create or replace function public.get_repair_financial_summary(p_repair_id uuid)
returns table(repair_id uuid,total_cost numeric,total_paid numeric,outstanding numeric,payment_status text)
language plpgsql stable security definer set search_path=public as $$
declare v_company_id uuid; v_branch_id uuid; v_total_cost numeric(14,2); v_total_paid numeric(14,2);
begin
 if auth.uid() is null then raise exception 'Authentication required'; end if;
 if not public.has_permission('repairs.manage') and not public.has_permission('payments.manage') then raise exception 'Permission denied'; end if;
 select r.company_id,r.branch_id,coalesce(r.final_cost,r.estimated_cost,0) into v_company_id,v_branch_id,v_total_cost from public.repairs r where r.id=p_repair_id;
 if v_company_id is null or v_company_id<>public.get_my_company_id() then raise exception 'Repair not found'; end if;
 if v_branch_id is not null and not public.user_has_branch_access(v_branch_id) then raise exception 'Branch access denied'; end if;
 select coalesce(sum(rp.amount),0) into v_total_paid from public.repair_payments rp where rp.repair_id=p_repair_id and rp.company_id=v_company_id;
 return query select p_repair_id,v_total_cost,v_total_paid,greatest(v_total_cost-v_total_paid,0),case when v_total_cost<=0 then 'Paid' when v_total_paid>=v_total_cost then 'Paid' when v_total_paid>0 then 'Partially paid' else 'Unpaid' end;
end; $$;

create or replace function public.get_repair_profit(p_repair_id uuid)
returns table(repair_id uuid,revenue numeric,parts_cost numeric,gross_profit numeric,margin_percent numeric,amount_paid numeric,outstanding numeric)
language plpgsql stable security definer set search_path=public as $$
declare v_company_id uuid; v_branch_id uuid; v_revenue numeric:=0; v_parts_cost numeric:=0; v_paid numeric:=0; v_outstanding numeric:=0;
begin
 if auth.uid() is null then raise exception 'Authentication required'; end if;
 if not public.has_permission('reports.view') then raise exception 'Permission denied'; end if;
 select r.company_id,r.branch_id,case when coalesce(r.final_cost,0)>0 then r.final_cost else coalesce(r.estimated_cost,0) end into v_company_id,v_branch_id,v_revenue from public.repairs r where r.id=p_repair_id;
 if v_company_id is null or v_company_id<>public.get_my_company_id() then raise exception 'Repair not found'; end if;
 if v_branch_id is not null and not public.user_has_branch_access(v_branch_id) then raise exception 'Branch access denied'; end if;
 select coalesce(sum(rp.amount),0) into v_paid from public.repair_payments rp where rp.repair_id=p_repair_id and rp.company_id=v_company_id;
 select coalesce(sum((u.quantity_used-u.quantity_returned)*u.unit_cost),0) into v_parts_cost from public.repair_parts_usage u where u.repair_id=p_repair_id and u.company_id=v_company_id;
 v_revenue:=greatest(coalesce(v_revenue,0),0); v_parts_cost:=greatest(coalesce(v_parts_cost,0),0); v_paid:=greatest(coalesce(v_paid,0),0); v_outstanding:=greatest(v_revenue-v_paid,0);
 return query select p_repair_id,v_revenue,v_parts_cost,v_revenue-v_parts_cost,case when v_revenue>0 then ((v_revenue-v_parts_cost)/v_revenue)*100 else 0 end,v_paid,v_outstanding;
end; $$;
