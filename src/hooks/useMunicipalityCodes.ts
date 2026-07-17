import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import type { MunicipalityCodeRow } from '@/types/database';

export function useMunicipalityCodes() {
  const [codes, setCodes] = useState<MunicipalityCodeRow[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('municipality_codes')
        .select('*')
        .order('municipality', { ascending: true });
      setCodes(data ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return { codes, loading, reload };
}
