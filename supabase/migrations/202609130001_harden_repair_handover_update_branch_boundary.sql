-- Production security hardening: keep repair handover updates inside
-- the caller's tenant, branch access, and repair-management permission boundary.
drop policy if exists repair_handovers_update on public.repair_handovers;

create policy repair_handovers_update
on public.repair_handovers
for update to authenticated
using (
  company_id = (select public.get_my_company_id())
  and (branch_id is null or (select public.user_has_branch_access(branch_id)))
  and (select public.has_permission('repairs.manage'))
)
with check (
  company_id = (select public.get_my_company_id())
  and (branch_id is null or (select public.user_has_branch_access(branch_id)))
  and (select public.has_permission('repairs.manage'))
);
