-- NOVATECH Repair Suite database regression checks.
-- Read-only: safe to run against staging or production with psql.
-- The script fails fast when a critical security/integrity invariant regresses.

DO $$
DECLARE v_count integer;
BEGIN
  SELECT count(*) INTO v_count FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relkind='r' AND NOT c.relrowsecurity;
  IF v_count<>0 THEN RAISE EXCEPTION 'RLS regression: % public tables have RLS disabled',v_count; END IF;
END $$;

DO $reg$
DECLARE v_table text;
BEGIN
  FOREACH v_table IN ARRAY ARRAY['financial_transactions','customer_debt_ledger','engineer_transactions','engineer_payments','invoice_payments','repair_payments','sales','sale_items','inventory_stock_movements','daily_closings','daily_closing_payment_methods'] LOOP
    IF EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname='public' AND tablename=v_table
        AND ('anon'=ANY(roles) OR 'public'=ANY(roles))
        AND cmd IN ('INSERT','UPDATE','DELETE','ALL')
        AND (
          (cmd = 'INSERT' AND coalesce(with_check,'') <> 'false')
          OR (cmd = 'UPDATE' AND (coalesce(with_check,'') <> 'false' OR coalesce(qual,'') <> 'false'))
          OR (cmd = 'DELETE' AND coalesce(qual,'') <> 'false')
          OR (cmd = 'ALL' AND (coalesce(with_check,'') <> 'false' OR coalesce(qual,'') <> 'false'))
        )
    ) THEN RAISE EXCEPTION 'RLS regression: % exposes a permissive public/anonymous write policy',v_table;
    END IF;
  END LOOP;
END $reg$;

DO $$
DECLARE v_count integer;
BEGIN
  SELECT count(*) INTO v_count FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND p.prosecdef AND has_function_privilege('anon',p.oid,'EXECUTE');
  IF v_count<>0 THEN RAISE EXCEPTION 'RPC regression: % SECURITY DEFINER functions executable by anon',v_count; END IF;
END $$;

DO $$
DECLARE v_view text; v_options text[];
BEGIN
  FOREACH v_view IN ARRAY ARRAY['repair_balance_view','repair_invoice_view','sale_receipt_view'] LOOP
    SELECT c.reloptions INTO v_options FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relname=v_view AND c.relkind='v';
    IF v_options IS NULL OR NOT ('security_invoker=true'=ANY(v_options)) THEN RAISE EXCEPTION 'View security regression: public.% must use security_invoker=true',v_view; END IF;
    IF has_table_privilege('anon','public.'||v_view,'SELECT') THEN RAISE EXCEPTION 'View security regression: anon can SELECT public.%',v_view; END IF;
  END LOOP;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger t JOIN pg_class c ON c.oid=t.tgrelid JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relname='profiles' AND t.tgname='trg_prevent_self_role_escalation' AND NOT t.tgisinternal) THEN
    RAISE EXCEPTION 'Role escalation regression: profile authorization trigger is missing';
  END IF;
  IF NOT has_function_privilege('authenticated','public.update_staff_role(uuid,text)','EXECUTE') THEN RAISE EXCEPTION 'update_staff_role is not executable by authenticated users'; END IF;
  IF has_function_privilege('anon','public.update_staff_role(uuid,text)','EXECUTE') THEN RAISE EXCEPTION 'update_staff_role must not be executable by anon'; END IF;
  IF has_function_privilege('authenticated','public.write_audit_log(text,text,uuid,jsonb,jsonb,jsonb)','EXECUTE') THEN RAISE EXCEPTION 'write_audit_log must not be directly executable by authenticated users'; END IF;
END $$;

-- Authoritative workflow tables must not expose an authenticated INSERT/UPDATE/DELETE policy.
DO $$
DECLARE v_table text; v_policy text;
BEGIN
  FOREACH v_table IN ARRAY ARRAY['repair_parts_usage','repair_assignments','invoices','invoice_items','customer_debt_ledger'] LOOP
    IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename=v_table AND roles @> ARRAY['authenticated']::name[] AND cmd IN ('INSERT','UPDATE','DELETE') AND coalesce(with_check,'') <> 'false' AND coalesce(qual,'') <> 'false') THEN
      RAISE EXCEPTION 'Direct-write regression: % still has a permissive authenticated write policy',v_table;
    END IF;
  END LOOP;
END $$;

DO $$
BEGIN
  IF NOT has_function_privilege('authenticated','public.record_repair_part_usage(uuid,uuid,integer,text)','EXECUTE') THEN RAISE EXCEPTION 'record_repair_part_usage is not executable by authenticated users'; END IF;
  IF has_function_privilege('anon','public.record_repair_part_usage(uuid,uuid,integer,text)','EXECUTE') THEN RAISE EXCEPTION 'record_repair_part_usage must not be executable by anon'; END IF;
  IF NOT has_function_privilege('authenticated','public.return_repair_part_usage(uuid,integer,text)','EXECUTE') THEN RAISE EXCEPTION 'return_repair_part_usage is not executable by authenticated users'; END IF;
  IF has_function_privilege('anon','public.return_repair_part_usage(uuid,integer,text)','EXECUTE') THEN RAISE EXCEPTION 'return_repair_part_usage must not be executable by anon'; END IF;
END $$;

DO $$
BEGIN
  IF NOT has_function_privilege('authenticated','public.engineer_parts_out(uuid,uuid,integer,numeric,text)','EXECUTE') OR has_function_privilege('anon','public.engineer_parts_out(uuid,uuid,integer,numeric,text)','EXECUTE') THEN RAISE EXCEPTION 'Engineer parts-out RPC execute boundary regression'; END IF;
  IF NOT has_function_privilege('authenticated','public.engineer_parts_in(uuid,uuid,integer,numeric,text)','EXECUTE') OR has_function_privilege('anon','public.engineer_parts_in(uuid,uuid,integer,numeric,text)','EXECUTE') THEN RAISE EXCEPTION 'Engineer parts-in RPC execute boundary regression'; END IF;
  IF NOT has_function_privilege('authenticated','public.engineer_payment_in(uuid,numeric,text,text)','EXECUTE') OR has_function_privilege('anon','public.engineer_payment_in(uuid,numeric,text,text)','EXECUTE') THEN RAISE EXCEPTION 'Engineer payment-in RPC execute boundary regression'; END IF;
  IF NOT has_function_privilege('authenticated','public.engineer_payment_out(uuid,numeric,text,text)','EXECUTE') OR has_function_privilege('anon','public.engineer_payment_out(uuid,numeric,text,text)','EXECUTE') THEN RAISE EXCEPTION 'Engineer payment-out RPC execute boundary regression'; END IF;
  IF NOT has_function_privilege('authenticated','public.engineer_opening_balance(uuid,numeric,text)','EXECUTE') OR has_function_privilege('anon','public.engineer_opening_balance(uuid,numeric,text)','EXECUTE') THEN RAISE EXCEPTION 'Engineer opening-balance RPC execute boundary regression'; END IF;
END $$;

DO $$
BEGIN
  IF NOT has_function_privilege('authenticated','public.create_invoice(text,uuid,uuid,uuid,numeric,numeric,numeric,timestamptz,text)','EXECUTE') OR has_function_privilege('anon','public.create_invoice(text,uuid,uuid,uuid,numeric,numeric,numeric,timestamptz,text)','EXECUTE') THEN RAISE EXCEPTION 'create_invoice execute boundary regression'; END IF;
  IF NOT has_function_privilege('authenticated','public.create_invoice_with_item(text,uuid,uuid,uuid,numeric,numeric,numeric,timestamptz,text,text,numeric,numeric)','EXECUTE') OR has_function_privilege('anon','public.create_invoice_with_item(text,uuid,uuid,uuid,numeric,numeric,numeric,timestamptz,text,text,numeric,numeric)','EXECUTE') THEN RAISE EXCEPTION 'create_invoice_with_item execute boundary regression'; END IF;
  IF NOT has_function_privilege('authenticated','public.add_invoice_item(uuid,text,numeric,numeric)','EXECUTE') OR has_function_privilege('anon','public.add_invoice_item(uuid,text,numeric,numeric)','EXECUTE') THEN RAISE EXCEPTION 'add_invoice_item execute boundary regression'; END IF;
  IF NOT has_function_privilege('authenticated','public.record_invoice_payment(uuid,numeric,text,text,uuid)','EXECUTE') OR has_function_privilege('anon','public.record_invoice_payment(uuid,numeric,text,text,uuid)','EXECUTE') THEN RAISE EXCEPTION 'record_invoice_payment execute boundary regression'; END IF;
END $$;

DO $$
BEGIN
  IF NOT has_function_privilege('authenticated','public.accept_staff_invitation()','EXECUTE') OR has_function_privilege('anon','public.accept_staff_invitation()','EXECUTE') THEN RAISE EXCEPTION 'accept_staff_invitation execute boundary regression'; END IF;
  IF NOT has_function_privilege('authenticated','public.global_search(text,integer)','EXECUTE') OR has_function_privilege('anon','public.global_search(text,integer)','EXECUTE') THEN RAISE EXCEPTION 'global_search execute boundary regression'; END IF;
  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND p.proname='global_search' AND p.prosecdef) THEN RAISE EXCEPTION 'global_search must remain SECURITY INVOKER'; END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='branches' AND policyname='branches_insert' AND with_check LIKE '%is_manager_or_owner%') THEN RAISE EXCEPTION 'Branch-management policy regression: branches_insert missing'; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='branches' AND policyname='branches_delete' AND qual LIKE '%is_company_owner%') THEN RAISE EXCEPTION 'Branch-management policy regression: branches_delete missing owner guard'; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='user_branches' AND policyname='user_branches_owner_insert' AND with_check LIKE '%is_company_owner%') THEN RAISE EXCEPTION 'Branch-membership regression: owner insert policy missing'; END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname='customers' AND relrowsecurity) THEN RAISE EXCEPTION 'Search boundary regression: customers RLS missing'; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname='devices' AND relrowsecurity) THEN RAISE EXCEPTION 'Search boundary regression: devices RLS missing'; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname='repairs' AND relrowsecurity) THEN RAISE EXCEPTION 'Search boundary regression: repairs RLS missing'; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname='inventory' AND relrowsecurity) THEN RAISE EXCEPTION 'Search boundary regression: inventory RLS missing'; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname='invoices' AND relrowsecurity) THEN RAISE EXCEPTION 'Search boundary regression: invoices RLS missing'; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname='inventory_purchases' AND relrowsecurity) THEN RAISE EXCEPTION 'Search boundary regression: inventory_purchases RLS missing'; END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='financial_transactions_amount_positive') THEN RAISE EXCEPTION 'Missing financial_transactions_amount_positive constraint'; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='invoice_payments_amount_positive') THEN RAISE EXCEPTION 'Missing invoice_payments_amount_positive constraint'; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='sales_amounts_nonnegative') THEN RAISE EXCEPTION 'Missing sales_amounts_nonnegative constraint'; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='sale_items_unit_price_nonnegative') THEN RAISE EXCEPTION 'Missing sale_items_unit_price_nonnegative constraint'; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='sale_items_total_price_nonnegative') THEN RAISE EXCEPTION 'Missing sale_items_total_price_nonnegative constraint'; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='customer_debt_one_sided_entry') THEN RAISE EXCEPTION 'Missing customer_debt_one_sided_entry constraint'; END IF;
END $$;

DO $invreg$
DECLARE v_count integer;
BEGIN
  SELECT count(*) INTO v_count FROM pg_policies WHERE schemaname='public' AND tablename='inventory_stock_movements' AND policyname IN ('inventory_stock_movements_no_direct_insert','inventory_stock_movements_no_update','inventory_stock_movements_no_delete');
  IF v_count<>3 THEN RAISE EXCEPTION 'Inventory ledger regression: expected 3 direct-write blocking policies, found %',v_count; END IF;
END $invreg$;

-- Authoritative ledgers must not grant direct table writes to authenticated clients.
DO $reg$
DECLARE v_table text;
BEGIN
  FOREACH v_table IN ARRAY ARRAY['customer_debt_ledger','engineer_transactions','engineer_payments','inventory_stock_movements'] LOOP
    IF has_table_privilege('authenticated','public.'||v_table,'INSERT')
       OR has_table_privilege('authenticated','public.'||v_table,'UPDATE')
       OR has_table_privilege('authenticated','public.'||v_table,'DELETE') THEN
      RAISE EXCEPTION 'Ledger table % still grants direct authenticated DML privileges',v_table;
    END IF;
  END LOOP;
END $reg$;

DO $$
BEGIN
  IF NOT has_function_privilege('authenticated','public.record_inventory_movement(uuid,text,integer,numeric,text,uuid,text)','EXECUTE') THEN RAISE EXCEPTION 'record_inventory_movement is not executable by authenticated users'; END IF;
  IF has_function_privilege('anon','public.record_inventory_movement(uuid,text,integer,numeric,text,uuid,text)','EXECUTE') THEN RAISE EXCEPTION 'record_inventory_movement must not be executable by anon'; END IF;
  IF has_function_privilege('authenticated','public.record_customer_debt(uuid,text,uuid,numeric,numeric,uuid,uuid,text)','EXECUTE') THEN RAISE EXCEPTION 'record_customer_debt must not be directly executable by authenticated users'; END IF;
  IF has_function_privilege('anon','public.record_customer_debt(uuid,text,uuid,numeric,numeric,uuid,uuid,text)','EXECUTE') THEN RAISE EXCEPTION 'record_customer_debt must not be executable by anon'; END IF;
  IF NOT has_function_privilege('authenticated','public.change_repair_status(uuid,text,text)','EXECUTE') THEN RAISE EXCEPTION 'change_repair_status is not executable by authenticated users'; END IF;
  IF has_function_privilege('anon','public.change_repair_status(uuid,text,text)','EXECUTE') THEN RAISE EXCEPTION 'change_repair_status must not be executable by anon'; END IF;
END $$;

SELECT 'negative_financial_transactions' AS check_name,count(*) AS failures FROM public.financial_transactions WHERE amount<=0
UNION ALL SELECT 'nonpositive_invoice_payments',count(*) FROM public.invoice_payments WHERE amount<=0
UNION ALL SELECT 'negative_sale_item_prices',count(*) FROM public.sale_items WHERE unit_price<0 OR total_price<0
UNION ALL SELECT 'negative_sales_amounts',count(*) FROM public.sales WHERE coalesce(subtotal,0)<0 OR coalesce(discount,0)<0 OR coalesce(total,0)<0
UNION ALL SELECT 'invalid_debt_entries',count(*) FROM public.customer_debt_ledger WHERE NOT ((debit>0 AND coalesce(credit,0)=0) OR (credit>0 AND coalesce(debit,0)=0));

SELECT 'repair_payment_deposit_mismatch' AS check_name,count(*) AS failures
FROM public.repairs r LEFT JOIN (SELECT repair_id,coalesce(sum(amount),0) AS paid FROM public.repair_payments GROUP BY repair_id) p ON p.repair_id=r.id
WHERE round(coalesce(r.deposit,0),2)<>round(coalesce(p.paid,0),2);