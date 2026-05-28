import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { LayoutProvider, useLayout } from '../../context/LayoutContext';
import { DataProvider } from '../../context/DataContext';
import { prefetchInitialData } from '../../utils/routePrefetch';
import { Sidebar } from './Sidebar';
import './DashboardLayout.css';

function Shell() {
  const { sidebarCollapsed, toggleSidebar } = useLayout();

  useEffect(() => {
    prefetchInitialData();
  }, []);

  return (
    <div className={`app-shell ${sidebarCollapsed ? 'sidebar-is-collapsed' : ''}`}>
      <Sidebar />
      <div className="main-area">
        <div className="main-bg" aria-hidden="true">
          <div className="main-bg-orb main-bg-orb--amber" />
          <div className="main-bg-orb main-bg-orb--orange" />
          <div className="main-bg-orb main-bg-orb--warm" />
        </div>
        <header className="top-bar">
          <button type="button" className="sidebar-toggle" onClick={toggleSidebar} aria-label="Menú">
            <Menu size={20} />
          </button>
          <span className="top-bar-title">Vax · Celulares</span>
        </header>
        <main className="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export function DashboardLayout() {
  return (
    <LayoutProvider>
      <DataProvider>
        <Shell />
      </DataProvider>
    </LayoutProvider>
  );
}
