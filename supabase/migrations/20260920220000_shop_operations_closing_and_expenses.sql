-- Amezing shop operations: apprentices can run the day without gaining owner financial reporting access.
-- Adds a controlled shop-expense workflow and grants the operational daily-closing permissions.

insert into public.role_permissions(role, permission, allowed)
values
  ('apprentice','daily_closing.view',true),
  ('apprentice','daily_closing.reconcile',true),
  ('apprentice','daily_closing.close',true)
on conflict (role, permission) do update set allowed = excluded.allowed;

create table if not exists public.shop_expenses (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  branch_id uuid references public.branches(id) on delete set null,
  business_date date not null,
  category text not null check (category in ('transportation','water','other')),
  amount numeric not null check (amount > 0),
  payment_method text not null check (lower(trim(payment_method)) in ('cash','transfer','pos','card','other')),
  description text not null check (length(btrim(description)) >= 2),
  financial_transaction_id uuid references public.financial_transactions(id) on delete restrict,
  recorded_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

create index if not exists shop_expenses_company_date_idx
  on public.shop_expenses(company_id, business_date, created_at desc);

alter table public.shop_expenses enable row level security;
revoke all on table public.shop_expenses from anon, authenticated;
grant select on table public.shop_expenses to authenticated;

drop policy if exists shop_expenses_operational_select on public.shop_expenses;
create policy shop_expenses_operational_select
  on public.shop_expenses for select
  to authenticated
  using (
    company_id = public.get_my_company_id()
    and public.has_permission('daily_closing.view')
  );

create or replace function public.record_shop_expense(
  p_business_date date,
  p_category text,
  p_amount numeric,
  p_payment_method text,
  p_description text
)
returns public.shop_expenses
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_user uuid := auth.uid();
  v_company uuid;
  v_branch uuid;
  v_financial_id uuid;
  v_row public.shop_expenses;
  v_category text := lower(btrim(coalesce(p_category,'')));
  v_method text := lower(btrim(coalesce(p_payment_method,'')));
  v_description text := btrim(coalesce(p_description,''));
begin
  if v_user is null then raise exception 'Authentication required'; end if;
  if not public.has_permission('daily_closing.close') then raise exception 'Permission denied'; end if;
  if p_business_date is null then raise exception 'Business date is required'; end if;
  if v_category not in ('transportation','water','other') then raise exception 'Invalid shop expense category'; end if;
  if p_amount is null or p_amount <= 0 then raise exception 'Expense amount must be greater than zero'; end if;
  if v_method not in ('cash','transfer','pos','card','other') then raise exception 'Invalid payment method'; end if;
  if length(v_description) < 2 then raise exception 'Expense description is required'; end if;

  select p.company_id into v_company
  from public.profiles p
  where p.id = v_user and p.is_active = true;

  if v_company is null then raise exception 'Active company profile required'; end if;

  select branch_id into v_branch
  from public.get_my_branch_ids() branch_id
  limit 1;

  insert into public.financial_transactions(
    company_id, direction, category, amount, payment_method, description,
    source_type, occurred_at, recorded_by, branch_id
  )
  values(
    v_company, 'out', 'other', round(p_amount,2), v_method,
    'Shop expense: ' || v_category || ' — ' || v_description,
    'shop_expense',
    now(), v_user, v_branch
  )
  returning id into v_financial_id;

  insert into public.shop_expenses(
    company_id, branch_id, business_date, category, amount, payment_method,
    description, financial_transaction_id, recorded_by
  )
  values(
    v_company, v_branch, p_business_date, v_category, round(p_amount,2), v_method,
    v_description, v_financial_id, v_user
  )
  returning * into v_row;

  return v_row;
end;
$function$;

revoke execute on function public.record_shop_expense(date,text,numeric,text,text) from public;
revoke execute on function public.record_shop_expense(date,text,numeric,text,text) from anon;
grant execute on function public.record_shop_expense(date,text,numeric,text,text) to authenticated;

comment on table public.shop_expenses is 'Operational shop expenses recorded by owner/apprentice; financial_transactions remains the accounting source of truth.';


create or replace function public.get_daily_money_buckets(
  p_business_date date
)
returns table(
  parts_sales numeric,
  accessories_sales numeric,
  repair_payments numeric,
  transportation_expenses numeric,
  water_expenses numeric,
  other_shop_expenses numeric
)
language plpgsql
security definer
stable
set search_path = ''
as $function$
declare
  v_company uuid := public.get_my_company_id();
  v_timezone text;
  v_start timestamptz;
  v_end timestamptz;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if not public.has_permission('profit') then raise exception 'Permission denied'; end if;
  if v_company is null then raise exception 'Company not found'; end if;

  select coalesce(c.timezone,'Africa/Lagos') into v_timezone
  from public.companies c where c.id=v_company;
  v_start := (p_business_date::text||' 00:00:00')::timestamp at time zone v_timezone;
  v_end := ((p_business_date+1)::text||' 00:00:00')::timestamp at time zone v_timezone;

  return query
  with item_totals as (
    select
      si.sale_id,
      sum(si.total_price) as subtotal,
      sum(si.total_price) filter(where i.item_type='part') as parts_amount,
      sum(si.total_price) filter(where i.item_type in ('accessory','gadget')) as accessories_amount
    from public.sale_items si
    join public.inventory i on i.id=si.inventory_id
    group by si.sale_id
  ),
  allocated_sales as (
    select
      s.total,
      coalesce(it.parts_amount,0) as parts_amount,
      coalesce(it.accessories_amount,0) as accessories_amount,
      greatest(coalesce(it.subtotal,0),0) as item_subtotal
    from public.sales s
    join item_totals it on it.sale_id=s.id
    where s.company_id=v_company
      and s.sale_date>=v_start and s.sale_date<v_end
  )
  select
    coalesce(sum(case when item_subtotal>0 then total * parts_amount / item_subtotal else 0 end),0),
    coalesce(sum(case when item_subtotal>0 then total * accessories_amount / item_subtotal else 0 end),0),
    coalesce((select sum(f.amount) from public.financial_transactions f
      where f.company_id=v_company and f.direction='in' and f.category='repair_payment'
        and f.occurred_at>=v_start and f.occurred_at<v_end),0),
    coalesce((select sum(e.amount) from public.shop_expenses e
      where e.company_id=v_company and e.business_date=p_business_date and e.category='transportation'),0),
    coalesce((select sum(e.amount) from public.shop_expenses e
      where e.company_id=v_company and e.business_date=p_business_date and e.category='water'),0),
    coalesce((select sum(e.amount) from public.shop_expenses e
      where e.company_id=v_company and e.business_date=p_business_date and e.category='other'),0)
  from allocated_sales;
end;
$function$;

revoke execute on function public.get_daily_money_buckets(date) from public;
revoke execute on function public.get_daily_money_buckets(date) from anon;
grant execute on function public.get_daily_money_buckets(date) to authenticated;
