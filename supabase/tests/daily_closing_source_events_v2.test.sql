begin;

-- Phase 2B source-event evidence harness.
-- Run in a database test session with pgtap installed.
-- Each scenario uses a SAVEPOINT, creates authoritative business events,
-- calls calculate_daily_closing_position(), asserts the returned snapshot,
-- then rolls back the scenario. The outer transaction rolls back all fixtures.
-- No daily_closings rows are ever used as calculation inputs.

select no_plan();
set local request.jwt.claim.sub='8ef5cb57-b7bc-41a1-8373-d63a86cd2bfa';

create temp table dc_ctx(company_id uuid,profile_id uuid,customer_id uuid,engineer_id uuid,inventory_id uuid,device_id uuid);
insert into dc_ctx values('00000000-0000-0000-0000-000000002b20','8ef5cb57-b7bc-41a1-8373-d63a86cd2bfa',gen_random_uuid(),gen_random_uuid(),gen_random_uuid(),gen_random_uuid());
insert into public.companies(id,name,owner_id,timezone) select company_id,'Phase2B Source Event Test V2',profile_id,'Africa/Lagos' from dc_ctx;
update public.profiles set company_id=(select company_id from dc_ctx),role='owner',is_active=true where id=(select profile_id from dc_ctx);
insert into public.customers(id,company_id,full_name,phone) select customer_id,company_id,'Phase2B Customer V2','2349000000020' from dc_ctx;
insert into public.engineers(id,company_id,name) select engineer_id,company_id,'Phase2B Engineer V2' from dc_ctx;
insert into public.inventory(id,company_id,item_name,selling_price,cost_price,quantity,minimum_stock,item_type,category) select inventory_id,company_id,'Phase2B Historical Cost Part',20000,8000,100,1,'part','Phone Parts' from dc_ctx;
insert into public.devices(id,company_id,customer_id,brand,model,device_type) select device_id,company_id,customer_id,'Test','P2B','phone' from dc_ctx;

-- A Cash sale: sale trigger supplies the financial event.
savepoint a;
insert into public.sales(id,company_id,total,subtotal,discount,payment_method,sale_date) select '00000000-0000-0000-0000-000000002a20',company_id,20000,20000,0,'Cash','2026-09-20 10:00:00+01' from dc_ctx;
select is((select sales_revenue from public.calculate_daily_closing_position((select company_id from dc_ctx),'2026-09-20',100000)),20000::numeric,'A sales revenue');
select is((select cash_received from public.calculate_daily_closing_position((select company_id from dc_ctx),'2026-09-20',100000)),20000::numeric,'A cash received');
select is((select transfer_received+pos_received+other_received from public.calculate_daily_closing_position((select company_id from dc_ctx),'2026-09-20',100000)),0::numeric,'A non-cash buckets are zero');
rollback to a;

-- B Transfer sale: sale trigger records transfer, physical cash stays zero.
savepoint b;
insert into public.sales(id,company_id,total,subtotal,discount,payment_method,sale_date) select '00000000-0000-0000-0000-000000002b21',company_id,20000,20000,0,'Transfer','2026-09-20 11:00:00+01' from dc_ctx;
select is((select total_revenue from public.calculate_daily_closing_position((select company_id from dc_ctx),'2026-09-20',100000)),20000::numeric,'B revenue');
select is((select transfer_received from public.calculate_daily_closing_position((select company_id from dc_ctx),'2026-09-20',100000)),20000::numeric,'B transfer received');
select is((select cash_inflows from public.calculate_daily_closing_position((select company_id from dc_ctx),'2026-09-20',100000)),0::numeric,'B physical cash inflow is zero');
rollback to b;

-- C Partial repair: repair trigger creates customer charge; payment trigger creates debt credit + cash event.
savepoint c;
insert into public.repairs(id,company_id,device_id,issue,estimated_cost,final_cost,status,completed_at) select '00000000-0000-0000-0000-000000002c21',company_id,device_id,'screen',30000,30000,'Completed','2026-09-20 13:00:00+01' from dc_ctx;
insert into public.repair_payments(company_id,repair_id,amount,payment_method,payment_date,idempotency_key) select company_id,'00000000-0000-0000-0000-000000002c21',10000,'Cash','2026-09-20 16:00:00+01',gen_random_uuid() from dc_ctx;
select is((select repair_revenue from public.calculate_daily_closing_position((select company_id from dc_ctx),'2026-09-20',100000)),30000::numeric,'C repair revenue');
select is((select cash_received from public.calculate_daily_closing_position((select company_id from dc_ctx),'2026-09-20',100000)),10000::numeric,'C repair payment cash');
select is((select customer_charges from public.calculate_daily_closing_position((select company_id from dc_ctx),'2026-09-20',100000)),30000::numeric,'C customer charge');
select is((select customer_payments from public.calculate_daily_closing_position((select company_id from dc_ctx),'2026-09-20',100000)),10000::numeric,'C customer payment');
select is((select customer_closing from public.calculate_daily_closing_position((select company_id from dc_ctx),'2026-09-20',100000)),20000::numeric,'C closing receivable');
rollback to c;

-- D Fully paid repair.
savepoint d;
insert into public.repairs(id,company_id,device_id,issue,estimated_cost,final_cost,status,completed_at) select '00000000-0000-0000-0000-000000002d21',company_id,device_id,'battery',30000,30000,'Completed','2026-09-20 13:00:00+01' from dc_ctx;
insert into public.repair_payments(company_id,repair_id,amount,payment_method,payment_date,idempotency_key) select company_id,'00000000-0000-0000-0000-000000002d21',30000,'Transfer','2026-09-20 16:00:00+01',gen_random_uuid() from dc_ctx;
select is((select repair_revenue from public.calculate_daily_closing_position((select company_id from dc_ctx),'2026-09-20',100000)),30000::numeric,'D repair revenue');
select is((select customer_closing from public.calculate_daily_closing_position((select company_id from dc_ctx),'2026-09-20',100000)),0::numeric,'D repair is fully settled');
rollback to d;

-- E/F linked invoices. They are excluded from standalone invoice revenue regardless of link type.
savepoint e_f;
insert into public.sales(id,company_id,total,subtotal,discount,payment_method,sale_date) select '00000000-0000-0000-0000-000000002e21',company_id,50000,50000,0,'Cash','2026-09-20 10:00:00+01' from dc_ctx;
insert into public.repairs(id,company_id,device_id,issue,estimated_cost,final_cost,status,completed_at) select '00000000-0000-0000-0000-000000002f21',company_id,device_id,'port',40000,40000,'Completed','2026-09-20 11:00:00+01' from dc_ctx;
insert into public.invoices(id,company_id,invoice_number,customer_id,sale_id,status,subtotal,total,issued_at) select '00000000-0000-0000-0000-000000002e22',company_id,'LINK-SALE',customer_id,'00000000-0000-0000-0000-000000002e21','issued',50000,50000,'2026-09-20 12:00:00+01' from dc_ctx;
insert into public.invoices(id,company_id,invoice_number,customer_id,repair_id,status,subtotal,total,issued_at) select '00000000-0000-0000-0000-000000002f22',company_id,'LINK-REPAIR',customer_id,'00000000-0000-0000-0000-000000002f21','issued',40000,40000,'2026-09-20 12:30:00+01' from dc_ctx;
select is((select linked_invoice_revenue from public.calculate_daily_closing_position((select company_id from dc_ctx),'2026-09-20',100000)),0::numeric,'E/F linked invoice revenue is zero');
select is((select total_revenue from public.calculate_daily_closing_position((select company_id from dc_ctx),'2026-09-20',100000)),90000::numeric,'E/F total is sale plus repair, not duplicated');
rollback to e_f;

-- G standalone invoice, paid on the following business date.
savepoint g;
insert into public.invoices(id,company_id,invoice_number,customer_id,status,subtotal,total,issued_at) select '00000000-0000-0000-0000-000000002g21',company_id,'STANDALONE',customer_id,'issued',5000,5000,'2026-09-20 19:00:00+01' from dc_ctx;
select is((select standalone_invoice_revenue from public.calculate_daily_closing_position((select company_id from dc_ctx),'2026-09-20',null)),5000::numeric,'G day1 invoice revenue');
insert into public.invoice_payments(company_id,invoice_id,customer_id,amount,payment_method,payment_date,idempotency_key) select company_id,'00000000-0000-0000-0000-000000002g21',customer_id,5000,'cash','2026-09-21 10:00:00+01',gen_random_uuid() from dc_ctx;
select is((select standalone_invoice_revenue from public.calculate_daily_closing_position((select company_id from dc_ctx),'2026-09-21',null)),0::numeric,'G day2 payment adds no revenue');
select is((select cash_received from public.calculate_daily_closing_position((select company_id from dc_ctx),'2026-09-21',null)),5000::numeric,'G day2 payment adds cash');
rollback to g;

-- H purchase alone is cash outflow, not expense/COGS; I/J/L consume historical cost.
savepoint h_i_j_l;
insert into public.inventory_purchases(id,company_id,supplier,total_amount,payment_method,purchase_date,amount_paid,payment_status) select '00000000-0000-0000-0000-000000002h21',company_id,'P2B Supplier',100000,'cash','2026-09-20 09:00:00+01',100000,'paid' from dc_ctx;
insert into public.inventory_purchase_items(company_id,purchase_id,inventory_id,quantity,unit_cost) select company_id,'00000000-0000-0000-0000-000000002h21',inventory_id,10,10000 from dc_ctx;
insert into public.financial_transactions(company_id,direction,category,amount,payment_method,source_type,source_id,occurred_at) select company_id,'out','part_purchase',100000,'cash','inventory_purchase','00000000-0000-0000-0000-000000002h21','2026-09-20 09:00:00+01' from dc_ctx;
insert into public.inventory_stock_movements(company_id,inventory_id,movement_type,quantity,unit_cost,reference_type,reference_id,created_at) select company_id,inventory_id,'purchase',10,10000,'inventory_purchase','00000000-0000-0000-0000-000000002h21','2026-09-20 09:00:00+01' from dc_ctx;
select is((select operating_expenses from public.calculate_daily_closing_position((select company_id from dc_ctx),'2026-09-20',100000)),0::numeric,'H purchase is not operating expense');
select is((select total_cogs from public.calculate_daily_closing_position((select company_id from dc_ctx),'2026-09-20',100000)),0::numeric,'H purchase is not COGS');
insert into public.inventory_stock_movements(company_id,inventory_id,movement_type,quantity,unit_cost,reference_type,created_at) select company_id,inventory_id,'sale',-1,10000,'sale','2026-09-20 14:00:00+01' from dc_ctx;
select is((select sale_cogs from public.calculate_daily_closing_position((select company_id from dc_ctx),'2026-09-20',100000)),10000::numeric,'I sale COGS uses historical movement cost');
insert into public.inventory_stock_movements(company_id,inventory_id,movement_type,quantity,unit_cost,reference_type,created_at) select company_id,inventory_id,'repair_use',-1,10000,'repair','2026-09-20 15:00:00+01' from dc_ctx;
select is((select repair_cogs from public.calculate_daily_closing_position((select company_id from dc_ctx),'2026-09-20',100000)),10000::numeric,'J repair COGS uses historical movement cost');
insert into public.inventory_stock_movements(company_id,inventory_id,movement_type,quantity,unit_cost,reference_type,created_at) select company_id,inventory_id,'repair_return',1,10000,'repair','2026-09-20 16:00:00+01' from dc_ctx;
select is((select total_cogs from public.calculate_daily_closing_position((select company_id from dc_ctx),'2026-09-20',100000)),10000::numeric,'L repair return reverses historical cost');
rollback to h_i_j_l;

-- K engineer source ledger semantics.
savepoint k;
insert into public.engineer_transactions(company_id,engineer_id,transaction_type,description,debit,credit,transaction_date,created_at,payment_method) select company_id,engineer_id,'opening_balance','opening',10000,0,'2026-09-20','2026-09-19 12:00:00+01',null from dc_ctx;
insert into public.engineer_transactions(company_id,engineer_id,transaction_type,description,debit,credit,transaction_date,created_at,payment_method) select company_id,engineer_id,'parts_out','parts out',50000,0,'2026-09-20','2026-09-20 12:00:00+01',null from dc_ctx;
insert into public.engineer_transactions(company_id,engineer_id,transaction_type,description,debit,credit,transaction_date,created_at,payment_method) select company_id,engineer_id,'parts_in','parts in',0,5000,'2026-09-20','2026-09-20 14:00:00+01',null from dc_ctx;
insert into public.engineer_transactions(company_id,engineer_id,transaction_type,description,debit,credit,transaction_date,created_at,payment_method) select company_id,engineer_id,'payment_in','payment in',0,10000,'2026-09-20','2026-09-20 18:00:00+01','cash' from dc_ctx;
insert into public.engineer_transactions(company_id,engineer_id,transaction_type,description,debit,credit,transaction_date,created_at,payment_method) select company_id,engineer_id,'payment_out','payment out',7000,0,'2026-09-20','2026-09-20 18:30:00+01','cash' from dc_ctx;
insert into public.financial_transactions(company_id,direction,category,amount,payment_method,source_type,occurred_at) select company_id,'in','engineer_payment',10000,'cash','engineer_payment','2026-09-20 18:00:00+01' from dc_ctx;
insert into public.financial_transactions(company_id,direction,category,amount,payment_method,source_type,occurred_at) select company_id,'out','engineer_payment',7000,'cash','engineer_payment','2026-09-20 18:30:00+01' from dc_ctx;
select is((select engineer_revenue from public.calculate_daily_closing_position((select company_id from dc_ctx),'2026-09-20',100000)),45000::numeric,'K engineer revenue');
select is((select engineer_closing from public.calculate_daily_closing_position((select company_id from dc_ctx),'2026-09-20',100000)),45000::numeric,'K engineer receivable excludes payment_out');
select is((select engineer_direct_cost from public.calculate_daily_closing_position((select company_id from dc_ctx),'2026-09-20',100000)),7000::numeric,'K payment_out direct cost');
rollback to k;

-- M canonical payment buckets.
savepoint m;
insert into public.financial_transactions(company_id,direction,category,amount,payment_method,source_type,occurred_at) select company_id,'in','other',1000,'cash','test','2026-09-20 20:00:00+01' from dc_ctx;
insert into public.financial_transactions(company_id,direction,category,amount,payment_method,source_type,occurred_at) select company_id,'in','other',2000,'transfer','test','2026-09-20 20:01:00+01' from dc_ctx;
insert into public.financial_transactions(company_id,direction,category,amount,payment_method,source_type,occurred_at) select company_id,'in','other',3000,'POS','test','2026-09-20 20:02:00+01' from dc_ctx;
insert into public.financial_transactions(company_id,direction,category,amount,payment_method,source_type,occurred_at) select company_id,'in','other',4000,'other','test','2026-09-20 20:03:00+01' from dc_ctx;
select is((select cash_received from public.calculate_daily_closing_position((select company_id from dc_ctx),'2026-09-20',null)),10000::numeric,'M all payment buckets total');
select is((select cash_received+transfer_received+pos_received+other_received from public.calculate_daily_closing_position((select company_id from dc_ctx),'2026-09-20',null)),10000::numeric,'M buckets reconcile');
rollback to m;

-- N exact Lagos midnight.
savepoint n;
insert into public.financial_transactions(company_id,direction,category,amount,payment_method,source_type,occurred_at) select company_id,'in','other',111,'cash','boundary','2026-09-06 22:59:59+00' from dc_ctx;
insert into public.financial_transactions(company_id,direction,category,amount,payment_method,source_type,occurred_at) select company_id,'in','other',222,'cash','boundary','2026-09-06 23:00:00+00' from dc_ctx;
select is((select cash_received from public.calculate_daily_closing_position((select company_id from dc_ctx),'2026-09-06',null)),111::numeric,'N 23:59:59 Lagos is Sep 6');
select is((select cash_received from public.calculate_daily_closing_position((select company_id from dc_ctx),'2026-09-07',null)),222::numeric,'N 00:00:00 Lagos is Sep 7');
rollback to n;

-- O opening cash. Previous-closing chaining is explicitly Gate C because no close RPC exists yet.
savepoint o;
select is((select opening_cash_available from public.calculate_daily_closing_position((select company_id from dc_ctx),'2026-09-20',100000)),true,'O explicit opening is available');
select is((select expected_closing_cash from public.calculate_daily_closing_position((select company_id from dc_ctx),'2026-09-20',null)),null::numeric,'O missing opening is not silently zero');
rollback to o;

-- Adversarial: same business date in another company must be isolated.
savepoint isolation;
insert into public.companies(id,name,owner_id,timezone) values('00000000-0000-0000-0000-000000002b21','Phase2B Other Company','8ef5cb57-b7bc-41a1-8373-d63a86cd2bfa','Africa/Lagos');
insert into public.financial_transactions(company_id,direction,category,amount,payment_method,source_type,occurred_at) values('00000000-0000-0000-0000-000000002b21','in','other',99999,'cash','other_company','2026-09-20 10:00:00+01');
select is((select cash_received from public.calculate_daily_closing_position((select company_id from dc_ctx),'2026-09-20',null)),0::numeric,'wrong-company event cannot affect requested company');
rollback to isolation;

-- Prove no scenario rows remain after each savepoint rollback. The synthetic company/profile
-- context itself is rolled back by the final ROLLBACK below.
select is((select count(*) from public.sales where company_id=(select company_id from dc_ctx)),0::bigint,'cleanup sales');
select is((select count(*) from public.sale_items where company_id=(select company_id from dc_ctx)),0::bigint,'cleanup sale_items');
select is((select count(*) from public.repairs where company_id=(select company_id from dc_ctx)),0::bigint,'cleanup repairs');
select is((select count(*) from public.repair_payments where company_id=(select company_id from dc_ctx)),0::bigint,'cleanup repair_payments');
select is((select count(*) from public.invoices where company_id=(select company_id from dc_ctx)),0::bigint,'cleanup invoices');
select is((select count(*) from public.invoice_payments where company_id=(select company_id from dc_ctx)),0::bigint,'cleanup invoice_payments');
select is((select count(*) from public.inventory_stock_movements where company_id=(select company_id from dc_ctx)),0::bigint,'cleanup stock movements');
select is((select count(*) from public.engineer_transactions where company_id=(select company_id from dc_ctx)),0::bigint,'cleanup engineer transactions');
select is((select count(*) from public.financial_transactions where company_id=(select company_id from dc_ctx)),0::bigint,'cleanup financial transactions');
select is((select count(*) from public.customer_debt_ledger where company_id=(select company_id from dc_ctx)),0::bigint,'cleanup customer debt ledger');
select is((select count(*) from public.daily_closings where company_id=(select company_id from dc_ctx)),0::bigint,'cleanup daily closings');
select is((select count(*) from public.daily_closing_payment_methods where daily_closing_id in(select id from public.daily_closings where company_id=(select company_id from dc_ctx))),0::bigint,'cleanup daily closing payment rows');

select * from finish();
rollback;
