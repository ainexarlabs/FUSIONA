import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import type { Modality, PropertyCatalogRow } from '@/types/database';

export interface PropertyFilters {
  municipality?: string;
  modality?: Modality;
  search?: string;
}

export function useProperties(filters: PropertyFilters) {
  const [properties, setProperties] = useState<PropertyCatalogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        let query = supabase
          .from('property_catalog')
          .select('*')
          .eq('status', 'activa')
          .order('created_at', { ascending: false });

        if (filters.municipality) {
          query = query.eq('municipality', filters.municipality);
        }
        if (filters.modality) {
          query = query.eq('modality', filters.modality);
        }
        if (filters.search) {
          query = query.or(
            `title.ilike.%${filters.search}%,folio.ilike.%${filters.search}%,neighborhood.ilike.%${filters.search}%`,
          );
        }

        const { data, error: queryError } = await query;

        if (cancelled) return;
        if (queryError) {
          setError(queryError.message);
          setProperties([]);
        } else {
          setProperties(data ?? []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'network_error');
          setProperties([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [filters.municipality, filters.modality, filters.search]);

  return { properties, loading, error };
}
