create table if not exists public.supplier_payables (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  branch_id uuid references public.branches(id) on delete set null,
  person_name text not null,
  phone text,
  description text,
  agreed_amount numeric(14,2) not null check (agreed_amount > 0),
  due_date date,
  status text not null default 'open' check (status in ('open','part_paid','paid','cancelled')),
  notes text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.supplier_payable_items (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  payable_id uuid not null references public.supplier_payables(id) on delete cascade,
  item_name text not null,
  quantity numeric(14,2) not null default 1 check (quantity > 0),
  unit_value numeric(14,2) not null check (unit_value >= 0),
  created_at timestamptz not null default now()
);
create table if not exists public.supplier_payable_payments (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  payable_id uuid not null references public.supplier_payables(id) on delete restrict,
  amount numeric(14,2) not null check (amount > 0),
  payment_method text not null default 'cash',
  paid_at timestamptz not null default now(),
  note text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);
create index if not exists supplier_payables_company_status_idx on public.supplier_payables(company_id,status);
create index if not exists supplier_payables_company_due_idx on public.supplier_payables(company_id,due_date);
create index if not exists supplier_payable_items_payable_idx on public.supplier_payable_items(payable_id);
create index if not exists supplier_payable_payments_payable_idx on public.supplier_payable_payments(payable_id,paid_at);
alter table public.supplier_payables enable row level security;
alter table public.supplier_payable_items enable row level security;
alter table public.supplier_payable_payments enable row level security;
drop policy if exists supplier_payables_select on public.supplier_payables;
create policy supplier_payables_select on public.supplier_payables for select to authenticated using(company_id=public.get_my_company_id());
drop policy if exists supplier_payables_insert on public.supplier_payables;
create policy supplier_payables_insert on public.supplier_payables for insert to authenticated with check(company_id=public.get_my_company_id());
drop policy if exists supplier_payables_update on public.supplier_payables;
create policy supplier_payables_update on public.supplier_payables for update to authenticated using(company_id=public.get_my_company_id()) with check(company_id=public.get_my_company_id());
drop policy if exists supplier_payable_items_select on public.supplier_payable_items;
create policy supplier_payable_items_select on public.supplier_payable_items for select to authenticated using(company_id=public.get_my_company_id());
drop policy if exists supplier_payable_items_insert on public.supplier_payable_items;
create policy supplier_payable_items_insert on public.supplier_payable_items for insert to authenticated with check(company_id=public.get_my_company_id());
drop policy if exists supplier_payable_payments_select on public.supplier_payable_payments;
create policy supplier_payable_payments_select on public.supplier_payable_payments for select to authenticated using(company_id=public.get_my_company_id());
drop policy if exists supplier_payable_payments_insert on public.supplier_payable_payments;
create policy supplier_payable_payments_insert on public.supplier_payable_payments for insert to authenticated with check(company_id=public.get_my_company_id());
create or replace view public.supplier_payables_balance_view with (security_invoker=true) as
select p.id,p.company_id,p.branch_id,p.person_name,p.phone,p.description,p.agreed_amount,p.due_date,p.notes,p.created_by,p.created_at,p.updated_at,
coalesce(sum(sp.amount),0)::numeric(14,2) as amount_paid,
greatest(p.agreed_amount-coalesce(sum(sp.amount),0),0)::numeric(14,2) as balance,
case when coalesce(sum(sp.amount),0)>=p.agreed_amount then 'paid' when coalesce(sum(sp.amount),0)>0 then 'part_paid' else 'open' end as computed_status,
count(sp.id)::bigint as payment_count
from public.supplier_payables p
left join public.supplier_payable_payments sp on sp.payable_id=p.id and sp.company_id=p.company_id
group by p.id;
grant select on public.supplier_payables_balance_view to authenticated;
create or replace function public.refresh_supplier_payable_status() returns trigger language plpgsql as $$
declare v_total numeric(14,2); v_agreed numeric(14,2); v_id uuid;
begin v_id:=coalesce(new.payable_id,old.payable_id); select agreed_amount into v_agreed from public.supplier_payables where id=v_id; select coalesce(sum(amount),0) into v_total from public.supplier_payable_payments where payable_id=v_id; update public.supplier_payables set status=case when v_total>=v_agreed then 'paid' when v_total>0 then 'part_paid' else 'open' end,updated_at=now() where id=v_id; return coalesce(new,old); end $$;
drop trigger if exists supplier_payable_payment_status on public.supplier_payable_payments;
create trigger supplier_payable_payment_status after insert or update or delete on public.supplier_payable_payments for each row execute function public.refresh_supplier_payable_status();
