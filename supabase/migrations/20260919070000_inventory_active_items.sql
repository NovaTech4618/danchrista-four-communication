alter table public.inventory add column if not exists is_active boolean not null default true;
create index if not exists inventory_company_active_idx on public.inventory(company_id, is_active, item_name);
