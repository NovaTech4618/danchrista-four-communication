-- Blue-team follow-up: disabled accounts must not retain data or storage access.

create or replace function public.get_my_company_id()
returns uuid
language sql
stable
security definer
set search_path = 'public'
as $$
  select company_id
  from public.profiles
  where id = auth.uid()
    and is_active = true
  limit 1;
$$;

drop policy if exists "Inventory images company read" on storage.objects;
create policy "Inventory images company read"
on storage.objects for select to authenticated
using (
  bucket_id = 'inventory-images'
  and (select p.is_active from public.profiles p where p.id = auth.uid()) = true
  and (storage.foldername(name))[1] = (
    select p.company_id::text
    from public.profiles p
    where p.id = auth.uid() and p.is_active = true
  )
);

drop policy if exists "Inventory images company upload" on storage.objects;
create policy "Inventory images company upload"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'inventory-images'
  and (select p.is_active from public.profiles p where p.id = auth.uid()) = true
  and (storage.foldername(name))[1] = (
    select p.company_id::text
    from public.profiles p
    where p.id = auth.uid() and p.is_active = true
  )
);

drop policy if exists "Inventory images company update" on storage.objects;
create policy "Inventory images company update"
on storage.objects for update to authenticated
using (
  bucket_id = 'inventory-images'
  and (select p.is_active from public.profiles p where p.id = auth.uid()) = true
  and (storage.foldername(name))[1] = (
    select p.company_id::text
    from public.profiles p
    where p.id = auth.uid() and p.is_active = true
  )
)
with check (
  bucket_id = 'inventory-images'
  and (select p.is_active from public.profiles p where p.id = auth.uid()) = true
  and (storage.foldername(name))[1] = (
    select p.company_id::text
    from public.profiles p
    where p.id = auth.uid() and p.is_active = true
  )
);

drop policy if exists "Inventory images company delete" on storage.objects;
create policy "Inventory images company delete"
on storage.objects for delete to authenticated
using (
  bucket_id = 'inventory-images'
  and (select p.is_active from public.profiles p where p.id = auth.uid()) = true
  and (storage.foldername(name))[1] = (
    select p.company_id::text
    from public.profiles p
    where p.id = auth.uid() and p.is_active = true
  )
);
