import { createContext, useContext, useState, type ReactNode } from 'react';

interface LayoutContextValue {
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
}

const LayoutContext = createContext<LayoutContextValue | null>(null);

export function LayoutProvider({ children }: { children: ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  return (
    <LayoutContext.Provider
      value={{
        sidebarCollapsed,
        toggleSidebar: () => setSidebarCollapsed((v) => !v),
      }}
    >
      {children}
    </LayoutContext.Provider>
  );
}

export function useLayout() {
  const ctx = useContext(LayoutContext);
  if (!ctx) throw new Error('useLayout debe usarse dentro de LayoutProvider');
  return ctx;
}
