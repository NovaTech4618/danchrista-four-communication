-- Phase 1: financial truth reporting and business-day timezone.
-- No historical production rows are deleted or rewritten.

alter table public.companies add column if not exists timezone text not null default 'Africa/Lagos';
update public.companies set timezone='Africa/Lagos' where timezone is null or btrim(timezone)='';
alter table public.companies drop constraint if exists companies_timezone_valid;

create or replace function public.get_profit_summary(p_start timestamptz,p_end timestamptz)
returns table(total_revenue numeric,parts_cost numeric,operating_expenses numeric,engineer_cost numeric,net_profit numeric,cash_in numeric,transfer_in numeric,card_in numeric,other_in numeric,outstanding_customer numeric,engineer_outstanding numeric)
language plpgsql security definer set search_path=public as $$
declare v_company_id uuid;
begin
 if not public.has_permission('reports.view') then raise exception 'Permission denied'; end if;
 v_company_id:=public.get_my_company_id(); if v_company_id is null then raise exception 'Company not found'; end if;
 select coalesce(sum(s.total),0) into total_revenue from public.sales s where s.company_id=v_company_id and s.sale_date>=p_start and s.sale_date<p_end and (s.branch_id is null or public.user_has_branch_access(s.branch_id));
 total_revenue:=total_revenue+coalesce((select sum(coalesce(r.final_cost,r.estimated_cost,0)) from public.repairs r where r.company_id=v_company_id and r.status in('Completed','Collected') and r.completed_at>=p_start and r.completed_at<p_end and (r.branch_id is null or public.user_has_branch_access(r.branch_id))),0);
 total_revenue:=total_revenue+coalesce((select sum(t.debit-t.credit) from public.engineer_transactions t where t.company_id=v_company_id and t.transaction_type in('parts_out','service_charge','parts_in') and t.created_at>=p_start and t.created_at<p_end),0);
 total_revenue:=total_revenue+coalesce((select sum(i.total) from public.invoices i where i.company_id=v_company_id and i.sale_id is null and i.repair_id is null and i.status<>'void' and i.issued_at>=p_start and i.issued_at<p_end and (i.branch_id is null or public.user_has_branch_access(i.branch_id))),0);
 select cogs into parts_cost from public.get_inventory_cogs(p_start,p_end);
 select coalesce(sum(amount),0) into operating_expenses from public.financial_transactions f where f.company_id=v_company_id and f.direction='out' and f.category in('salary','rent','utility','other') and f.occurred_at>=p_start and f.occurred_at<p_end and (f.branch_id is null or public.user_has_branch_access(f.branch_id));
 select coalesce(sum(amount),0) into engineer_cost from public.financial_transactions f where f.company_id=v_company_id and f.direction='out' and f.category='engineer_payment' and f.occurred_at>=p_start and f.occurred_at<p_end and (f.branch_id is null or public.user_has_branch_access(f.branch_id));
 net_profit:=total_revenue-parts_cost-operating_expenses-engineer_cost;
 select coalesce(sum(amount),0) into cash_in from public.financial_transactions f where f.company_id=v_company_id and f.direction='in' and lower(trim(f.payment_method))='cash' and f.occurred_at>=p_start and f.occurred_at<p_end and (f.branch_id is null or public.user_has_branch_access(f.branch_id));
 select coalesce(sum(amount),0) into transfer_in from public.financial_transactions f where f.company_id=v_company_id and f.direction='in' and lower(trim(f.payment_method)) in('transfer','bank_transfer','bank transfer') and f.occurred_at>=p_start and f.occurred_at<p_end and (f.branch_id is null or public.user_has_branch_access(f.branch_id));
 select coalesce(sum(amount),0) into card_in from public.financial_transactions f where f.company_id=v_company_id and f.direction='in' and lower(trim(f.payment_method)) in('pos','card') and f.occurred_at>=p_start and f.occurred_at<p_end and (f.branch_id is null or public.user_has_branch_access(f.branch_id));
 select coalesce(sum(amount),0) into other_in from public.financial_transactions f where f.company_id=v_company_id and f.direction='in' and lower(trim(coalesce(f.payment_method,''))) not in('cash','transfer','bank_transfer','bank transfer','pos','card') and f.occurred_at>=p_start and f.occurred_at<p_end and (f.branch_id is null or public.user_has_branch_access(f.branch_id));
 select coalesce(sum(balance),0) into outstanding_customer from (select greatest(coalesce(sum(d.debit),0)-coalesce(sum(d.credit),0),0) balance from public.customer_debt_ledger d where d.company_id=v_company_id and (d.branch_id is null or public.user_has_branch_access(d.branch_id)) group by d.customer_id) x;
 select coalesce(sum(balance),0) into engineer_outstanding from public.get_engineer_balances();
 return next;
end;$$;

create or replace function public.get_daily_profit_trend(p_start timestamptz,p_end timestamptz)
returns table(day date,revenue numeric,parts_cost numeric,operating_expenses numeric,engineer_cost numeric,net_profit numeric)
language sql security definer set search_path=public as $$
with company as(select timezone from public.companies where id=public.get_my_company_id()),
days as(select gs::date day_value from company,generate_series((p_start at time zone company.timezone)::date,((p_end-interval '1 microsecond') at time zone company.timezone)::date,interval '1 day') gs),
revenue as(
 select (s.sale_date at time zone c.timezone)::date day_value,sum(s.total) amount from public.sales s cross join company c where s.company_id=public.get_my_company_id() and s.sale_date>=p_start and s.sale_date<p_end and (s.branch_id is null or public.user_has_branch_access(s.branch_id)) group by 1
 union all select (r.completed_at at time zone c.timezone)::date,sum(coalesce(r.final_cost,r.estimated_cost,0)) from public.repairs r cross join company c where r.company_id=public.get_my_company_id() and r.status in('Completed','Collected') and r.completed_at>=p_start and r.completed_at<p_end and (r.branch_id is null or public.user_has_branch_access(r.branch_id)) group by 1
 union all select (t.created_at at time zone c.timezone)::date,sum(t.debit-t.credit) from public.engineer_transactions t cross join company c where t.company_id=public.get_my_company_id() and t.transaction_type in('parts_out','service_charge','parts_in') and t.created_at>=p_start and t.created_at<p_end group by 1
 union all select (i.issued_at at time zone c.timezone)::date,sum(i.total) from public.invoices i cross join company c where i.company_id=public.get_my_company_id() and i.sale_id is null and i.repair_id is null and i.status<>'void' and i.issued_at>=p_start and i.issued_at<p_end and (i.branch_id is null or public.user_has_branch_access(i.branch_id)) group by 1),
rev as(select day_value,sum(amount) amount from revenue group by 1),
expenses as(select (f.occurred_at at time zone c.timezone)::date day_value,coalesce(sum(f.amount) filter(where f.category in('salary','rent','utility','other')),0) operating,coalesce(sum(f.amount) filter(where f.category='engineer_payment'),0) engineer from public.financial_transactions f cross join company c where f.company_id=public.get_my_company_id() and f.direction='out' and f.occurred_at>=p_start and f.occurred_at<p_end and (f.branch_id is null or public.user_has_branch_access(f.branch_id)) group by 1),
cogs as(select (m.created_at at time zone c.timezone)::date day_value,coalesce(sum(case when m.movement_type in('sale','repair_use','engineer_out') then m.total_cost when m.movement_type in('repair_return','engineer_return') then -m.total_cost else 0 end),0) amount from public.inventory_stock_movements m join public.inventory i on i.id=m.inventory_id cross join company c where m.company_id=public.get_my_company_id() and m.created_at>=p_start and m.created_at<p_end and (i.branch_id is null or public.user_has_branch_access(i.branch_id)) group by 1)
select d.day_value,coalesce(r.amount,0),coalesce(c.amount,0),coalesce(e.operating,0),coalesce(e.engineer,0),coalesce(r.amount,0)-coalesce(c.amount,0)-coalesce(e.operating,0)-coalesce(e.engineer,0) from days d left join rev r on r.day_value=d.day_value left join cogs c on c.day_value=d.day_value left join expenses e on e.day_value=d.day_value where public.has_permission('reports.view') order by d.day_value;
$$;

drop function if exists public.get_business_report(timestamptz,timestamptz);
create function public.get_business_report(p_from timestamptz default date_trunc('month',now()),p_to timestamptz default now())
returns table(sales_revenue numeric,repair_revenue numeric,engineer_revenue numeric,standalone_invoice_revenue numeric,cash_received numeric,inventory_cogs numeric,gross_profit numeric,operating_expenses numeric,engineer_cost numeric,net_profit numeric,repairs_received bigint,repairs_completed bigint,customer_outstanding numeric,engineer_outstanding numeric,low_stock_items bigint)
language sql stable security definer set search_path=public as $$
with company as(select id from public.companies where id=public.get_my_company_id()),
s as(select coalesce(sum(total),0) value from public.sales where company_id=(select id from company) and sale_date>=p_from and sale_date<p_to and (branch_id is null or public.user_has_branch_access(branch_id))),
r as(select coalesce(sum(coalesce(final_cost,estimated_cost,0)),0) value,count(*) filter(where created_at>=p_from and created_at<p_to) received,count(*) filter(where completed_at>=p_from and completed_at<p_to and status in('Completed','Collected')) completed from public.repairs where company_id=(select id from company) and (branch_id is null or public.user_has_branch_access(branch_id)) and status not in('Cancelled','Returned Unrepaired')),
er as(select coalesce(sum(debit-credit),0) value from public.engineer_transactions where company_id=(select id from company) and transaction_type in('parts_out','service_charge','parts_in') and created_at>=p_from and created_at<p_to),
i as(select coalesce(sum(total),0) value from public.invoices where company_id=(select id from company) and sale_id is null and repair_id is null and status<>'void' and issued_at>=p_from and issued_at<p_to and (branch_id is null or public.user_has_branch_access(branch_id))),
p as(select coalesce(sum(amount),0) value from public.financial_transactions where company_id=(select id from company) and direction='in' and occurred_at>=p_from and occurred_at<p_to and (branch_id is null or public.user_has_branch_access(branch_id))),
c as(select coalesce(sum(case when movement_type in('sale','repair_use','engineer_out') then total_cost when movement_type in('repair_return','engineer_return') then -total_cost else 0 end),0) value from public.inventory_stock_movements m join public.inventory inv on inv.id=m.inventory_id where m.company_id=(select id from company) and m.created_at>=p_from and m.created_at<p_to and (inv.branch_id is null or public.user_has_branch_access(inv.branch_id))),
o as(select coalesce(sum(amount),0) value from public.financial_transactions where company_id=(select id from company) and direction='out' and category in('salary','rent','utility','other') and occurred_at>=p_from and occurred_at<p_to and (branch_id is null or public.user_has_branch_access(branch_id))),
ec as(select coalesce(sum(amount),0) value from public.financial_transactions where company_id=(select id from company) and direction='out' and category='engineer_payment' and occurred_at>=p_from and occurred_at<p_to and (branch_id is null or public.user_has_branch_access(branch_id))),
cu as(select coalesce(sum(balance),0) value from(select greatest(coalesce(sum(d.debit),0)-coalesce(sum(d.credit),0),0) balance from public.customer_debt_ledger d where d.company_id=(select id from company) and (d.branch_id is null or public.user_has_branch_access(d.branch_id)) group by d.customer_id)x),
eng as(select coalesce(sum(balance),0) value from public.get_engineer_balances()),
ls as(select count(*) value from public.inventory where company_id=(select id from company) and coalesce(quantity,0)<=coalesce(minimum_stock,0) and (branch_id is null or public.user_has_branch_access(branch_id)))
select s.value,r.value,er.value,i.value,p.value,c.value,(s.value+r.value+er.value+i.value-c.value),o.value,ec.value,(s.value+r.value+er.value+i.value-c.value-o.value-ec.value),r.received,r.completed,cu.value,eng.value,ls.value from s,r,er,i,p,c,o,ec,cu,eng,ls where public.has_permission('reports.view');
$$;
revoke all on function public.get_business_report(timestamptz,timestamptz) from public,anon;
grant execute on function public.get_business_report(timestamptz,timestamptz) to authenticated;
