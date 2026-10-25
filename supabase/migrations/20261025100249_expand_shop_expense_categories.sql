-- Extend shop expense categories while preserving the existing ledger and authorization boundary.
alter table public.shop_expenses
  drop constraint if exists shop_expenses_category_check;

alter table public.shop_expenses
  add constraint shop_expenses_category_check
  check (category = any (array['transportation','feeding','electricity','water','other']::text[]));

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
  if v_category not in ('transportation','feeding','electricity','water','other') then raise exception 'Invalid shop expense category'; end if;
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
    'shop_expense', now(), v_user, v_branch
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

comment on constraint shop_expenses_category_check on public.shop_expenses
  is 'Supported operating expense categories: transportation, feeding, electricity, water and other.';
