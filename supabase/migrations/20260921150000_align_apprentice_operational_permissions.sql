BEGIN;

-- Amezing Limited: apprentices must be able to perform normal shop operations.
-- Financial reporting, engineer money administration, price overrides, staff
-- management, settings, and other owner-only controls remain restricted.
INSERT INTO public.role_permissions(role, permission, allowed) VALUES
  ('apprentice','inventory.manage',true),
  ('apprentice','inventory.issue',true),
  ('apprentice','inventory.return',true),
  ('apprentice','engineers.work',true),
  ('apprentice','daily_closing.view',true),
  ('apprentice','daily_closing.reconcile',true),
  ('apprentice','daily_closing.close',true)
ON CONFLICT (role, permission) DO UPDATE
SET allowed = EXCLUDED.allowed;

COMMIT;
