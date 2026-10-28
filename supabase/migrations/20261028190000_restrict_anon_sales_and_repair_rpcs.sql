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
