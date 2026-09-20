-- pgtap is a database test extension, not an application API.
-- PUBLIC execution implicitly exposes extension functions to anon/authenticated.
do $$
declare
  r record;
begin
  for r in
    select p.oid::regprocedure::text as sig
    from pg_proc p
    join pg_depend d on d.objid = p.oid and d.deptype = 'e'
    join pg_extension e on e.oid = d.refobjid
    where e.extname = 'pgtap'
  loop
    execute format('revoke all on function %s from public', r.sig);
  end loop;
end $$;
