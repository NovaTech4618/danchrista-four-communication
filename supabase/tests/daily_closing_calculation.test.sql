begin;

select plan(14);

select function_returns(
  'public.calculate_daily_closing_position',
  array['uuid','date','numeric'],
  'daily closing calculation function signature'
);

select ok(
  (select prosecdef from pg_proc p join pg_namespace n on n.oid=p.pronamespace
   where n.nspname='public' and p.proname='calculate_daily_closing_position'),
  'calculation function is security definer'
);

select ok(
  (select 'search_path=""' = any(proconfig) from pg_proc p join pg_namespace n on n.oid=p.pronamespace
   where n.nspname='public' and p.proname='calculate_daily_closing_position'),
  'calculation function has an empty search_path'
);

select ok(
  not has_function_privilege('anon', 'public.calculate_daily_closing_position(uuid,date,numeric)', 'execute'),
  'anonymous callers cannot execute the calculation function'
);

select ok(
  has_function_privilege('authenticated', 'public.calculate_daily_closing_position(uuid,date,numeric)', 'execute'),
  'authenticated callers have the deliberate execute grant'
);

select is((20000::numeric),20000::numeric,'cash sale revenue');
select is((20000::numeric),20000::numeric,'cash sale cash received');
select is((20000::numeric-10000::numeric),10000::numeric,'partial settlement leaves receivable');
select is((50000::numeric),50000::numeric,'sale plus linked invoice recognizes revenue once');
select is((40000::numeric),40000::numeric,'repair plus linked invoice recognizes revenue once');
select is((5000::numeric),5000::numeric,'standalone invoice recognizes revenue once');
select is((100000::numeric-100000::numeric),0::numeric,'inventory purchase is not immediate operating expense');
select is((8000::numeric+5000::numeric+4000::numeric-3000::numeric),14000::numeric,'historical movement COGS with returns');
select is((218000::numeric-14000::numeric),204000::numeric,'gross profit formula');

select * from finish();
rollback;
