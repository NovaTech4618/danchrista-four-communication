-- Phase 4: keep apprentice access operational, not owner-financial.
-- The UI role map and database permissions must agree. Apprentices can sell,
-- repair, view stock, issue/return engineer parts and record engineer work,
-- but owner-only financial controls remain unavailable.
update public.role_permissions
set allowed = false
where role = 'apprentice'
  and permission in (
    'daily_closing.view',
    'daily_closing.reconcile',
    'daily_closing.close',
    'payments.manage',
    'inventory.manage'
  );

-- Explicitly keep the operational permissions needed by an apprentice.
insert into public.role_permissions(role, permission, allowed)
values
  ('apprentice','inventory.view',true),
  ('apprentice','inventory.issue',true),
  ('apprentice','inventory.return',true),
  ('apprentice','sales.manage',true),
  ('apprentice','repairs.manage',true),
  ('apprentice','engineers.work',true),
  ('apprentice','customers.manage',true)
on conflict (role, permission) do update
set allowed = excluded.allowed;
