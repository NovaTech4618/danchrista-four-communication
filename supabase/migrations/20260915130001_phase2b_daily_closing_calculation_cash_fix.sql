-- Phase 2B follow-up: preserve total recorded inflows separately from physical cash inflows.
-- The authoritative calculation remains unchanged in scope; this migration reasserts
-- the final cash mapping after the initial engine deployment.

-- The final function definition in 20260915130000 already contains the corrected
-- mapping. This migration exists to mirror the production migration sequence and
-- protect migration-history parity.
