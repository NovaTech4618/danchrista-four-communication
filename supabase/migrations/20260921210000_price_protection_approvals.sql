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


create or replace function public.request_sale_price_override(p_customer_id uuid,p_payment_method text,p_discount numeric,p_staff_name text,p_notes text,p_items jsonb,p_reason text default null)
returns uuid language plpgsql security definer set search_path='public' as $
declare c uuid; u uuid:=auth.uid(); b uuid; i jsonb; iid uuid; q int; price numeric; floor numeric; ib uuid; below boolean:=false; rid uuid;
begin
 if u is null or not public.has_permission('sales.manage') then raise exception 'Permission denied'; end if;
 select company_id into c from public.profiles where id=u and is_active=true;
 if c is null then raise exception 'Company not found'; end if;
 if lower(trim(coalesce(p_payment_method,''))) not in ('cash','transfer','pos','other') then raise exception 'Invalid payment method'; end if;
 if jsonb_array_length(coalesce(p_items,'[]'::jsonb))=0 then raise exception 'Sale must contain at least one item'; end if;
 if coalesce(p_discount,0)<0 then raise exception 'Discount cannot be negative'; end if;
 for i in select * from jsonb_array_elements(p_items) loop
  iid:=(i->>'inventory_id')::uuid; q:=(i->>'quantity')::int; price:=(i->>'unit_price')::numeric;
  select quantity,branch_id,minimum_selling_price into q,ib,floor from public.inventory where id=iid and company_id=c for update;
  if not found then raise exception 'Inventory item not found'; end if;
  if (i->>'quantity')::int<=0 or price<0 or q<(i->>'quantity')::int then raise exception 'Invalid quantity or insufficient stock'; end if;
  if ib is not null and not public.user_has_branch_access(ib) then raise exception 'Branch access denied'; end if;
  if price<coalesce(floor,0) then below:=true; end if;
  if b is null then b:=ib; elsif ib is distinct from b then raise exception 'A sale cannot combine stock from different branches'; end if;
 end loop;
 if not below then raise exception 'This sale does not need price approval'; end if;
 insert into public.sale_price_approval_requests(company_id,branch_id,requested_by,customer_id,payment_method,discount,staff_name,notes,items,request_reason)
 values(c,b,u,p_customer_id,lower(trim(p_payment_method)),coalesce(p_discount,0),p_staff_name,p_notes,p_items,p_reason) returning id into rid;
 perform public.write_audit_log('sale.price_override_requested','sale_price_approval_request',rid,null,null,jsonb_build_object('requested_by',u,'reason',p_reason));
 return rid;
end; $;

create or replace function public.list_sale_price_override_requests()
returns setof public.sale_price_approval_requests language plpgsql security definer set search_path='public' as $
begin
 if auth.uid() is null then raise exception 'Not authenticated'; end if;
 if public.has_permission('sales.price_override') then
  return query select * from public.sale_price_approval_requests where company_id=public.get_my_company_id() and status in ('pending','approved') order by requested_at desc;
 else
  return query select * from public.sale_price_approval_requests where company_id=public.get_my_company_id() and requested_by=auth.uid() order by requested_at desc;
 end if;
end; $;

create or replace function public.approve_sale_price_override(p_request_id uuid,p_decision_note text default null)
returns uuid language plpgsql security definer set search_path='public' as $
declare r public.sale_price_approval_requests%rowtype; sale_id uuid; approved_items jsonb;
begin
 if auth.uid() is null or not public.has_permission('sales.price_override') then raise exception 'Only the owner can approve price overrides.'; end if;
 select * into r from public.sale_price_approval_requests where id=p_request_id and company_id=public.get_my_company_id() for update;
 if r.id is null then raise exception 'Approval request not found'; end if;
 if r.status<>'pending' then raise exception 'Approval request is no longer pending'; end if;
 update public.sale_price_approval_requests set status='approved',approved_by=auth.uid(),decision_note=p_decision_note,decided_at=now() where id=r.id;
 select jsonb_agg(x || jsonb_build_object('price_override',true)) into approved_items from jsonb_array_elements(r.items) x;
 select public.create_sale(r.customer_id,r.payment_method,r.discount,r.staff_name,r.notes,approved_items,r.id) into sale_id;
 update public.sale_price_approval_requests set status='used',sale_id=sale_id,used_at=now() where id=r.id;
 perform public.write_audit_log('sale.price_override_approved_and_used','sale',sale_id,null,null,jsonb_build_object('approval_id',r.id,'approved_by',auth.uid(),'decision_note',p_decision_note));
 return sale_id;
end; $;

create or replace function public.reject_sale_price_override(p_request_id uuid,p_decision_note text default null)
returns uuid language plpgsql security definer set search_path='public' as $
begin
 if auth.uid() is null or not public.has_permission('sales.price_override') then raise exception 'Only the owner can reject price overrides.'; end if;
 update public.sale_price_approval_requests set status='rejected',approved_by=auth.uid(),decision_note=p_decision_note,decided_at=now()
 where id=p_request_id and company_id=public.get_my_company_id() and status='pending';
 if not found then raise exception 'Approval request not found or no longer pending'; end if;
 perform public.write_audit_log('sale.price_override_rejected','sale_price_approval_request',p_request_id,null,null,jsonb_build_object('rejected_by',auth.uid(),'decision_note',p_decision_note));
 return p_request_id;
end; $;

revoke all on function public.request_sale_price_override(uuid,text,numeric,text,text,jsonb,text) from public,anon,authenticated;
revoke all on function public.list_sale_price_override_requests() from public,anon,authenticated;
revoke all on function public.approve_sale_price_override(uuid,text) from public,anon,authenticated;
revoke all on function public.reject_sale_price_override(uuid,text) from public,anon,authenticated;
grant execute on function public.request_sale_price_override(uuid,text,numeric,text,text,jsonb,text) to authenticated;
grant execute on function public.list_sale_price_override_requests() to authenticated;
grant execute on function public.approve_sale_price_override(uuid,text) to authenticated;
grant execute on function public.reject_sale_price_override(uuid,text) to authenticated;
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