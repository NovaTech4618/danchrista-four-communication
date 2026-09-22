-- Phase 1 final integrity audit fixes.
-- Customer phone is optional and uniqueness is scoped to the company.
-- Returns/replacements use the stock ledger and its movement types are valid.
-- Business COGS includes replacement stock leaving inventory.
-- Correct current company wording in owner notifications.

alter table public.customers alter column phone drop not null;
drop index if exists public.customers_phone_key;
create unique index if not exists customers_company_phone_key on public.customers(company_id, phone) where phone is not null and btrim(phone) <> '';

alter table public.inventory_stock_movements drop constraint if exists inventory_stock_movements_movement_type_check;
alter table public.inventory_stock_movements add constraint inventory_stock_movements_movement_type_check check (movement_type = any (array['opening','purchase','sale','sale_return','replacement_out','repair_use','repair_return','engineer_out','engineer_return','adjustment_in','adjustment_out']));

create or replace function public.create_walk_in_repair(
 p_customer_name text,p_phone text,p_device_type text,p_brand text,p_model text,
 p_serial_number text default null,p_color text default null,p_issue text default '',p_technician text default null,
 p_estimated_cost numeric default null,p_deposit numeric default 0,p_payment_method text default 'Cash',
 p_priority text default 'Normal',p_expected_completion_date date default null)
returns table(repair_id uuid,customer_id uuid,device_id uuid)
language plpgsql security definer set search_path='public' as $$
declare v_company_id uuid; v_branch_id uuid; v_customer_id uuid; v_device_id uuid; v_repair_id uuid; v_payment_method text; v_estimated numeric; v_deposit numeric;
begin
 if auth.uid() is null then raise exception 'Authentication required'; end if;
 v_company_id:=public.get_my_company_id(); if v_company_id is null then raise exception 'Your account is not connected to a company'; end if;
 if not public.has_permission('repairs.manage') then raise exception 'You do not have permission to create repairs'; end if;
 select ub.branch_id into v_branch_id from public.user_branches ub join public.branches b on b.id=ub.branch_id and b.company_id=v_company_id where ub.profile_id=auth.uid() order by ub.created_at asc limit 1;
 if v_branch_id is null then select b.id into v_branch_id from public.branches b where b.company_id=v_company_id and b.is_main=true order by b.created_at asc limit 1; end if;
 if v_branch_id is null then raise exception 'No branch is assigned to your account'; end if;
 if nullif(trim(coalesce(p_customer_name,'')),'') is null then raise exception 'Customer name is required'; end if;
 if nullif(trim(coalesce(p_brand,'')),'') is null or nullif(trim(coalesce(p_model,'')),'') is null then raise exception 'Device brand and model are required'; end if;
 if nullif(trim(coalesce(p_issue,'')),'') is null then raise exception 'Repair issue is required'; end if;
 v_estimated:=p_estimated_cost; v_deposit:=coalesce(p_deposit,0);
 if v_estimated is not null and (v_estimated<0 or v_estimated<>v_estimated) then raise exception 'Estimated cost is invalid'; end if;
 if v_deposit<0 or v_deposit<>v_deposit then raise exception 'Deposit is invalid'; end if;
 if v_estimated is not null and v_deposit>v_estimated then raise exception 'Deposit cannot be greater than the estimated cost'; end if;
 v_payment_method:=case lower(trim(coalesce(p_payment_method,'cash'))) when 'cash' then 'Cash' when 'transfer' then 'Transfer' when 'pos' then 'POS' when 'other' then 'Other' else null end;
 if v_payment_method is null then raise exception 'Invalid payment method'; end if;
 if nullif(trim(coalesce(p_phone,'')),'') is not null then
   select c.id into v_customer_id from public.customers c where c.company_id=v_company_id and c.phone=trim(p_phone) order by c.created_at asc limit 1;
 end if;
 if v_customer_id is null then
   insert into public.customers(company_id,full_name,phone,email,address) values(v_company_id,trim(p_customer_name),nullif(trim(coalesce(p_phone,'')),''),null,null) returning id into v_customer_id;
 else
   update public.customers set full_name=trim(p_customer_name) where id=v_customer_id and company_id=v_company_id;
 end if;
 insert into public.devices(company_id,customer_id,device_type,brand,model,serial_number,color,condition,accessories,problem)
 values(v_company_id,v_customer_id,coalesce(nullif(trim(p_device_type),''),'Phone'),trim(p_brand),trim(p_model),nullif(trim(coalesce(p_serial_number,'')),''),nullif(trim(coalesce(p_color,'')),''),null,null,trim(p_issue)) returning id into v_device_id;
 insert into public.repairs(company_id,branch_id,device_id,technician,issue,diagnosis,repair_notes,solution,priority,deposit,deposit_payment_method,expected_completion_date,estimated_cost,final_cost,status)
 values(v_company_id,v_branch_id,v_device_id,nullif(trim(coalesce(p_technician,'')),''),trim(p_issue),null,null,null,coalesce(nullif(trim(p_priority),''),'Normal'),0,v_payment_method,p_expected_completion_date,v_estimated,null,'Received') returning id into v_repair_id;
 if v_deposit>0 then insert into public.repair_payments(company_id,repair_id,amount,payment_method,payment_date,notes,recorded_by) values(v_company_id,v_repair_id,v_deposit,v_payment_method,now(),'Walk-in repair deposit',auth.uid()); end if;
 return query select v_repair_id,v_customer_id,v_device_id;
end; $$;

create or replace function public.approve_sale_return(p_request_id uuid,p_decision_note text default null)
returns uuid language plpgsql security definer set search_path='public' as $$
declare r public.sale_return_requests%rowtype; x record; v_replacement public.inventory%rowtype; v_return public.inventory%rowtype;
begin
 if auth.uid() is null or not public.has_permission('sales.return_manage') then raise exception 'Only the Boss can approve returns, refunds or replacements'; end if;
 select * into r from public.sale_return_requests where id=p_request_id and company_id=public.get_my_company_id() for update;
 if r.id is null or r.status<>'pending' then raise exception 'Return request not found or no longer pending'; end if;
 if r.action='replacement' then
   select * into v_replacement from public.inventory where id=r.replacement_inventory_id and company_id=r.company_id for update;
   if not found or v_replacement.quantity<coalesce(r.replacement_quantity,0) then raise exception 'Replacement stock is unavailable'; end if;
 end if;
 for x in select sri.quantity,si.inventory_id from public.sale_return_items sri join public.sale_items si on si.id=sri.sale_item_id where sri.request_id=r.id loop
   select * into v_return from public.inventory where id=x.inventory_id and company_id=r.company_id for update;
   if not found then raise exception 'Inventory item no longer exists'; end if;
   perform public.record_inventory_movement(v_return.id,'sale_return',x.quantity,coalesce(v_return.cost_price,0),'sale_return',r.id,r.reason);
 end loop;
 if r.action='replacement' then perform public.record_inventory_movement(r.replacement_inventory_id,'replacement_out',r.replacement_quantity,coalesce(v_replacement.cost_price,0),'sale_return',r.id,'Replacement issued');
 elsif r.action='refund' then
   insert into public.financial_transactions(company_id,branch_id,direction,category,amount,payment_method,description,source_type,source_id,occurred_at,recorded_by)
   values(r.company_id,r.branch_id,'out','customer_refund',r.refund_amount,coalesce(r.refund_payment_method,'cash'),'Customer refund for sale '||left(r.sale_id::text,8),'sale_refund',r.id,now(),auth.uid());
 end if;
 update public.sale_return_requests set status='used',approved_by=auth.uid(),decided_at=now(),used_at=now(),notes=case when p_decision_note is null then notes else coalesce(notes,'')||' Boss: '||p_decision_note end where id=r.id;
 perform public.write_audit_log('sale.return_approved','sale_return_request',r.id,null,null,jsonb_build_object('approved_by',auth.uid(),'action',r.action,'refund_amount',r.refund_amount,'sale_id',r.sale_id,'decision_note',p_decision_note));
 return r.id;
end; $$;

create or replace function public.get_inventory_cogs(p_start timestamptz,p_end timestamptz)
returns table(cogs numeric,sales_cogs numeric,repair_cogs numeric,engineer_cogs numeric)
language plpgsql security definer set search_path='public' as $$
begin
 if not public.has_permission('reports.view') then raise exception 'Permission denied'; end if;
 return query select coalesce(sum(case when m.movement_type in ('sale','repair_use','engineer_out','replacement_out') then m.total_cost when m.movement_type in ('sale_return','repair_return','engineer_return') then -m.total_cost else 0 end),0),
 coalesce(sum(case when m.movement_type='sale' then m.total_cost when m.movement_type='sale_return' then -m.total_cost else 0 end),0),
 coalesce(sum(case when m.movement_type='repair_use' then m.total_cost when m.movement_type='repair_return' then -m.total_cost else 0 end),0),
 greatest(coalesce(sum(case when m.movement_type='engineer_out' then m.total_cost when m.movement_type='engineer_return' then -m.total_cost else 0 end),0),0)
 from public.inventory_stock_movements m join public.inventory i on i.id=m.inventory_id where m.company_id=public.get_my_company_id() and m.created_at>=p_start and m.created_at<p_end and (i.branch_id is null or public.user_has_branch_access(i.branch_id));
end; $$;

create or replace function public.get_business_report(p_from timestamptz default date_trunc('month',now()),p_to timestamptz default now())
returns table(sales_revenue numeric,repair_revenue numeric,engineer_revenue numeric,standalone_invoice_revenue numeric,cash_received numeric,inventory_cogs numeric,gross_profit numeric,operating_expenses numeric,engineer_cost numeric,net_profit numeric,repairs_received bigint,repairs_completed bigint,customer_outstanding numeric,engineer_outstanding numeric,low_stock_items bigint)
language sql stable security definer set search_path='public' as $$
with company as(select id from public.companies where id=public.get_my_company_id()),
s as(select coalesce(sum(total),0) value from public.sales where company_id=(select id from company) and sale_date>=p_from and sale_date<p_to and (branch_id is null or public.user_has_branch_access(branch_id))),
r as(select coalesce(sum(coalesce(final_cost,estimated_cost,0)) filter(where completed_at>=p_from and completed_at<p_to and status in('Completed','Collected')),0) value,count(*) filter(where created_at>=p_from and created_at<p_to and status not in('Cancelled','Returned Unrepaired')) received,count(*) filter(where completed_at>=p_from and completed_at<p_to and status in('Completed','Collected')) completed from public.repairs where company_id=(select id from company) and (branch_id is null or public.user_has_branch_access(branch_id))),
er as(select coalesce(sum(debit-credit),0) value from public.engineer_transactions where company_id=(select id from company) and transaction_type in('parts_out','service_charge','parts_in') and created_at>=p_from and created_at<p_to),
i as(select coalesce(sum(total),0) value from public.invoices where company_id=(select id from company) and sale_id is null and repair_id is null and status<>'void' and issued_at>=p_from and issued_at<p_to and (branch_id is null or public.user_has_branch_access(branch_id))),
p as(select coalesce(sum(amount),0) value from public.financial_transactions where company_id=(select id from company) and direction='in' and occurred_at>=p_from and occurred_at<p_to and (branch_id is null or public.user_has_branch_access(branch_id))),
c as(select coalesce(sum(case when movement_type in('sale','repair_use','engineer_out','replacement_out') then total_cost when movement_type in('sale_return','repair_return','engineer_return') then -total_cost else 0 end),0) value from public.inventory_stock_movements m join public.inventory inv on inv.id=m.inventory_id where m.company_id=(select id from company) and m.created_at>=p_from and m.created_at<p_to and (inv.branch_id is null or public.user_has_branch_access(inv.branch_id))),
o as(select coalesce(sum(amount),0) value from public.financial_transactions where company_id=(select id from company) and direction='out' and category in('salary','rent','utility','other','customer_refund') and occurred_at>=p_from and occurred_at<p_to and (branch_id is null or public.user_has_branch_access(branch_id))),
ec as(select coalesce(sum(amount),0) value from public.financial_transactions where company_id=(select id from company) and direction='out' and category='engineer_payment' and occurred_at>=p_from and occurred_at<p_to and (branch_id is null or public.user_has_branch_access(branch_id))),
cu as(select coalesce(sum(balance),0) value from(select greatest(coalesce(sum(d.debit),0)-coalesce(sum(d.credit),0),0) balance from public.customer_debt_ledger d where d.company_id=(select id from company) and (d.branch_id is null or public.user_has_branch_access(d.branch_id)) group by d.customer_id)x),
eng as(select coalesce(sum(balance),0) value from public.get_engineer_balances()),ls as(select count(*) value from public.inventory where company_id=(select id from company) and coalesce(quantity,0)<=coalesce(minimum_stock,0) and (branch_id is null or public.user_has_branch_access(branch_id)))
select s.value,r.value,er.value,i.value,p.value,c.value,(s.value+r.value+er.value+i.value-c.value),o.value,ec.value,(s.value+r.value+er.value+i.value-c.value-o.value-ec.value),r.received,r.completed,cu.value,eng.value,ls.value from s,r,er,i,p,c,o,ec,cu,eng,ls where public.has_permission('reports.view'); $$;

create or replace function public.queue_owner_transaction_notification() returns trigger language plpgsql security definer set search_path='public','pg_temp' as $$
declare company record; notification_id uuid; event_type text; title text; message text; entity_id uuid;
begin
 if tg_table_name='sales' then event_type:='sale'; entity_id:=new.id; select c.id,c.owner_id,c.name into company from public.companies c where c.id=new.company_id; if company.id is null then return new; end if; title:='New sale'; message:=format('Amezing Limited — New Sale\\nBusiness: %s\\nAmount: ₦%s\\nPayment: %s\\nStaff: %s\\nSale ID: %s',company.name,to_char(coalesce(new.total,0),'FM999,999,999,990.00'),coalesce(new.payment_method,'Not specified'),coalesce(new.staff_name,'Not specified'),new.id::text);
 else event_type:='repair'; entity_id:=new.id; select c.id,c.owner_id,c.name into company from public.companies c where c.id=new.company_id; if company.id is null then return new; end if; title:='Repair update'; message:=format('Amezing Limited — Repair Update\\nBusiness: %s\\nStatus: %s\\nProblem: %s\\nTechnician: %s\\nRepair ID: %s',company.name,coalesce(new.status,'Not specified'),coalesce(new.issue,'Not specified'),coalesce(new.technician,'Not assigned'),new.id::text); end if;
 insert into public.owner_transaction_notifications(company_id,owner_id,event_type,entity_id,title,message) values(company.id,company.owner_id,event_type,entity_id,title,message) returning id into notification_id; return new;
end; $$;
