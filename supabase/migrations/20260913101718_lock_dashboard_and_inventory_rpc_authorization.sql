create or replace function public.get_dashboard_summary()
returns table(
  repairs_today bigint,
  active_repairs bigint,
  completed_today bigint,
  cash_today numeric,
  outstanding_customer numeric,
  low_stock_count bigint,
  engineer_debit numeric
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_company_id uuid;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  select p.company_id into v_company_id
  from public.profiles p
  where p.id = v_user_id
    and p.is_active = true;

  if v_company_id is null then
    raise exception 'Active company profile required';
  end if;

  return query
  with auth_ctx as (select v_company_id as company_id),
  today as (select date_trunc('day', now() at time zone 'Africa/Lagos') at time zone 'Africa/Lagos' as started),
  repair_counts as (
    select count(*) filter (where r.created_at >= (select started from today)) as repairs_today,
      count(*) filter (where r.status not in ('Completed','Collected','Cancelled')) as active_repairs,
      count(*) filter (where r.completed_at >= (select started from today) and r.status <> 'Cancelled') as completed_today
    from public.repairs r join auth_ctx a on a.company_id=r.company_id
    where r.branch_id is null or public.user_has_branch_access(r.branch_id)
  ),
  cash as (
    select coalesce(sum(x.amount),0) as cash_today from (
      select rp.amount from public.repair_payments rp
      join public.repairs r on r.id=rp.repair_id and r.company_id=rp.company_id
      join auth_ctx a on a.company_id=rp.company_id
      where rp.payment_date >= (select started from today) and (r.branch_id is null or public.user_has_branch_access(r.branch_id))
      union all
      select coalesce(s.total,0) from public.sales s join auth_ctx a on a.company_id=s.company_id
      where s.sale_date >= (select started from today) and (s.branch_id is null or public.user_has_branch_access(s.branch_id))
    ) x
  ),
  outstanding as (
    select coalesce(sum(v.outstanding),0) as outstanding_customer from public.repair_balance_view v join auth_ctx a on a.company_id=v.company_id
    where v.outstanding>0 and (v.branch_id is null or public.user_has_branch_access(v.branch_id))
  ),
  low as (
    select count(*) as low_stock_count from public.inventory i join auth_ctx a on a.company_id=i.company_id
    where coalesce(i.quantity,0)<=coalesce(i.minimum_stock,0) and (i.branch_id is null or public.user_has_branch_access(i.branch_id))
  ),
  debt as (
    select coalesce(sum(t.debit-t.credit),0) as engineer_debit from public.engineer_transactions t join auth_ctx a on a.company_id=t.company_id
  )
  select rc.*,c.cash_today,o.outstanding_customer,l.low_stock_count,d.engineer_debit from repair_counts rc,cash c,outstanding o,low l,debt d;
end;
$$;

revoke execute on function public.record_inventory_movement(uuid,text,integer,numeric,text,uuid,text) from public, anon, authenticated;
revoke execute on function public.get_dashboard_summary() from anon;
grant execute on function public.get_dashboard_summary() to authenticated;
