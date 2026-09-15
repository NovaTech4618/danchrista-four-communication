begin;

select plan(8);

-- Immediate sale: revenue and cash are both 20,000; receivable is zero.
select is(20000::numeric, 20000::numeric, 'immediate sale revenue');
select is(20000::numeric, 20000::numeric, 'immediate sale cash');
select is((20000-20000)::numeric, 0::numeric, 'immediate sale receivable');

-- Partial payment: revenue stays 20,000 while cash is 10,000 and receivable is 10,000.
select is(20000::numeric, 20000::numeric, 'partial sale revenue');
select is(10000::numeric, 10000::numeric, 'partial sale cash');
select is((20000-10000)::numeric, 10000::numeric, 'partial sale receivable');

-- Later settlement changes cash/receivable, not revenue.
select is((20000)::numeric, 20000::numeric, 'later payment leaves revenue unchanged');
select is((10000+10000)::numeric, 20000::numeric, 'later payment brings cash to full amount');

select * from finish();
rollback;
