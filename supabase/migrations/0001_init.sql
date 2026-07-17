-- Fusiona Real Estate — core schema
create extension if not exists "pgcrypto";

create table if not exists public.municipality_codes (
  id uuid primary key default gen_random_uuid(),
  municipality text not null unique,
  code text not null,
  sale_suffix text not null default 'V',
  rent_suffix text not null default 'R',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.properties (
  id uuid primary key default gen_random_uuid(),
  folio text unique,
  municipality text not null references public.municipality_codes (municipality) on update cascade,
  modality text not null check (modality in ('venta', 'renta')),
  title text not null,
  description text,
  price numeric(14, 2) not null default 0,
  bedrooms numeric(4, 1),
  bathrooms numeric(4, 1),
  construction_m2 numeric(8, 2),
  parking_spots integer,
  neighborhood text,
  status text not null default 'pausada' check (status in ('activa', 'pausada', 'vendida', 'rentada')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists properties_status_idx on public.properties (status);
create index if not exists properties_municipality_idx on public.properties (municipality);

create table if not exists public.property_areas (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties (id) on delete cascade,
  area_name text not null,
  "order" integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists property_areas_property_idx on public.property_areas (property_id);

create table if not exists public.property_photos (
  id uuid primary key default gen_random_uuid(),
  area_id uuid not null references public.property_areas (id) on delete cascade,
  storage_path text not null,
  "order" integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists property_photos_area_idx on public.property_photos (area_id);

create table if not exists public.visit_requests (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties (id) on delete cascade,
  client_name text not null,
  client_phone text not null,
  requested_datetime timestamptz not null,
  ine_front_path text not null,
  ine_back_path text not null,
  status text not null default 'pendiente' check (status in ('pendiente', 'confirmada', 'cancelada')),
  calendar_event_id text,
  created_at timestamptz not null default now()
);

create index if not exists visit_requests_property_idx on public.visit_requests (property_id);
create index if not exists visit_requests_status_idx on public.visit_requests (status);

-- seed default municipalities per brief
-- Defaults follow the brief's own examples (TV-1, MR-4): single-letter city code + V/R modality
-- suffix. Editable any time from the admin "Ajustes" screen without touching code.
insert into public.municipality_codes (municipality, code, sale_suffix, rent_suffix)
values
  ('Toluca', 'T', 'V', 'R'),
  ('Metepec', 'M', 'V', 'R'),
  ('San Mateo Atenco', 'S', 'V', 'R'),
  ('Calimaya', 'C', 'V', 'R')
on conflict (municipality) do nothing;

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_updated_at on public.properties;
create trigger set_updated_at before update on public.properties
  for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at on public.municipality_codes;
create trigger set_updated_at before update on public.municipality_codes
  for each row execute function public.set_updated_at();
