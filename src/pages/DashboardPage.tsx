import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { TrendingUp, CreditCard, Target, Smartphone, Bell } from 'lucide-react';
import { KpiCard } from '../components/ui/KpiCard';
import { Dialog } from '../components/ui/Dialog';
import { Spinner } from '../components/ui/Spinner';
import { useData } from '../context/DataContext';
import '../components/ui/KpiCard.css';
import '../components/ui/Dialog.css';
import { formatCurrency, formatDate, formatMonthYear, formatPercent } from '../utils/format';
import { fetchDashboardHome, getCachedDashboardHome } from '../utils/dashboardCache';
import type { DashboardHome } from '../types';
import './DashboardPage.css';

const DashboardCharts = lazy(() =>
  import('./DashboardCharts').then((m) => ({ default: m.DashboardCharts })),
);

export function DashboardPage() {
  const { tick } = useData();
  const location = useLocation();
  const now = new Date();
  const m = now.getMonth() + 1;
  const y = now.getFullYear();

  const [data, setData] = useState<DashboardHome | null>(
    () => getCachedDashboardHome(y, m) ?? null,
  );
  const [dialog, setDialog] = useState<'profit' | 'payments' | 'goals' | 'sales' | null>(null);

  const load = useCallback(async () => {
    try {
      const home = await fetchDashboardHome(y, m, { force: tick > 0 });
      setData(home);
    } catch {
      /* mantener últimos datos visibles */
    }
  }, [m, y, tick]);

  useEffect(() => {
    load();
  }, [load, location.key]);

  const kpis = data?.kpis;
  const monthGoal = data?.month_goal;
  const monthly = data?.monthly_sales ?? [];
  const investment = data?.investment ?? null;
  const recentSales = data?.recent_sales ?? [];
  const alerts = data?.alerts ?? [];

  const currentMonthStat = monthly.find((s) => s.month === m && s.year === y) ?? monthly.at(-1);
  const goalPct = monthGoal ? Math.min(parseFloat(monthGoal.percent_complete), 100) : 0;

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <div>
          <h1>Inicio</h1>
          <p>Tienda de celulares · {formatMonthYear(m, y)}</p>
        </div>
      </div>

      {alerts.length > 0 && (
        <div className="card dashboard-alerts-banner">
          <div className="dashboard-alerts-head">
            <Bell size={18} />
            <strong>{alerts.length} alerta{alerts.length > 1 ? 's' : ''} activa{alerts.length > 1 ? 's' : ''}</strong>
            <Link to="/alertas" className="dashboard-alerts-link">Ver todas →</Link>
          </div>
          <ul className="dashboard-alerts-preview">
            {alerts.slice(0, 3).map((a) => (
              <li key={a.id}>{a.title}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid-4">
        <KpiCard
          title="Ganancia del mes"
          value={formatCurrency(kpis?.total_profit ?? currentMonthStat?.profit ?? 0)}
          icon={TrendingUp}
          variant="accent"
          onClick={() => setDialog('profit')}
        />
        <KpiCard
          title="Ventas del mes"
          value={String(currentMonthStat?.sales_count ?? investment?.sales_count ?? 0)}
          icon={Smartphone}
          subtitle={formatCurrency(currentMonthStat?.profit ?? investment?.total_profit ?? 0)}
          variant="dark"
          onClick={() => setDialog('sales')}
        />
        <KpiCard
          title="Meta del mes"
          value={monthGoal ? `${goalPct.toFixed(0)}%` : '—'}
          icon={Target}
          subtitle={monthGoal ? `Faltan ${formatCurrency(monthGoal.remaining)}` : 'Sin meta'}
          onClick={() => setDialog('goals')}
        />
        <KpiCard
          title="Pagos pendientes"
          value={String(kpis?.pending_payments ?? 0)}
          icon={CreditCard}
          subtitle={kpis?.overdue_payments ? `${kpis.overdue_payments} vencidos` : 'Este mes'}
          onClick={() => setDialog('payments')}
        />
      </div>

      <Suspense fallback={<div className="charts-grid charts-grid--loading"><Spinner /></div>}>
        <DashboardCharts monthly={monthly} investment={investment} month={m} year={y} />
      </Suspense>

      {monthGoal && (
        <div className="card card-spaced chart-card">
          <h3 className="section-title"><Target size={18} /> Progreso meta — {formatMonthYear(m, y)}</h3>
          <div className="goal-row">
            <div className="goal-row-info">
              <strong>{formatCurrency(monthGoal.target_amount)}</strong>
              <span>{formatCurrency(monthGoal.profit)} de {formatCurrency(monthGoal.target_amount)}</span>
            </div>
            <div className="goal-bar"><div className="goal-bar-fill" style={{ width: `${goalPct}%` }} /></div>
            <span className="goal-row-pct">
              {goalPct.toFixed(0)}% · {formatCurrency(monthGoal.payments_total)} pagos + {formatCurrency(monthGoal.base_profit)} base · faltan {formatCurrency(monthGoal.remaining)}
            </span>
          </div>
        </div>
      )}

      <div className="card chart-card">
        <div className="chart-card-header">
          <h3 className="section-title">Últimas 10 ventas</h3>
        </div>
        {recentSales.length === 0 ? (
          <p className="empty-text">Aún no hay ventas completadas. Guárdalas en el Simulador y márcalas como completadas.</p>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Modelo</th>
                  <th>Tipo</th>
                  <th>Invertido</th>
                  <th>Ganancia</th>
                  <th>Margen</th>
                  <th>Fecha</th>
                </tr>
              </thead>
              <tbody>
                {recentSales.map((r) => (
                  <tr key={r.id}>
                    <td>{r.phone_model || r.title}</td>
                    <td>{r.sale_type === 'cambio' ? 'Cambio' : 'Venta'}</td>
                    <td>{formatCurrency(r.total_cost)}</td>
                    <td className="sale-profit">{formatCurrency(r.total_profit)}</td>
                    <td>{formatPercent(r.margin_percent)}</td>
                    <td>{formatDate(r.created_at.slice(0, 10))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Dialog open={dialog === 'profit'} onClose={() => setDialog(null)} title="Ganancia del mes" subtitle={formatMonthYear(m, y)}>
        <p className="dialog-stat">{formatCurrency(kpis?.total_profit ?? 0)}</p>
        <p className="empty-text">Suma de ventas completadas en el mes actual.</p>
      </Dialog>

      <Dialog open={dialog === 'sales'} onClose={() => setDialog(null)} title="Ventas del mes">
        <p className="dialog-stat">{currentMonthStat?.sales_count ?? 0} operaciones</p>
        <p>Ganancia del mes: <strong>{formatCurrency(currentMonthStat?.profit ?? 0)}</strong></p>
      </Dialog>

      <Dialog open={dialog === 'goals'} onClose={() => setDialog(null)} title="Meta del mes">
        {!monthGoal ? (
          <p className="empty-text">Define tu meta en la sección Metas.</p>
        ) : (
          <div className="goal-row">
            <p>Meta total: <strong>{formatCurrency(monthGoal.target_amount)}</strong></p>
            <p>{formatCurrency(monthGoal.payments_total)} pagos + {formatCurrency(monthGoal.base_profit)} base</p>
            <p>Faltan {formatCurrency(monthGoal.remaining)} ({goalPct.toFixed(0)}% avance)</p>
            <div className="goal-bar"><div className="goal-bar-fill" style={{ width: `${goalPct}%` }} /></div>
          </div>
        )}
      </Dialog>

      <Dialog open={dialog === 'payments'} onClose={() => setDialog(null)} title="Pagos pendientes del mes">
        <p className="dialog-stat">{kpis?.pending_payments ?? 0} por pagar</p>
        {kpis?.overdue_payments ? (
          <p className="alert alert-error">{kpis.overdue_payments} pagos vencidos este mes — revisa la sección Pagos.</p>
        ) : (
          <p className="empty-text">Pagos pendientes de {formatMonthYear(m, y)}.</p>
        )}
      </Dialog>
    </div>
  );
}
