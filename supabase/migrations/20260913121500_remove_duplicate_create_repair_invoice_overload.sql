-- Keep a single create_repair_invoice signature.
-- The hardened 7-argument function has defaults for the optional fields, so
-- existing 4-argument callers continue to work without an ambiguous overload.
DROP FUNCTION IF EXISTS public.create_repair_invoice(uuid, text, timestamptz, text);
