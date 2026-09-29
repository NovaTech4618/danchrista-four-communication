-- Add simple supplier debt alerts to the operational alert list.
-- Live database function updated together with this migration.
create or replace function public.refresh_operational_alerts() returns integer language plpgsql security definer set search_path to 'public' as $function$
declare v_company uuid:=public.get_my_company_id(); v_count integer:=0;
begin
 if v_company is null then raise exception 'Company not found'; end if;
 if not public.has_permission('reports.view') then raise exception 'Permission denied'; end if;
 delete from public.operational_alerts where company_id=v_company and created_at<now()-interval '7 days';
 insert into public.operational_alerts(company_id,branch_id,alert_type,title,message,severity,entity_type,entity_id)
 select i.company_id,i.branch_id,'low_stock','Low stock',i.item_name||' has '||i.quantity||' left.',case when i.quantity=0 then 'critical' else 'warning' end,'inventory',i.id
 from public.inventory i where i.company_id=v_company and i.quantity<=i.minimum_stock and (i.branch_id is null or public.user_has_branch_access(i.branch_id))
 and not exists(select 1 from public.operational_alerts a where a.company_id=i.company_id and a.branch_id is not distinct from i.branch_id and a.alert_type='low_stock' and a.entity_id=i.id and a.created_at>now()-interval '1 day');
 get diagnostics v_count=row_count;
 insert into public.operational_alerts(company_id,branch_id,alert_type,title,message,severity,entity_type,entity_id)
 select r.company_id,r.branch_id,'overdue_repair','Repair is late','A repair is past its expected date.','critical','repair',r.id
 from public.repairs r where r.company_id=v_company and r.status not in ('completed','cancelled') and r.expected_completion_date is not null and r.expected_completion_date<current_date and (r.branch_id is null or public.user_has_branch_access(r.branch_id))
 and not exists(select 1 from public.operational_alerts a where a.company_id=r.company_id and a.branch_id is not distinct from r.branch_id and a.alert_type='overdue_repair' and a.entity_id=r.id and a.created_at>now()-interval '1 day');
 insert into public.operational_alerts(company_id,branch_id,alert_type,title,message,severity,entity_type,entity_id)
 select d.company_id,d.branch_id,'customer_balance','Customer owing',c.full_name||' still owes money.','warning','customer',c.id
 from public.customer_debt_ledger d join public.customers c on c.id=d.customer_id where d.company_id=v_company and (d.branch_id is null or public.user_has_branch_access(d.branch_id))
 group by d.company_id,d.branch_id,c.id,c.full_name having sum(d.amount)>0
 and not exists(select 1 from public.operational_alerts a where a.company_id=d.company_id and a.branch_id is not distinct from d.branch_id and a.alert_type='customer_balance' and a.entity_id=c.id and a.created_at>now()-interval '1 day');
 insert into public.operational_alerts(company_id,branch_id,alert_type,title,message,severity,entity_type,entity_id)
 select p.company_id,null,'supplier_payable','Supplier owing',coalesce(p.supplier,'Supplier')||' is owed ₦'||to_char(greatest(coalesce(p.total_amount,0)-coalesce(p.amount_paid,0),0),'FM999,999,999,990'),'warning','purchase',p.id
 from public.inventory_purchases p where p.company_id=v_company and greatest(coalesce(p.total_amount,0)-coalesce(p.amount_paid,0),0)>0
 and not exists(select 1 from public.operational_alerts a where a.company_id=p.company_id and a.alert_type='supplier_payable' and a.entity_id=p.id and a.created_at>now()-interval '1 day');
 return v_count;
end;$function$;