import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Calculator,
  Smartphone,
  Target,
  CreditCard,
  Bell,
  ChevronLeft,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLayout } from '../../context/LayoutContext';
import { useAlertsCount } from '../../hooks/useAlertsCount';
import { prefetchRoute } from '../../utils/routePrefetch';
import './Sidebar.css';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Inicio' },
  { to: '/alertas', icon: Bell, label: 'Alertas' },
  { to: '/simulador', icon: Calculator, label: 'Simulador' },
  { to: '/ventas', icon: Smartphone, label: 'Ventas' },
  { to: '/metas', icon: Target, label: 'Metas' },
  { to: '/pagos', icon: CreditCard, label: 'Pagos' },
];

export function Sidebar() {
  const { user, logout } = useAuth();
  const { sidebarCollapsed, toggleSidebar } = useLayout();
  const alertCount = useAlertsCount();

  return (
    <aside className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-top">
        <div className="sidebar-brand">
          <div className="brand-icon">V</div>
          {!sidebarCollapsed && <span>VAX</span>}
        </div>
        <button type="button" className="collapse-btn" onClick={toggleSidebar} aria-label="Colapsar menú">
          <ChevronLeft size={18} className={sidebarCollapsed ? 'flipped' : ''} />
        </button>
      </div>

      <nav className="sidebar-nav">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            title={sidebarCollapsed ? label : undefined}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            onMouseEnter={() => prefetchRoute(to)}
            onFocus={() => prefetchRoute(to)}
          >
            <Icon size={18} />
            {!sidebarCollapsed && <span>{label}</span>}
            {to === '/alertas' && alertCount > 0 && (
              <span className="nav-badge" aria-label={`${alertCount} alertas`}>{alertCount}</span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="user-card">
          <div className="user-avatar">{user?.full_name?.charAt(0) || 'U'}</div>
          {!sidebarCollapsed && (
            <div className="user-info">
              <span className="user-name">{user?.full_name}</span>
              <span className="user-email">{user?.email}</span>
            </div>
          )}
          <button type="button" className="logout-btn" onClick={() => logout()} title="Cerrar sesión">
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}
