-- Amezing Limited: enforce documented device handover before collection.
-- Normal completed repairs must be fully paid. An unpaid handover is a Boss-only exception
-- and must include an approval note. No historical records are rewritten.

create or replace function public.record_repair_handover(p_repair_id uuid, p_recipient_name text, p_recipient_phone text default null, p_id_type text default null, p_id_reference text default null, p_device_condition text default null, p_customer_confirmed boolean default false, p_notes text default null)
returns uuid language plpgsql security definer set search_path = public as $function$
declare v_company uuid; v_branch uuid; v_customer uuid; v_id uuid; v_status text; v_total numeric; v_paid numeric; v_outstanding numeric;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if not public.has_permission('repairs.manage') then raise exception 'Permission denied'; end if;
  v_company := public.get_my_company_id();
  select r.branch_id,(select d.customer_id from public.devices d where d.id=r.device_id),r.status,greatest(coalesce(r.final_cost,r.estimated_cost,0),0) into v_branch,v_customer,v_status,v_total from public.repairs r where r.id=p_repair_id and r.company_id=v_company for update;
  if v_customer is null then raise exception 'Repair not found'; end if;
  if v_branch is not null and not public.user_has_branch_access(v_branch) then raise exception 'Branch access denied'; end if;
  if v_status not in ('Completed','Ready for Collection','Collected') then raise exception 'Repair is not ready for collection'; end if;
  if p_customer_confirmed is distinct from true then raise exception 'Customer confirmation is required'; end if;
  select coalesce(sum(rp.amount),0) into v_paid from public.repair_payments rp where rp.repair_id=p_repair_id and rp.company_id=v_company;
  v_outstanding := greatest(v_total-v_paid,0);
  if v_outstanding > 0 then
    if not public.has_permission('*') then raise exception 'Outstanding balance must be paid before collection'; end if;
    if nullif(trim(coalesce(p_notes,'')),'') is null then raise exception 'Boss approval note is required for an unpaid handover'; end if;
  end if;
  insert into public.repair_handovers(company_id,branch_id,repair_id,customer_id,handed_over_by,recipient_name,recipient_phone,id_type,id_reference,device_condition,customer_confirmed,notes)
  values(v_company,v_branch,p_repair_id,v_customer,auth.uid(),nullif(trim(p_recipient_name),''),nullif(trim(p_recipient_phone),''),nullif(trim(p_id_type),''),nullif(trim(p_id_reference),''),nullif(trim(p_device_condition),''),true,p_notes)
  on conflict (repair_id) do update set handed_over_at=now(),handed_over_by=auth.uid(),recipient_name=excluded.recipient_name,recipient_phone=excluded.recipient_phone,id_type=excluded.id_type,id_reference=excluded.id_reference,device_condition=excluded.device_condition,customer_confirmed=true,notes=excluded.notes returning id into v_id;
  update public.repairs set status='Collected',completed_at=coalesce(completed_at,now()) where id=p_repair_id and company_id=v_company;
  return v_id;
end; $function$;

create or replace function public.change_repair_status(p_repair_id uuid,p_status text,p_note text default null)
returns public.repairs language plpgsql security definer set search_path = public as $function$
declare v_repair public.repairs%rowtype; v_company_id uuid; v_old text; v_allowed boolean := false;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if not public.has_permission('repairs.manage') then raise exception 'Permission denied'; end if;
  v_company_id := public.get_my_company_id();
  select * into v_repair from public.repairs where id=p_repair_id and company_id=v_company_id for update;
  if not found then raise exception 'Repair not found or access denied'; end if;
  if v_repair.branch_id is not null and not public.user_has_branch_access(v_repair.branch_id) then raise exception 'Branch access denied'; end if;
  if p_status not in ('Received','Diagnosis','Estimate Sent','Customer Approved','Repairing','Testing','Completed','Collected','No Fix','Cancelled') then raise exception 'Invalid repair status'; end if;
  v_old := v_repair.status; if v_old=p_status then return v_repair; end if;
  v_allowed := case v_old when 'Received' then p_status in ('Diagnosis','Cancelled') when 'Diagnosis' then p_status in ('Estimate Sent','Repairing','No Fix','Cancelled') when 'Estimate Sent' then p_status in ('Customer Approved','Diagnosis','Cancelled','No Fix') when 'Customer Approved' then p_status in ('Repairing','Cancelled') when 'Repairing' then p_status in ('Testing','No Fix','Cancelled') when 'Testing' then p_status in ('Completed','Repairing','No Fix') when 'Completed' then p_status='Collected' when 'No Fix' then p_status in ('Collected','Cancelled') when 'Collected' then false when 'Cancelled' then false else false end;
  if not v_allowed then raise exception 'Invalid repair transition: % -> %',v_old,p_status; end if;
  if p_status='Collected' and not exists(select 1 from public.repair_handovers h where h.repair_id=p_repair_id and h.company_id=v_company_id and h.customer_confirmed=true) then raise exception 'Record the customer handover before marking the repair collected'; end if;
  perform set_config('app.repair_status_transition','1',true);
  update public.repairs set status=p_status,completed_at=case when p_status='Completed' then coalesce(completed_at,now()) else completed_at end where id=p_repair_id and company_id=v_company_id;
  if p_note is not null then update public.repair_status_history set note=p_note where id=(select id from public.repair_status_history where repair_id=p_repair_id order by changed_at desc limit 1); end if;
  select * into v_repair from public.repairs where id=p_repair_id and company_id=v_company_id; return v_repair;
end; $function$;