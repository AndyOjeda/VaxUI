import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';

interface DataContextValue {
  tick: number;
  refreshAll: () => void;
}

const DataContext = createContext<DataContextValue | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const [tick, setTick] = useState(0);
  const refreshAll = useCallback(() => setTick((t) => t + 1), []);
  return (
    <DataContext.Provider value={{ tick, refreshAll }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData debe usarse dentro de DataProvider');
  return ctx;
}
