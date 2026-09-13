-- invoice_payments already has an AFTER INSERT trigger that writes the financial ledger.
-- Do not write the same financial transaction again inside the RPC.
create or replace function public.record_invoice_payment(p_invoice_id uuid, p_amount numeric, p_payment_method text default 'cash', p_notes text default null, p_idempotency_key uuid default null)
returns uuid
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_company uuid; v_customer uuid; v_branch uuid; v_total numeric; v_paid numeric; v_id uuid; v_existing uuid; v_user uuid:=auth.uid(); v_key uuid:=coalesce(p_idempotency_key,gen_random_uuid()); v_status text; v_repair_id uuid;
begin
  if v_user is null then raise exception 'Not authenticated'; end if;
  if not public.has_permission('payments.manage') then raise exception 'Permission denied'; end if;
  if p_amount is null or p_amount<=0 then raise exception 'Payment amount must be greater than zero'; end if;
  if p_payment_method not in ('cash','transfer','pos','other') then raise exception 'Invalid payment method'; end if;
  v_company:=public.get_my_company_id(); if v_company is null then raise exception 'Company not found'; end if;
  if p_idempotency_key is not null then
    select id into v_existing from public.invoice_payments where company_id=v_company and idempotency_key=p_idempotency_key;
    if v_existing is not null then return v_existing; end if;
  end if;
  select i.company_id,i.customer_id,i.branch_id,i.total,i.status,i.repair_id into v_company,v_customer,v_branch,v_total,v_status,v_repair_id
  from public.invoices i where i.id=p_invoice_id and i.company_id=v_company for update;
  if not found then raise exception 'Invoice not found'; end if;
  if v_status='void' then raise exception 'Cannot record payment on a void invoice'; end if;
  if v_branch is not null and not public.user_has_branch_access(v_branch) then raise exception 'Branch access denied'; end if;
  select coalesce(sum(amount),0) into v_paid from public.invoice_payments where invoice_id=p_invoice_id and company_id=v_company;
  if p_amount>greatest(v_total-v_paid,0) then raise exception 'Payment exceeds invoice balance. Remaining: %',greatest(v_total-v_paid,0); end if;
  insert into public.invoice_payments(company_id,branch_id,invoice_id,customer_id,amount,payment_method,notes,recorded_by,idempotency_key)
  values(v_company,v_branch,p_invoice_id,v_customer,p_amount,p_payment_method,p_notes,v_user,v_key) returning id into v_id;
  if v_customer is not null then perform public.record_customer_debt(v_customer,'payment',v_id,0,p_amount,p_invoice_id,v_branch,'Payment for invoice '||p_invoice_id::text); end if;
  update public.invoices set status=case when v_paid+p_amount>=v_total then 'paid' when v_paid+p_amount>0 then 'part_paid' else 'issued' end where id=p_invoice_id;
  if v_repair_id is not null then
    update public.repairs set deposit=coalesce((select sum(rp.amount) from public.repair_payments rp where rp.repair_id=v_repair_id and rp.company_id=v_company),0)+coalesce((select sum(ip.amount) from public.invoice_payments ip join public.invoices ii on ii.id=ip.invoice_id where ii.repair_id=v_repair_id and ii.company_id=v_company and ip.company_id=v_company),0)
    where id=v_repair_id and company_id=v_company;
  end if;
  return v_id;
exception when unique_violation then
  select id into v_existing from public.invoice_payments where company_id=v_company and idempotency_key=v_key;
  if v_existing is not null then return v_existing; end if;
  raise;
end;
$function$;
revoke all on function public.record_invoice_payment(uuid,numeric,text,text,uuid) from anon, authenticated;
grant execute on function public.record_invoice_payment(uuid,numeric,text,text,uuid) to authenticated;
