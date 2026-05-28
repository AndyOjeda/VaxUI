import { useCallback, useEffect, useState } from 'react';
import { useData } from '../context/DataContext';
import { api } from '../services/api';
import type { AlertItem } from '../types';

export function useAlertsCount() {
  const { tick } = useData();
  const [count, setCount] = useState(0);

  const refresh = useCallback(async () => {
    try {
      const list = await api.get<AlertItem[]>('/api/dashboard/alerts');
      setCount(list.length);
    } catch {
      setCount(0);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh, tick]);

  return count;
}
