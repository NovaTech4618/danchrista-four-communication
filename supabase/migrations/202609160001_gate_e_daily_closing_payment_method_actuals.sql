create or replace function public.close_daily_closing_with_payment_methods(
  p_daily_closing_id uuid,
  p_actual_cash numeric,
  p_notes text default null,
  p_payment_methods jsonb default '{}'::jsonb
)
returns public.daily_closings
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_user uuid := auth.uid();
  v_row public.daily_closings;
  v_method text;
  v_actual numeric;
begin
  if v_user is null then raise exception 'Authentication required'; end if;
  if not public.has_permission('daily_closing.close') then raise exception 'Permission denied'; end if;
  if jsonb_typeof(p_payment_methods) <> 'object' then raise exception 'Payment method amounts must be an object'; end if;

  foreach v_method in array array['cash','transfer','pos','other'] loop
    if not (p_payment_methods ? v_method) then raise exception 'Actual amount is required for %', v_method; end if;
    begin v_actual := (p_payment_methods ->> v_method)::numeric;
    exception when invalid_text_representation then raise exception 'Actual amount for % must be a valid number', v_method; end;
    if v_actual is null or v_actual < 0 then raise exception 'Actual amount for % must be zero or greater', v_method; end if;
  end loop;

  select * into v_row from public.close_daily_closing(p_daily_closing_id, p_actual_cash, p_notes);

  foreach v_method in array array['cash','transfer','pos','other'] loop
    v_actual := (p_payment_methods ->> v_method)::numeric;
    update public.daily_closing_payment_methods set actual_amount = round(v_actual,2), updated_at = now()
    where daily_closing_id = v_row.id and payment_method = v_method;
  end loop;

  return v_row;
end;
$function$;

revoke execute on function public.close_daily_closing_with_payment_methods(uuid,numeric,text,jsonb) from public;
revoke execute on function public.close_daily_closing_with_payment_methods(uuid,numeric,text,jsonb) from anon;
grant execute on function public.close_daily_closing_with_payment_methods(uuid,numeric,text,jsonb) to authenticated;
grant execute on function public.close_daily_closing_with_payment_methods(uuid,numeric,text,jsonb) to service_role;
