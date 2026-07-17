import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import type { PropertyAreaRow, PropertyPhotoRow, PropertyRow } from '@/types/database';

export interface AreaWithPhotos extends PropertyAreaRow {
  photos: PropertyPhotoRow[];
}

export function usePropertyDetail(folio: string | undefined) {
  const [property, setProperty] = useState<PropertyRow | null>(null);
  const [areas, setAreas] = useState<AreaWithPhotos[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!folio) return;
    const currentFolio = folio;
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const { data: propertyData, error: propertyError } = await supabase
          .from('properties')
          .select('*')
          .eq('folio', currentFolio)
          .maybeSingle();

        if (cancelled) return;

        if (propertyError || !propertyData) {
          setError(propertyError?.message ?? 'not_found');
          setProperty(null);
          setAreas([]);
          return;
        }

        setProperty(propertyData);

        const { data: areaData } = await supabase
          .from('property_areas')
          .select('*, property_photos(*)')
          .eq('property_id', propertyData.id)
          .order('order', { ascending: true });

        if (cancelled) return;

        const withPhotos: AreaWithPhotos[] = (areaData ?? []).map((area) => {
          const photos = ((area as { property_photos?: PropertyPhotoRow[] }).property_photos ?? []).slice().sort(
            (a, b) => a.order - b.order,
          );
          return { ...(area as PropertyAreaRow), photos };
        });

        setAreas(withPhotos);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'network_error');
          setProperty(null);
          setAreas([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [folio]);

  return { property, areas, loading, error };
}
