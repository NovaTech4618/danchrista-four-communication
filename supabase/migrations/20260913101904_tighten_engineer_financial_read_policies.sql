drop policy if exists engineer_payments_company_select on public.engineer_payments;
create policy engineer_payments_authorized_select on public.engineer_payments for select to authenticated using(company_id=public.get_my_company_id() and (public.has_permission('engineers.view') or public.has_permission('engineers.manage')));

drop policy if exists engineer_part_ledger_branch_select on public.engineer_part_ledger;
create policy engineer_part_ledger_authorized_select on public.engineer_part_ledger for select to authenticated using(company_id=public.get_my_company_id() and (public.has_permission('engineers.view') or public.has_permission('engineers.manage')) and public.user_has_branch_access(branch_id));

drop policy if exists engineer_parts_in_branch_select on public.engineer_parts_in;
create policy engineer_parts_in_authorized_select on public.engineer_parts_in for select to authenticated using(company_id=public.get_my_company_id() and (public.has_permission('engineers.view') or public.has_permission('engineers.manage')) and exists(select 1 from public.inventory i where i.id=engineer_parts_in.inventory_id and i.company_id=engineer_parts_in.company_id and (i.branch_id is null or public.user_has_branch_access(i.branch_id))));

drop policy if exists engineer_parts_out_branch_select on public.engineer_parts_out;
create policy engineer_parts_out_authorized_select on public.engineer_parts_out for select to authenticated using(company_id=public.get_my_company_id() and (public.has_permission('engineers.view') or public.has_permission('engineers.manage')) and exists(select 1 from public.inventory i where i.id=engineer_parts_out.inventory_id and i.company_id=engineer_parts_out.company_id and (i.branch_id is null or public.user_has_branch_access(i.branch_id))));
