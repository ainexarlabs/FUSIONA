-- Add optional latitude/longitude to each property so the client can render a
-- map on the detail page and the admin can pin a location visually.
alter table public.properties
  add column if not exists latitude  numeric(10, 7),
  add column if not exists longitude numeric(10, 7);

-- Add "apartada" (reserved) to the property status set.
alter table public.properties drop constraint if exists properties_status_check;
alter table public.properties
  add constraint properties_status_check
  check (status in ('activa', 'apartada', 'pausada', 'vendida', 'rentada'));

-- Refresh the public catalog view so the new columns come through unchanged.
create or replace view public.property_catalog as
select
  p.*,
  cover.storage_path as cover_photo_path
from public.properties p
left join lateral (
  select ph.storage_path
  from public.property_areas a
  join public.property_photos ph on ph.area_id = a.id
  where a.property_id = p.id
  order by a."order" asc, ph."order" asc
  limit 1
) cover on true;

alter view public.property_catalog set (security_invoker = on);
