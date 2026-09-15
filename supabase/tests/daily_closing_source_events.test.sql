begin;

-- Phase 2B evidence harness. Every business scenario is created from authoritative
-- source tables, the calculation function is called, assertions inspect its return,
-- and the final transaction rolls back. This file intentionally does not write
-- daily_closings or daily_closing_payment_methods.

select plan(34);
set local request.jwt.claim.sub = '8ef5cb57-b7bc-41a1-8373-d63a86cd2bfa';

create temp table dc_ctx (
  company_id uuid,
  profile_id uuid,
  customer_id uuid,
  engineer_id uuid,
  inventory_id uuid,
  business_date date
) on commit drop;

insert into dc_ctx values (
  '00000000-0000-0000-0000-000000002b01',
  '8ef5cb57-b7bc-41a1-8373-d63a86cd2bfa',
  gen_random_uuid(), gen_random_uuid(), gen_random_uuid(), '2026-09-20'
);

-- A temporary synthetic company/profile context is used so the calculation's
-- real auth/company boundary is exercised without writing to Danchrista data.
insert into public.companies(id,name,owner_id,timezone)
select company_id,'Phase2B Source Event Test',profile_id,'Africa/Lagos' from dc_ctx;
update public.profiles
set company_id=(select company_id from dc_ctx), role='owner', is_active=true
where id=(select profile_id from dc_ctx);

insert into public.customers(id,company_id,full_name,phone)
select customer_id,company_id,'Phase2B Customer','2349000000000' from dc_ctx;
insert into public.engineers(id,company_id,name)
select engineer_id,company_id,'Phase2B Engineer' from dc_ctx;
insert into public.inventory(id,company_id,item_name,selling_price,cost_price,quantity,minimum_stock,item_type,category)
select inventory_id,company_id,'Phase2B Test Part',20000,8000,100,1,'part','Phone Parts' from dc_ctx;
insert into public.devices(id,company_id,customer_id,brand,model,device_type)
select '00000000-0000-0000-0000-000000002d01',company_id,customer_id,'Test','A','phone' from dc_ctx;

-- A/B: genuine sale + corresponding cash/transfer financial events + stock COGS.
savepoint test_a_b;
insert into public.sales(id,company_id,total,subtotal,discount,payment_method,sale_date,staff_name)
select '00000000-0000-0000-0000-000000002a01',company_id,20000,20000,0,'Cash','2026-09-20 10:00:00+01','pgtap' from dc_ctx;
insert into public.sale_items(sale_id,company_id,inventory_id,quantity,unit_price,total_price)
select '00000000-0000-0000-0000-000000002a01',company_id,inventory_id,1,20000,20000 from dc_ctx;
insert into public.financial_transactions(company_id,direction,category,amount,payment_method,description,source_type,source_id,occurred_at)
select company_id,'in','sales',20000,'cash','A cash sale','sale','00000000-0000-0000-0000-000000002a01','2026-09-20 10:00:00+01' from dc_ctx;
insert into public.inventory_stock_movements(company_id,inventory_id,movement_type,quantity,unit_cost,reference_type,reference_id,created_at)
select company_id,inventory_id,'sale',-1,8000,'sale','00000000-0000-0000-0000-000000002a01','2026-09-20 10:00:00+01' from dc_ctx;
select is((select sales_revenue from public.calculate_daily_closing_position((select company_id from dc_ctx),'2026-09-20',100000)),20000::numeric,'A revenue comes from sale source event');
select is((select cash_received from public.calculate_daily_closing_position((select company_id from dc_ctx),'2026-09-20',100000)),20000::numeric,'A cash comes from financial source event');
select is((select cash_received from public.calculate_daily_closing_position((select company_id from dc_ctx),'2026-09-20',100000)),(select transfer_received+pos_received+other_received+20000), 'A payment buckets reconcile to cash received');
select is((select sale_cogs from public.calculate_daily_closing_position((select company_id from dc_ctx),'2026-09-20',100000)),8000::numeric,'A COGS uses historical movement cost');
rollback to savepoint test_a_b;

-- B: transfer sale does not enter physical cash.
savepoint test_b;
insert into public.sales(id,company_id,total,subtotal,discount,payment_method,sale_date)
select '00000000-0000-0000-0000-000000002a02',company_id,20000,20000,0,'Transfer','2026-09-20 11:00:00+01' from dc_ctx;
insert into public.sale_items(sale_id,company_id,inventory_id,quantity,unit_price,total_price)
select '00000000-0000-0000-0000-000000002a02',company_id,inventory_id,1,20000,20000 from dc_ctx;
insert into public.financial_transactions(company_id,direction,category,amount,payment_method,source_type,source_id,occurred_at)
select company_id,'in','sales',20000,'transfer','sale','00000000-0000-0000-0000-000000002a02','2026-09-20 11:00:00+01' from dc_ctx;
select is((select total_revenue from public.calculate_daily_closing_position((select company_id from dc_ctx),'2026-09-20',100000)),20000::numeric,'B transfer sale revenue');
select is((select transfer_received from public.calculate_daily_closing_position((select company_id from dc_ctx),'2026-09-20',100000)),20000::numeric,'B transfer bucket');
select is((select cash_inflows from public.calculate_daily_closing_position((select company_id from dc_ctx),'2026-09-20',100000)),0::numeric,'B transfer produces zero physical cash inflow');
rollback to savepoint test_b;

-- C/D: recognized repairs and authoritative customer debt/payment events.
savepoint test_c_d;
insert into public.repairs(id,company_id,device_id,issue,estimated_cost,final_cost,status,received_at,completed_at)
select '00000000-0000-0000-0000-000000002c01',company_id,'00000000-0000-0000-0000-000000002d01','test',30000,30000,'Completed','2026-09-20 12:00:00+01','2026-09-20 13:00:00+01' from dc_ctx;
insert into public.customer_debt_ledger(company_id,customer_id,source_type,source_id,debit,credit,created_at)
select company_id,customer_id,'repair','00000000-0000-0000-0000-000000002c01',30000,0,'2026-09-20 13:00:00+01' from dc_ctx;
insert into public.repair_payments(company_id,repair_id,amount,payment_method,payment_date,idempotency_key)
select company_id,'00000000-0000-0000-0000-000000002c01',10000,'Cash','2026-09-20 16:00:00+01',gen_random_uuid() from dc_ctx;
insert into public.customer_debt_ledger(company_id,customer_id,source_type,source_id,debit,credit,created_at)
select company_id,customer_id,'payment',gen_random_uuid(),0,10000,'2026-09-20 16:00:00+01' from dc_ctx;
insert into public.financial_transactions(company_id,direction,category,amount,payment_method,source_type,source_id,occurred_at)
select company_id,'in','repair_payment',10000,'cash','repair_payment','00000000-0000-0000-0000-000000002c01','2026-09-20 16:00:00+01' from dc_ctx;
select is((select repair_revenue from public.calculate_daily_closing_position((select company_id from dc_ctx),'2026-09-20',100000)),30000::numeric,'C repair revenue is recognized from completed repair');
select is((select cash_received from public.calculate_daily_closing_position((select company_id from dc_ctx),'2026-09-20',100000)),10000::numeric,'C partial repair payment is cash only');
select is((select customer_charges from public.calculate_daily_closing_position((select company_id from dc_ctx),'2026-09-20',100000)),30000::numeric,'C customer charge comes from debt ledger');
select is((select customer_payments from public.calculate_daily_closing_position((select company_id from dc_ctx),'2026-09-20',100000)),10000::numeric,'C customer payment comes from debt ledger');
select is((select customer_closing from public.calculate_daily_closing_position((select company_id from dc_ctx),'2026-09-20',100000)),20000::numeric,'C partial repair leaves receivable');
rollback to savepoint test_c_d;

-- E/F/G: linked invoices never enter standalone revenue; standalone invoice is revenue once.
savepoint test_e_f_g;
insert into public.sales(id,company_id,total,subtotal,discount,payment_method,sale_date)
select '00000000-0000-0000-0000-000000002e01',company_id,50000,50000,0,'Cash','2026-09-20 10:00:00+01' from dc_ctx;
insert into public.repairs(id,company_id,device_id,issue,estimated_cost,final_cost,status,received_at,completed_at)
select '00000000-0000-0000-0000-000000002e02',company_id,'00000000-0000-0000-0000-000000002d01','test',40000,40000,'Completed','2026-09-20 10:00:00+01','2026-09-20 11:00:00+01' from dc_ctx;
insert into public.invoices(id,company_id,invoice_number,customer_id,sale_id,status,subtotal,total,issued_at)
select '00000000-0000-0000-0000-000000002e03',company_id,'LINK-SALE',customer_id,'00000000-0000-0000-0000-000000002e01','issued',50000,50000,'2026-09-20 12:00:00+01' from dc_ctx;
insert into public.invoices(id,company_id,invoice_number,customer_id,repair_id,status,subtotal,total,issued_at)
select '00000000-0000-0000-0000-000000002e04',company_id,'LINK-REPAIR',customer_id,'00000000-0000-0000-0000-000000002e02','issued',40000,40000,'2026-09-20 12:30:00+01' from dc_ctx;
insert into public.invoices(id,company_id,invoice_number,customer_id,status,subtotal,total,issued_at)
select '00000000-0000-0000-0000-000000002e05',company_id,'STANDALONE',customer_id,'issued',5000,5000,'2026-09-20 13:00:00+01' from dc_ctx;
select is((select linked_invoice_revenue from public.calculate_daily_closing_position((select company_id from dc_ctx),'2026-09-20',100000)),0::numeric,'E/F linked invoice revenue is zero');
select is((select standalone_invoice_revenue from public.calculate_daily_closing_position((select company_id from dc_ctx),'2026-09-20',100000)),5000::numeric,'G standalone invoice revenue is recognized once');
select is((select total_revenue from public.calculate_daily_closing_position((select company_id from dc_ctx),'2026-09-20',100000)),95000::numeric,'E/F/G total revenue excludes linked invoice duplicates');
rollback to savepoint test_e_f_g;

-- H/I/J/L: purchase is not COGS; later historical-cost consumption is; returns reverse it.
savepoint test_h_i_j_l;
insert into public.inventory_purchases(id,company_id,supplier,total_amount,payment_method,purchase_date,amount_paid,payment_status)
select '00000000-0000-0000-0000-000000002h01',company_id,'Test Supplier',100000,'cash','2026-09-20 09:00:00+01',100000,'paid' from dc_ctx;
insert into public.inventory_purchase_items(company_id,purchase_id,inventory_id,quantity,unit_cost)
select company_id,'00000000-0000-0000-0000-000000002h01',inventory_id,10,10000 from dc_ctx;
insert into public.financial_transactions(company_id,direction,category,amount,payment_method,source_type,source_id,occurred_at)
select company_id,'out','part_purchase',100000,'cash','inventory_purchase','00000000-0000-0000-0000-000000002h01','2026-09-20 09:00:00+01' from dc_ctx;
insert into public.inventory_stock_movements(company_id,inventory_id,movement_type,quantity,unit_cost,reference_type,reference_id,created_at)
select company_id,inventory_id,'purchase',10,10000,'inventory_purchase','00000000-0000-0000-0000-000000002h01','2026-09-20 09:00:00+01' from dc_ctx;
select is((select operating_expenses from public.calculate_daily_closing_position((select company_id from dc_ctx),'2026-09-20',100000)),0::numeric,'H inventory purchase is not operating expense');
select is((select total_cogs from public.calculate_daily_closing_position((select company_id from dc_ctx),'2026-09-20',100000)),0::numeric,'H purchase alone is not COGS');
insert into public.inventory_stock_movements(company_id,inventory_id,movement_type,quantity,unit_cost,reference_type,created_at)
select company_id,inventory_id,'repair_use',-1,10000,'repair','2026-09-20 14:00:00+01' from dc_ctx;
select is((select repair_cogs from public.calculate_daily_closing_position((select company_id from dc_ctx),'2026-09-20',100000)),10000::numeric,'J repair COGS uses historical movement cost');
insert into public.inventory_stock_movements(company_id,inventory_id,movement_type,quantity,unit_cost,reference_type,created_at)
select company_id,inventory_id,'repair_return',1,10000,'repair','2026-09-20 15:00:00+01' from dc_ctx;
select is((select total_cogs from public.calculate_daily_closing_position((select company_id from dc_ctx),'2026-09-20',100000)),0::numeric,'L repair return reverses historical COGS');
rollback to savepoint test_h_i_j_l;

-- K: established engineer semantics, including payment_out as direct cost only.
savepoint test_k;
insert into public.engineer_transactions(company_id,engineer_id,transaction_type,description,debit,credit,transaction_date,created_at,payment_method)
select company_id,engineer_id,'opening_balance','opening',10000,0,'2026-09-20','2026-09-19 12:00:00+01',null from dc_ctx;
insert into public.engineer_transactions(company_id,engineer_id,transaction_type,description,debit,credit,transaction_date,created_at,payment_method)
select company_id,engineer_id,'parts_out','parts out',50000,0,'2026-09-20','2026-09-20 12:00:00+01',null from dc_ctx;
insert into public.engineer_transactions(company_id,engineer_id,transaction_type,description,debit,credit,transaction_date,created_at,payment_method)
select company_id,engineer_id,'parts_in','return',0,5000,'2026-09-20','2026-09-20 14:00:00+01',null from dc_ctx;
insert into public.engineer_transactions(company_id,engineer_id,transaction_type,description,debit,credit,transaction_date,created_at,payment_method)
select company_id,engineer_id,'payment_in','settlement',0,10000,'2026-09-20','2026-09-20 18:00:00+01','cash' from dc_ctx;
insert into public.engineer_transactions(company_id,engineer_id,transaction_type,description,debit,credit,transaction_date,created_at,payment_method)
select company_id,engineer_id,'payment_out','engineer cost',7000,0,'2026-09-20','2026-09-20 18:30:00+01','cash' from dc_ctx;
insert into public.financial_transactions(company_id,direction,category,amount,payment_method,source_type,occurred_at)
select company_id,'in','engineer_payment',10000,'cash','engineer_payment','2026-09-20 18:00:00+01' from dc_ctx;
insert into public.financial_transactions(company_id,direction,category,amount,payment_method,source_type,occurred_at)
select company_id,'out','engineer_payment',7000,'cash','engineer_payment','2026-09-20 18:30:00+01' from dc_ctx;
select is((select engineer_revenue from public.calculate_daily_closing_position((select company_id from dc_ctx),'2026-09-20',100000)),45000::numeric,'K engineer revenue equals parts out minus parts in');
select is((select engineer_closing from public.calculate_daily_closing_position((select company_id from dc_ctx),'2026-09-20',100000)),45000::numeric,'K engineer receivable excludes payment_out');
select is((select engineer_direct_cost from public.calculate_daily_closing_position((select company_id from dc_ctx),'2026-09-20',100000)),7000::numeric,'K payment_out is direct cost');
rollback to savepoint test_k;

-- M: all canonical payment buckets.
savepoint test_m;
insert into public.financial_transactions(company_id,direction,category,amount,payment_method,source_type,occurred_at)
select company_id,'in','other',1000,'cash','test','2026-09-20 20:00:00+01' from dc_ctx;
insert into public.financial_transactions(company_id,direction,category,amount,payment_method,source_type,occurred_at)
select company_id,'in','other',2000,'transfer','test','2026-09-20 20:01:00+01' from dc_ctx;
insert into public.financial_transactions(company_id,direction,category,amount,payment_method,source_type,occurred_at)
select company_id,'in','other',3000,'POS','test','2026-09-20 20:02:00+01' from dc_ctx;
insert into public.financial_transactions(company_id,direction,category,amount,payment_method,source_type,occurred_at)
select company_id,'in','other',4000,'other','test','2026-09-20 20:03:00+01' from dc_ctx;
select is((select cash_received from public.calculate_daily_closing_position((select company_id from dc_ctx),'2026-09-20',100000)),10000::numeric,'M mixed methods total inflow');
select is((select cash_received+transfer_received+pos_received+other_received from public.calculate_daily_closing_position((select company_id from dc_ctx),'2026-09-20',100000)),10000::numeric,'M buckets sum to total inflow');
rollback to savepoint test_m;

-- N: exact Lagos boundary. UTC 22:59:59 is Sep 6 23:59:59 Lagos;
-- UTC 23:00:00 is Sep 7 00:00:00 Lagos.
savepoint test_n;
insert into public.financial_transactions(company_id,direction,category,amount,payment_method,source_type,occurred_at)
select company_id,'in','other',111,'cash','boundary','2026-09-06 22:59:59+00' from dc_ctx;
insert into public.financial_transactions(company_id,direction,category,amount,payment_method,source_type,occurred_at)
select company_id,'in','other',222,'cash','boundary','2026-09-06 23:00:00+00' from dc_ctx;
select is((select cash_received from public.calculate_daily_closing_position((select company_id from dc_ctx),'2026-09-06',null)),111::numeric,'N 23:59:59 Lagos belongs to Sep 6');
select is((select cash_received from public.calculate_daily_closing_position((select company_id from dc_ctx),'2026-09-07',null)),222::numeric,'N 00:00:00 Lagos belongs to Sep 7');
rollback to savepoint test_n;

-- O: explicit opening is available; NULL remains unavailable and never becomes zero.
savepoint test_o;
select is((select opening_cash_available from public.calculate_daily_closing_position((select company_id from dc_ctx),'2026-09-20',100000)),true,'O explicit opening cash is available');
select is((select expected_closing_cash from public.calculate_daily_closing_position((select company_id from dc_ctx),'2026-09-20',null)),null::numeric,'O missing opening has no silent zero fallback');
rollback to savepoint test_o;

select * from finish();
rollback;
