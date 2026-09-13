drop policy if exists quick_logs_select_company on public.quick_logs;
create policy quick_logs_authorized_select on public.quick_logs for select to authenticated using(company_id=public.get_my_company_id() and (public.has_permission('payments.manage') or public.has_permission('reports.view')));
