-- Allow a confirmed device handover for No Fix / Failed Repair outcomes.
-- The final agreed charge is recorded explicitly so an estimate is never silently
-- treated as the customer's accepted amount. Failed outcomes keep their status.

create or replace function public.set_repair_final_agreed_charge(
  p_repair_id uuid,
  p_amount numeric
)
returns void
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_company uuid;
  v_branch uuid;
  v_status text;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if not public.has_permission('repairs.manage') then raise exception 'Permission denied'; end if;
  if p_amount is null or p_amount < 0 then raise exception 'Enter a valid final agreed amount'; end if;

  v_company := public.get_my_company_id();
  select r.branch_id, r.status into v_branch, v_status
  from public.repairs r
  where r.id = p_repair_id and r.company_id = v_company
  for update;

  if not found then raise exception 'Repair not found'; end if;
  if v_branch is not null and not public.user_has_branch_access(v_branch) then raise exception 'Branch access denied'; end if;
  if v_status not in ('No Fix', 'Failed Repair') then
    raise exception 'A final agreed charge can only be set for No Fix or Failed Repair jobs';
  end if;

  update public.repairs
  set final_cost = round(p_amount, 2)
  where id = p_repair_id and company_id = v_company;
end;
$function$;

revoke all on function public.set_repair_final_agreed_charge(uuid, numeric) from public, anon;
grant execute on function public.set_repair_final_agreed_charge(uuid, numeric) to authenticated;

create or replace function public.record_repair_handover(
  p_repair_id uuid,
  p_recipient_name text,
  p_recipient_phone text default null,
  p_id_type text default null,
  p_id_reference text default null,
  p_device_condition text default null,
  p_customer_confirmed boolean default false,
  p_notes text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_company uuid;
  v_branch uuid;
  v_customer uuid;
  v_id uuid;
  v_status text;
  v_final_cost numeric;
  v_estimated_cost numeric;
  v_total numeric;
  v_paid numeric;
  v_outstanding numeric;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if not public.has_permission('repairs.manage') then raise exception 'Permission denied'; end if;

  v_company := public.get_my_company_id();
  select r.branch_id,
         (select d.customer_id from public.devices d where d.id = r.device_id),
         r.status, r.final_cost, r.estimated_cost
  into v_branch, v_customer, v_status, v_final_cost, v_estimated_cost
  from public.repairs r
  where r.id = p_repair_id and r.company_id = v_company
  for update;

  if v_customer is null then raise exception 'Repair not found'; end if;
  if v_branch is not null and not public.user_has_branch_access(v_branch) then raise exception 'Branch access denied'; end if;

  if v_status in ('No Fix', 'Failed Repair') then
    if v_final_cost is null then raise exception 'Save the final agreed charge before returning this device'; end if;
    v_total := greatest(v_final_cost, 0);
  elsif v_status in ('Completed', 'Ready for Collection', 'Collected') then
    v_total := greatest(coalesce(v_final_cost, v_estimated_cost, 0), 0);
  else
    raise exception 'This repair outcome is not eligible for handover';
  end if;

  if p_customer_confirmed is distinct from true then raise exception 'Customer confirmation is required'; end if;
  if nullif(trim(coalesce(p_recipient_name, '')), '') is null then raise exception 'Recipient name is required'; end if;

  select coalesce(sum(rp.amount), 0) + coalesce((
    select sum(ip.amount)
    from public.invoice_payments ip
    join public.invoices i on i.id = ip.invoice_id
    where i.repair_id = p_repair_id and i.company_id = v_company
      and ip.company_id = v_company and i.status <> 'void'
  ), 0)
  into v_paid
  from public.repair_payments rp
  where rp.repair_id = p_repair_id and rp.company_id = v_company;

  v_outstanding := greatest(v_total - v_paid, 0);
  if v_outstanding > 0 then
    if not public.has_permission('*') then raise exception 'Outstanding balance must be paid before collection'; end if;
    if nullif(trim(coalesce(p_notes, '')), '') is null then raise exception 'Boss approval note is required for an unpaid handover'; end if;
  end if;

  insert into public.repair_handovers(
    company_id, branch_id, repair_id, customer_id, handed_over_by,
    recipient_name, recipient_phone, id_type, id_reference,
    device_condition, customer_confirmed, notes
  )
  values (
    v_company, v_branch, p_repair_id, v_customer, auth.uid(),
    nullif(trim(p_recipient_name), ''), nullif(trim(p_recipient_phone), ''),
    nullif(trim(p_id_type), ''), nullif(trim(p_id_reference), ''),
    nullif(trim(p_device_condition), ''), true, p_notes
  )
  on conflict (repair_id) do update
  set handed_over_at = now(), handed_over_by = auth.uid(),
      recipient_name = excluded.recipient_name, recipient_phone = excluded.recipient_phone,
      id_type = excluded.id_type, id_reference = excluded.id_reference,
      device_condition = excluded.device_condition, customer_confirmed = true,
      notes = excluded.notes
  returning id into v_id;

  -- Only successful repairs transition to Collected. Failed outcomes remain
  -- No Fix / Failed Repair for accurate operational and revenue reporting.
  if v_status in ('Completed', 'Ready for Collection', 'Collected') then
    update public.repairs
    set status = 'Collected', completed_at = coalesce(completed_at, now())
    where id = p_repair_id and company_id = v_company;
  end if;

  return v_id;
end;
$function$;

revoke all on function public.record_repair_handover(uuid, text, text, text, text, text, boolean, text) from public, anon;
grant execute on function public.record_repair_handover(uuid, text, text, text, text, text, boolean, text) to authenticated;
