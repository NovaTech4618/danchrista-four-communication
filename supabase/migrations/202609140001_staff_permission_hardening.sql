-- Danchrista staff permission hardening.
-- Applied to production before being committed here.

create or replace function public.engineer_parts_out(p_engineer_id uuid, p_inventory_id uuid, p_quantity integer, p_unit_price numeric default null, p_notes text default null) returns uuid language plpgsql security definer set search_path to 'public' as $function$
declare v_company_id uuid; v_item_name text; v_current integer; v_sell_price numeric; v_cost numeric; v_price numeric; v_total numeric; v_tx uuid; v_user uuid; v_branch uuid;
begin
 v_user:=auth.uid(); if v_user is null then raise exception 'Not authenticated'; end if;
 v_company_id:=public.get_my_company_id(); if not public.has_permission('engineers.manage') then raise exception 'Permission denied'; end if;
 if p_quantity<=0 then raise exception 'Quantity must be greater than zero'; end if;
 select item_name,quantity,selling_price,coalesce(cost_price,0),branch_id into v_item_name,v_current,v_sell_price,v_cost,v_branch from inventory where id=p_inventory_id and company_id=v_company_id for update;
 if not found then raise exception 'Inventory item not found'; end if;
 if v_branch is not null and not public.user_has_branch_access(v_branch) then raise exception 'Branch access denied'; end if;
 if coalesce(v_current,0)<p_quantity then raise exception 'Insufficient stock. Available: %, Requested: %',v_current,p_quantity; end if;
 if not exists(select 1 from engineers where id=p_engineer_id and company_id=v_company_id and status='active') then raise exception 'Engineer not found or inactive'; end if;
 v_price:=coalesce(p_unit_price,v_sell_price); if v_price<0 then raise exception 'Unit price cannot be negative'; end if;
 v_total:=p_quantity*v_price;
 insert into engineer_transactions(company_id,engineer_id,transaction_type,description,debit,credit,notes,created_by) values(v_company_id,p_engineer_id,'parts_out',p_quantity||' × '||v_item_name,v_total,0,p_notes,v_user) returning id into v_tx;
 insert into engineer_parts_out(company_id,engineer_id,inventory_id,quantity,unit_price,transaction_id,notes,created_by) values(v_company_id,p_engineer_id,p_inventory_id,p_quantity,v_price,v_tx,p_notes,v_user);
 perform record_inventory_movement(p_inventory_id,'engineer_out',p_quantity,v_cost,'engineer_parts_out',v_tx,p_notes); return v_tx;
end; $function$;

create or replace function public.engineer_parts_in(p_engineer_id uuid, p_inventory_id uuid, p_quantity integer, p_unit_price numeric, p_notes text default null) returns uuid language plpgsql security definer set search_path to 'public' as $function$
declare v_company_id uuid; v_item_name text; v_total numeric; v_tx uuid; v_user uuid; v_issued integer; v_returned integer; v_available integer; v_return_cost numeric; v_branch uuid;
begin
 v_user:=auth.uid(); if v_user is null then raise exception 'Not authenticated'; end if;
 v_company_id:=public.get_my_company_id(); if not public.has_permission('engineers.manage') then raise exception 'Permission denied'; end if;
 if p_quantity<=0 then raise exception 'Quantity must be greater than zero'; end if; if p_unit_price<0 then raise exception 'Unit price cannot be negative'; end if;
 if not exists(select 1 from engineers where id=p_engineer_id and company_id=v_company_id and status='active') then raise exception 'Engineer not found or inactive'; end if;
 select item_name,branch_id into v_item_name,v_branch from inventory where id=p_inventory_id and company_id=v_company_id for update; if not found then raise exception 'Inventory item not found'; end if;
 if v_branch is not null and not public.user_has_branch_access(v_branch) then raise exception 'Branch access denied'; end if;
 select coalesce(sum(quantity),0)::integer into v_issued from engineer_parts_out where company_id=v_company_id and engineer_id=p_engineer_id and inventory_id=p_inventory_id;
 select coalesce(sum(quantity),0)::integer into v_returned from engineer_parts_in where company_id=v_company_id and engineer_id=p_engineer_id and inventory_id=p_inventory_id;
 v_available:=v_issued-v_returned; if p_quantity>v_available then raise exception 'Return exceeds outstanding quantity. Available to return: %, Requested: %',v_available,p_quantity; end if;
 select coalesce(sum(total_cost),0)/nullif(sum(abs(quantity)),0) into v_return_cost from inventory_stock_movements where company_id=v_company_id and inventory_id=p_inventory_id and movement_type='engineer_out';
 v_return_cost:=coalesce(v_return_cost,0); v_total:=p_quantity*p_unit_price;
 insert into engineer_transactions(company_id,engineer_id,transaction_type,description,debit,credit,notes,created_by) values(v_company_id,p_engineer_id,'parts_in',p_quantity||' × '||v_item_name,0,v_total,p_notes,v_user) returning id into v_tx;
 insert into engineer_parts_in(company_id,engineer_id,inventory_id,quantity,unit_price,total_price,transaction_id,notes,created_by) values(v_company_id,p_engineer_id,p_inventory_id,p_quantity,p_unit_price,v_total,v_tx,p_notes,v_user);
 perform record_inventory_movement(p_inventory_id,'engineer_return',p_quantity,v_return_cost,'engineer_parts_in',v_tx,p_notes); return v_tx;
end; $function$;

create or replace function public.engineer_payment_in(p_engineer_id uuid, p_amount numeric, p_payment_method text default null, p_notes text default null) returns uuid language plpgsql security definer set search_path to 'public' as $function$
declare v_company_id uuid; v_transaction_id uuid; v_user_id uuid;
begin
 v_user_id:=auth.uid(); if v_user_id is null then raise exception 'Not authenticated'; end if; if not public.has_permission('engineers.manage') then raise exception 'Permission denied'; end if;
 select company_id into v_company_id from profiles where id=v_user_id; if v_company_id is null then raise exception 'Company not found'; end if;
 if p_amount<=0 then raise exception 'Payment amount must be greater than zero'; end if; if p_payment_method is not null and p_payment_method not in ('cash','transfer','pos','other') then raise exception 'Invalid payment method'; end if;
 if not exists(select 1 from engineers where id=p_engineer_id and company_id=v_company_id) then raise exception 'Engineer not found'; end if;
 insert into engineer_transactions(company_id,engineer_id,transaction_type,description,debit,credit,payment_method,notes,created_by) values(v_company_id,p_engineer_id,'payment_in','Payment received from engineer',0,p_amount,p_payment_method,p_notes,v_user_id) returning id into v_transaction_id;
 insert into engineer_payments(company_id,engineer_id,payment_type,amount,payment_method,transaction_id,notes,created_by) values(v_company_id,p_engineer_id,'payment_in',p_amount,p_payment_method,v_transaction_id,p_notes,v_user_id); return v_transaction_id;
end; $function$;

create or replace function public.engineer_payment_out(p_engineer_id uuid, p_amount numeric, p_payment_method text default null, p_notes text default null) returns uuid language plpgsql security definer set search_path to 'public' as $function$
declare v_company_id uuid; v_transaction_id uuid; v_user_id uuid; v_status text;
begin
 v_user_id:=auth.uid(); if v_user_id is null then raise exception 'Not authenticated'; end if; if not public.has_permission('engineers.manage') then raise exception 'Permission denied'; end if;
 select company_id into v_company_id from profiles where id=v_user_id; if v_company_id is null then raise exception 'Company not found'; end if;
 if p_amount is null or p_amount<=0 then raise exception 'Payment amount must be greater than zero'; end if; if p_payment_method is not null and p_payment_method not in ('cash','transfer','pos','other') then raise exception 'Invalid payment method'; end if;
 select status into v_status from engineers where id=p_engineer_id and company_id=v_company_id; if not found then raise exception 'Engineer not found'; end if; if v_status<>'active' then raise exception 'Cannot record payment for an inactive engineer'; end if;
 insert into engineer_transactions(company_id,engineer_id,transaction_type,description,debit,credit,payment_method,notes,created_by) values(v_company_id,p_engineer_id,'payment_out','Payment made to engineer',p_amount,0,p_payment_method,p_notes,v_user_id) returning id into v_transaction_id;
 insert into engineer_payments(company_id,engineer_id,payment_type,amount,payment_method,transaction_id,notes,created_by) values(v_company_id,p_engineer_id,'payment_out',p_amount,p_payment_method,v_transaction_id,p_notes,v_user_id); return v_transaction_id;
end; $function$;

create or replace function public.engineer_opening_balance(p_engineer_id uuid, p_amount numeric, p_notes text default null) returns uuid language plpgsql security definer set search_path to 'public' as $function$
declare v_company_id uuid; v_tx uuid; v_user uuid;
begin
 v_user:=auth.uid(); if v_user is null then raise exception 'Not authenticated'; end if; if not public.has_permission('engineers.manage') then raise exception 'Permission denied'; end if;
 v_company_id:=public.get_my_company_id(); if v_company_id is null then raise exception 'Company not found'; end if; if not exists(select 1 from engineers where id=p_engineer_id and company_id=v_company_id) then raise exception 'Engineer not found'; end if; if p_amount=0 then raise exception 'Opening balance cannot be zero'; end if;
 insert into engineer_transactions(company_id,engineer_id,transaction_type,description,debit,credit,notes,created_by) values(v_company_id,p_engineer_id,'opening_balance','Opening balance',greatest(p_amount,0),greatest(-p_amount,0),p_notes,v_user) returning id into v_tx; return v_tx;
end; $function$;

create or replace function public.get_dashboard_summary() returns table(repairs_today bigint, active_repairs bigint, completed_today bigint, cash_today numeric, outstanding_customer numeric, low_stock_count bigint, engineer_debit numeric) language plpgsql stable security definer set search_path to 'public' as $function$
declare v_user_id uuid := auth.uid(); v_company_id uuid; v_reports boolean;
begin
 if v_user_id is null then raise exception 'Authentication required'; end if;
 select p.company_id into v_company_id from public.profiles p where p.id=v_user_id and p.is_active=true; if v_company_id is null then raise exception 'Active company profile required'; end if;
 v_reports := public.has_permission('reports.view');
 return query with auth_ctx as (select v_company_id company_id),
 today as (select date_trunc('day',now() at time zone 'Africa/Lagos') at time zone 'Africa/Lagos' started),
 repair_counts as (select count(*) filter(where r.created_at >= (select started from today)) repairs_today, count(*) filter(where r.status not in ('Completed','Collected','Cancelled')) active_repairs, count(*) filter(where r.completed_at >= (select started from today) and r.status <> 'Cancelled') completed_today from public.repairs r join auth_ctx a on a.company_id=r.company_id where r.branch_id is null or public.user_has_branch_access(r.branch_id)),
 cash as (select case when v_reports then coalesce(sum(ft.amount) filter(where ft.direction='in'),0) else 0 end cash_today from public.financial_transactions ft join auth_ctx a on a.company_id=ft.company_id where ft.occurred_at >= (select started from today) and (ft.branch_id is null or public.user_has_branch_access(ft.branch_id))),
 outstanding as (select case when v_reports then coalesce(sum(v.outstanding),0) else 0 end outstanding_customer from public.repair_balance_view v join auth_ctx a on a.company_id=v.company_id where v.outstanding>0 and (v.branch_id is null or public.user_has_branch_access(v.branch_id))),
 low as (select count(*) low_stock_count from public.inventory i join auth_ctx a on a.company_id=i.company_id where coalesce(i.quantity,0)<=coalesce(i.minimum_stock,0) and (i.branch_id is null or public.user_has_branch_access(i.branch_id))),
 debt as (select case when v_reports then coalesce(sum(t.debit-t.credit),0) else 0 end engineer_debit from public.engineer_transactions t join auth_ctx a on a.company_id=t.company_id join public.engineers e on e.id=t.engineer_id and e.company_id=t.company_id)
 select rc.*,c.cash_today,o.outstanding_customer,l.low_stock_count,d.engineer_debit from repair_counts rc,cash c,outstanding o,low l,debt d;
end; $function$;
