-- Final SECURITY DEFINER + direct RLS boundary audit.
-- Keeps the public company showcase intentionally anonymous while closing
-- direct client access to internal trigger/automation functions.

DROP POLICY IF EXISTS companies_owner_update ON public.companies;
CREATE POLICY companies_owner_update
  ON public.companies
  FOR UPDATE
  TO authenticated
  USING (id = public.get_my_company_id() AND public.is_company_owner())
  WITH CHECK (id = public.get_my_company_id() AND public.is_company_owner());

DROP POLICY IF EXISTS whatsapp_message_log_insert ON public.whatsapp_message_log;
CREATE POLICY whatsapp_message_log_insert
  ON public.whatsapp_message_log
  FOR INSERT
  TO authenticated
  WITH CHECK (company_id = public.get_my_company_id() AND public.is_company_owner());

DROP POLICY IF EXISTS whatsapp_message_log_select ON public.whatsapp_message_log;
CREATE POLICY whatsapp_message_log_select
  ON public.whatsapp_message_log
  FOR SELECT
  TO authenticated
  USING (company_id = public.get_my_company_id() AND public.is_company_owner());

DROP POLICY IF EXISTS whatsapp_reminders_all ON public.whatsapp_reminders;
CREATE POLICY whatsapp_reminders_all
  ON public.whatsapp_reminders
  FOR ALL
  TO authenticated
  USING (company_id = public.get_my_company_id() AND public.is_company_owner())
  WITH CHECK (company_id = public.get_my_company_id() AND public.is_company_owner());

DROP POLICY IF EXISTS whatsapp_settings_all ON public.whatsapp_settings;
CREATE POLICY whatsapp_settings_all
  ON public.whatsapp_settings
  FOR ALL
  TO authenticated
  USING (company_id = public.get_my_company_id() AND public.is_company_owner())
  WITH CHECK (company_id = public.get_my_company_id() AND public.is_company_owner());

DROP POLICY IF EXISTS whatsapp_templates_all ON public.whatsapp_templates;
CREATE POLICY whatsapp_templates_all
  ON public.whatsapp_templates
  FOR ALL
  TO authenticated
  USING (company_id = public.get_my_company_id() AND public.is_company_owner())
  WITH CHECK (company_id = public.get_my_company_id() AND public.is_company_owner());

REVOKE ALL ON FUNCTION public.record_repair_status_history() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.prevent_direct_inventory_quantity_change() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.prevent_self_role_escalation() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.prevent_deletion_of_repairs_with_history() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.protect_main_branch() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.sync_credit_payment_to_financial_ledger() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.sync_engineer_payment_to_financial_ledger() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.sync_initial_repair_deposit() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.sync_invoice_payment_to_financial_ledger() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.sync_repair_payment_to_financial_ledger() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.sync_sale_to_financial_ledger() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.trg_whatsapp_on_invoice_issued() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.trg_whatsapp_on_repair_status_change() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.update_parts_credit_status() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.validate_sale_financial_values() FROM PUBLIC, anon, authenticated;

ALTER FUNCTION public.change_repair_status(uuid, text, text) SET search_path = public;
ALTER FUNCTION public.complete_repair(uuid) SET search_path = public;
ALTER FUNCTION public.record_repair_part_usage(uuid, uuid, integer, text) SET search_path = public;
ALTER FUNCTION public.return_repair_part_usage(uuid, integer, text) SET search_path = public;
ALTER FUNCTION public.record_repair_status_history() SET search_path = public;

REVOKE EXECUTE ON FUNCTION public.get_public_company_showcase(text) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_company_showcase(text) TO anon;
