-- Deepen production authorization boundaries after the staff permission audit.
--
-- Security model:
-- * staff may record operational work but must not delete repair history;
-- * payment-entry permission does not grant financial-ledger visibility;
-- * manager/owner staff-management actions are enforced in the database;
-- * internal helper/trigger functions are not public Data API endpoints.

revoke execute on function public.can_manage_staff() from public, anon;
revoke execute on function public.engineer_work_charge(uuid,numeric,text,text) from public, anon;
revoke execute on function public.enforce_repair_status_transition() from public, anon, authenticated;

drop policy if exists repairs_branch_delete on public.repairs;
create policy repairs_branch_delete on public.repairs for delete
using (
  company_id = public.get_my_company_id()
  and public.user_has_branch_access(branch_id)
  and public.is_manager_or_owner()
);

drop policy if exists financial_authorized_select on public.financial_transactions;
create policy financial_authorized_select on public.financial_transactions for select
using (
  company_id = public.get_my_company_id()
  and public.has_permission('reports.view')
  and public.user_has_branch_access(branch_id)
);

create or replace function public.create_staff_invitation(
  p_email text,
  p_role text,
  p_branch_ids uuid[]
)
returns public.staff_invitations
language plpgsql
security definer
set search_path = public
as $$
declare
  v_company_id uuid := public.get_my_company_id();
  v_invitation public.staff_invitations;
  v_branch_count integer;
  v_email text := lower(trim(p_email));
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  if not public.is_manager_or_owner() then raise exception 'Only owners and branch managers can invite staff'; end if;
  if v_company_id is null then raise exception 'Company not found'; end if;
  if v_email = '' or position('@' in v_email) < 2 then raise exception 'Valid email is required'; end if;
  if p_role not in ('branch_manager','technician','front_desk') then raise exception 'Invalid staff role'; end if;
  if coalesce(array_length(p_branch_ids, 1), 0) = 0 then raise exception 'At least one branch is required'; end if;
  select count(*) into v_branch_count
  from unnest(p_branch_ids) as requested_branch_id
  join public.branches b on b.id = requested_branch_id
  where b.company_id = v_company_id and b.is_active = true;
  if v_branch_count <> array_length(p_branch_ids, 1) then raise exception 'One or more branches are invalid'; end if;
  if exists (
    select 1 from public.profiles p join auth.users u on u.id = p.id
    where p.company_id = v_company_id and lower(u.email) = v_email
  ) then raise exception 'A staff account with this email already exists'; end if;
  if exists (
    select 1 from public.staff_invitations
    where company_id=v_company_id and lower(email)=v_email and status='pending' and expires_at > now()
  ) then raise exception 'A pending invitation already exists for this email'; end if;
  insert into public.staff_invitations(company_id,email,role,branch_ids,invited_by,expires_at)
  values(v_company_id,v_email,p_role,p_branch_ids,auth.uid(),now() + interval '7 days')
  returning * into v_invitation;
  return v_invitation;
end;
$$;

grant execute on function public.create_staff_invitation(text,text,uuid[]) to authenticated;
revoke execute on function public.create_staff_invitation(text,text,uuid[]) from anon, public;

create or replace function public.set_staff_branches(p_profile_id uuid, p_branch_ids uuid[])
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_company uuid;
  v_actor uuid := auth.uid();
  v_branch uuid;
begin
  if v_actor is null or not public.is_manager_or_owner() then
    raise exception 'Only owners and branch managers can manage staff branch access';
  end if;
  select company_id into v_company from public.profiles where id=p_profile_id;
  if v_company is null or v_company<>public.get_my_company_id() then raise exception 'Staff member does not belong to your company'; end if;
  if p_profile_id=v_actor then raise exception 'Owner branch access cannot be changed here'; end if;
  if exists(
    select 1 from unnest(coalesce(p_branch_ids,'{}'::uuid[])) x
    left join public.branches b on b.id=x
    where b.id is null or b.company_id<>v_company or not b.is_active
  ) then raise exception 'One or more branches are invalid or inactive'; end if;
  delete from public.user_branches where profile_id=p_profile_id;
  foreach v_branch in array coalesce(p_branch_ids,'{}'::uuid[]) loop
    insert into public.user_branches(profile_id,branch_id) values(p_profile_id,v_branch) on conflict do nothing;
  end loop;
end;
$$;

grant execute on function public.set_staff_branches(uuid,uuid[]) to authenticated;
revoke execute on function public.set_staff_branches(uuid,uuid[]) from anon, public;
