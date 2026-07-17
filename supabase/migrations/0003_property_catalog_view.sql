-- Public catalog view: property + cover photo (first photo of the
-- lowest-order area), used by the client home/listing page.
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
