-- Danchrista is a single-business record system. Keep one person identity when the same
-- person appears in both the debit book (they owe us) and the credit book (we owe them).
alter table public.supplier_payables
  add column if not exists customer_id uuid references public.customers(id) on delete set null;

create index if not exists supplier_payables_customer_idx
  on public.supplier_payables(customer_id);

create or replace view public.supplier_payables_balance_view with (security_invoker=true) as
select
  p.id,
  p.company_id,
  p.branch_id,
  p.customer_id,
  p.person_name,
  p.phone,
  p.description,
  p.agreed_amount,
  p.due_date,
  p.notes,
  p.created_by,
  p.created_at,
  p.updated_at,
  coalesce(sum(sp.amount),0)::numeric(14,2) as amount_paid,
  greatest(p.agreed_amount-coalesce(sum(sp.amount),0),0)::numeric(14,2) as balance,
  case
    when coalesce(sum(sp.amount),0)>=p.agreed_amount then 'paid'
    when coalesce(sum(sp.amount),0)>0 then 'part_paid'
    else 'open'
  end as computed_status,
  count(sp.id)::bigint as payment_count
from public.supplier_payables p
left join public.supplier_payable_payments sp
  on sp.payable_id=p.id and sp.company_id=p.company_id
group by p.id;

grant select on public.supplier_payables_balance_view to authenticated;

-- Only link people inside the same Danchrista company.
create or replace function public.validate_supplier_payable_customer()
returns trigger
language plpgsql
as $$
begin
  if new.customer_id is not null then
    if not exists (
      select 1 from public.customers c
      where c.id = new.customer_id
        and c.company_id = new.company_id
    ) then
      raise exception 'Selected person does not belong to this business';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists supplier_payable_customer_guard on public.supplier_payables;
create trigger supplier_payable_customer_guard
before insert or update of customer_id, company_id on public.supplier_payables
for each row execute function public.validate_supplier_payable_customer();
