-- Lock customer debt ledger helper behind internal SECURITY DEFINER workflows.
-- The app does not call record_customer_debt() directly. Exposing it to authenticated
-- users would allow direct creation of ledger entries outside the authoritative workflows.

revoke execute on function public.record_customer_debt(uuid,text,uuid,numeric,numeric,uuid,uuid,text)
from public, anon, authenticated;