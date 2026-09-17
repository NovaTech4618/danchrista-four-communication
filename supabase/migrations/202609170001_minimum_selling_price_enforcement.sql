-- Danchrista price-floor protection.
-- Normal staff can sell at/above the owner-set minimum. Only users with
-- sales.price_override may deliberately sell below it, and every override is audited.

alter table public.inventory
  add column if not exists minimum_selling_price numeric(14,2);

update public.inventory
set minimum_selling_price = selling_price
where minimum_selling_price is null;

alter table public.inventory
  alter column minimum_selling_price set default 0,
  alter column minimum_selling_price set not null;

alter table public.inventory
  drop constraint if exists inventory_minimum_selling_price_valid;

alter table public.inventory
  add constraint inventory_minimum_selling_price_valid
  check (minimum_selling_price >= 0 and minimum_selling_price <= selling_price);

insert into public.role_permissions(role, permission, allowed)
values ('branch_manager', 'sales.price_override', true)
on conflict (role, permission) do update set allowed = excluded.allowed;

create or replace function public.create_sale(
  p_customer_id uuid,
  p_payment_method text,
  p_discount numeric,
  p_staff_name text,
  p_notes text,
  p_items jsonb
)
returns uuid
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_company_id uuid;
  v_user uuid;
  v_sale uuid;
  v_subtotal numeric := 0;
  v_total numeric;
  v_item jsonb;
  v_inventory_id uuid;
  v_qty integer;
  v_unit numeric;
  v_cost numeric;
  v_available integer;
  v_floor numeric;
  v_override boolean;
  v_branch uuid;
  v_sale_branch uuid;
begin
  v_user := auth.uid();
  if v_user is null then raise exception 'Not authenticated'; end if;
  if not public.has_permission('sales.manage') then raise exception 'Permission denied'; end if;

  select company_id into v_company_id from public.profiles where id = v_user;
  if v_company_id is null then raise exception 'Company not found'; end if;
  if p_customer_id is not null and not exists (
    select 1 from public.customers where id = p_customer_id and company_id = v_company_id
  ) then raise exception 'Customer not found'; end if;
  if jsonb_array_length(coalesce(p_items, '[]'::jsonb)) = 0 then raise exception 'Sale must contain at least one item'; end if;

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_inventory_id := (v_item->>'inventory_id')::uuid;
    v_qty := (v_item->>'quantity')::integer;
    v_unit := (v_item->>'unit_price')::numeric;
    v_override := coalesce((v_item->>'price_override')::boolean, false);

    if v_qty <= 0 or v_unit < 0 then raise exception 'Invalid sale item'; end if;

    select quantity, branch_id, minimum_selling_price, coalesce(cost_price, 0)
      into v_available, v_branch, v_floor, v_cost
    from public.inventory
    where id = v_inventory_id and company_id = v_company_id
    for update;

    if not found then raise exception 'Inventory item not found: %', v_inventory_id; end if;
    if v_branch is not null and not public.user_has_branch_access(v_branch) then raise exception 'Branch access denied'; end if;
    if v_available < v_qty then raise exception 'Insufficient stock: have %, need %', v_available, v_qty; end if;

    if v_unit < coalesce(v_floor, 0) then
      if not v_override then
        raise exception 'Price below minimum selling price. Minimum allowed: %', coalesce(v_floor, 0);
      end if;
      if not public.has_permission('sales.price_override') then
        raise exception 'Only an authorised user can override the minimum selling price.';
      end if;
    end if;

    if v_sale_branch is null then
      v_sale_branch := v_branch;
    elsif v_branch is distinct from v_sale_branch then
      raise exception 'A sale cannot combine stock from different branches';
    end if;

    v_subtotal := v_subtotal + (v_qty * v_unit);
  end loop;

  if coalesce(p_discount, 0) < 0 then raise exception 'Discount cannot be negative'; end if;
  v_total := v_subtotal - coalesce(p_discount, 0);
  if v_total < 0 then raise exception 'Sale total cannot be negative'; end if;

  insert into public.sales(company_id, branch_id, customer_id, sale_date, payment_method, subtotal, discount, total, staff_name, notes)
  values (v_company_id, v_sale_branch, p_customer_id, now(), p_payment_method, v_subtotal, coalesce(p_discount, 0), v_total, p_staff_name, p_notes)
  returning id into v_sale;

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_inventory_id := (v_item->>'inventory_id')::uuid;
    v_qty := (v_item->>'quantity')::integer;
    v_unit := (v_item->>'unit_price')::numeric;
    v_override := coalesce((v_item->>'price_override')::boolean, false);

    select coalesce(cost_price, 0), minimum_selling_price into v_cost, v_floor
    from public.inventory
    where id = v_inventory_id and company_id = v_company_id;

    insert into public.sale_items(sale_id, inventory_id, quantity, unit_price, total_price)
    values (v_sale, v_inventory_id, v_qty, v_unit, v_qty * v_unit);

    perform public.record_inventory_movement(v_inventory_id, 'sale', v_qty, v_cost, 'sale', v_sale, null);

    if v_override and v_unit < coalesce(v_floor, 0) then
      perform public.write_audit_log(
        'sale.price_floor_override', 'sale', v_sale, null, null,
        jsonb_build_object(
          'inventory_id', v_inventory_id,
          'quantity', v_qty,
          'unit_price', v_unit,
          'minimum_selling_price', v_floor,
          'user_id', v_user
        )
      );
    end if;
  end loop;

  return v_sale;
end;
$function$;

revoke execute on function public.create_sale(uuid,text,numeric,text,text,jsonb) from anon;
grant execute on function public.create_sale(uuid,text,numeric,text,text,jsonb) to authenticated;
