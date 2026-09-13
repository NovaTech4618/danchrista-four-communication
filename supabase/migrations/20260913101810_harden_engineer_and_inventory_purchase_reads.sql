create or replace function public.get_engineer_account_summary(p_engineer_id uuid)
returns table(total_parts_out numeric,total_parts_in numeric,total_payments_in numeric,total_payments_out numeric,total_debit numeric,total_credit numeric,balance numeric)
language plpgsql stable security definer set search_path=public as $$
declare v_company_id uuid;
begin
 if auth.uid() is null then raise exception 'Not authenticated'; end if;
 v_company_id:=public.get_my_company_id();
 if v_company_id is null then raise exception 'Company not found'; end if;
 if not public.has_permission('engineers.view') and not public.has_permission('engineers.manage') then raise exception 'Permission denied'; end if;
 if not exists(select 1 from public.engineers e where e.id=p_engineer_id and e.company_id=v_company_id) then raise exception 'Engineer not found'; end if;
 return query select coalesce(sum(case when et.transaction_type='parts_out' then et.debit else 0 end),0),coalesce(sum(case when et.transaction_type='parts_in' then et.credit else 0 end),0),coalesce(sum(case when et.transaction_type='payment_in' then et.credit else 0 end),0),coalesce(sum(case when et.transaction_type='payment_out' then et.debit else 0 end),0),coalesce(sum(et.debit),0),coalesce(sum(et.credit),0),coalesce(sum(et.debit),0)-coalesce(sum(et.credit),0) from public.engineer_transactions et where et.engineer_id=p_engineer_id and et.company_id=v_company_id;
end; $$;

create or replace function public.get_inventory_purchase_items(p_purchase_id uuid)
returns table(id uuid,purchase_id uuid,inventory_id uuid,item_name text,quantity integer,unit_cost numeric,total_cost numeric)
language plpgsql security definer set search_path=public as $$
declare v_company_id uuid;
begin
 if auth.uid() is null then raise exception 'Not authenticated'; end if;
 v_company_id:=public.get_my_company_id();
 if v_company_id is null then raise exception 'Company not found'; end if;
 if not public.has_permission('inventory.view') then raise exception 'Permission denied'; end if;
 return query select i.id,i.purchase_id,i.inventory_id,inv.item_name,i.quantity,i.unit_cost,i.total_cost from public.inventory_purchase_items i join public.inventory inv on inv.id=i.inventory_id where i.purchase_id=p_purchase_id and i.company_id=v_company_id and inv.company_id=v_company_id and (inv.branch_id is null or public.user_has_branch_access(inv.branch_id));
end; $$;

create or replace function public.get_inventory_purchases()
returns table(id uuid,company_id uuid,supplier text,invoice_reference text,purchase_date timestamp with time zone,payment_method text,total_amount numeric,notes text,created_by uuid,created_at timestamp with time zone)
language plpgsql security definer set search_path=public as $$
declare v_company_id uuid;
begin
 if auth.uid() is null then raise exception 'Not authenticated'; end if;
 v_company_id:=public.get_my_company_id();
 if v_company_id is null then raise exception 'Company not found'; end if;
 if not public.has_permission('inventory.view') then raise exception 'Permission denied'; end if;
 return query select p.id,p.company_id,p.supplier,p.invoice_reference,p.purchase_date,p.payment_method,p.total_amount,p.notes,p.created_by,p.created_at from public.inventory_purchases p where p.company_id=v_company_id order by p.purchase_date desc;
end; $$;

alter table public.engineer_transactions enable row level security;
alter table public.inventory_purchases enable row level security;
alter table public.inventory_purchase_items enable row level security;

drop policy if exists engineer_transactions_company_select on public.engineer_transactions;
create policy engineer_transactions_authorized_select on public.engineer_transactions for select to authenticated using(company_id=public.get_my_company_id() and (public.has_permission('engineers.view') or public.has_permission('engineers.manage')));

drop policy if exists inventory_purchases_select_company on public.inventory_purchases;
create policy inventory_purchases_authorized_select on public.inventory_purchases for select to authenticated using(company_id=public.get_my_company_id() and public.has_permission('inventory.view'));

drop policy if exists inventory_purchase_items_branch_select on public.inventory_purchase_items;
create policy inventory_purchase_items_authorized_select on public.inventory_purchase_items for select to authenticated using(company_id=public.get_my_company_id() and public.has_permission('inventory.view') and exists(select 1 from public.inventory i where i.id=inventory_purchase_items.inventory_id and i.company_id=inventory_purchase_items.company_id and (i.branch_id is null or public.user_has_branch_access(i.branch_id))));
