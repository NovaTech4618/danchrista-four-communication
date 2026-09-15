update public.inventory
set image_url = null,
    updated_at = now()
where image_path is not null
  and image_url is not null;
