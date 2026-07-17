import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import type { PropertyRow, VisitRequestRow } from '@/types/database';

export interface VisitRequestWithProperty extends VisitRequestRow {
  property: Pick<PropertyRow, 'folio' | 'title'> | null;
}

export function useVisitRequests() {
  const [requests, setRequests] = useState<VisitRequestWithProperty[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('visit_requests')
        .select('*, property:properties(folio, title)')
        .order('created_at', { ascending: false });
      setRequests((data ?? []) as unknown as VisitRequestWithProperty[]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return { requests, loading, reload };
}
