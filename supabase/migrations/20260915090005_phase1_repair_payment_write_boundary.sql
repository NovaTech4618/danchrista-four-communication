DROP POLICY IF EXISTS repair_payments_branch_insert ON public.repair_payments;
REVOKE INSERT, UPDATE, DELETE ON public.repair_payments FROM authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.invoice_payments FROM authenticated;
