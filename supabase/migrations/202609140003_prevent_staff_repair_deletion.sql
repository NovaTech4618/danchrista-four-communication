-- Staff can record and update repair work, but repair history is not deleted by front-desk users.
-- Owner/branch-manager retain the staff-management permission and may delete when genuinely required.
drop policy if exists repairs_branch_delete on public.repairs;
create policy repairs_branch_delete on public.repairs for delete
using (company_id = public.get_my_company_id() and public.user_has_branch_access(branch_id) and public.has_permission('staff'));
