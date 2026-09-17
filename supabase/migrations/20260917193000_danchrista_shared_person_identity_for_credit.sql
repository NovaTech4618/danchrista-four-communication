-- Keep Danchrista debit and credit ledgers financially separate while allowing
-- both sides of a person's relationship with the shop to share one identity.
alter table public.supplier_payables
  add column if not exists customer_id uuid references public.customers(id) on delete set null;

create index if not exists supplier_payables_customer_id_idx
  on public.supplier_payables(customer_id);

-- Preserve the existing view column order for compatibility and append the
-- shared customer identity at the end.
create or replace view public.supplier_payables_balance_view as
select
  p.id,
  p.company_id,
  p.branch_id,
  p.person_name,
  p.phone,
  p.description,
  p.agreed_amount,
  p.due_date,
  p.notes,
  p.created_by,
  p.created_at,
  p.updated_at,
  coalesce(sum(sp.amount), 0)::numeric(14,2) as amount_paid,
  greatest(p.agreed_amount - coalesce(sum(sp.amount), 0), 0)::numeric(14,2) as balance,
  case
    when coalesce(sum(sp.amount), 0) >= p.agreed_amount then 'paid'::text
    when coalesce(sum(sp.amount), 0) > 0 then 'part_paid'::text
    else 'open'::text
  end as computed_status,
  count(sp.id) as payment_count,
  p.customer_id
from public.supplier_payables p
left join public.supplier_payable_payments sp
  on sp.payable_id = p.id
  and sp.company_id = p.company_id
group by p.id;
