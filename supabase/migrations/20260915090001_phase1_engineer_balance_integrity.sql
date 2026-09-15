-- Engineer payment_out is a cash cost, not an engineer receivable debit.
create or replace function public.get_engineer_balances()
returns table(engineer_id uuid,total_debit numeric,total_credit numeric,balance numeric)
language sql stable security definer set search_path=public
as $$
select e.id,
 coalesce(sum(t.debit) filter(where t.transaction_type<>'payment_out'),0),
 coalesce(sum(t.credit),0),
 greatest(coalesce(sum(t.debit) filter(where t.transaction_type<>'payment_out'),0)-coalesce(sum(t.credit),0),0)
from public.engineers e left join public.engineer_transactions t on t.engineer_id=e.id and t.company_id=public.get_my_company_id()
where e.company_id=public.get_my_company_id() group by e.id;
$$;

-- Do not silently create a negative engineer receivable through overpayment.
create or replace function public.engineer_payment_in(p_engineer_id uuid,p_amount numeric,p_payment_method text default null,p_notes text default null)
returns uuid language plpgsql security definer set search_path=public as $$
declare v_company_id uuid; v_transaction_id uuid; v_user_id uuid; v_balance numeric;
begin
 v_user_id:=auth.uid(); if v_user_id is null then raise exception 'Not authenticated'; end if;
 if not public.has_permission('engineers.manage') then raise exception 'Permission denied'; end if;
 select company_id into v_company_id from public.profiles where id=v_user_id; if v_company_id is null then raise exception 'Company not found'; end if;
 if p_amount is null or p_amount<=0 then raise exception 'Payment amount must be greater than zero'; end if;
 if p_payment_method is not null and p_payment_method not in('cash','transfer','pos','other') then raise exception 'Invalid payment method'; end if;
 if not exists(select 1 from public.engineers where id=p_engineer_id and company_id=v_company_id) then raise exception 'Engineer not found'; end if;
 select greatest(coalesce(sum(t.debit) filter(where t.transaction_type<>'payment_out'),0)-coalesce(sum(t.credit),0),0) into v_balance from public.engineer_transactions t where t.company_id=v_company_id and t.engineer_id=p_engineer_id;
 if p_amount>v_balance then raise exception 'Payment exceeds engineer outstanding balance. Outstanding: %, requested: %',v_balance,p_amount; end if;
 insert into public.engineer_transactions(company_id,engineer_id,transaction_type,description,debit,credit,payment_method,notes,created_by) values(v_company_id,p_engineer_id,'payment_in','Payment received from engineer',0,p_amount,p_payment_method,p_notes,v_user_id) returning id into v_transaction_id;
 insert into public.engineer_payments(company_id,engineer_id,payment_type,amount,payment_method,transaction_id,notes,created_by) values(v_company_id,p_engineer_id,'payment_in',p_amount,p_payment_method,v_transaction_id,p_notes,v_user_id);
 return v_transaction_id;
end;$$;

-- Prevent a part return from making an engineer receivable negative.
create or replace function public.engineer_parts_in(p_engineer_id uuid,p_inventory_id uuid,p_quantity integer,p_unit_price numeric,p_notes text default null)
returns uuid language plpgsql security definer set search_path=public as $$
declare v_company_id uuid; v_item_name text; v_total numeric; v_tx uuid; v_user uuid; v_issued integer; v_returned integer; v_available integer; v_return_cost numeric; v_branch uuid; v_balance numeric;
begin
 v_user:=auth.uid(); if v_user is null then raise exception 'Not authenticated'; end if; v_company_id:=public.get_my_company_id();
 if not public.has_permission('engineers.work') and not public.has_permission('engineers.manage') then raise exception 'Permission denied'; end if;
 if p_quantity<=0 then raise exception 'Quantity must be greater than zero'; end if; if p_unit_price<0 then raise exception 'Unit price cannot be negative'; end if;
 if not exists(select 1 from public.engineers where id=p_engineer_id and company_id=v_company_id and status='active') then raise exception 'Engineer not found or inactive'; end if;
 select item_name,branch_id into v_item_name,v_branch from public.inventory where id=p_inventory_id and company_id=v_company_id for update; if not found then raise exception 'Inventory item not found'; end if;
 if v_branch is not null and not public.user_has_branch_access(v_branch) then raise exception 'Branch access denied'; end if;
 select coalesce(sum(quantity),0)::integer into v_issued from public.engineer_parts_out where company_id=v_company_id and engineer_id=p_engineer_id and inventory_id=p_inventory_id;
 select coalesce(sum(quantity),0)::integer into v_returned from public.engineer_parts_in where company_id=v_company_id and engineer_id=p_engineer_id and inventory_id=p_inventory_id;
 v_available:=v_issued-v_returned; if p_quantity>v_available then raise exception 'Return exceeds outstanding quantity. Available to return: %, Requested: %',v_available,p_quantity; end if;
 select greatest(coalesce(sum(t.debit) filter(where t.transaction_type<>'payment_out'),0)-coalesce(sum(t.credit),0),0) into v_balance from public.engineer_transactions t where t.company_id=v_company_id and t.engineer_id=p_engineer_id;
 v_total:=p_quantity*p_unit_price; if v_total>v_balance then raise exception 'Return credit exceeds engineer outstanding balance. Outstanding: %, requested credit: %',v_balance,v_total; end if;
 select coalesce(sum(total_cost),0)/nullif(sum(abs(quantity)),0) into v_return_cost from public.inventory_stock_movements where company_id=v_company_id and inventory_id=p_inventory_id and movement_type='engineer_out'; v_return_cost:=coalesce(v_return_cost,0);
 insert into public.engineer_transactions(company_id,engineer_id,transaction_type,description,debit,credit,notes,created_by) values(v_company_id,p_engineer_id,'parts_in',p_quantity||' × '||v_item_name,0,v_total,p_notes,v_user) returning id into v_tx;
 insert into public.engineer_parts_in(company_id,engineer_id,inventory_id,quantity,unit_price,total_price,transaction_id,notes,created_by) values(v_company_id,p_engineer_id,p_inventory_id,p_quantity,p_unit_price,v_total,v_tx,p_notes,v_user);
 perform public.record_inventory_movement(p_inventory_id,'engineer_return',p_quantity,v_return_cost,'engineer_parts_in',v_tx,p_notes); return v_tx;
end;$$;
