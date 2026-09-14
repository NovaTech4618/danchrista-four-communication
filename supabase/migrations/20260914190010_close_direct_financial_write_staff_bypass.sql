-- Manual financial ledger entries are owner/branch-manager operations.
-- Staff payment-entry workflows use protected RPCs/triggers instead of direct ledger writes.

drop policy if exists financial_branch_write on public.financial_transactions;
create policy financial_branch_write on public.financial_transactions for insert
with check (
  company_id = public.get_my_company_id()
  and public.is_manager_or_owner()
  and public.user_has_branch_access(branch_id)
);

drop policy if exists financial_branch_update on public.financial_transactions;
create policy financial_branch_update on public.financial_transactions for update
using (
  company_id = public.get_my_company_id()
  and public.is_manager_or_owner()
  and public.user_has_branch_access(branch_id)
)
with check (
  company_id = public.get_my_company_id()
  and public.is_manager_or_owner()
  and public.user_has_branch_access(branch_id)
);
