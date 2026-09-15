-- Phase 2B evidence exposed a real cross-day accounting defect:
-- invoice-payment financial events were timestamped with created_at instead of
-- the payment's business timestamp. Preserve the authoritative payment_date
-- so Daily Closing assigns cash to the correct Africa/Lagos business day.

create or replace function public.sync_invoice_payment_to_financial_ledger()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_customer_name text;
  v_invoice_number text;
begin
  select c.full_name, i.invoice_number
    into v_customer_name, v_invoice_number
  from public.invoices i
  left join public.customers c on c.id = i.customer_id
  where i.id = new.invoice_id;

  insert into public.financial_transactions (
    company_id, direction, category, amount, payment_method, description,
    source_type, source_id, occurred_at, recorded_by
  ) values (
    new.company_id,
    'in',
    'customer_payment',
    new.amount,
    new.payment_method,
    'Invoice payment'
      || coalesce(' - ' || v_invoice_number, '')
      || coalesce(' - ' || v_customer_name, ''),
    'invoice_payment',
    new.id,
    coalesce(new.payment_date, new.created_at, now()),
    new.recorded_by
  )
  on conflict (source_type, source_id)
    where source_type is not null and source_id is not null
  do update set
    company_id = excluded.company_id,
    direction = excluded.direction,
    category = excluded.category,
    amount = excluded.amount,
    payment_method = excluded.payment_method,
    description = excluded.description,
    occurred_at = excluded.occurred_at,
    recorded_by = excluded.recorded_by;

  return new;
end;
$$;
