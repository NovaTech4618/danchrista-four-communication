-- Repair invoice RPC must use columns that actually exist on repairs.
-- The repairs table has no discount column; discount is an invoice-level value.
create or replace function public.create_repair_invoice(p_repair_id uuid, p_invoice_number text, p_due_at timestamptz default null, p_notes text default null, p_description text default 'Repair service', p_amount numeric default null, p_discount numeric default null)
returns uuid
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_company uuid;
  v_branch uuid;
  v_customer uuid;
  v_total numeric(14,2);
  v_discount numeric(14,2);
  v_subtotal numeric(14,2);
  v_invoice uuid;
  v_existing uuid;
  v_repair_paid numeric(14,2) := 0;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if not public.has_permission('payments.manage') then raise exception 'Permission denied'; end if;
  v_company := public.get_my_company_id();
  select r.branch_id,d.customer_id into v_branch,v_customer
  from public.repairs r join public.devices d on d.id=r.device_id
  where r.id=p_repair_id and r.company_id=v_company;
  if not found then raise exception 'Repair not found'; end if;
  if v_branch is not null and not public.user_has_branch_access(v_branch) then raise exception 'Branch access denied'; end if;
  if trim(coalesce(p_invoice_number,''))='' then raise exception 'Invoice number is required'; end if;
  select id into v_existing from public.invoices where repair_id=p_repair_id and company_id=v_company and status <> 'void' order by created_at asc limit 1;
  if v_existing is not null then return v_existing; end if;
  select greatest(coalesce(r.final_cost,r.estimated_cost,0),0) into v_total from public.repairs r where r.id=p_repair_id;
  if p_amount is not null then v_total := greatest(p_amount,0); end if;
  v_discount := greatest(coalesce(p_discount,0),0);
  if v_discount > v_total then raise exception 'Discount cannot exceed invoice amount'; end if;
  v_subtotal := v_total + v_discount;
  select coalesce(sum(amount),0) into v_repair_paid from public.repair_payments where repair_id=p_repair_id and company_id=v_company;
  insert into public.invoices(company_id,branch_id,customer_id,repair_id,invoice_number,subtotal,discount,total,due_at,notes,created_by)
  values(v_company,v_branch,v_customer,p_repair_id,trim(p_invoice_number),v_subtotal,v_discount,v_total,p_due_at,p_notes,auth.uid()) returning id into v_invoice;
  insert into public.invoice_items(invoice_id,company_id,description,quantity,unit_price)
  values(v_invoice,v_company,trim(coalesce(nullif(p_description,''),'Repair service')),1,v_total);
  if v_customer is not null and v_total > v_repair_paid then
    perform public.record_customer_debt(v_customer,'invoice',v_invoice,v_total-v_repair_paid,0,v_invoice,v_branch,'Repair invoice issued');
  end if;
  return v_invoice;
end;
$function$;
revoke all on function public.create_repair_invoice(uuid,text,timestamptz,text,text,numeric,numeric) from anon, authenticated;
grant execute on function public.create_repair_invoice(uuid,text,timestamptz,text,text,numeric,numeric) to authenticated;
