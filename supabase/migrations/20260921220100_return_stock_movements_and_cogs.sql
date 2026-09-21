-- Allow approved customer returns/replacements to use canonical stock movements.
create or replace function public.record_inventory_movement(p_inventory_id uuid,p_movement_type text,p_quantity integer,p_unit_cost numeric default 0,p_reference_type text default null,p_reference_id uuid default null,p_notes text default null)
returns uuid language plpgsql security definer set search_path='public' as $$
declare c uuid; ic uuid; b uuid; available int; delta int; mid uuid;
begin
 c:=public.get_my_company_id(); if c is null then raise exception 'Company not found'; end if;
 if p_quantity is null or p_quantity<=0 then raise exception 'Quantity must be greater than zero'; end if;
 if p_unit_cost is null or p_unit_cost<0 then raise exception 'Unit cost cannot be negative'; end if;
 if p_movement_type not in ('opening','purchase','sale','sale_return','replacement_out','repair_use','repair_return','engineer_out','engineer_return','adjustment_in','adjustment_out') then raise exception 'Invalid movement type'; end if;
 if p_movement_type in ('opening','purchase','adjustment_in','adjustment_out') and not public.has_permission('inventory.manage') then raise exception 'Permission denied'; end if;
 if p_movement_type='sale' and not public.has_permission('sales.manage') then raise exception 'Permission denied'; end if;
 if p_movement_type in ('sale_return','replacement_out') and not public.has_permission('sales.return_manage') then raise exception 'Permission denied'; end if;
 if p_movement_type in ('repair_use','repair_return') and not public.has_permission('repairs.manage') then raise exception 'Permission denied'; end if;
 if p_movement_type='engineer_out' and not public.has_permission('inventory.issue') then raise exception 'Permission denied'; end if;
 if p_movement_type='engineer_return' and not public.has_permission('inventory.return') then raise exception 'Permission denied'; end if;
 select company_id,branch_id,quantity into ic,b,available from public.inventory where id=p_inventory_id for update;
 if ic is null or ic<>c then raise exception 'Inventory item not found'; end if;
 if b is not null and not public.user_has_branch_access(b) then raise exception 'Branch access denied'; end if;
 delta:=case when p_movement_type in ('opening','purchase','sale_return','repair_return','engineer_return','adjustment_in') then p_quantity else -p_quantity end;
 if available+delta<0 then raise exception 'Insufficient stock'; end if;
 perform set_config('novatech.stock_movement','1',true);
 update public.inventory set quantity=quantity+delta,updated_at=now() where id=p_inventory_id;
 perform set_config('novatech.stock_movement','0',true);
 insert into public.inventory_stock_movements(company_id,inventory_id,movement_type,quantity,unit_cost,reference_type,reference_id,notes,created_by)
 values(c,p_inventory_id,p_movement_type,delta,p_unit_cost,p_reference_type,p_reference_id,p_notes,auth.uid()) returning id into mid;
 return mid;
exception when others then perform set_config('novatech.stock_movement','0',true); raise;
end; $$;
revoke all on function public.record_inventory_movement(uuid,text,integer,numeric,text,uuid,text) from public,anon,authenticated;
grant execute on function public.record_inventory_movement(uuid,text,integer,numeric,text,uuid,text) to authenticated;

create or replace function public.get_inventory_cogs(p_start timestamptz,p_end timestamptz)
returns table(cogs numeric,sales_cogs numeric,repair_cogs numeric,engineer_cogs numeric)
language plpgsql security definer set search_path='public' as $$
begin
 if not public.has_permission('reports.view') then raise exception 'Permission denied'; end if;
 return query select
 coalesce(sum(case when m.movement_type in ('sale','repair_use','engineer_out') then m.total_cost when m.movement_type in ('sale_return','repair_return','engineer_return') then -m.total_cost else 0 end),0),
 coalesce(sum(case when m.movement_type='sale' then m.total_cost when m.movement_type='sale_return' then -m.total_cost else 0 end),0),
 coalesce(sum(case when m.movement_type='repair_use' then m.total_cost when m.movement_type='repair_return' then -m.total_cost else 0 end),0),
 greatest(coalesce(sum(case when m.movement_type='engineer_out' then m.total_cost when m.movement_type='engineer_return' then -m.total_cost else 0 end),0),0)
 from public.inventory_stock_movements m join public.inventory i on i.id=m.inventory_id
 where m.company_id=public.get_my_company_id() and m.created_at>=p_start and m.created_at<p_end and (i.branch_id is null or public.user_has_branch_access(i.branch_id));
end; $$;