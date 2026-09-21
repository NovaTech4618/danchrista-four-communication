-- Section 14: real Boss approval for below-floor sales.
create table if not exists public.sale_price_approval_requests (
 id uuid primary key default gen_random_uuid(),
 company_id uuid not null references public.companies(id),
 branch_id uuid references public.branches(id),
 requested_by uuid not null references public.profiles(id),
 approved_by uuid references public.profiles(id),
 status text not null default 'pending' check(status in ('pending','approved','rejected','used')),
 customer_id uuid references public.customers(id),
 payment_method text not null,
 discount numeric(14,2) not null default 0,
 staff_name text,
 notes text,
 items jsonb not null,
 request_reason text,
 decision_note text,
 requested_at timestamptz not null default now(),
 decided_at timestamptz,
 used_at timestamptz,
 sale_id uuid references public.sales(id)
);
create index if not exists sale_price_approval_company_status_idx on public.sale_price_approval_requests(company_id,status,requested_at desc);
alter table public.sale_price_approval_requests enable row level security;
drop policy if exists sale_price_approval_select on public.sale_price_approval_requests;
create policy sale_price_approval_select on public.sale_price_approval_requests for select to authenticated using(company_id=public.get_my_company_id() and (requested_by=auth.uid() or public.has_permission('sales.price_override')));
revoke all on public.sale_price_approval_requests from public,authenticated,anon;

-- The live implementation of these RPCs is the source of truth for the
-- approval workflow: request -> owner approve/reject -> sale execution.
-- Execute grants are deliberately limited to authenticated users.
revoke all on function public.request_sale_price_override(uuid,text,numeric,text,text,jsonb,text) from public,anon,authenticated;
revoke all on function public.list_sale_price_override_requests() from public,anon,authenticated;
revoke all on function public.approve_sale_price_override(uuid,text) from public,anon,authenticated;
revoke all on function public.reject_sale_price_override(uuid,text) from public,anon,authenticated;
grant execute on function public.request_sale_price_override(uuid,text,numeric,text,text,jsonb,text) to authenticated;
grant execute on function public.list_sale_price_override_requests() to authenticated;
grant execute on function public.approve_sale_price_override(uuid,text) to authenticated;
grant execute on function public.reject_sale_price_override(uuid,text) to authenticated;

delete from public.role_permissions where permission='sales.price_override';
insert into public.role_permissions(role,permission,allowed) values('owner','sales.price_override',true)
on conflict(role,permission) do update set allowed=excluded.allowed;