-- Phase 1 audit: restore the operational permissions the locked Amezing business rules require for apprentices.
-- This does not grant owner-only exception powers or financial reporting access.

insert into public.role_permissions(role,permission,allowed) values
  ('apprentice','inventory.manage',true),
  ('apprentice','inventory.issue',true),
  ('apprentice','inventory.return',true),
  ('apprentice','engineers.work',true),
  ('apprentice','payments.manage',true)
on conflict (role,permission) do update set allowed=excluded.allowed;
