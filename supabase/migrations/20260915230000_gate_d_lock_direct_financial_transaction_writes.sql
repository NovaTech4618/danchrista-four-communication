-- Gate D: financial_transactions is an authoritative ledger populated by proven
-- business workflows. The client must not write ledger rows directly.

DROP POLICY IF EXISTS financial_branch_write ON public.financial_transactions;
DROP POLICY IF EXISTS financial_branch_update ON public.financial_transactions;

CREATE POLICY financial_transactions_no_direct_insert
  ON public.financial_transactions
  FOR INSERT
  TO authenticated
  WITH CHECK (false);

CREATE POLICY financial_transactions_no_direct_update
  ON public.financial_transactions
  FOR UPDATE
  TO authenticated
  USING (false)
  WITH CHECK (false);

REVOKE INSERT, UPDATE, DELETE ON TABLE public.financial_transactions FROM anon, authenticated;
GRANT SELECT ON TABLE public.financial_transactions TO authenticated;
