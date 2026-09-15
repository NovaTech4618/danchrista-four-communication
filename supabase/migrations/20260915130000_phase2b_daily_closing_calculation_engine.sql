-- Phase 2B: authoritative Daily Closing calculation engine.
-- Reads Phase 1 business events only. Daily Closing snapshot tables are never inputs.

create index if not exists sales_company_sale_date_idx
  on public.sales (company_id, sale_date);
create index if not exists repairs_company_completed_at_idx
  on public.repairs (company_id, completed_at);
create index if not exists invoices_company_issued_at_idx
  on public.invoices (company_id, issued_at);
create index if not exists financial_transactions_company_occurred_at_idx
  on public.financial_transactions (company_id, occurred_at);
create index if not exists inventory_stock_movements_company_created_at_idx
  on public.inventory_stock_movements (company_id, created_at);
create index if not exists customer_debt_ledger_company_created_at_idx
  on public.customer_debt_ledger (company_id, created_at);
create index if not exists engineer_transactions_company_created_at_idx
  on public.engineer_transactions (company_id, created_at);

create or replace function public.calculate_daily_closing_position(
  p_company_id uuid,
  p_business_date date,
  p_opening_cash numeric default null
)
returns table (
  company_id uuid,
  business_date date,
  timezone text,
  opening_cash numeric,
  opening_cash_available boolean,
  sales_revenue numeric,
  repair_revenue numeric,
  engineer_revenue numeric,
  standalone_invoice_revenue numeric,
  linked_invoice_revenue numeric,
  total_revenue numeric,
  cash_received numeric,
  transfer_received numeric,
  pos_received numeric,
  other_received numeric,
  total_cash_received numeric,
  customer_opening numeric,
  customer_charges numeric,
  customer_payments numeric,
  customer_closing numeric,
  engineer_opening numeric,
  engineer_charges numeric,
  engineer_credits numeric,
  engineer_payments numeric,
  engineer_closing numeric,
  sale_cogs numeric,
  repair_cogs numeric,
  engineer_cogs numeric,
  return_cogs numeric,
  total_cogs numeric,
  operating_expenses numeric,
  engineer_direct_cost numeric,
  gross_profit numeric,
  net_profit numeric,
  cash_inflows numeric,
  cash_outflows numeric,
  expected_closing_cash numeric
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_timezone text;
  v_start timestamptz;
  v_end timestamptz;
  v_user_company uuid;
  v_sales numeric := 0;
  v_repairs numeric := 0;
  v_engineer_revenue numeric := 0;
  v_standalone_invoice numeric := 0;
  v_cash numeric := 0;
  v_transfer numeric := 0;
  v_pos numeric := 0;
  v_other numeric := 0;
  v_total_cash_received numeric := 0;
  v_customer_open numeric := 0;
  v_customer_charges numeric := 0;
  v_customer_payments numeric := 0;
  v_customer_close numeric := 0;
  v_engineer_open numeric := 0;
  v_engineer_charges numeric := 0;
  v_engineer_credits numeric := 0;
  v_engineer_payments numeric := 0;
  v_engineer_close numeric := 0;
  v_sale_cogs numeric := 0;
  v_repair_cogs numeric := 0;
  v_engineer_cogs numeric := 0;
  v_return_cogs numeric := 0;
  v_operating_expenses numeric := 0;
  v_engineer_direct_cost numeric := 0;
  v_cash_inflows numeric := 0;
  v_cash_outflows numeric := 0;
  v_total_revenue numeric := 0;
  v_total_cogs numeric := 0;
  v_gross_profit numeric := 0;
  v_net_profit numeric := 0;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  select p.company_id into v_user_company
  from public.profiles p where p.id = auth.uid() and p.is_active = true;
  if v_user_company is null or v_user_company <> p_company_id then raise exception 'Company access denied'; end if;
  if not public.has_permission('daily_closing.view') then raise exception 'Permission denied'; end if;
  if p_business_date is null then raise exception 'Business date is required'; end if;
  select coalesce(c.timezone, 'Africa/Lagos') into v_timezone from public.companies c where c.id = p_company_id;
  if v_timezone is null then raise exception 'Company not found'; end if;
  v_start := (p_business_date::text || ' 00:00:00')::timestamp at time zone v_timezone;
  v_end := ((p_business_date + 1)::text || ' 00:00:00')::timestamp at time zone v_timezone;

  select coalesce(sum(s.total),0) into v_sales
  from public.sales s where s.company_id=p_company_id and s.sale_date>=v_start and s.sale_date<v_end;
  select coalesce(sum(greatest(coalesce(r.final_cost,r.estimated_cost,0),0)),0) into v_repairs
  from public.repairs r where r.company_id=p_company_id and r.status in ('Completed','Collected') and r.completed_at>=v_start and r.completed_at<v_end;
  select coalesce(sum(t.debit-t.credit),0) into v_engineer_revenue
  from public.engineer_transactions t where t.company_id=p_company_id and t.transaction_type in ('parts_out','service_charge','parts_in') and t.created_at>=v_start and t.created_at<v_end;
  select coalesce(sum(i.total),0) into v_standalone_invoice
  from public.invoices i where i.company_id=p_company_id and i.sale_id is null and i.repair_id is null and i.status<>'void' and i.issued_at>=v_start and i.issued_at<v_end;

  select
    coalesce(sum(f.amount) filter(where f.direction='in' and lower(trim(coalesce(f.payment_method,'')))='cash'),0),
    coalesce(sum(f.amount) filter(where f.direction='in' and lower(trim(coalesce(f.payment_method,''))) in('transfer','bank_transfer','bank transfer')),0),
    coalesce(sum(f.amount) filter(where f.direction='in' and lower(trim(coalesce(f.payment_method,''))) in('pos','card')),0),
    coalesce(sum(f.amount) filter(where f.direction='in' and lower(trim(coalesce(f.payment_method,''))) not in('cash','transfer','bank_transfer','bank transfer','pos','card')),0),
    coalesce(sum(f.amount) filter(where f.direction='in'),0),
    coalesce(sum(f.amount) filter(where f.direction='out' and lower(trim(coalesce(f.payment_method,'')))='cash'),0)
  into v_cash,v_transfer,v_pos,v_other,v_total_cash_received,v_cash_outflows
  from public.financial_transactions f where f.company_id=p_company_id and f.occurred_at>=v_start and f.occurred_at<v_end;
  v_cash_inflows := v_cash;

  select coalesce(sum(balance),0) into v_customer_open from (
    select greatest(coalesce(sum(d.debit),0)-coalesce(sum(d.credit),0),0) balance
    from public.customer_debt_ledger d where d.company_id=p_company_id and d.created_at<v_start group by d.customer_id
  ) x;
  select coalesce(sum(d.debit),0),coalesce(sum(d.credit),0) into v_customer_charges,v_customer_payments
  from public.customer_debt_ledger d where d.company_id=p_company_id and d.created_at>=v_start and d.created_at<v_end;
  select coalesce(sum(balance),0) into v_customer_close from (
    select greatest(coalesce(sum(d.debit),0)-coalesce(sum(d.credit),0),0) balance
    from public.customer_debt_ledger d where d.company_id=p_company_id and d.created_at<v_end group by d.customer_id
  ) x;

  select coalesce(sum(balance),0) into v_engineer_open from (
    select greatest(coalesce(sum(t.debit) filter(where t.transaction_type<>'payment_out'),0)-coalesce(sum(t.credit),0),0) balance
    from public.engineer_transactions t where t.company_id=p_company_id and t.created_at<v_start group by t.engineer_id
  ) x;
  select coalesce(sum(t.debit) filter(where t.transaction_type<>'payment_out'),0),
         coalesce(sum(t.credit) filter(where t.transaction_type<>'payment_in'),0),
         coalesce(sum(t.credit) filter(where t.transaction_type='payment_in'),0)
  into v_engineer_charges,v_engineer_credits,v_engineer_payments
  from public.engineer_transactions t where t.company_id=p_company_id and t.created_at>=v_start and t.created_at<v_end;
  select coalesce(sum(balance),0) into v_engineer_close from (
    select greatest(coalesce(sum(t.debit) filter(where t.transaction_type<>'payment_out'),0)-coalesce(sum(t.credit),0),0) balance
    from public.engineer_transactions t where t.company_id=p_company_id and t.created_at<v_end group by t.engineer_id
  ) x;

  select coalesce(sum(m.total_cost) filter(where m.movement_type='sale'),0),
         coalesce(sum(m.total_cost) filter(where m.movement_type='repair_use'),0),
         coalesce(sum(m.total_cost) filter(where m.movement_type='engineer_out'),0),
         -coalesce(sum(m.total_cost) filter(where m.movement_type in('repair_return','engineer_return')),0)
  into v_sale_cogs,v_repair_cogs,v_engineer_cogs,v_return_cogs
  from public.inventory_stock_movements m
  where m.company_id=p_company_id and m.created_at>=v_start and m.created_at<v_end
    and m.movement_type in('sale','repair_use','engineer_out','repair_return','engineer_return');

  select coalesce(sum(f.amount),0) into v_operating_expenses
  from public.financial_transactions f where f.company_id=p_company_id and f.direction='out'
    and f.category in('salary','rent','utility','other') and f.occurred_at>=v_start and f.occurred_at<v_end;
  select coalesce(sum(f.amount),0) into v_engineer_direct_cost
  from public.financial_transactions f where f.company_id=p_company_id and f.direction='out'
    and f.category='engineer_payment' and f.occurred_at>=v_start and f.occurred_at<v_end;

  v_total_revenue:=v_sales+v_repairs+v_engineer_revenue+v_standalone_invoice;
  v_total_cogs:=v_sale_cogs+v_repair_cogs+v_engineer_cogs+v_return_cogs;
  v_gross_profit:=v_total_revenue-v_total_cogs;
  v_net_profit:=v_gross_profit-v_operating_expenses-v_engineer_direct_cost;

  return query select p_company_id,p_business_date,v_timezone,p_opening_cash,(p_opening_cash is not null),
    v_sales,v_repairs,v_engineer_revenue,v_standalone_invoice,0::numeric,v_total_revenue,
    v_cash,v_transfer,v_pos,v_other,v_total_cash_received,
    v_customer_open,v_customer_charges,v_customer_payments,v_customer_close,
    v_engineer_open,v_engineer_charges,v_engineer_credits,v_engineer_payments,v_engineer_close,
    v_sale_cogs,v_repair_cogs,v_engineer_cogs,v_return_cogs,v_total_cogs,
    v_operating_expenses,v_engineer_direct_cost,v_gross_profit,v_net_profit,
    v_cash_inflows,v_cash_outflows,
    case when p_opening_cash is null then null else p_opening_cash+v_cash-v_cash_outflows end;
end;
$$;

revoke all on function public.calculate_daily_closing_position(uuid,date,numeric) from public, anon, authenticated;
grant execute on function public.calculate_daily_closing_position(uuid,date,numeric) to authenticated;
