-- Blue-team security hardening for Danchrista Four Communication.
-- This migration is intentionally idempotent where practical.

alter view public.supplier_payables_balance_view set (security_invoker = true);

create or replace function public.refresh_supplier_payable_status()
returns trigger
language plpgsql
set search_path = 'public'
as $function$
declare
  v_total numeric(14,2);
  v_agreed numeric(14,2);
begin
  select agreed_amount into v_agreed
  from public.supplier_payables
  where id = coalesce(new.payable_id, old.payable_id);

  select coalesce(sum(amount),0) into v_total
  from public.supplier_payable_payments
  where payable_id = coalesce(new.payable_id, old.payable_id);

  update public.supplier_payables
  set status = case
    when v_total >= v_agreed then 'paid'
    when v_total > 0 then 'part_paid'
    else 'open'
  end,
  updated_at = now()
  where id = coalesce(new.payable_id, old.payable_id);

  return coalesce(new, old);
end
$function$;

revoke all on table public.tap_funky from anon, authenticated;
revoke all on table public.pg_all_foreign_keys from anon, authenticated;

-- The application uses customer_password_provided instead of storing device PINs/passwords.
alter table public.devices drop column if exists password;

alter table public.whatsapp_message_log drop constraint if exists whatsapp_message_log_status_check;
alter table public.whatsapp_message_log
  add constraint whatsapp_message_log_status_check
  check (status = any (array['queued'::text,'processing'::text,'sent'::text,'failed'::text]));
alter table public.whatsapp_message_log
  add column if not exists processing_at timestamptz;

create table if not exists public.whatsapp_dispatch_security (
  id boolean primary key default true,
  secret_hash text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint whatsapp_dispatch_security_singleton check (id)
);

alter table public.whatsapp_dispatch_security enable row level security;
revoke all on table public.whatsapp_dispatch_security from public, anon, authenticated;
grant select on table public.whatsapp_dispatch_security to service_role;

drop policy if exists "Deny direct access to WhatsApp dispatch secret"
  on public.whatsapp_dispatch_security;
create policy "Deny direct access to WhatsApp dispatch secret"
on public.whatsapp_dispatch_security
as restrictive
for all
to anon, authenticated
using (false)
with check (false);

create or replace function public.get_whatsapp_dispatch_secret_hash()
returns text
language sql
security definer
set search_path = ''
stable
as $function$
  select secret_hash
  from public.whatsapp_dispatch_security
  where id = true
  limit 1;
$function$;

revoke all on function public.get_whatsapp_dispatch_secret_hash() from public, anon, authenticated;
grant execute on function public.get_whatsapp_dispatch_secret_hash() to service_role;

create or replace function public.get_engineer_balances()
returns table(engineer_id uuid, total_debit numeric, total_credit numeric, balance numeric)
language sql
stable
security definer
set search_path = 'public'
as $function$
  select
    e.id,
    coalesce(sum(t.debit) filter(where t.transaction_type <> 'payment_out'),0),
    coalesce(sum(t.credit),0),
    greatest(
      coalesce(sum(t.debit) filter(where t.transaction_type <> 'payment_out'),0)
      - coalesce(sum(t.credit),0),
      0
    )
  from public.engineers e
  left join public.engineer_transactions t
    on t.engineer_id = e.id
   and t.company_id = public.get_my_company_id()
  where e.company_id = public.get_my_company_id()
    and public.has_permission('engineers.manage')
  group by e.id;
$function$;

create or replace function public.create_staff_invitation(
  p_email text,
  p_role text,
  p_branch_ids uuid[]
)
returns public.staff_invitations
language plpgsql
security definer
set search_path = 'public'
as $function$
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
  where b.company_id = v_company_id
    and b.is_active = true
    and public.user_has_branch_access(b.id);

  if v_branch_count <> array_length(p_branch_ids, 1) then
    raise exception 'One or more branches are outside your branch access';
  end if;

  if exists (
    select 1 from public.profiles p
    join auth.users u on u.id = p.id
    where p.company_id = v_company_id and lower(u.email) = v_email
  ) then raise exception 'A staff account with this email already exists'; end if;

  if exists (
    select 1 from public.staff_invitations
    where company_id = v_company_id
      and lower(email) = v_email
      and status = 'pending'
      and expires_at > now()
  ) then raise exception 'A pending invitation already exists for this email'; end if;

  insert into public.staff_invitations(company_id,email,role,branch_ids,invited_by,expires_at)
  values(v_company_id,v_email,p_role,p_branch_ids,auth.uid(),now() + interval '7 days')
  returning * into v_invitation;

  return v_invitation;
end;
$function$;

create or replace function public.set_staff_active(
  p_profile_id uuid,
  p_is_active boolean
)
returns void
language plpgsql
security definer
set search_path = 'public'
as $function$
declare
  c uuid;
  actor_role text;
  old_active boolean;
  target_company uuid;
  target_role text;
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;

  select company_id, role into c, actor_role
  from public.profiles
  where id = auth.uid() and is_active = true;

  if c is null or actor_role not in ('owner','branch_manager') then
    raise exception 'Only owners and branch managers can change staff status';
  end if;

  select company_id,is_active,role into target_company,old_active,target_role
  from public.profiles where id=p_profile_id for update;

  if target_company is null or target_company<>c then raise exception 'Staff member not found'; end if;
  if p_profile_id=auth.uid() then raise exception 'You cannot deactivate yourself'; end if;
  if target_role='owner' then raise exception 'The owner account cannot be deactivated'; end if;

  if actor_role='branch_manager'
     and not exists (
       select 1
       from public.user_branches actor_branch
       join public.user_branches target_branch
         on target_branch.branch_id = actor_branch.branch_id
       where actor_branch.profile_id = auth.uid()
         and target_branch.profile_id = p_profile_id
     ) then
    raise exception 'Staff member is outside your branch access';
  end if;

  update public.profiles set is_active=p_is_active where id=p_profile_id;

  insert into public.audit_logs(company_id,actor_id,action,entity_type,entity_id,old_data,new_data)
  values(c,auth.uid(),'STAFF_STATUS_CHANGED','profiles',p_profile_id,
    jsonb_build_object('is_active',old_active),
    jsonb_build_object('is_active',p_is_active));
end;
$function$;

create or replace function public.update_staff_role(
  p_profile_id uuid,
  p_role text
)
returns void
language plpgsql
security definer
set search_path = 'public'
as $function$
declare
  c uuid;
  actor_role text;
  old_role text;
  target_company uuid;
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;

  select company_id, role into c, actor_role
  from public.profiles
  where id=auth.uid() and is_active=true;

  if c is null or actor_role not in ('owner','branch_manager') then
    raise exception 'Only owners and branch managers can change staff roles';
  end if;

  if p_role not in ('branch_manager','technician','front_desk') then
    raise exception 'Invalid staff role';
  end if;

  select company_id, role into target_company, old_role
  from public.profiles where id=p_profile_id for update;

  if target_company is null or target_company<>c then raise exception 'Staff member not found'; end if;
  if p_profile_id=auth.uid() then raise exception 'You cannot change your own role here'; end if;
  if old_role='owner' then raise exception 'The owner role cannot be changed'; end if;

  if actor_role='branch_manager'
     and not exists (
       select 1
       from public.user_branches actor_branch
       join public.user_branches target_branch
         on target_branch.branch_id = actor_branch.branch_id
       where actor_branch.profile_id = auth.uid()
         and target_branch.profile_id = p_profile_id
     ) then
    raise exception 'Staff member is outside your branch access';
  end if;

  update public.profiles set role=p_role where id=p_profile_id;

  insert into public.audit_logs(company_id,actor_id,action,entity_type,entity_id,old_data,new_data)
  values(c,auth.uid(),'STAFF_ROLE_CHANGED','profiles',p_profile_id,
    jsonb_build_object('role',old_role),
    jsonb_build_object('role',p_role));
end;
$function$;

create or replace function public.set_staff_branches(
  p_profile_id uuid,
  p_branch_ids uuid[]
)
returns void
language plpgsql
security definer
set search_path = 'public'
as $function$
declare
  v_company uuid;
  v_actor uuid := auth.uid();
  v_actor_role text;
  v_branch uuid;
begin
  if v_actor is null then raise exception 'Not authenticated'; end if;

  select company_id, role into v_company, v_actor_role
  from public.profiles
  where id=v_actor and is_active=true;

  if v_company is null or v_actor_role not in ('owner','branch_manager') then
    raise exception 'Only owners and branch managers can manage staff branch access';
  end if;

  select company_id into v_company from public.profiles where id=p_profile_id;

  if v_company is null or v_company<>public.get_my_company_id() then
    raise exception 'Staff member does not belong to your company';
  end if;

  if p_profile_id=v_actor then
    raise exception 'Owner branch access cannot be changed here';
  end if;

  if exists(
    select 1
    from unnest(coalesce(p_branch_ids,'{}'::uuid[])) x
    left join public.branches b on b.id=x
    where b.id is null
       or b.company_id is distinct from v_company
       or not b.is_active
  ) then
    raise exception 'One or more branches are invalid or inactive';
  end if;

  if v_actor_role='branch_manager'
     and exists (
       select 1
       from unnest(coalesce(p_branch_ids,'{}'::uuid[])) x
       where not public.user_has_branch_access(x)
     ) then
    raise exception 'One or more branches are outside your branch access';
  end if;

  delete from public.user_branches where profile_id=p_profile_id;

  foreach v_branch in array coalesce(p_branch_ids,'{}'::uuid[]) loop
    insert into public.user_branches(profile_id,branch_id)
    values(p_profile_id,v_branch)
    on conflict do nothing;
  end loop;
end;
$function$;

drop policy if exists "Public showcase companies" on public.companies;
create policy "Public showcase companies"
on public.companies
for select
to anon
using (showcase_enabled = true);

revoke select on table public.companies from anon;
grant select (
  name,
  logo_url,
  slug,
  showcase_enabled,
  showcase_description,
  showcase_phone,
  showcase_address,
  showcase_services,
  showcase_name
) on table public.companies to anon;

create or replace function public.get_public_company_showcase(p_slug text)
returns table(
  name text,
  logo_url text,
  showcase_description text,
  showcase_phone text,
  showcase_address text,
  showcase_services text[]
)
language sql
security invoker
set search_path = ''
stable
as $function$
  select
    coalesce(nullif(trim(c.showcase_name), ''), c.name),
    c.logo_url,
    c.showcase_description,
    c.showcase_phone,
    c.showcase_address,
    c.showcase_services
  from public.companies c
  where c.slug = p_slug
    and c.showcase_enabled = true
    and c.slug is not null
  limit 1;
$function$;

revoke all on function public.get_public_company_showcase(text) from public;
grant execute on function public.get_public_company_showcase(text) to anon, authenticated;

do $$
declare
  v_secret text := encode(extensions.gen_random_bytes(32), 'hex');
  v_job_id bigint;
begin
  insert into public.whatsapp_dispatch_security(id, secret_hash, updated_at)
  values(true, encode(extensions.digest(v_secret, 'sha256'), 'hex'), now())
  on conflict (id) do update
    set secret_hash = excluded.secret_hash,
        updated_at = excluded.updated_at;

  for v_job_id in
    select jobid from cron.job where jobname = 'dispatch-queued-whatsapp'
  loop
    perform cron.unschedule(v_job_id);
  end loop;

  perform cron.schedule(
    'dispatch-queued-whatsapp',
    '* * * * *',
    format(
      $cmd$
        select net.http_post(
          url := 'https://pidmgakgvpfyardisomy.supabase.co/functions/v1/send-whatsapp',
          headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'x-cron-secret', '%s'
          ),
          body := '{}'::jsonb
        );
      $cmd$,
      v_secret
    )
  );
end
$$;
