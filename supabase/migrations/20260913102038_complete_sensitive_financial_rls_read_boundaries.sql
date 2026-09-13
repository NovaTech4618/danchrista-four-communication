drop policy if exists financial_branch_select on public.financial_transactions;
create policy financial_authorized_select on public.financial_transactions for select to authenticated using(company_id=public.get_my_company_id() and (public.has_permission('reports.view') or public.has_permission('payments.manage')) and public.user_has_branch_access(branch_id));

drop policy if exists customer_debt_branch_select on public.customer_debt_ledger;
create policy customer_debt_authorized_select on public.customer_debt_ledger for select to authenticated using(company_id=public.get_my_company_id() and (public.has_permission('customers.manage') or public.has_permission('payments.manage') or public.has_permission('reports.view')) and public.user_has_branch_access(branch_id));

drop policy if exists repair_payments_branch_select on public.repair_payments;
create policy repair_payments_authorized_select on public.repair_payments for select to authenticated using(exists(select 1 from public.repairs r where r.id=repair_payments.repair_id and r.company_id=public.get_my_company_id() and public.user_has_branch_access(r.branch_id)) and (public.has_permission('payments.manage') or public.has_permission('reports.view')));

drop policy if exists invoice_payments_branch_select on public.invoice_payments;
create policy invoice_payments_authorized_select on public.invoice_payments for select to authenticated using(company_id=public.get_my_company_id() and (public.has_permission('payments.manage') or public.has_permission('reports.view')) and public.user_has_branch_access(branch_id));

drop policy if exists invoices_branch_select on public.invoices;
create policy invoices_authorized_select on public.invoices for select to authenticated using(company_id=public.get_my_company_id() and (public.has_permission('payments.manage') or public.has_permission('reports.view')) and public.user_has_branch_access(branch_id));

drop policy if exists sales_branch_select on public.sales;
create policy sales_authorized_select on public.sales for select to authenticated using(company_id=public.get_my_company_id() and (public.has_permission('sales.manage') or public.has_permission('reports.view')) and public.user_has_branch_access(branch_id));

drop policy if exists sale_items_branch_select on public.sale_items;
create policy sale_items_authorized_select on public.sale_items for select to authenticated using(exists(select 1 from public.sales s where s.id=sale_items.sale_id and s.company_id=public.get_my_company_id() and public.user_has_branch_access(s.branch_id)) and (public.has_permission('sales.manage') or public.has_permission('reports.view')));

drop policy if exists parts_credits_branch_select on public.parts_credits;
create policy parts_credits_authorized_select on public.parts_credits for select to authenticated using(company_id=public.get_my_company_id() and (public.has_permission('engineers.view') or public.has_permission('engineers.manage') or public.has_permission('inventory.manage')) and exists(select 1 from public.inventory i where i.id=parts_credits.inventory_id and i.company_id=parts_credits.company_id and (i.branch_id is null or public.user_has_branch_access(i.branch_id))));

drop policy if exists credit_payments_branch_select on public.credit_payments;
create policy credit_payments_authorized_select on public.credit_payments for select to authenticated using(company_id=public.get_my_company_id() and (public.has_permission('engineers.view') or public.has_permission('engineers.manage') or public.has_permission('inventory.manage')) and exists(select 1 from public.parts_credits pc join public.inventory i on i.id=pc.inventory_id where pc.id=credit_payments.credit_id and pc.company_id=credit_payments.company_id and i.company_id=pc.company_id and (i.branch_id is null or public.user_has_branch_access(i.branch_id))));
