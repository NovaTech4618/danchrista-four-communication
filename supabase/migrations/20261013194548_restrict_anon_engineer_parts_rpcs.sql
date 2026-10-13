-- Engineer workflow RPCs should never be invokable by anonymous callers.
-- Existing permission checks remain inside both SECURITY DEFINER functions.
revoke execute on function public.engineer_part_paid(uuid, uuid, integer, text, text) from public, anon;
grant execute on function public.engineer_part_paid(uuid, uuid, integer, text, text) to authenticated;

revoke execute on function public.get_engineer_daily_collection_summary(date) from public, anon;
grant execute on function public.get_engineer_daily_collection_summary(date) to authenticated;
