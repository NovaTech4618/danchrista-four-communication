-- Defense in depth: authoritative ledgers are written only through guarded RPCs.
-- Authenticated clients do not need direct DML privileges on these tables.

revoke insert, update, delete on table public.customer_debt_ledger from public, anon, authenticated;
revoke insert, update, delete on table public.engineer_transactions from public, anon, authenticated;
revoke insert, update, delete on table public.engineer_payments from public, anon, authenticated;
revoke insert, update, delete on table public.inventory_stock_movements from public, anon, authenticated;