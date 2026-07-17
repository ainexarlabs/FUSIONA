-- Folio generation: {code}{V|R}-{consecutive}, consecutive kept independently
-- per code+modality combination (e.g. TV and TR count separately).
create table if not exists public.folio_counters (
  prefix text primary key,
  last_value integer not null default 0
);

create or replace function public.next_folio_number(p_prefix text)
returns integer as $$
declare
  v_value integer;
begin
  insert into public.folio_counters (prefix, last_value)
  values (p_prefix, 1)
  on conflict (prefix) do update set last_value = public.folio_counters.last_value + 1
  returning last_value into v_value;

  return v_value;
end;
$$ language plpgsql;

create or replace function public.generate_property_folio()
returns trigger as $$
declare
  v_code text;
  v_suffix text;
  v_prefix text;
  v_number integer;
begin
  if new.folio is not null then
    return new;
  end if;

  select code,
         case when new.modality = 'venta' then sale_suffix else rent_suffix end
    into v_code, v_suffix
  from public.municipality_codes
  where municipality = new.municipality;

  if v_code is null then
    raise exception 'No municipality_codes entry for municipality %', new.municipality;
  end if;

  v_prefix := v_code || v_suffix;
  v_number := public.next_folio_number(v_prefix);
  new.folio := v_prefix || '-' || v_number;

  return new;
end;
$$ language plpgsql;

drop trigger if exists generate_property_folio on public.properties;
create trigger generate_property_folio
  before insert on public.properties
  for each row execute function public.generate_property_folio();
