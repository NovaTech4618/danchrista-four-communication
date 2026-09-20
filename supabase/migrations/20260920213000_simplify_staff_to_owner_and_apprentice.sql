BEGIN;

-- Amezing Limited uses only two real shop roles: owner and apprentice.
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.staff_invitations DROP CONSTRAINT IF EXISTS staff_invitations_role_check;

-- Existing non-owner users/invitations become apprentices.
ALTER TABLE public.profiles DISABLE TRIGGER USER;
UPDATE public.profiles SET role='apprentice' WHERE role <> 'owner';
ALTER TABLE public.profiles ENABLE TRIGGER USER;

ALTER TABLE public.staff_invitations DISABLE TRIGGER USER;
UPDATE public.staff_invitations SET role='apprentice' WHERE role <> 'apprentice';
ALTER TABLE public.staff_invitations ENABLE TRIGGER USER;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check CHECK (role = ANY (ARRAY['owner'::text,'apprentice'::text]));

ALTER TABLE public.staff_invitations
  ADD CONSTRAINT staff_invitations_role_check CHECK (role='apprentice'::text);

DELETE FROM public.role_permissions
WHERE role IN ('branch_manager','technician','front_desk','apprentice');

INSERT INTO public.role_permissions(role,permission,allowed) VALUES
  ('apprentice','sales.manage',true),
  ('apprentice','repairs.manage',true),
  ('apprentice','customers.manage',true),
  ('apprentice','inventory.view',true);

-- Apprentices can collect repair payments as part of the repair workflow,
-- without receiving the broader finance/credit permissions.
CREATE OR REPLACE FUNCTION public.record_repair_payment(
  p_repair_id uuid,
  p_amount numeric,
  p_payment_method text DEFAULT 'Cash'::text,
  p_payment_date timestamp with time zone DEFAULT now(),
  p_notes text DEFAULT NULL::text,
  p_idempotency_key uuid DEFAULT NULL::uuid
)
RETURNS TABLE(payment_id uuid,repair_id uuid,amount numeric,total_cost numeric,total_paid numeric,outstanding numeric,payment_status text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
declare
 v_company_id uuid; v_total_cost numeric(14,2); v_paid numeric(14,2); v_payment_id uuid;
 v_user_id uuid:=auth.uid(); v_branch uuid; v_existing uuid; v_key uuid:=coalesce(p_idempotency_key,gen_random_uuid());
begin
 if v_user_id is null then raise exception 'Authentication required'; end if;
 if not public.has_permission('repairs.manage') and not public.has_permission('payments.manage') then raise exception 'Permission denied'; end if;
 if p_amount is null or p_amount<=0 then raise exception 'Payment amount must be greater than zero'; end if;
 if lower(trim(coalesce(p_payment_method,''))) not in ('cash','transfer','pos','other') then raise exception 'Invalid payment method'; end if;
 select r.company_id,greatest(coalesce(r.final_cost,r.estimated_cost,0),0),r.branch_id into v_company_id,v_total_cost,v_branch from public.repairs r where r.id=p_repair_id for update;
 if v_company_id is null then raise exception 'Repair not found'; end if;
 if v_company_id<>public.get_my_company_id() then raise exception 'Repair does not belong to your company'; end if;
 if v_branch is not null and not public.user_has_branch_access(v_branch) then raise exception 'Branch access denied'; end if;
 if p_idempotency_key is not null then
   select id into v_existing from public.repair_payments where company_id=v_company_id and idempotency_key=p_idempotency_key;
   if v_existing is not null then
     select coalesce(sum(rp.amount),0)+coalesce((select sum(ip.amount) from public.invoice_payments ip join public.invoices i on i.id=ip.invoice_id where i.repair_id=p_repair_id and i.company_id=v_company_id and ip.company_id=v_company_id and i.status<>'void'),0) into v_paid from public.repair_payments rp where rp.repair_id=p_repair_id and rp.company_id=v_company_id;
     return query select rp.id,rp.repair_id,rp.amount,v_total_cost,v_paid,greatest(v_total_cost-v_paid,0),case when v_total_cost=0 or v_paid>=v_total_cost then 'Paid' when v_paid>0 then 'Partially paid' else 'Unpaid' end from public.repair_payments rp where rp.id=v_existing; return;
   end if;
 end if;
 select coalesce(sum(rp.amount),0)+coalesce((select sum(ip.amount) from public.invoice_payments ip join public.invoices i on i.id=ip.invoice_id where i.repair_id=p_repair_id and i.company_id=v_company_id and ip.company_id=v_company_id and i.status<>'void'),0) into v_paid from public.repair_payments rp where rp.repair_id=p_repair_id and rp.company_id=v_company_id;
 if v_paid+p_amount>v_total_cost then raise exception 'Payment exceeds outstanding repair balance. Outstanding: %',greatest(v_total_cost-v_paid,0); end if;
 insert into public.repair_payments(company_id,repair_id,amount,payment_method,payment_date,notes,recorded_by,idempotency_key) values(v_company_id,p_repair_id,p_amount,lower(trim(coalesce(p_payment_method,'cash'))),coalesce(p_payment_date,now()),p_notes,v_user_id,p_idempotency_key) returning id into v_payment_id;
 update public.repairs set deposit=v_paid+p_amount where id=p_repair_id;
 return query select v_payment_id,p_repair_id,p_amount,v_total_cost,v_paid+p_amount,greatest(v_total_cost-(v_paid+p_amount),0),case when v_total_cost=0 or v_paid+p_amount>=v_total_cost then 'Paid' when v_paid+p_amount>0 then 'Partially paid' else 'Unpaid' end;
exception when unique_violation then
 select id into v_existing from public.repair_payments where company_id=v_company_id and idempotency_key=v_key;
 if v_existing is not null then
   select coalesce(sum(rp.amount),0)+coalesce((select sum(ip.amount) from public.invoice_payments ip join public.invoices i on i.id=ip.invoice_id where i.repair_id=p_repair_id and i.company_id=v_company_id and ip.company_id=v_company_id and i.status<>'void'),0) into v_paid from public.repair_payments rp where rp.repair_id=p_repair_id and rp.company_id=v_company_id;
   return query select rp.id,rp.repair_id,rp.amount,v_total_cost,v_paid,greatest(v_total_cost-v_paid,0),case when v_total_cost=0 or v_paid>=v_total_cost then 'Paid' when v_paid>0 then 'Partially paid' else 'Unpaid' end from public.repair_payments rp where rp.id=v_existing; return;
 end if;
 raise;
end;
$function$;

DROP POLICY IF EXISTS repair_payments_authorized_select ON public.repair_payments;
CREATE POLICY repair_payments_authorized_select ON public.repair_payments
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.repairs r
    WHERE r.id=repair_payments.repair_id
      AND r.company_id=public.get_my_company_id()
      AND public.user_has_branch_access(r.branch_id)
  )
  AND (public.has_permission('repairs.manage') OR public.has_permission('payments.manage') OR public.has_permission('reports.view'))
);

CREATE OR REPLACE FUNCTION public.update_staff_role(p_profile_id uuid,p_role text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
declare c uuid; actor_role text; old_role text; target_company uuid;
begin
 if auth.uid() is null then raise exception 'Not authenticated'; end if;
 select company_id,role into c,actor_role from public.profiles where id=auth.uid() and is_active=true;
 if c is null or actor_role <> 'owner' then raise exception 'Only the owner can change apprentice roles'; end if;
 if p_role <> 'apprentice' then raise exception 'Invalid staff role'; end if;
 select company_id,role into target_company,old_role from public.profiles where id=p_profile_id for update;
 if target_company is null or target_company<>c then raise exception 'Staff member not found'; end if;
 if p_profile_id=auth.uid() then raise exception 'You cannot change your own role here'; end if;
 if old_role='owner' then raise exception 'The owner role cannot be changed'; end if;
 update public.profiles set role='apprentice' where id=p_profile_id;
 insert into public.audit_logs(company_id,actor_id,action,entity_type,entity_id,old_data,new_data)
 values(c,auth.uid(),'STAFF_ROLE_CHANGED','profiles',p_profile_id,jsonb_build_object('role',old_role),jsonb_build_object('role','apprentice'));
end;
$function$;

CREATE OR REPLACE FUNCTION public.create_staff_invitation(p_email text,p_role text,p_branch_ids uuid[])
RETURNS public.staff_invitations LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
declare v_company_id uuid:=public.get_my_company_id(); v_invitation public.staff_invitations; v_branch_count integer; v_email text:=lower(trim(p_email));
begin
 if auth.uid() is null then raise exception 'Not authenticated'; end if;
 if not public.is_manager_or_owner() then raise exception 'Only the owner can invite apprentices'; end if;
 if v_company_id is null then raise exception 'Company not found'; end if;
 if v_email='' or position('@' in v_email)<2 then raise exception 'Valid email is required'; end if;
 if p_role<>'apprentice' then raise exception 'Invalid staff role'; end if;
 if coalesce(array_length(p_branch_ids,1),0)=0 then raise exception 'At least one branch is required'; end if;
 select count(*) into v_branch_count from unnest(p_branch_ids) as requested_branch_id join public.branches b on b.id=requested_branch_id where b.company_id=v_company_id and b.is_active=true and public.user_has_branch_access(b.id);
 if v_branch_count<>array_length(p_branch_ids,1) then raise exception 'One or more branches are outside your branch access'; end if;
 if exists(select 1 from public.profiles p join auth.users u on u.id=p.id where p.company_id=v_company_id and lower(u.email)=v_email) then raise exception 'A staff account with this email already exists'; end if;
 if exists(select 1 from public.staff_invitations where company_id=v_company_id and lower(email)=v_email and status='pending' and expires_at>now()) then raise exception 'A pending invitation already exists for this email'; end if;
 insert into public.staff_invitations(company_id,email,role,branch_ids,invited_by,expires_at) values(v_company_id,v_email,'apprentice',p_branch_ids,auth.uid(),now()+interval '7 days') returning * into v_invitation;
 return v_invitation;
end;
$function$;

CREATE OR REPLACE FUNCTION public.accept_staff_invitation()
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
declare v_user_id uuid:=auth.uid(); v_email text; v_invite public.staff_invitations%rowtype; v_company_id uuid; v_branch_count integer; v_existing_company uuid;
begin
 if v_user_id is null then raise exception 'Not authenticated'; end if;
 select lower(email) into v_email from auth.users where id=v_user_id;
 if v_email is null then raise exception 'Account email not found'; end if;
 select company_id into v_existing_company from public.profiles where id=v_user_id for update;
 if v_existing_company is not null then raise exception 'This account is already associated with a Danchrista business'; end if;
 select * into v_invite from public.staff_invitations where lower(email)=v_email and status='pending' order by created_at desc limit 1 for update;
 if v_invite.id is null then return null; end if;
 if v_invite.expires_at<=now() then update public.staff_invitations set status='expired' where id=v_invite.id; raise exception 'This invitation has expired. Ask the business owner to send a new one.'; end if;
 if v_invite.role<>'apprentice' then raise exception 'Invalid invitation role'; end if;
 select count(*) into v_branch_count from unnest(v_invite.branch_ids) as requested_branch_id join public.branches b on b.id=requested_branch_id where b.company_id=v_invite.company_id and b.is_active=true;
 if v_branch_count<>coalesce(array_length(v_invite.branch_ids,1),0) then raise exception 'Invitation contains invalid branch access'; end if;
 v_company_id:=v_invite.company_id;
 insert into public.profiles(id,company_id,full_name,role,is_active) values(v_user_id,v_company_id,v_email,'apprentice',true);
 insert into public.user_branches(profile_id,branch_id) select v_user_id,requested_branch_id from unnest(v_invite.branch_ids) as requested_branch_id;
 update public.staff_invitations set status='accepted',accepted_at=now() where id=v_invite.id;
 return v_company_id;
end;
$function$;

COMMIT;