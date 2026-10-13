-- Allow zero-debt replacement parts to be marked as used or returned.
-- Keep each part status mutually exclusive in the engineer's open quantity:
-- issued - returned - used - paid = outstanding. Replacement issues are included
-- in physical quantity counts, but their recorded unit_price is zero so returning
-- a replacement after a faulty return cannot create a second credit.

create or replace function public.engineer_part_return(
  p_engineer_id uuid,
  p_inventory_id uuid,
  p_quantity integer,
  p_condition text default 'normal',
  p_notes text default null
)
returns uuid
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_user uuid := auth.uid();
  v_company_id uuid;
  v_item_name text;
  v_branch uuid;
  v_issued_qty integer;
  v_returned_qty integer;
  v_used_qty integer;
  v_paid_qty integer;
  v_outstanding_qty integer;
  v_issued_value numeric;
  v_returned_value numeric;
  v_used_value numeric;
  v_paid_value numeric;
  v_unit_price numeric;
  v_total numeric;
  v_tx uuid;
  v_return_id uuid;
begin
  if v_user is null then raise exception 'Not authenticated'; end if;
  if not public.has_permission('engineers.work') and not public.has_permission('engineers.manage') then
    raise exception 'Permission denied';
  end if;
  if p_quantity is null or p_quantity <= 0 then raise exception 'Quantity must be greater than zero'; end if;
  if p_condition not in ('normal', 'faulty') then raise exception 'Return condition must be normal or faulty'; end if;

  v_company_id := public.get_my_company_id();
  if v_company_id is null then raise exception 'Company not found'; end if;
  if not exists (
    select 1 from public.engineers
    where id = p_engineer_id and company_id = v_company_id and status = 'active'
  ) then raise exception 'Engineer not found or inactive'; end if;

  select i.item_name, i.branch_id
    into v_item_name, v_branch
  from public.inventory i
  where i.id = p_inventory_id and i.company_id = v_company_id
  for update;
  if not found then raise exception 'Inventory item not found'; end if;
  if v_branch is not null and not public.user_has_branch_access(v_branch) then
    raise exception 'Branch access denied';
  end if;

  -- Count normal issues and zero-price replacements. A faulty return is already
  -- a resolved quantity; its replacement remains open until used or returned.
  select coalesce(sum(o.quantity), 0)::integer,
         coalesce(sum(o.quantity * coalesce(o.unit_price, 0)), 0)
    into v_issued_qty, v_issued_value
  from public.engineer_parts_out o
  where o.company_id = v_company_id
    and o.engineer_id = p_engineer_id
    and o.inventory_id = p_inventory_id;

  select coalesce(sum(i.quantity), 0)::integer,
         coalesce(sum(i.total_price), 0)
    into v_returned_qty, v_returned_value
  from public.engineer_parts_in i
  where i.company_id = v_company_id
    and i.engineer_id = p_engineer_id
    and i.inventory_id = p_inventory_id;

  select coalesce(sum(u.quantity), 0)::integer,
         coalesce(sum(u.quantity * coalesce(u.unit_price, 0)), 0)
    into v_used_qty, v_used_value
  from public.engineer_parts_used u
  where u.company_id = v_company_id
    and u.engineer_id = p_engineer_id
    and u.inventory_id = p_inventory_id;

  select coalesce(sum(p.quantity), 0)::integer,
         coalesce(sum(p.quantity * coalesce(p.unit_price, 0)), 0)
    into v_paid_qty, v_paid_value
  from public.engineer_parts_paid p
  where p.company_id = v_company_id
    and p.engineer_id = p_engineer_id
    and p.inventory_id = p_inventory_id;

  v_outstanding_qty := v_issued_qty - v_returned_qty - v_used_qty - v_paid_qty;
  if v_outstanding_qty <= 0 or p_quantity > v_outstanding_qty then
    raise exception 'Return exceeds outstanding quantity. Available to return: %, Requested: %',
      greatest(v_outstanding_qty, 0), p_quantity;
  end if;

  -- Spread the remaining recorded value over the quantities not yet resolved.
  -- This keeps a free replacement at zero value once the faulty original was credited.
  v_unit_price := greatest(v_issued_value - v_returned_value - v_used_value - v_paid_value, 0)
    / nullif(v_outstanding_qty, 0);
  v_unit_price := coalesce(v_unit_price, 0);
  v_total := p_quantity * v_unit_price;

  insert into public.engineer_transactions(
    company_id, engineer_id, transaction_type, description, debit, credit, notes, created_by
  ) values (
    v_company_id,
    p_engineer_id,
    case when p_condition = 'faulty' then 'faulty_return' else 'parts_in' end,
    p_quantity || ' × ' || v_item_name ||
      case when p_condition = 'faulty' then ' · Faulty return' else ' · Return' end,
    0, v_total, p_notes, v_user
  ) returning id into v_tx;

  insert into public.engineer_parts_in(
    company_id, engineer_id, inventory_id, quantity, unit_price, total_price,
    transaction_id, notes, created_by, return_condition
  ) values (
    v_company_id, p_engineer_id, p_inventory_id, p_quantity, v_unit_price, v_total,
    v_tx, p_notes, v_user, p_condition
  ) returning id into v_return_id;

  update public.engineer_transactions set reference_id = v_return_id where id = v_tx;

  if p_condition = 'normal' then
    perform set_config('novatech.stock_movement', '1', true);
    update public.inventory
      set quantity = quantity + p_quantity, updated_at = now()
      where id = p_inventory_id;
    perform set_config('novatech.stock_movement', '0', true);
    insert into public.inventory_stock_movements(
      company_id, inventory_id, movement_type, quantity, unit_cost,
      reference_type, reference_id, notes, created_by
    ) values (
      v_company_id, p_inventory_id, 'engineer_return', p_quantity, v_unit_price,
      'engineer_parts_in', v_return_id, coalesce(p_notes, 'Normal engineer part return'), v_user
    );
  else
    perform set_config('novatech.stock_movement', '1', true);
    update public.inventory
      set faulty_quantity = faulty_quantity + p_quantity, updated_at = now()
      where id = p_inventory_id;
    perform set_config('novatech.stock_movement', '0', true);
    insert into public.inventory_stock_movements(
      company_id, inventory_id, movement_type, quantity, unit_cost,
      reference_type, reference_id, notes, created_by
    ) values (
      v_company_id, p_inventory_id, 'engineer_faulty_return', 0, v_unit_price,
      'engineer_parts_in', v_return_id,
      coalesce(p_notes, 'Faulty engineer return; kept out of sellable stock'), v_user
    );
  end if;

  return v_return_id;
exception
  when others then
    perform set_config('novatech.stock_movement', '0', true);
    raise;
end;
$function$;

create or replace function public.engineer_part_used(
  p_engineer_id uuid,
  p_inventory_id uuid,
  p_quantity integer,
  p_notes text default null
)
returns uuid
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_user uuid := auth.uid();
  v_company uuid;
  v_branch uuid;
  v_out integer;
  v_returned integer;
  v_used integer;
  v_paid integer;
  v_available integer;
  v_issue_value numeric;
  v_return_value numeric;
  v_used_value numeric;
  v_paid_value numeric;
  v_price numeric;
  v_id uuid;
  v_tx uuid;
  v_name text;
begin
  if v_user is null then raise exception 'Not authenticated'; end if;
  if not (public.has_permission('engineers.work') or public.has_permission('engineers.manage')) then
    raise exception 'Permission denied';
  end if;
  v_company := public.get_my_company_id();
  if v_company is null then raise exception 'Company not found'; end if;
  if p_quantity is null or p_quantity <= 0 then raise exception 'Quantity must be greater than zero'; end if;

  select item_name, branch_id into v_name, v_branch
  from public.inventory
  where id = p_inventory_id and company_id = v_company
  for update;
  if not found then raise exception 'Inventory item not found'; end if;
  if v_branch is not null and not public.user_has_branch_access(v_branch) then
    raise exception 'Branch access denied';
  end if;
  if not exists (
    select 1 from public.engineers
    where id = p_engineer_id and company_id = v_company and status = 'active'
  ) then raise exception 'Engineer not found or inactive'; end if;

  select coalesce(sum(o.quantity), 0)::integer,
         coalesce(sum(o.quantity * coalesce(o.unit_price, 0)), 0)
    into v_out, v_issue_value
  from public.engineer_parts_out o
  where o.company_id = v_company
    and o.engineer_id = p_engineer_id
    and o.inventory_id = p_inventory_id;

  select coalesce(sum(i.quantity), 0)::integer,
         coalesce(sum(i.total_price), 0)
    into v_returned, v_return_value
  from public.engineer_parts_in i
  where i.company_id = v_company
    and i.engineer_id = p_engineer_id
    and i.inventory_id = p_inventory_id;

  select coalesce(sum(u.quantity), 0)::integer,
         coalesce(sum(u.quantity * coalesce(u.unit_price, 0)), 0)
    into v_used, v_used_value
  from public.engineer_parts_used u
  where u.company_id = v_company
    and u.engineer_id = p_engineer_id
    and u.inventory_id = p_inventory_id;

  select coalesce(sum(p.quantity), 0)::integer,
         coalesce(sum(p.quantity * coalesce(p.unit_price, 0)), 0)
    into v_paid, v_paid_value
  from public.engineer_parts_paid p
  where p.company_id = v_company
    and p.engineer_id = p_engineer_id
    and p.inventory_id = p_inventory_id;

  v_available := v_out - v_returned - v_used - v_paid;
  if v_available <= 0 or p_quantity > v_available then
    raise exception 'Used quantity exceeds outstanding collection. Available: %, requested: %',
      greatest(v_available, 0), p_quantity;
  end if;

  v_price := greatest(v_issue_value - v_return_value - v_used_value - v_paid_value, 0)
    / nullif(v_available, 0);
  v_price := coalesce(v_price, 0);

  insert into public.engineer_parts_used(
    company_id, engineer_id, inventory_id, quantity, unit_price, notes, created_by
  ) values (
    v_company, p_engineer_id, p_inventory_id, p_quantity, v_price, p_notes, v_user
  ) returning id into v_id;

  insert into public.engineer_transactions(
    company_id, engineer_id, transaction_type, description, debit, credit,
    notes, created_by, reference_id
  ) values (
    v_company, p_engineer_id, 'parts_used',
    p_quantity || ' × ' || v_name || ' · Used', 0, 0, p_notes, v_user, v_id
  ) returning id into v_tx;

  update public.engineer_parts_used set reference_id = v_tx where id = v_id;
  return v_id;
end;
$function$;

revoke execute on function public.engineer_part_return(uuid, uuid, integer, text, text) from public, anon;
grant execute on function public.engineer_part_return(uuid, uuid, integer, text, text) to authenticated;
revoke execute on function public.engineer_part_used(uuid, uuid, integer, text) from public, anon;
grant execute on function public.engineer_part_used(uuid, uuid, integer, text) to authenticated;
