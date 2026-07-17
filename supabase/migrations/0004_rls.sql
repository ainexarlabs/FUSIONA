-- Row Level Security
alter table public.properties enable row level security;
alter table public.municipality_codes enable row level security;
alter table public.property_areas enable row level security;
alter table public.property_photos enable row level security;
alter table public.visit_requests enable row level security;

-- run the catalog view with the querying role's own privileges so the
-- properties RLS policy below (status = 'activa' for anon) still applies.
alter view public.property_catalog set (security_invoker = on);

-- properties: public can read only active listings; admins (authenticated) can do everything.
create policy "properties_public_read_active" on public.properties
  for select to anon
  using (status = 'activa');

create policy "properties_admin_all" on public.properties
  for all to authenticated
  using (true)
  with check (true);

-- municipality_codes: admin-only, never exposed to anon.
create policy "municipality_codes_admin_all" on public.municipality_codes
  for all to authenticated
  using (true)
  with check (true);

-- property_areas / property_photos: publicly readable (needed for the client
-- gallery), writes restricted to authenticated admins.
create policy "property_areas_public_read" on public.property_areas
  for select to anon
  using (
    exists (
      select 1 from public.properties p
      where p.id = property_areas.property_id and p.status = 'activa'
    )
  );

create policy "property_areas_admin_all" on public.property_areas
  for all to authenticated
  using (true)
  with check (true);

create policy "property_photos_public_read" on public.property_photos
  for select to anon
  using (
    exists (
      select 1
      from public.property_areas a
      join public.properties p on p.id = a.property_id
      where a.id = property_photos.area_id and p.status = 'activa'
    )
  );

create policy "property_photos_admin_all" on public.property_photos
  for all to authenticated
  using (true)
  with check (true);

-- visit_requests: anonymous clients can only insert their own request;
-- reading/updating/deleting is restricted to authenticated admins.
create policy "visit_requests_public_insert" on public.visit_requests
  for insert to anon
  with check (true);

create policy "visit_requests_admin_all" on public.visit_requests
  for all to authenticated
  using (true)
  with check (true);
