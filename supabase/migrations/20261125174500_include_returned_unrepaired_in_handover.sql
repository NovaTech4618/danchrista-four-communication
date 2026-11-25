-- Treat Returned Unrepaired as an unsuccessful outcome that still requires
-- an explicit agreed charge and confirmed device handover.
do $migration$
declare
  v_definition text;
begin
  select pg_get_functiondef('public.set_repair_final_agreed_charge(uuid,numeric)'::regprocedure)
    into v_definition;
  v_definition := replace(v_definition, 'v_status not in (''No Fix'', ''Failed Repair'')', 'v_status not in (''No Fix'', ''Failed Repair'', ''Returned Unrepaired'')');
  execute v_definition;

  select pg_get_functiondef('public.record_repair_handover(uuid,text,text,text,text,text,boolean,text)'::regprocedure)
    into v_definition;
  v_definition := replace(v_definition, 'v_status in (''No Fix'', ''Failed Repair'')', 'v_status in (''No Fix'', ''Failed Repair'', ''Returned Unrepaired'')');
  execute v_definition;
end;
$migration$;
