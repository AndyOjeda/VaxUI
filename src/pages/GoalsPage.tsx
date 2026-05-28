import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pencil } from 'lucide-react';
import { Dialog } from '../components/ui/Dialog';
import { MoneyInput } from '../components/ui/MoneyInput';
import { HoverTooltip } from '../components/ui/HoverTooltip';
import { ProgressRing } from '../components/ui/ProgressRing';
import { useData } from '../context/DataContext';
import { useToast } from '../components/ui/Toast';
import '../components/ui/Dialog.css';
import { api } from '../services/api';
import {
  ensureDefaultBusiness,
  formatCurrency,
  formatMonthName,
} from '../utils/format';
import { buildMonthsRange, goalsVisibleFromMonth } from '../utils/monthOverview';
import { dailyTarget, daysLeftInMonth } from '../utils/dates';
import {
  fetchMonthOverview,
  fetchMonthsOverview,
  getCachedMonthOverview,
  getCachedMonthsOverview,
  invalidateMonthsOverviewCache,
} from '../utils/monthsOverviewCache';
import type { MonthOverview } from '../types';
import './GoalsPage.css';

const DEFAULT_BASE_PROFIT = 2_000_000;

export function GoalsPage() {
  const { tick, refreshAll } = useData();
  const { showToast } = useToast();
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  const [year, setYear] = useState(currentYear);
  const fromMonth = goalsVisibleFromMonth(year, now);
  const [businessId, setBusinessId] = useState(0);
  const [months, setMonths] = useState<MonthOverview[]>(
    () => getCachedMonthsOverview(year, fromMonth) ?? [],
  );
  const [loading, setLoading] = useState(
    () => !(getCachedMonthsOverview(year, fromMonth)?.length || getCachedMonthOverview(year, fromMonth)),
  );
  const [editMonth, setEditMonth] = useState<MonthOverview | null>(null);
  const [editBaseProfit, setEditBaseProfit] = useState(DEFAULT_BASE_PROFIT);

  const load = useCallback(async (opts?: { silent?: boolean }) => {
    const visibleFrom = goalsVisibleFromMonth(year);
    const cached = getCachedMonthsOverview(year, visibleFrom);
    if (cached?.length) setMonths(cached);
    if (!cached?.length && !opts?.silent) setLoading(true);

    try {
      const currentCached = getCachedMonthOverview(year, visibleFrom);
      if (!cached?.length) {
        const first = currentCached ?? await fetchMonthOverview(year, visibleFrom);
        setMonths([first]);
        setLoading(false);
      }

      const overview = await fetchMonthsOverview(year, visibleFrom);
      setMonths(overview);
    } finally {
      setLoading(false);
    }
  }, [year]);

  useEffect(() => {
    const visibleFrom = goalsVisibleFromMonth(year);
    const hasCache = !!getCachedMonthsOverview(year, visibleFrom)?.length
      || !!getCachedMonthOverview(year, visibleFrom);
    load({ silent: hasCache });
  }, [load, tick, year]);

  const handleYearChange = (delta: number) => {
    setYear((y) => {
      const next = y + delta;
      const visibleFrom = goalsVisibleFromMonth(next, now);
      const cached = getCachedMonthsOverview(next, visibleFrom);
      setMonths(cached ?? []);
      setLoading(!cached?.length && !getCachedMonthOverview(next, visibleFrom));
      return next;
    });
  };

  const visibleMonths = useMemo(
    () => buildMonthsRange(year, fromMonth, 12, months),
    [year, fromMonth, months],
  );

  const openEdit = async (m: MonthOverview) => {
    if (!businessId) {
      const bid = await ensureDefaultBusiness();
      setBusinessId(bid);
    }
    setEditMonth(m);
    setEditBaseProfit(parseFloat(m.base_profit));
  };

  const editPayments = editMonth ? parseFloat(editMonth.payments_total) : 0;
  const editTarget = editPayments + editBaseProfit;
  const editRemaining = editMonth ? parseFloat(editMonth.remaining) : 0;
  const editDaysLeft = editMonth ? daysLeftInMonth(editMonth.year, editMonth.month) : 1;
  const editDaily = editMonth ? dailyTarget(editRemaining, editMonth.year, editMonth.month) : 0;

  const saveGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editMonth) return;
    const bid = businessId || await ensureDefaultBusiness();
    if (!businessId) setBusinessId(bid);
    try {
      await api.post(`/api/goals/businesses/${bid}`, {
        year: editMonth.year,
        month: editMonth.month,
        base_profit: editBaseProfit,
      });
      setEditMonth(null);
      invalidateMonthsOverviewCache();
      refreshAll();
      await load({ silent: true });
      showToast('Meta guardada correctamente');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Error al guardar meta', 'error');
    }
  };

  const resetBaseProfit = () => setEditBaseProfit(DEFAULT_BASE_PROFIT);

  const isCurrentYear = year === currentYear;

  return (
    <div className="goals-page">
      <div className="page-header">
        <div>
          <h1>Metas {year}</h1>
          <p>
            Meta = pagos del mes + ganancia base (por defecto {formatCurrency(DEFAULT_BASE_PROFIT)})
            {isCurrentYear && ` · Desde ${formatMonthName(fromMonth)}`}
          </p>
        </div>
        <div className="year-nav">
          <button type="button" className="month-nav-btn" onClick={() => handleYearChange(-1)} aria-label="Año anterior">←</button>
          <span>{year}</span>
          <button type="button" className="month-nav-btn" onClick={() => handleYearChange(1)} aria-label="Año siguiente">→</button>
        </div>
      </div>

      <div className="goals-grid">
        {visibleMonths.map((m) => {
          const pct = Math.min(parseFloat(m.percent_complete), 100);
          const target = parseFloat(m.target_amount);
          const payments = parseFloat(m.payments_total);
          const base = parseFloat(m.base_profit);
          const remaining = parseFloat(m.remaining);
          const pendingPay = parseFloat(m.payments_pending);
          const daysLeft = daysLeftInMonth(year, m.month);
          const perDay = dailyTarget(remaining, year, m.month);
          const showDaily = isCurrentYear && (m.month >= currentMonth || year > currentYear) && remaining > 0;
          const hasData = months.some((x) => x.month === m.month);
          const isRefreshing = loading && !hasData;
          const isCurrent = isCurrentYear && m.month === currentMonth;
          return (
            <div
              key={m.month}
              className={`card goal-month-horizontal ${isRefreshing ? 'goal-skeleton' : ''} ${isCurrent ? 'goal-month-current' : ''}`}
            >
              <div className="goal-h-info">
                <div className="goal-h-top">
                  <span className="goal-h-name">
                    {formatMonthName(m.month)}
                    {isCurrent && <span className="goal-current-badge">Actual</span>}
                  </span>
                  <button
                    type="button"
                    className="payment-action-btn"
                    onClick={() => openEdit(m)}
                    aria-label="Editar meta"
                    disabled={isRefreshing}
                  >
                    <Pencil size={14} />
                  </button>
                </div>
                <strong className="goal-h-target">{isRefreshing ? '…' : formatCurrency(remaining)}</strong>
                <p className="goal-h-formula">
                  {isRefreshing ? '…' : `${formatCurrency(payments)} pagos + ${formatCurrency(base)} base`}
                </p>
                <p className="goal-h-pending">
                  {isRefreshing ? '…' : `Por pagar ${formatCurrency(pendingPay)}`}
                </p>
                <p className="goal-h-total">
                  {isRefreshing ? 'Cargando…' : `Total ${formatCurrency(target)}`}
                </p>
              </div>
              <div className="goal-h-ring">
                {showDaily && !isRefreshing ? (
                  <HoverTooltip
                    content={
                      <>
                        <strong>{formatCurrency(perDay)}</strong>
                        <span>por día · {daysLeft} días restantes</span>
                      </>
                    }
                  >
                    <ProgressRing percent={pct} size={64} label="avance" />
                  </HoverTooltip>
                ) : (
                  <ProgressRing percent={isRefreshing ? 0 : pct} size={64} label="avance" />
                )}
              </div>
            </div>
          );
        })}
      </div>

      <Dialog
        open={!!editMonth}
        onClose={() => setEditMonth(null)}
        title={editMonth ? `Meta ${formatMonthName(editMonth.month)} ${editMonth.year}` : ''}
        subtitle="La meta se calcula con los pagos del mes más la ganancia base"
      >
        {editMonth && (
          <form onSubmit={saveGoal}>
            <div className="form-group goal-daily-box">
              <label>¿Cuánto debes ganar por día?</label>
              <p className="goal-edit-total">{formatCurrency(editDaily)}</p>
              <p className="goal-edit-info">
                {editDaysLeft} días restantes · faltan {formatCurrency(editRemaining)} para la meta
              </p>
            </div>
            <div className="form-group">
              <label>Pagos del mes</label>
              <p className="goal-edit-readonly">{formatCurrency(editMonth.payments_total)}</p>
            </div>
            <div className="form-group">
              <label>Ganancia base (COP)</label>
              <MoneyInput value={editBaseProfit} onChange={setEditBaseProfit} required />
            </div>
            <div className="form-group">
              <label>Meta total del mes</label>
              <p className="goal-edit-total">{formatCurrency(editTarget)}</p>
              <p className="goal-edit-info">
                {formatCurrency(editMonth.payments_total)} + {formatCurrency(editBaseProfit)}
              </p>
            </div>
            <div className="goal-edit-actions">
              <button type="button" className="btn btn-secondary" onClick={resetBaseProfit}>
                Restablecer base ({formatCurrency(DEFAULT_BASE_PROFIT)})
              </button>
              <button type="submit" className="btn btn-primary">Guardar meta</button>
            </div>
          </form>
        )}
      </Dialog>
    </div>
  );
}
