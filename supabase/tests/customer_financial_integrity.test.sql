-- Phase 1 customer receivable integrity checks.
-- These tests are schema/invariant checks. The full A-F transactional scenarios are
-- also exercised against Supabase with BEGIN/ROLLBACK so production data is untouched.

BEGIN;
SELECT plan(10);

SELECT has_column('public','repair_payments','idempotency_key','repair payments have an idempotency key');
SELECT has_column('public','invoice_payments','idempotency_key','invoice payments have an idempotency key');
SELECT has_view('public','repair_balance_view','repair balance projection exists');
SELECT has_view('public','invoice_balance_view','invoice balance projection exists');
SELECT has_view('public','customer_financial_reconciliation','customer reconciliation projection exists');
SELECT has_function('public','record_repair_payment(uuid,numeric,text,timestamp with time zone,text,uuid)','repair payment RPC accepts idempotency key');
SELECT has_function('public','record_invoice_payment(uuid,numeric,text,text,uuid)','invoice payment RPC accepts idempotency key');
SELECT has_function('public','create_repair_invoice(uuid,text,timestamp with time zone,text,text,numeric,numeric)','repair invoice creation is explicit');
SELECT has_function('public','get_profit_summary(timestamp with time zone,timestamp with time zone)','profit summary exists');
SELECT has_function('public','get_business_report(timestamp with time zone,timestamp with time zone)','business report exists');

SELECT * FROM finish();
ROLLBACK;
