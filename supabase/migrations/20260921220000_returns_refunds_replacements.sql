-- Section 15: returns, refunds and replacements.
create table if not exists public.sale_return_requests (
 id uuid primary key default gen_random_uuid(), company_id uuid not null references public.companies(id), branch_id uuid references public.branches(id),
 sale_id uuid not null references public.sales(id), requested_by uuid not null references public.profiles(id), approved_by uuid references public.profiles(id),
 status text not null default 'pending' check(status in ('pending','approved','rejected','used')), action text not null check(action in ('return','refund','replacement')),
 refund_amount numeric(14,2) not null default 0 check(refund_amount>=0), refund_payment_method text,
 replacement_inventory_id uuid references public.inventory(id), replacement_quantity integer, reason text not null, notes text,
 requested_at timestamptz not null default now(), decided_at timestamptz, used_at timestamptz);
create table if not exists public.sale_return_items (
 id uuid primary key default gen_random_uuid(), request_id uuid not null references public.sale_return_requests(id) on delete cascade,
 sale_item_id uuid not null references public.sale_items(id), quantity integer not null check(quantity>0));
create index if not exists sale_return_requests_company_status_idx on public.sale_return_requests(company_id,status,requested_at desc);
alter table public.sale_return_requests enable row level security; alter table public.sale_return_items enable row level security;
drop policy if exists sale_return_requests_select on public.sale_return_requests;
create policy sale_return_requests_select on public.sale_return_requests for select to authenticated using(company_id=public.get_my_company_id() and (requested_by=auth.uid() or public.has_permission('sales.return_manage')));
drop policy if exists sale_return_items_select on public.sale_return_items;
create policy sale_return_items_select on public.sale_return_items for select to authenticated using(exists(select 1 from public.sale_return_requests r where r.id=request_id and r.company_id=public.get_my_company_id() and (r.requested_by=auth.uid() or public.has_permission('sales.return_manage'))));
revoke all on public.sale_return_requests,public.sale_return_items from public,anon,authenticated;
delete from public.role_permissions where permission='sales.return_manage';
insert into public.role_permissions(role,permission,allowed) values('owner','sales.return_manage',true) on conflict(role,permission) do update set allowed=excluded.allowed;

create table if not exists public.repair_refund_requests (
 id uuid primary key default gen_random_uuid(), company_id uuid not null references public.companies(id), branch_id uuid references public.branches(id),
 repair_id uuid not null references public.repairs(id), requested_by uuid not null references public.profiles(id), approved_by uuid references public.profiles(id),
 status text not null default 'pending' check(status in ('pending','approved','rejected','used')), amount numeric(14,2) not null check(amount>0),
 payment_method text not null check(payment_method in ('cash','transfer','pos','other')), reason text not null, notes text,
 requested_at timestamptz not null default now(), decided_at timestamptz, used_at timestamptz);
alter table public.repair_refund_requests enable row level security;
drop policy if exists repair_refund_select on public.repair_refund_requests;
create policy repair_refund_select on public.repair_refund_requests for select to authenticated using(company_id=public.get_my_company_id() and (requested_by=auth.uid() or public.has_permission('sales.return_manage')));
revoke all on public.repair_refund_requests from public,anon,authenticated;

create or replace function public.request_sale_return(p_sale_id uuid,p_action text,p_refund_amount numeric,p_refund_payment_method text,p_reason text,p_notes text,p_items jsonb,p_replacement_inventory_id uuid default null,p_replacement_quantity integer default null)
returns uuid language plpgsql security definer set search_path='public' as $$
declare c uuid:=public.get_my_company_id(); u uuid:=auth.uid(); r uuid; x jsonb; sid uuid; q int; sold int; already int; b uuid;
begin
 if u is null or not public.has_permission('sales.manage') then raise exception 'Permission denied'; end if;
 if p_action not in ('return','refund','replacement') then raise exception 'Invalid return action'; end if;
 if trim(coalesce(p_reason,''))='' then raise exception 'Return reason is required'; end if;
 if coalesce(p_refund_amount,0)<0 then raise exception 'Refund cannot be negative'; end if;
 select branch_id into b from public.sales where id=p_sale_id and company_id=c; if not found then raise exception 'Sale not found'; end if;
 if b is not null and not public.user_has_branch_access(b) then raise exception 'Branch access denied'; end if;
 if p_action='refund' and coalesce(p_refund_amount,0)=0 then raise exception 'Refund amount is required'; end if;
 if p_refund_payment_method is not null and lower(p_refund_payment_method) not in ('cash','transfer','pos','other') then raise exception 'Invalid refund payment method'; end if;
 if jsonb_array_length(coalesce(p_items,'[]'::jsonb))=0 then raise exception 'At least one returned item is required'; end if;
 for x in select * from jsonb_array_elements(p_items) loop
  sid:=(x->>'sale_item_id')::uuid; q:=(x->>'quantity')::int;
  select si.quantity into sold from public.sale_items si join public.sales s on s.id=si.sale_id where si.id=sid and si.sale_id=p_sale_id and s.company_id=c;
  if not found or q<=0 then raise exception 'Invalid sale item'; end if;
  select coalesce(sum(i.quantity),0) into already from public.sale_return_items i join public.sale_return_requests rr on rr.id=i.request_id where rr.sale_id=p_sale_id and rr.company_id=c and rr.status='used' and i.sale_item_id=sid;
  if already+q>sold then raise exception 'Return quantity exceeds quantity sold'; end if;
 end loop;
 if p_action='replacement' and (p_replacement_inventory_id is null or coalesce(p_replacement_quantity,0)<=0) then raise exception 'Replacement item and quantity are required'; end if;
 insert into public.sale_return_requests(company_id,branch_id,sale_id,requested_by,action,refund_amount,refund_payment_method,reason,notes,replacement_inventory_id,replacement_quantity)
 values(c,b,p_sale_id,u,p_action,coalesce(p_refund_amount,0),lower(p_refund_payment_method),p_reason,p_notes,p_replacement_inventory_id,p_replacement_quantity) returning id into r;
 for x in select * from jsonb_array_elements(p_items) loop insert into public.sale_return_items(request_id,sale_item_id,quantity) values(r,(x->>'sale_item_id')::uuid,(x->>'quantity')::int); end loop;
 perform public.write_audit_log('sale.return_requested','sale_return_request',r,null,null,jsonb_build_object('sale_id',p_sale_id,'action',p_action,'refund_amount',coalesce(p_refund_amount,0),'requested_by',u,'reason',p_reason));
 return r;
end; $$;

create or replace function public.list_sale_return_requests()
returns table(id uuid,sale_id uuid,action text,status text,refund_amount numeric,refund_payment_method text,reason text,notes text,requested_at timestamptz,requested_by uuid)
language sql security definer set search_path='public' as $$
select r.id,r.sale_id,r.action,r.status,r.refund_amount,r.refund_payment_method,r.reason,r.notes,r.requested_at,r.requested_by from public.sale_return_requests r
where r.company_id=public.get_my_company_id() and (public.has_permission('sales.return_manage') or r.requested_by=auth.uid()) order by r.requested_at desc $$;

create or replace function public.approve_sale_return(p_request_id uuid,p_decision_note text default null)
returns uuid language plpgsql security definer set search_path='public' as $$
declare r public.sale_return_requests%rowtype; x record; inv public.inventory%rowtype;
begin
 if auth.uid() is null or not public.has_permission('sales.return_manage') then raise exception 'Only the Boss can approve returns, refunds or replacements'; end if;
 select * into r from public.sale_return_requests where id=p_request_id and company_id=public.get_my_company_id() for update;
 if r.id is null or r.status<>'pending' then raise exception 'Return request not found or no longer pending'; end if;
 for x in select sri.quantity,sri.sale_item_id,si.inventory_id from public.sale_return_items sri join public.sale_items si on si.id=sri.sale_item_id where sri.request_id=r.id loop
  perform public.record_inventory_movement(x.inventory_id,'sale_return',x.quantity,coalesce((select cost_price from public.inventory where id=x.inventory_id),0),'sale_return',r.id,r.reason);
 end loop;
 if r.action='replacement' then
  select * into inv from public.inventory where id=r.replacement_inventory_id and company_id=r.company_id for update;
  if not found or inv.quantity<coalesce(r.replacement_quantity,0) then raise exception 'Replacement stock is unavailable'; end if;
  perform public.record_inventory_movement(inv.id,'replacement_out',r.replacement_quantity,coalesce(inv.cost_price,0),'sale_return',r.id,'Replacement issued');
 elsif r.action='refund' then
  insert into public.financial_transactions(company_id,branch_id,direction,category,amount,payment_method,description,source_type,source_id,occurred_at,recorded_by)
  values(r.company_id,r.branch_id,'out','customer_refund',r.refund_amount,coalesce(r.refund_payment_method,'cash'),'Customer refund for sale '||left(r.sale_id::text,8),'sale_refund',r.id,now(),auth.uid());
 end if;
 update public.sale_return_requests set status='used',approved_by=auth.uid(),decided_at=now(),used_at=now(),notes=case when p_decision_note is null then notes else coalesce(notes,'')||' Boss: '||p_decision_note end where id=r.id;
 perform public.write_audit_log('sale.return_approved','sale_return_request',r.id,null,null,jsonb_build_object('approved_by',auth.uid(),'action',r.action,'refund_amount',r.refund_amount,'sale_id',r.sale_id,'decision_note',p_decision_note));
 return r.id;
end; $$;

create or replace function public.reject_sale_return(p_request_id uuid,p_decision_note text default null)
returns uuid language plpgsql security definer set search_path='public' as $$
begin
 if auth.uid() is null or not public.has_permission('sales.return_manage') then raise exception 'Only the Boss can reject returns, refunds or replacements'; end if;
 update public.sale_return_requests set status='rejected',approved_by=auth.uid(),decided_at=now(),notes=case when p_decision_note is null then notes else coalesce(notes,'')||' Boss: '||p_decision_note end where id=p_request_id and company_id=public.get_my_company_id() and status='pending';
 if not found then raise exception 'Return request not found or no longer pending'; end if;
 perform public.write_audit_log('sale.return_rejected','sale_return_request',p_request_id,null,null,jsonb_build_object('rejected_by',auth.uid(),'decision_note',p_decision_note)); return p_request_id;
end; $$;

create or replace function public.request_repair_refund(p_repair_id uuid,p_amount numeric,p_payment_method text,p_reason text,p_notes text default null)
returns uuid language plpgsql security definer set search_path='public' as $$
declare c uuid:=public.get_my_company_id(); u uuid:=auth.uid(); b uuid; paid numeric; prior numeric; rid uuid;
begin
 if u is null or not public.has_permission('repairs.manage') then raise exception 'Permission denied'; end if;
 select branch_id into b from public.repairs where id=p_repair_id and company_id=c; if not found then raise exception 'Repair not found'; end if;
 select coalesce(sum(amount),0) into paid from public.repair_payments where repair_id=p_repair_id and company_id=c;
 select coalesce(sum(amount),0) into prior from public.repair_refund_requests where repair_id=p_repair_id and company_id=c and status='used';
 if p_amount<=0 or p_amount>greatest(paid-prior,0) then raise exception 'Refund exceeds amount actually received'; end if;
 if lower(p_payment_method) not in ('cash','transfer','pos','other') then raise exception 'Invalid payment method'; end if;
 if trim(coalesce(p_reason,''))='' then raise exception 'Refund reason is required'; end if;
 insert into public.repair_refund_requests(company_id,branch_id,repair_id,requested_by,amount,payment_method,reason,notes) values(c,b,p_repair_id,u,p_amount,lower(p_payment_method),p_reason,p_notes) returning id into rid;
 perform public.write_audit_log('repair.refund_requested','repair_refund_request',rid,null,null,jsonb_build_object('repair_id',p_repair_id,'amount',p_amount,'requested_by',u,'reason',p_reason)); return rid;
end; $$;

create or replace function public.approve_repair_refund(p_request_id uuid,p_decision_note text default null)
returns uuid language plpgsql security definer set search_path='public' as $$
declare r public.repair_refund_requests%rowtype;
begin
 if auth.uid() is null or not public.has_permission('sales.return_manage') then raise exception 'Only the Boss can approve refunds'; end if;
 select * into r from public.repair_refund_requests where id=p_request_id and company_id=public.get_my_company_id() for update;
 if r.id is null or r.status<>'pending' then raise exception 'Refund request not found or no longer pending'; end if;
 insert into public.financial_transactions(company_id,branch_id,direction,category,amount,payment_method,description,source_type,source_id,occurred_at,recorded_by) values(r.company_id,r.branch_id,'out','customer_refund',r.amount,r.payment_method,'Refund for repair '||left(r.repair_id::text,8),'repair_refund',r.id,now(),auth.uid());
 update public.repair_refund_requests set status='used',approved_by=auth.uid(),decided_at=now(),used_at=now(),notes=case when p_decision_note is null then notes else coalesce(notes,'')||' Boss: '||p_decision_note end where id=r.id;
 perform public.write_audit_log('repair.refund_approved','repair_refund_request',r.id,null,null,jsonb_build_object('approved_by',auth.uid(),'repair_id',r.repair_id,'amount',r.amount,'decision_note',p_decision_note)); return r.id;
end; $$;

create or replace function public.reject_repair_refund(p_request_id uuid,p_decision_note text default null)
returns uuid language plpgsql security definer set search_path='public' as $$
begin
 if auth.uid() is null or not public.has_permission('sales.return_manage') then raise exception 'Only the Boss can reject refunds'; end if;
 update public.repair_refund_requests set status='rejected',approved_by=auth.uid(),decided_at=now(),notes=case when p_decision_note is null then notes else coalesce(notes,'')||' Boss: '||p_decision_note end where id=p_request_id and company_id=public.get_my_company_id() and status='pending';
 if not found then raise exception 'Refund request not found or no longer pending'; end if;
 perform public.write_audit_log('repair.refund_rejected','repair_refund_request',p_request_id,null,null,jsonb_build_object('rejected_by',auth.uid(),'decision_note',p_decision_note)); return p_request_id;
end; $$;

revoke all on function public.request_sale_return(uuid,text,numeric,text,text,text,jsonb,uuid,integer) from public,anon,authenticated;
revoke all on function public.list_sale_return_requests() from public,anon,authenticated;
revoke all on function public.approve_sale_return(uuid,text) from public,anon,authenticated;
revoke all on function public.reject_sale_return(uuid,text) from public,anon,authenticated;
revoke all on function public.request_repair_refund(uuid,numeric,text,text,text) from public,anon,authenticated;
revoke all on function public.approve_repair_refund(uuid,text) from public,anon,authenticated;
revoke all on function public.reject_repair_refund(uuid,text) from public,anon,authenticated;
grant execute on function public.request_sale_return(uuid,text,numeric,text,text,text,jsonb,uuid,integer) to authenticated;
grant execute on function public.list_sale_return_requests() to authenticated;
grant execute on function public.approve_sale_return(uuid,text) to authenticated;
grant execute on function public.reject_sale_return(uuid,text) to authenticated;
grant execute on function public.request_repair_refund(uuid,numeric,text,text,text) to authenticated;
grant execute on function public.approve_repair_refund(uuid,text) to authenticated;
grant execute on function public.reject_repair_refund(uuid,text) to authenticated;
create or replace function public.list_repair_refund_requests()
returns table(id uuid,repair_id uuid,status text,amount numeric,payment_method text,reason text,notes text,requested_at timestamptz,requested_by uuid)
language sql security definer set search_path='public' as $$
select r.id,r.repair_id,r.status,r.amount,r.payment_method,r.reason,r.notes,r.requested_at,r.requested_by from public.repair_refund_requests r
where r.company_id=public.get_my_company_id() and (public.has_permission('sales.return_manage') or r.requested_by=auth.uid()) order by r.requested_at desc $$;
revoke all on function public.list_repair_refund_requests() from public,anon,authenticated;
grant execute on function public.list_repair_refund_requests() to authenticated;
