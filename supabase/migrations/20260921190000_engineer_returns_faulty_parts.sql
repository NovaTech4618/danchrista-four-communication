alter table public.inventory add column if not exists faulty_quantity integer not null default 0;
alter table public.inventory drop constraint if exists inventory_faulty_quantity_nonnegative;
alter table public.inventory add constraint inventory_faulty_quantity_nonnegative check (faulty_quantity >= 0);
alter table public.engineer_parts_in add column if not exists return_condition text not null default 'normal';
alter table public.engineer_parts_in drop constraint if exists engineer_parts_in_return_condition_check;
alter table public.engineer_parts_in add constraint engineer_parts_in_return_condition_check check (return_condition in ('normal','faulty'));
alter table public.engineer_parts_out add column if not exists replacement_for_return_id uuid references public.engineer_parts_in(id);

create or replace function public.engineer_part_return(p_engineer_id uuid,p_inventory_id uuid,p_quantity integer,p_condition text default 'normal',p_notes text default null)
returns uuid language plpgsql security definer set search_path to 'public' as $function$
declare v_user uuid:=auth.uid(); v_company_id uuid; v_item_name text; v_branch uuid; v_issued_qty integer; v_returned_qty integer; v_outstanding_qty integer; v_issued_value numeric; v_returned_value numeric; v_unit_price numeric; v_total numeric; v_tx uuid; v_return_id uuid;
begin
 if v_user is null then raise exception 'Not authenticated'; end if;
 if not public.has_permission('engineers.work') and not public.has_permission('engineers.manage') then raise exception 'Permission denied'; end if;
 if p_quantity is null or p_quantity<=0 then raise exception 'Quantity must be greater than zero'; end if;
 if p_condition not in ('normal','faulty') then raise exception 'Return condition must be normal or faulty'; end if;
 v_company_id:=public.get_my_company_id(); if v_company_id is null then raise exception 'Company not found'; end if;
 if not exists(select 1 from public.engineers where id=p_engineer_id and company_id=v_company_id and status='active') then raise exception 'Engineer not found or inactive'; end if;
 select i.item_name,i.branch_id into v_item_name,v_branch from public.inventory i where i.id=p_inventory_id and i.company_id=v_company_id for update;
 if not found then raise exception 'Inventory item not found'; end if;
 if v_branch is not null and not public.user_has_branch_access(v_branch) then raise exception 'Branch access denied'; end if;
 select coalesce(sum(o.quantity),0)::integer,coalesce(sum(o.quantity*o.unit_price),0) into v_issued_qty,v_issued_value from public.engineer_parts_out o where o.company_id=v_company_id and o.engineer_id=p_engineer_id and o.inventory_id=p_inventory_id;
 select coalesce(sum(i.quantity),0)::integer,coalesce(sum(i.total_price),0) into v_returned_qty,v_returned_value from public.engineer_parts_in i where i.company_id=v_company_id and i.engineer_id=p_engineer_id and i.inventory_id=p_inventory_id;
 v_outstanding_qty:=v_issued_qty-v_returned_qty;
 if p_quantity>v_outstanding_qty then raise exception 'Return exceeds outstanding quantity. Available to return: %, Requested: %',v_outstanding_qty,p_quantity; end if;
 v_unit_price:=greatest(v_issued_value-v_returned_value,0)/nullif(v_outstanding_qty,0); v_unit_price:=coalesce(v_unit_price,0); v_total:=p_quantity*v_unit_price;
 insert into public.engineer_transactions(company_id,engineer_id,transaction_type,description,debit,credit,notes,created_by) values(v_company_id,p_engineer_id,case when p_condition='faulty' then 'faulty_return' else 'parts_in' end,p_quantity||' × '||v_item_name||case when p_condition='faulty' then ' · Faulty return' else ' · Return' end,0,v_total,p_notes,v_user) returning id into v_tx;
 insert into public.engineer_parts_in(company_id,engineer_id,inventory_id,quantity,unit_price,total_price,transaction_id,notes,created_by,return_condition) values(v_company_id,p_engineer_id,p_inventory_id,p_quantity,v_unit_price,v_total,v_tx,p_notes,v_user,p_condition) returning id into v_return_id;
 if p_condition='normal' then
   perform set_config('novatech.stock_movement','1',true); update public.inventory set quantity=quantity+p_quantity,updated_at=now() where id=p_inventory_id; perform set_config('novatech.stock_movement','0',true);
   insert into public.inventory_stock_movements(company_id,inventory_id,movement_type,quantity,unit_cost,reference_type,reference_id,notes,created_by) values(v_company_id,p_inventory_id,'engineer_return',p_quantity,v_unit_price,'engineer_parts_in',v_return_id,coalesce(p_notes,'Normal engineer part return'),v_user);
 else
   perform set_config('novatech.stock_movement','1',true); update public.inventory set faulty_quantity=faulty_quantity+p_quantity,updated_at=now() where id=p_inventory_id; perform set_config('novatech.stock_movement','0',true);
   insert into public.inventory_stock_movements(company_id,inventory_id,movement_type,quantity,unit_cost,reference_type,reference_id,notes,created_by) values(v_company_id,p_inventory_id,'engineer_faulty_return',0,v_unit_price,'engineer_parts_in',v_return_id,coalesce(p_notes,'Faulty engineer return; kept out of sellable stock'),v_user);
 end if;
 return v_return_id;
exception when others then perform set_config('novatech.stock_movement','0',true); raise;
end;$function$;

create or replace function public.engineer_replacement_part(p_faulty_return_id uuid,p_inventory_id uuid,p_quantity integer,p_notes text default null)
returns uuid language plpgsql security definer set search_path to 'public' as $function$
declare v_user uuid:=auth.uid(); v_company_id uuid; v_engineer_id uuid; v_faulty_qty integer; v_replaced_qty integer; v_item_name text; v_branch uuid; v_available integer; v_tx uuid; v_out_id uuid;
begin
 if v_user is null then raise exception 'Not authenticated'; end if;
 if not public.has_permission('engineers.work') and not public.has_permission('engineers.manage') then raise exception 'Permission denied'; end if;
 if p_quantity is null or p_quantity<=0 then raise exception 'Quantity must be greater than zero'; end if;
 v_company_id:=public.get_my_company_id();
 select engineer_id,quantity into v_engineer_id,v_faulty_qty from public.engineer_parts_in where id=p_faulty_return_id and company_id=v_company_id and return_condition='faulty' for update;
 if not found then raise exception 'Faulty engineer return not found'; end if;
 select coalesce(sum(o.quantity),0)::integer into v_replaced_qty from public.engineer_parts_out o where o.replacement_for_return_id=p_faulty_return_id and o.company_id=v_company_id;
 if p_quantity>v_faulty_qty-v_replaced_qty then raise exception 'Replacement exceeds faulty quantity available. Available: %, Requested: %',v_faulty_qty-v_replaced_qty,p_quantity; end if;
 select i.item_name,i.branch_id,i.quantity into v_item_name,v_branch,v_available from public.inventory i where i.id=p_inventory_id and i.company_id=v_company_id for update;
 if not found then raise exception 'Replacement inventory item not found'; end if;
 if v_branch is not null and not public.user_has_branch_access(v_branch) then raise exception 'Branch access denied'; end if;
 if v_available<p_quantity then raise exception 'Insufficient stock. Available: %, Requested: %',v_available,p_quantity; end if;
 insert into public.engineer_transactions(company_id,engineer_id,transaction_type,reference_id,description,debit,credit,notes,created_by) values(v_company_id,v_engineer_id,'replacement',p_faulty_return_id,p_quantity||' × '||v_item_name||' · Replacement for faulty part',0,0,p_notes,v_user) returning id into v_tx;
 insert into public.engineer_parts_out(company_id,engineer_id,inventory_id,quantity,unit_price,transaction_id,notes,created_by,replacement_for_return_id) values(v_company_id,v_engineer_id,p_inventory_id,p_quantity,0,v_tx,coalesce(p_notes,'Replacement for faulty engineer return'),v_user,p_faulty_return_id) returning id into v_out_id;
 perform set_config('novatech.stock_movement','1',true); update public.inventory set quantity=quantity-p_quantity,updated_at=now() where id=p_inventory_id; perform set_config('novatech.stock_movement','0',true);
 insert into public.inventory_stock_movements(company_id,inventory_id,movement_type,quantity,unit_cost,reference_type,reference_id,notes,created_by) values(v_company_id,p_inventory_id,'engineer_out',-p_quantity,0,'engineer_replacement',v_out_id,coalesce(p_notes,'Zero-debt replacement issued'),v_user);
 return v_out_id;
exception when others then perform set_config('novatech.stock_movement','0',true); raise;
end;$function$;

revoke execute on function public.engineer_part_return(uuid,uuid,integer,text,text) from public,anon;
revoke execute on function public.engineer_replacement_part(uuid,uuid,integer,text) from public,anon;
grant execute on function public.engineer_part_return(uuid,uuid,integer,text,text) to authenticated;
grant execute on function public.engineer_replacement_part(uuid,uuid,integer,text) to authenticated;
