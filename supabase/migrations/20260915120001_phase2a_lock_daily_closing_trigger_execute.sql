-- Phase 2A security hardening: trigger-only function must not be callable through the API.
revoke execute on function public.audit_daily_closing_change() from public, anon, authenticated;
