-- Link engineer debit/payment ledger rows back to the exact engineer part record.
-- The live database function was updated together with this migration.
create or replace function public.engineer_parts_out(p_engineer_id uuid,p_inventory_id uuid,p_quantity integer,p_unit_price numeric default null,p_notes text default null) returns uuid language plpgsql security definer set search_path to 'public' as $function$
declare v_company_id uuid; v_item_name text; v_current integer; v_sell_price numeric; v_cost numeric; v_price numeric; v_total numeric; v_tx uuid; v_part_out uuid; v_user uuid; v_branch uuid;
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
 insert into engineer_parts_out(company_id,engineer_id,inventory_id,quantity,unit_price,transaction_id,notes,created_by) values(v_company_id,p_engineer_id,p_inventory_id,p_quantity,v_price,v_tx,p_notes,v_user) returning id into v_part_out;
 update engineer_transactions set reference_id=v_part_out where id=v_tx;
 perform record_inventory_movement(p_inventory_id,'engineer_out',p_quantity,v_cost,'engineer_parts_out',v_tx,p_notes);
 return v_tx;
end;$function$;