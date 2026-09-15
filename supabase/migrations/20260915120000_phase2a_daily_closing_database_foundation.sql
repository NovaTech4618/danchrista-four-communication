-- Phase 2A: Daily Closing database foundation.
-- This migration adds the closing control/snapshot layer only.
-- It does not modify Phase 1 financial event sources or reporting logic.

create table if not exists public.daily_closings (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id),
  business_date date not null,
  status text not null default 'open'
    check (status in ('open','reconciling','closed')),

  opening_cash numeric(20,2) not null check (opening_cash >= 0),
  opening_cash_source text not null default 'initial_manual'
    check (opening_cash_source in ('initial_manual','previous_closing')),
  opening_cash_source_closing_id uuid references public.daily_closings(id),

  expected_cash numeric(20,2),
  actual_cash numeric(20,2) check (actual_cash is null or actual_cash >= 0),
  cash_discrepancy numeric(20,2)
    generated always as (
      case
        when actual_cash is null or expected_cash is null then null
        else actual_cash - expected_cash
      end
    ) stored,

  revenue_total numeric(20,2),
  sales_revenue numeric(20,2),
  repair_revenue numeric(20,2),
  engineer_revenue numeric(20,2),
  standalone_invoice_revenue numeric(20,2),
  cash_received_total numeric(20,2),
  customer_outstanding numeric(20,2),
  engineer_outstanding numeric(20,2),
  cogs_total numeric(20,2),
  operating_expenses numeric(20,2),
  engineer_direct_cost numeric(20,2),
  gross_profit numeric(20,2),
  net_profit numeric(20,2),

  notes text,
  closed_by uuid references auth.users(id),
  closed_at timestamptz,
  reopened_by uuid references auth.users(id),
  reopened_at timestamptz,
  reopen_reason text,

  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint daily_closings_company_business_date_key unique (company_id, business_date),
  constraint daily_closings_opening_source_fk_check check (
    (opening_cash_source = 'initial_manual' and opening_cash_source_closing_id is null)
    or
    (opening_cash_source = 'previous_closing' and opening_cash_source_closing_id is not null)
  )
);

create table if not exists public.daily_closing_payment_methods (
  id uuid primary key default gen_random_uuid(),
  daily_closing_id uuid not null references public.daily_closings(id) on delete cascade,
  payment_method text not null
    check (payment_method in ('cash','transfer','pos','other')),
  expected_amount numeric(20,2) not null default 0 check (expected_amount >= 0),
  actual_amount numeric(20,2) check (actual_amount is null or actual_amount >= 0),
  discrepancy numeric(20,2)
    generated always as (
      case
        when actual_amount is null then null
        else actual_amount - expected_amount
      end
    ) stored,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint daily_closing_payment_methods_unique unique (daily_closing_id, payment_method)
);

create index if not exists daily_closings_company_date_idx
  on public.daily_closings (company_id, business_date desc);

create index if not exists daily_closings_status_idx
  on public.daily_closings (company_id, status);

create index if not exists daily_closing_payment_methods_closing_idx
  on public.daily_closing_payment_methods (daily_closing_id);

-- Owner remains covered by the existing '*' permission.
insert into public.role_permissions (role, permission, allowed)
values
  ('branch_manager', 'daily_closing.view', true),
  ('branch_manager', 'daily_closing.reconcile', true),
  ('branch_manager', 'daily_closing.close', true),
  ('owner', 'daily_closing.view', true),
  ('owner', 'daily_closing.reconcile', true),
  ('owner', 'daily_closing.close', true),
  ('owner', 'daily_closing.reopen', true)
on conflict (role, permission) do update set allowed = excluded.allowed;

alter table public.daily_closings enable row level security;
alter table public.daily_closing_payment_methods enable row level security;

drop policy if exists daily_closings_select on public.daily_closings;
create policy daily_closings_select
  on public.daily_closings
  for select
  to authenticated
  using (
    company_id = public.get_my_company_id()
    and public.has_permission('daily_closing.view')
  );

drop policy if exists daily_closings_no_direct_insert on public.daily_closings;
create policy daily_closings_no_direct_insert
  on public.daily_closings
  for insert
  to authenticated
  with check (false);

drop policy if exists daily_closings_no_direct_update on public.daily_closings;
create policy daily_closings_no_direct_update
  on public.daily_closings
  for update
  to authenticated
  using (false)
  with check (false);

drop policy if exists daily_closings_no_direct_delete on public.daily_closings;
create policy daily_closings_no_direct_delete
  on public.daily_closings
  for delete
  to authenticated
  using (false);

drop policy if exists daily_closing_payment_methods_select on public.daily_closing_payment_methods;
create policy daily_closing_payment_methods_select
  on public.daily_closing_payment_methods
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.daily_closings dc
      where dc.id = daily_closing_id
        and dc.company_id = public.get_my_company_id()
        and public.has_permission('daily_closing.view')
    )
  );

drop policy if exists daily_closing_payment_methods_no_direct_insert on public.daily_closing_payment_methods;
create policy daily_closing_payment_methods_no_direct_insert
  on public.daily_closing_payment_methods
  for insert
  to authenticated
  with check (false);

drop policy if exists daily_closing_payment_methods_no_direct_update on public.daily_closing_payment_methods;
create policy daily_closing_payment_methods_no_direct_update
  on public.daily_closing_payment_methods
  for update
  to authenticated
  using (false)
  with check (false);

drop policy if exists daily_closing_payment_methods_no_direct_delete on public.daily_closing_payment_methods;
create policy daily_closing_payment_methods_no_direct_delete
  on public.daily_closing_payment_methods
  for delete
  to authenticated
  using (false);

-- Controlled RPCs in later gates will create/finalize/reopen closings.
-- The trigger centralizes the required audit events without granting direct writes.
create or replace function public.audit_daily_closing_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    perform public.write_audit_log(
      'daily_closing.created',
      'daily_closing',
      new.id,
      null,
      to_jsonb(new),
      jsonb_build_object('business_date', new.business_date)
    );
  elsif tg_op = 'UPDATE' and old.status is distinct from new.status then
    if old.status = 'closed' and new.status = 'open' then
      perform public.write_audit_log(
        'daily_closing.reopened',
        'daily_closing',
        new.id,
        to_jsonb(old),
        to_jsonb(new),
        jsonb_build_object('business_date', new.business_date, 'reason', new.reopen_reason)
      );
    elsif new.status = 'closed' then
      perform public.write_audit_log(
        'daily_closing.closed',
        'daily_closing',
        new.id,
        to_jsonb(old),
        to_jsonb(new),
        jsonb_build_object(
          'business_date', new.business_date,
          'expected_cash', new.expected_cash,
          'actual_cash', new.actual_cash,
          'cash_discrepancy', new.cash_discrepancy,
          'reason', new.notes
        )
      );
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_audit_daily_closing_change on public.daily_closings;
create trigger trg_audit_daily_closing_change
after insert or update of status on public.daily_closings
for each row execute function public.audit_daily_closing_change();

revoke all on public.daily_closings from anon;
revoke all on public.daily_closing_payment_methods from anon;
revoke all on public.daily_closings from authenticated;
revoke all on public.daily_closing_payment_methods from authenticated;
grant select on public.daily_closings to authenticated;
grant select on public.daily_closing_payment_methods to authenticated;
