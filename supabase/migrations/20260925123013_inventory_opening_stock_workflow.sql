-- Inventory opening stock workflow for Amezing Limited.
-- Owner-only, one-time opening balance. The quantity and valuation fields are
-- updated atomically with the matching opening stock movement.

create or replace function public.set_inventory_opening_stock(
  p_inventory_id uuid,
  p_quantity integer,
  p_cost_price numeric,
  p_selling_price numeric,
  p_minimum_selling_price numeric,
  p_minimum_stock integer default 5
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_company_id uuid;
  v_item_company uuid;
  v_existing_quantity integer;
  v_existing_movements integer;
  v_movement_id uuid;
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  if not public.is_company_owner() then raise exception 'Only the company owner can set opening stock'; end if;
  v_company_id := public.get_my_company_id();
  if v_company_id is null then raise exception 'Company not found'; end if;
  if p_quantity <= 0 then raise exception 'Opening quantity must be greater than zero'; end if;
  if p_cost_price is null or p_cost_price < 0 then raise exception 'Cost price cannot be negative'; end if;
  if p_selling_price is null or p_selling_price <= 0 then raise exception 'Selling price must be greater than zero'; end if;
  if p_minimum_selling_price is null or p_minimum_selling_price < 0 then raise exception 'Minimum selling price cannot be negative'; end if;
  if p_minimum_selling_price > p_selling_price then raise exception 'Minimum selling price cannot exceed selling price'; end if;
  if p_minimum_stock is null or p_minimum_stock < 0 then raise exception 'Minimum stock cannot be negative'; end if;

  select company_id, quantity into v_item_company, v_existing_quantity
  from public.inventory where id = p_inventory_id for update;
  if v_item_company is null or v_item_company <> v_company_id then raise exception 'Inventory item not found'; end if;

  select count(*) into v_existing_movements
  from public.inventory_stock_movements where inventory_id = p_inventory_id;
  if v_existing_movements > 0 or coalesce(v_existing_quantity, 0) <> 0 then
    raise exception 'Opening stock is already established for this item. Use stock adjustment for corrections.';
  end if;

  perform set_config('novatech.stock_movement','1',true);
  update public.inventory
  set quantity=p_quantity, cost_price=p_cost_price, selling_price=p_selling_price,
      minimum_selling_price=p_minimum_selling_price, minimum_stock=p_minimum_stock, updated_at=now()
  where id=p_inventory_id;

  insert into public.inventory_stock_movements(
    company_id, inventory_id, movement_type, quantity, unit_cost, reference_type, notes, created_by
  ) values (
    v_company_id, p_inventory_id, 'opening', p_quantity, p_cost_price,
    'opening_stock', 'Opening stock established from Inventory > Opening Stock', auth.uid()
  ) returning id into v_movement_id;

  perform set_config('novatech.stock_movement','0',true);
  return jsonb_build_object('inventory_id',p_inventory_id,'quantity',p_quantity,'movement_id',v_movement_id);
exception when others then
  perform set_config('novatech.stock_movement','0',true);
  raise;
end;
$$;

revoke all on function public.set_inventory_opening_stock(uuid,integer,numeric,numeric,numeric,integer) from public, anon;
grant execute on function public.set_inventory_opening_stock(uuid,integer,numeric,numeric,numeric,integer) to authenticated;