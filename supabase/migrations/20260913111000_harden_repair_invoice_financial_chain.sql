create or replace function public.create_repair_invoice(p_repair_id uuid, p_invoice_number text, p_due_at timestamptz default null, p_notes text default null, p_description text default 'Repair service', p_amount numeric default null, p_discount numeric default null)
returns uuid
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_company uuid; v_branch uuid; v_customer uuid; v_total numeric(14,2); v_discount numeric(14,2); v_subtotal numeric(14,2); v_invoice uuid; v_existing uuid;
  v_repair_paid numeric(14,2) := 0;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if not public.has_permission('payments.manage') then raise exception 'Permission denied'; end if;
  v_company := public.get_my_company_id();
  select r.branch_id,d.customer_id into v_branch,v_customer from public.repairs r join public.devices d on d.id=r.device_id where r.id=p_repair_id and r.company_id=v_company;
  if not found then raise exception 'Repair not found'; end if;
  if v_branch is not null and not public.user_has_branch_access(v_branch) then raise exception 'Branch access denied'; end if;
  if trim(coalesce(p_invoice_number,''))='' then raise exception 'Invoice number is required'; end if;
  select id into v_existing from public.invoices where repair_id=p_repair_id and company_id=v_company and status <> 'void' order by created_at asc limit 1;
  if v_existing is not null then return v_existing; end if;
  select greatest(coalesce(r.final_cost,r.estimated_cost,0),0), greatest(coalesce(r.discount,0),0) into v_total,v_discount from public.repairs r where r.id=p_repair_id;
  if p_amount is not null then v_total := greatest(p_amount,0); end if;
  if p_discount is not null then v_discount := greatest(p_discount,0); end if;
  if v_discount > v_total then raise exception 'Discount cannot exceed invoice amount'; end if;
  v_subtotal := v_total + v_discount;
  select coalesce(sum(amount),0) into v_repair_paid from public.repair_payments where repair_id=p_repair_id and company_id=v_company;
  insert into public.invoices(company_id,branch_id,customer_id,repair_id,invoice_number,subtotal,discount,total,due_at,notes,created_by)
  values(v_company,v_branch,v_customer,p_repair_id,trim(p_invoice_number),v_subtotal,v_discount,v_total,p_due_at,p_notes,auth.uid()) returning id into v_invoice;
  insert into public.invoice_items(invoice_id,company_id,description,quantity,unit_price)
  values(v_invoice,v_company,trim(coalesce(nullif(p_description,''),'Repair service')),1,v_total);
  if v_customer is not null and v_total > 0 then
    perform public.record_customer_debt(v_customer,'invoice',v_invoice,greatest(v_total-v_repair_paid,0),0,v_invoice,v_branch,'Repair invoice issued');
  end if;
  return v_invoice;
end;
$$;

create or replace function public.get_repair_profit(p_repair_id uuid)
returns table(repair_id uuid, revenue numeric, parts_cost numeric, gross_profit numeric, margin_percent numeric, amount_paid numeric, outstanding numeric)
language plpgsql
stable security definer
set search_path to 'public'
as $$
declare
  v_company_id uuid; v_branch_id uuid; v_revenue numeric := 0; v_parts_cost numeric := 0; v_paid numeric := 0; v_outstanding numeric := 0;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if not public.has_permission('reports.view') then raise exception 'Permission denied'; end if;
  select r.company_id,r.branch_id,greatest(coalesce(r.final_cost,r.estimated_cost,0),0) into v_company_id,v_branch_id,v_revenue from public.repairs r where r.id=p_repair_id;
  if v_company_id is null or v_company_id <> public.get_my_company_id() then raise exception 'Repair not found'; end if;
  if v_branch_id is not null and not public.user_has_branch_access(v_branch_id) then raise exception 'Branch access denied'; end if;
  select coalesce(sum(rp.amount),0) into v_paid from public.repair_payments rp where rp.repair_id=p_repair_id and rp.company_id=v_company_id;
  select v_paid + coalesce(sum(ip.amount),0) into v_paid from public.invoice_payments ip join public.invoices i on i.id=ip.invoice_id where i.repair_id=p_repair_id and ip.company_id=v_company_id and i.company_id=v_company_id;
  select coalesce(sum((u.quantity_used-u.quantity_returned)*u.unit_cost),0) into v_parts_cost from public.repair_parts_usage u where u.repair_id=p_repair_id and u.company_id=v_company_id;
  v_parts_cost := greatest(v_parts_cost,0); v_paid := greatest(v_paid,0); v_outstanding := greatest(v_revenue-v_paid,0);
  return query select p_repair_id,v_revenue,v_parts_cost,v_revenue-v_parts_cost,case when v_revenue>0 then ((v_revenue-v_parts_cost)/v_revenue)*100 else 0 end,v_paid,v_outstanding;
end;
$$;

create or replace function public.record_invoice_payment(p_invoice_id uuid, p_amount numeric, p_payment_method text default 'cash', p_notes text default null, p_idempotency_key uuid default null)
returns uuid
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_company uuid; v_customer uuid; v_branch uuid; v_total numeric; v_paid numeric; v_id uuid; v_existing uuid; v_user uuid:=auth.uid(); v_key uuid:=coalesce(p_idempotency_key,gen_random_uuid()); v_status text; v_repair_id uuid;
begin
  if v_user is null then raise exception 'Not authenticated'; end if;
  if not public.has_permission('payments.manage') then raise exception 'Permission denied'; end if;
  if p_amount is null or p_amount<=0 then raise exception 'Payment amount must be greater than zero'; end if;
  if p_payment_method not in ('cash','transfer','pos','other') then raise exception 'Invalid payment method'; end if;
  v_company:=public.get_my_company_id(); if v_company is null then raise exception 'Company not found'; end if;
  if p_idempotency_key is not null then select id into v_existing from public.invoice_payments where company_id=v_company and idempotency_key=p_idempotency_key; if v_existing is not null then return v_existing; end if; end if;
  select i.company_id,i.customer_id,i.branch_id,i.total,i.status,i.repair_id into v_company,v_customer,v_branch,v_total,v_status,v_repair_id from public.invoices i where i.id=p_invoice_id and i.company_id=v_company for update;
  if not found then raise exception 'Invoice not found'; end if;
  if v_status='void' then raise exception 'Cannot record payment on a void invoice'; end if;
  if v_branch is not null and not public.user_has_branch_access(v_branch) then raise exception 'Branch access denied'; end if;
  select coalesce(sum(amount),0) into v_paid from public.invoice_payments where invoice_id=p_invoice_id and company_id=v_company;
  if p_amount>greatest(v_total-v_paid,0) then raise exception 'Payment exceeds invoice balance. Remaining: %',greatest(v_total-v_paid,0); end if;
  insert into public.invoice_payments(company_id,branch_id,invoice_id,customer_id,amount,payment_method,notes,recorded_by,idempotency_key) values(v_company,v_branch,p_invoice_id,v_customer,p_amount,p_payment_method,p_notes,v_user,v_key) returning id into v_id;
  if v_customer is not null then perform public.record_customer_debt(v_customer,'payment',v_id,0,p_amount,p_invoice_id,v_branch,'Payment for invoice '||p_invoice_id::text); end if;
  insert into public.financial_transactions(company_id,branch_id,direction,category,amount,payment_method,description,source_type,source_id,occurred_at,recorded_by) values(v_company,v_branch,'in','customer_payment',p_amount,p_payment_method,'Payment received for invoice '||p_invoice_id::text,'invoice_payment',v_id,now(),v_user);
  update public.invoices set status=case when v_paid+p_amount>=v_total then 'paid' when v_paid+p_amount>0 then 'part_paid' else 'issued' end where id=p_invoice_id;
  if v_repair_id is not null then update public.repairs set deposit=coalesce((select sum(rp.amount) from public.repair_payments rp where rp.repair_id=v_repair_id and rp.company_id=v_company),0)+coalesce((select sum(ip.amount) from public.invoice_payments ip join public.invoices ii on ii.id=ip.invoice_id where ii.repair_id=v_repair_id and ii.company_id=v_company and ip.company_id=v_company),0) where id=v_repair_id and company_id=v_company; end if;
  return v_id;
exception when unique_violation then select id into v_existing from public.invoice_payments where company_id=v_company and idempotency_key=v_key; if v_existing is not null then return v_existing; end if; raise;
end;
$$;

create or replace view public.repair_balance_view as
with repair_paid as (select rp.repair_id,rp.company_id,coalesce(sum(rp.amount),0) amount from public.repair_payments rp group by rp.repair_id,rp.company_id),
invoice_paid as (select i.repair_id,i.company_id,coalesce(sum(ip.amount),0) amount from public.invoices i join public.invoice_payments ip on ip.invoice_id=i.id and ip.company_id=i.company_id where i.status<>'void' and i.repair_id is not null group by i.repair_id,i.company_id)
select r.id repair_id,r.company_id,r.branch_id,r.device_id,r.status,coalesce(r.final_cost,r.estimated_cost,0)::numeric total_amount,(coalesce(rp.amount,0)+coalesce(ip.amount,0))::numeric paid_amount,
case when r.status in ('Cancelled','Returned Unrepaired') then 0::numeric else greatest(coalesce(r.final_cost,r.estimated_cost,0)-coalesce(rp.amount,0)-coalesce(ip.amount,0),0)::numeric end outstanding,
case when r.status in ('Cancelled','Returned Unrepaired') then 'Not chargeable' when coalesce(r.final_cost,r.estimated_cost,0)<=coalesce(rp.amount,0)+coalesce(ip.amount,0) then 'Paid' when coalesce(rp.amount,0)+coalesce(ip.amount,0)>0 then 'Partially paid' else 'Unpaid' end payment_status
from public.repairs r left join repair_paid rp on rp.repair_id=r.id and rp.company_id=r.company_id left join invoice_paid ip on ip.repair_id=r.id and ip.company_id=r.company_id where coalesce(r.final_cost,r.estimated_cost,0)>0;

create or replace function public.get_dashboard_summary()
returns table(repairs_today bigint, active_repairs bigint, completed_today bigint, cash_today numeric, outstanding_customer numeric, low_stock_count bigint, engineer_debit numeric)
language plpgsql stable security definer set search_path to 'public'
as $$
declare v_user_id uuid:=auth.uid(); v_company_id uuid;
begin
 if v_user_id is null then raise exception 'Authentication required'; end if;
 select p.company_id into v_company_id from public.profiles p where p.id=v_user_id and p.is_active=true;
 if v_company_id is null then raise exception 'Active company profile required'; end if;
 return query with auth_ctx as (select v_company_id company_id), today as (select date_trunc('day',now() at time zone 'Africa/Lagos') at time zone 'Africa/Lagos' started),
 repair_counts as (select count(*) filter(where r.created_at>=(select started from today)) repairs_today,count(*) filter(where r.status not in ('Completed','Collected','Cancelled')) active_repairs,count(*) filter(where r.completed_at>=(select started from today) and r.status<>'Cancelled') completed_today from public.repairs r join auth_ctx a on a.company_id=r.company_id where r.branch_id is null or public.user_has_branch_access(r.branch_id)),
 cash as (select coalesce(sum(x.amount),0) cash_today from (select rp.amount from public.repair_payments rp join public.repairs r on r.id=rp.repair_id and r.company_id=rp.company_id join auth_ctx a on a.company_id=rp.company_id where rp.payment_date>=(select started from today) and (r.branch_id is null or public.user_has_branch_access(r.branch_id)) union all select ip.amount from public.invoice_payments ip join public.invoices i on i.id=ip.invoice_id and i.company_id=ip.company_id join auth_ctx a on a.company_id=ip.company_id where ip.payment_date>=(select started from today) and i.status<>'void' and (i.branch_id is null or public.user_has_branch_access(i.branch_id)) union all select coalesce(s.total,0) from public.sales s join auth_ctx a on a.company_id=s.company_id where s.sale_date>=(select started from today) and (s.branch_id is null or public.user_has_branch_access(s.branch_id))) x),
 outstanding as (select coalesce(sum(v.outstanding),0) outstanding_customer from public.repair_balance_view v join auth_ctx a on a.company_id=v.company_id where v.outstanding>0 and (v.branch_id is null or public.user_has_branch_access(v.branch_id))),
 low as (select count(*) low_stock_count from public.inventory i join auth_ctx a on a.company_id=i.company_id where coalesce(i.quantity,0)<=coalesce(i.minimum_stock,0) and (i.branch_id is null or public.user_has_branch_access(i.branch_id))),
 debt as (select coalesce(sum(t.debit-t.credit),0) engineer_debit from public.engineer_transactions t join auth_ctx a on a.company_id=t.company_id)
 select rc.*,c.cash_today,o.outstanding_customer,l.low_stock_count,d.engineer_debit from repair_counts rc,cash c,outstanding o,low l,debt d;
end;
$$;
