-- Storage buckets: property photos are public (served on the catalog),
-- INE uploads are private and only reachable via signed URLs or the
-- authenticated admin panel.
insert into storage.buckets (id, name, public)
values ('property-photos', 'property-photos', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('ine-uploads', 'ine-uploads', false)
on conflict (id) do nothing;

-- property-photos: anyone can view, only admins can manage files.
create policy "property_photos_bucket_public_read"
  on storage.objects for select to anon, authenticated
  using (bucket_id = 'property-photos');

create policy "property_photos_bucket_admin_write"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'property-photos');

create policy "property_photos_bucket_admin_update"
  on storage.objects for update to authenticated
  using (bucket_id = 'property-photos')
  with check (bucket_id = 'property-photos');

create policy "property_photos_bucket_admin_delete"
  on storage.objects for delete to authenticated
  using (bucket_id = 'property-photos');

-- ine-uploads: anonymous clients may only INSERT their own visit documents
-- (never read/list/overwrite). Only authenticated admins can read/delete —
-- reads happen through short-lived signed URLs, never public links.
create policy "ine_uploads_bucket_public_insert"
  on storage.objects for insert to anon
  with check (bucket_id = 'ine-uploads');

create policy "ine_uploads_bucket_admin_read"
  on storage.objects for select to authenticated
  using (bucket_id = 'ine-uploads');

create policy "ine_uploads_bucket_admin_delete"
  on storage.objects for delete to authenticated
  using (bucket_id = 'ine-uploads');
