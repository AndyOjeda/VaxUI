import { api } from '../services/api';
import { prefetchDashboardHome } from './dashboardCache';
import { fetchMonthsOverview, prefetchCurrentMonthOverview, prefetchMonthsOverview } from './monthsOverviewCache';
import { fetchPaymentsMonth, prefetchAdjacentMonths, prefetchPaymentsMonth } from './paymentsCache';

type LazyImport = () => Promise<unknown>;

const lazyPages: Record<string, LazyImport> = {
  '/dashboard': () => import('../pages/DashboardPage'),
  '/alertas': () => import('../pages/AlertsPage'),
  '/simulador': () => import('../pages/SimulatorPage'),
  '/ventas': () => import('../pages/SalesPage'),
  '/metas': () => import('../pages/GoalsPage'),
  '/pagos': () => import('../pages/PaymentsPage'),
};

export function prefetchPageChunk(path: string) {
  lazyPages[path]?.();
}

export function prefetchRouteData(path: string) {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  switch (path) {
    case '/pagos':
      prefetchPaymentsMonth(month, year);
      prefetchAdjacentMonths(month, year);
      break;
    case '/alertas':
      api.get('/api/dashboard/alerts').catch(() => {});
      break;
    case '/metas':
      prefetchCurrentMonthOverview();
      prefetchMonthsOverview(year);
      break;
    case '/ventas':
      prefetchMonthsOverview(year, 1);
      break;
    case '/dashboard':
      prefetchDashboardHome();
      break;
    default:
      break;
  }
}

export function prefetchRoute(path: string) {
  prefetchPageChunk(path);
  prefetchRouteData(path);
}

/** Precarga datos clave al iniciar sesión */
export function prefetchInitialData() {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  prefetchDashboardHome();
  prefetchPaymentsMonth(month, year);
  prefetchAdjacentMonths(month, year);
  prefetchCurrentMonthOverview();
  prefetchMonthsOverview(year);
}

export async function ensureRouteData(path: string): Promise<void> {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  switch (path) {
    case '/pagos':
      await fetchPaymentsMonth(month, year);
      break;
    case '/metas':
      await fetchMonthsOverview(year);
      break;
    case '/ventas':
      await fetchMonthsOverview(year, 1);
      break;
    default:
      break;
  }
}
