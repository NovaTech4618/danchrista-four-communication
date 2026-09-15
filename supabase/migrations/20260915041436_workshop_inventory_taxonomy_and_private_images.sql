alter table public.inventory add column if not exists subcategory text;
alter table public.inventory add column if not exists image_path text;

update public.inventory
set
  item_type = case
    when lower(coalesce(category,'')) = 'phone parts' then 'part'
    when lower(coalesce(category,'')) in ('accessories','gadgets & accessories') then 'accessory'
    when lower(coalesce(category,'')) in ('devices','gadgets') then 'gadget'
    else item_type
  end,
  category = case
    when lower(coalesce(category,'')) = 'phone parts' then 'Phone Parts'
    when lower(coalesce(category,'')) in ('accessories','gadgets & accessories','devices','gadgets') then 'Gadgets & Accessories'
    else category
  end,
  subcategory = case
    when lower(coalesce(category,'')) = 'phone parts' and lower(item_name) like '%earpiece%' then 'Audio'
    when lower(coalesce(category,'')) = 'phone parts' and (lower(item_name) like '%charg%' or lower(item_name) like '%board%' or lower(item_name) like '%port%' or lower(item_name) like '%flex%' or lower(item_name) like '%flat%') then 'Charging'
    when lower(coalesce(category,'')) = 'phone parts' and lower(item_name) like '%battery%' then 'Power'
    when lower(coalesce(category,'')) = 'phone parts' and (lower(item_name) like '%display%' or lower(item_name) like '%lcd%' or lower(item_name) like '%oled%' or lower(item_name) like '%screen%') then 'Displays'
    when lower(coalesce(category,'')) = 'phone parts' and (lower(item_name) like '%back glass%' or lower(item_name) like '%housing%') then 'Back Glass / Housing'
    when lower(coalesce(category,'')) = 'phone parts' then 'Other Phone Parts'
    when lower(coalesce(category,'')) in ('accessories','gadgets & accessories','devices','gadgets') then 'Other Gadgets & Accessories'
    else subcategory
  end
where subcategory is null;

update public.inventory
set image_path = regexp_replace(image_url, '^https://[^/]+/storage/v1/object/public/inventory-images/', '')
where image_path is null and image_url is not null and image_url like '%/storage/v1/object/public/inventory-images/%';

update storage.buckets
set public = false,
    file_size_limit = 5242880,
    allowed_mime_types = array['image/jpeg','image/png','image/webp']
where id = 'inventory-images';

drop policy if exists "Inventory images authenticated read" on storage.objects;
drop policy if exists "Inventory images authenticated upload" on storage.objects;
drop policy if exists "Inventory images authenticated update" on storage.objects;
drop policy if exists "Inventory images authenticated delete" on storage.objects;

create policy "Inventory images company read"
on storage.objects for select to authenticated
using (
  bucket_id = 'inventory-images'
  and (storage.foldername(name))[1] = (select profiles.company_id::text from public.profiles where profiles.id = (select auth.uid()))
);

create policy "Inventory images company upload"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'inventory-images'
  and (storage.foldername(name))[1] = (select profiles.company_id::text from public.profiles where profiles.id = (select auth.uid()))
);

create policy "Inventory images company update"
on storage.objects for update to authenticated
using (
  bucket_id = 'inventory-images'
  and (storage.foldername(name))[1] = (select profiles.company_id::text from public.profiles where profiles.id = (select auth.uid()))
)
with check (
  bucket_id = 'inventory-images'
  and (storage.foldername(name))[1] = (select profiles.company_id::text from public.profiles where profiles.id = (select auth.uid()))
);

create policy "Inventory images company delete"
on storage.objects for delete to authenticated
using (
  bucket_id = 'inventory-images'
  and (storage.foldername(name))[1] = (select profiles.company_id::text from public.profiles where profiles.id = (select auth.uid()))
);