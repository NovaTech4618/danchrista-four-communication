-- Keep sensitive sales and repair RPCs unavailable to anonymous callers.
-- The function bodies still enforce authentication and business permissions.
-- These explicit grants preserve the signed-in application and server workflows.

revoke execute on function public.create_sale(
  uuid, text, text, numeric, text, text, jsonb, uuid, uuid, numeric
) from public, anon;
grant execute on function public.create_sale(
  uuid, text, text, numeric, text, text, jsonb, uuid, uuid, numeric
) to authenticated, service_role;

revoke execute on function public.create_walk_in_repair(
  text, text, text, text, text, text, text, text, text,
  numeric, numeric, text, text, date, text
) from public, anon;
grant execute on function public.create_walk_in_repair(
  text, text, text, text, text, text, text, text, text,
  numeric, numeric, text, text, date, text
) to authenticated, service_role;

revoke execute on function public.request_sale_price_override(
  uuid, text, text, numeric, text, text, jsonb, text
) from public, anon;
grant execute on function public.request_sale_price_override(
  uuid, text, text, numeric, text, text, jsonb, text
) to authenticated, service_role;

-- Fail the migration if the intended API boundary was not established.
do $verify_rpc_grants$
begin
  if has_function_privilege(
    'anon',
    'public.create_sale(uuid, text, text, numeric, text, text, jsonb, uuid, uuid, numeric)'::regprocedure,
    'EXECUTE'
  ) then
    raise exception 'Anonymous execution is still enabled for public.create_sale';
  end if;
  if not has_function_privilege(
    'authenticated',
    'public.create_sale(uuid, text, text, numeric, text, text, jsonb, uuid, uuid, numeric)'::regprocedure,
    'EXECUTE'
  ) then
    raise exception 'Authenticated execution is missing for public.create_sale';
  end if;

  if has_function_privilege(
    'anon',
    'public.create_walk_in_repair(text, text, text, text, text, text, text, text, text, numeric, numeric, text, text, date, text)'::regprocedure,
    'EXECUTE'
  ) then
    raise exception 'Anonymous execution is still enabled for the service-type walk-in repair RPC';
  end if;
  if not has_function_privilege(
    'authenticated',
    'public.create_walk_in_repair(text, text, text, text, text, text, text, text, text, numeric, numeric, text, text, date, text)'::regprocedure,
    'EXECUTE'
  ) then
    raise exception 'Authenticated execution is missing for the service-type walk-in repair RPC';
  end if;

  if has_function_privilege(
    'anon',
    'public.request_sale_price_override(uuid, text, text, numeric, text, text, jsonb, text)'::regprocedure,
    'EXECUTE'
  ) then
    raise exception 'Anonymous execution is still enabled for public.request_sale_price_override';
  end if;
  if not has_function_privilege(
    'authenticated',
    'public.request_sale_price_override(uuid, text, text, numeric, text, text, jsonb, text)'::regprocedure,
    'EXECUTE'
  ) then
    raise exception 'Authenticated execution is missing for public.request_sale_price_override';
  end if;
end
$verify_rpc_grants$;
