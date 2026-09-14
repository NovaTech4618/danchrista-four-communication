-- Danchrista staff: record engineer work/parts without financial administration.
insert into public.role_permissions(role, permission, allowed)
values ('front_desk','engineers.work',true)
on conflict (role, permission) do update set allowed=excluded.allowed;

-- Staff may view engineer identities needed for recording work, but not manage engineer accounts.
drop policy if exists "Authorized users manage company engineers" on public.engineers;
create policy "Engineer work users can view company engineers"
on public.engineers for select
using (company_id = public.get_my_company_id() and (public.has_permission('engineers.view') or public.has_permission('engineers.manage') or public.has_permission('engineers.work')));
create policy "Authorized users manage company engineers"
on public.engineers for all
using (company_id = public.get_my_company_id() and public.has_permission('engineers.manage'))
with check (company_id = public.get_my_company_id() and public.has_permission('engineers.manage'));

-- Engineer ledger reads needed by the work screen.
drop policy if exists "Engineer work users can view parts out" on public.engineer_parts_out;
create policy "Engineer work users can view parts out" on public.engineer_parts_out for select
using (company_id = public.get_my_company_id() and (public.has_permission('engineers.view') or public.has_permission('engineers.manage') or public.has_permission('engineers.work')));
drop policy if exists "Engineer work users can view parts in" on public.engineer_parts_in;
create policy "Engineer work users can view parts in" on public.engineer_parts_in for select
using (company_id = public.get_my_company_id() and (public.has_permission('engineers.view') or public.has_permission('engineers.manage') or public.has_permission('engineers.work')));
drop policy if exists "engineer_transactions_authorized_select" on public.engineer_transactions;
create policy "engineer_transactions_authorized_select" on public.engineer_transactions for select
using (company_id = public.get_my_company_id() and (public.has_permission('engineers.view') or public.has_permission('engineers.manage') or public.has_permission('engineers.work')));

-- Engineer ledger is append-only. Corrections use return/reversal transactions.
drop policy if exists "engineer_parts_out_no_direct_delete" on public.engineer_parts_out;
create policy "engineer_parts_out_no_direct_delete" on public.engineer_parts_out for delete using (false);
drop policy if exists "engineer_parts_out_no_direct_update" on public.engineer_parts_out;
create policy "engineer_parts_out_no_direct_update" on public.engineer_parts_out for update using (false) with check (false);
drop policy if exists "engineer_parts_in_no_direct_delete" on public.engineer_parts_in;
create policy "engineer_parts_in_no_direct_delete" on public.engineer_parts_in for delete using (false);
drop policy if exists "engineer_parts_in_no_direct_update" on public.engineer_parts_in;
create policy "engineer_parts_in_no_direct_update" on public.engineer_parts_in for update using (false) with check (false);
drop policy if exists "engineer_transactions_no_direct_delete" on public.engineer_transactions;
create policy "engineer_transactions_no_direct_delete" on public.engineer_transactions for delete using (false);
drop policy if exists "engineer_transactions_no_direct_update" on public.engineer_transactions;
create policy "engineer_transactions_no_direct_update" on public.engineer_transactions for update using (false) with check (false);

-- Staff may issue/return engineer parts through audited RPCs; engineer payments/opening balances remain manage-only.
create or replace function public.engineer_parts_out(p_engineer_id uuid, p_inventory_id uuid, p_quantity integer, p_unit_price numeric default null, p_notes text default null)
returns uuid language plpgsql security definer set search_path=public as $function$
declare v_company_id uuid; v_item_name text; v_current integer; v_sell_price numeric; v_cost numeric; v_price numeric; v_total numeric; v_tx uuid; v_user uuid; v_branch uuid;
begin
  v_user:=auth.uid(); if v_user is null then raise exception 'Not authenticated'; end if;
  v_company_id:=public.get_my_company_id();
  if not public.has_permission('engineers.work') and not public.has_permission('engineers.manage') then raise exception 'Permission denied'; end if;
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
  perform record_inventory_movement(p_inventory_id,'engineer_out',p_quantity,v_cost,'engineer_parts_out',v_tx,p_notes);
  return v_tx;
end;$function$;

create or replace function public.engineer_parts_in(p_engineer_id uuid, p_inventory_id uuid, p_quantity integer, p_unit_price numeric, p_notes text default null)
returns uuid language plpgsql security definer set search_path=public as $function$
declare v_company_id uuid; v_item_name text; v_total numeric; v_tx uuid; v_user uuid; v_issued integer; v_returned integer; v_available integer; v_return_cost numeric; v_branch uuid;
begin
  v_user:=auth.uid(); if v_user is null then raise exception 'Not authenticated'; end if;
  v_company_id:=public.get_my_company_id();
  if not public.has_permission('engineers.work') and not public.has_permission('engineers.manage') then raise exception 'Permission denied'; end if;
  if p_quantity<=0 then raise exception 'Quantity must be greater than zero'; end if;
  if p_unit_price<0 then raise exception 'Unit price cannot be negative'; end if;
  if not exists(select 1 from engineers where id=p_engineer_id and company_id=v_company_id and status='active') then raise exception 'Engineer not found or inactive'; end if;
  select item_name,branch_id into v_item_name,v_branch from inventory where id=p_inventory_id and company_id=v_company_id for update;
  if not found then raise exception 'Inventory item not found'; end if;
  if v_branch is not null and not public.user_has_branch_access(v_branch) then raise exception 'Branch access denied'; end if;
  select coalesce(sum(quantity),0)::integer into v_issued from engineer_parts_out where company_id=v_company_id and engineer_id=p_engineer_id and inventory_id=p_inventory_id;
  select coalesce(sum(quantity),0)::integer into v_returned from engineer_parts_in where company_id=v_company_id and engineer_id=p_engineer_id and inventory_id=p_inventory_id;
  v_available:=v_issued-v_returned; if p_quantity>v_available then raise exception 'Return exceeds outstanding quantity. Available to return: %, Requested: %',v_available,p_quantity; end if;
  select coalesce(sum(total_cost),0)/nullif(sum(abs(quantity)),0) into v_return_cost from inventory_stock_movements where company_id=v_company_id and inventory_id=p_inventory_id and movement_type='engineer_out';
  v_return_cost:=coalesce(v_return_cost,0); v_total:=p_quantity*p_unit_price;
  insert into engineer_transactions(company_id,engineer_id,transaction_type,description,debit,credit,notes,created_by) values(v_company_id,p_engineer_id,'parts_in',p_quantity||' × '||v_item_name,0,v_total,p_notes,v_user) returning id into v_tx;
  insert into engineer_parts_in(company_id,engineer_id,inventory_id,quantity,unit_price,total_price,transaction_id,notes,created_by) values(v_company_id,p_engineer_id,p_inventory_id,p_quantity,p_unit_price,v_total,v_tx,p_notes,v_user);
  perform record_inventory_movement(p_inventory_id,'engineer_return',p_quantity,v_return_cost,'engineer_parts_in',v_tx,p_notes);
  return v_tx;
end;$function$;

alter table public.engineer_transactions drop constraint if exists engineer_transactions_transaction_type_check;
alter table public.engineer_transactions add constraint engineer_transactions_transaction_type_check check (transaction_type = any (array['parts_out','parts_in','service_charge','payment_in','payment_out','opening_balance','adjustment_debit','adjustment_credit']));

create or replace function public.engineer_work_charge(p_engineer_id uuid, p_amount numeric, p_description text, p_notes text default null)
returns uuid language plpgsql security definer set search_path=public as $function$
declare v_company_id uuid; v_user uuid; v_tx uuid;
begin
  v_user:=auth.uid(); if v_user is null then raise exception 'Not authenticated'; end if;
  v_company_id:=public.get_my_company_id();
  if not public.has_permission('engineers.work') and not public.has_permission('engineers.manage') then raise exception 'Permission denied'; end if;
  if p_amount is null or p_amount<=0 then raise exception 'Work amount must be greater than zero'; end if;
  if nullif(trim(p_description),'') is null then raise exception 'Work description is required'; end if;
  if not exists(select 1 from engineers where id=p_engineer_id and company_id=v_company_id and status='active') then raise exception 'Engineer not found or inactive'; end if;
  insert into engineer_transactions(company_id,engineer_id,transaction_type,description,debit,credit,notes,created_by) values(v_company_id,p_engineer_id,'service_charge',trim(p_description),p_amount,0,p_notes,v_user) returning id into v_tx;
  return v_tx;
end;$function$;
revoke execute on function public.engineer_work_charge(uuid,numeric,text,text) from public;
grant execute on function public.engineer_work_charge(uuid,numeric,text,text) to authenticated;
