import { useCallback, useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Pencil, Trash2, TrendingUp, Percent, Target } from 'lucide-react';
import { Dialog } from '../components/ui/Dialog';
import { MoneyInput } from '../components/ui/MoneyInput';
import { Spinner } from '../components/ui/Spinner';
import { useToast } from '../components/ui/Toast';
import { useData } from '../context/DataContext';
import '../components/ui/Dialog.css';
import { api } from '../services/api';
import { formatCurrency, formatDate, formatMonthName, formatMonthYear, formatPercent } from '../utils/format';
import { fetchMonthOverview, getCachedMonthOverview } from '../utils/monthsOverviewCache';
import { shiftMonth } from '../utils/paymentsCache';
import type { MonthOverview, ProfitabilityRecord } from '../types';
import './SalesPage.css';

export function SalesPage() {
  const { tick, refreshAll } = useData();
  const { showToast } = useToast();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [overview, setOverview] = useState<MonthOverview | null>(
    () => getCachedMonthOverview(now.getFullYear(), now.getMonth() + 1) ?? null,
  );
  const [sales, setSales] = useState<ProfitabilityRecord[]>([]);
  const [loading, setLoading] = useState(() => !getCachedMonthOverview(now.getFullYear(), now.getMonth() + 1));
  const [editSale, setEditSale] = useState<ProfitabilityRecord | null>(null);
  const [editModel, setEditModel] = useState('');
  const [editCost, setEditCost] = useState(0);
  const [editRevenue, setEditRevenue] = useState(0);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ProfitabilityRecord | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async (opts?: { silent?: boolean }) => {
    const cached = getCachedMonthOverview(year, month);
    if (cached) setOverview(cached);
    if (!cached && !opts?.silent) setLoading(true);
    try {
      const [ov, records] = await Promise.all([
        fetchMonthOverview(year, month),
        api.get<ProfitabilityRecord[]>(
          `/api/profitability?record_status=completed&month=${month}&year=${year}`,
        ),
      ]);
      setOverview(ov);
      setSales(records);
    } finally {
      setLoading(false);
    }
  }, [year, month]);

  useEffect(() => {
    const hasCache = !!getCachedMonthOverview(year, month);
    load({ silent: hasCache });
  }, [load, tick]);

  const goMonth = (delta: number) => {
    const next = shiftMonth(month, year, delta);
    setMonth(next.month);
    setYear(next.year);
    const cached = getCachedMonthOverview(next.year, next.month);
    if (cached) setOverview(cached);
  };

  const openEdit = (sale: ProfitabilityRecord) => {
    setEditSale(sale);
    setEditModel(sale.phone_model || sale.title);
    setEditCost(parseFloat(sale.total_cost));
    setEditRevenue(parseFloat(sale.total_revenue));
  };

  const saveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editSale) return;
    setSaving(true);
    try {
      await api.put(`/api/profitability/${editSale.id}`, {
        phone_model: editModel.trim() || null,
        title: editModel.trim() || editSale.title,
        total_cost: editCost,
        total_revenue: editRevenue,
      });
      setEditSale(null);
      refreshAll();
      await load({ silent: true });
      showToast('Venta actualizada');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Error al guardar', 'error');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/api/profitability/${deleteTarget.id}`);
      setDeleteTarget(null);
      refreshAll();
      await load({ silent: true });
      showToast('Venta eliminada');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Error al eliminar', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const editProfit = editRevenue - editCost;

  if (loading && !overview) {
    return (
      <div className="sales-page">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="sales-page">
      <div className="page-header">
        <div>
          <h1>Ventas</h1>
          <p>Ventas completadas · conectado a metas y pagos</p>
        </div>
      </div>

      {overview && (
        <div className="sales-top-summary">
          <div className="summary-card">
            <div className="summary-icon"><TrendingUp size={20} /></div>
            <div>
              <span className="summary-label">Ganancia del mes</span>
              <strong className="summary-value">{formatCurrency(overview.profit)}</strong>
              <span className="summary-sub">{overview.sales_count} ventas completadas</span>
            </div>
          </div>
          <div className="summary-card summary-card-accent">
            <div className="summary-icon"><Percent size={20} /></div>
            <div>
              <span className="summary-label">Margen promedio</span>
              <strong className="summary-value">{formatPercent(overview.margin_percent)}</strong>
            </div>
          </div>
          <div className="summary-card">
            <div className="summary-icon"><Target size={20} /></div>
            <div>
              <span className="summary-label">Falta para meta</span>
              <strong className="summary-value goal-remaining">{formatCurrency(overview.remaining)}</strong>
              <span className="summary-sub">Meta {formatCurrency(overview.target_amount)}</span>
            </div>
          </div>
        </div>
      )}

      <div className="month-nav">
        <button type="button" className="month-nav-btn" onClick={() => goMonth(-1)} aria-label="Mes anterior">
          <ChevronLeft size={22} />
        </button>
        <div className="month-nav-label">
          <span className="month-nav-title">{formatMonthYear(month, year)}</span>
          {month === now.getMonth() + 1 && year === now.getFullYear() && (
            <span className="month-nav-badge">Actual</span>
          )}
        </div>
        <button type="button" className="month-nav-btn" onClick={() => goMonth(1)} aria-label="Mes siguiente">
          <ChevronRight size={22} />
        </button>
      </div>

      <div className="card sales-table-card">
        <h3 className="section-title">Ventas de {formatMonthName(month)} {year}</h3>
        {sales.length === 0 ? (
          <p className="empty-text">
            No hay ventas completadas en {formatMonthName(month)}. Simula en el Simulador, guarda y marca &quot;Completado&quot;.
          </p>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Modelo</th>
                  <th>Tipo</th>
                  <th>Invertido</th>
                  <th>Venta</th>
                  <th>Ganancia</th>
                  <th>Margen</th>
                  <th>Fecha</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {sales.map((r) => (
                  <tr key={r.id}>
                    <td>{r.phone_model || r.title}</td>
                    <td><span className="sale-type-badge">{r.sale_type === 'cambio' ? 'Cambio' : 'Venta'}</span></td>
                    <td>{formatCurrency(r.total_cost)}</td>
                    <td>{formatCurrency(r.total_revenue)}</td>
                    <td className="sale-profit">{formatCurrency(r.total_profit)}</td>
                    <td>{formatPercent(r.margin_percent)}</td>
                    <td>{formatDate(r.created_at.slice(0, 10))}</td>
                    <td>
                      <div className="table-actions">
                        <button type="button" className="payment-action-btn" onClick={() => openEdit(r)} aria-label="Editar venta">
                          <Pencil size={14} />
                        </button>
                        <button type="button" className="payment-action-btn payment-action-delete" onClick={() => setDeleteTarget(r)} aria-label="Eliminar venta">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Dialog
        open={!!editSale}
        onClose={() => setEditSale(null)}
        title="Editar venta"
        subtitle={editSale?.sale_type === 'cambio' ? 'Cambio / permuta' : 'Venta directa'}
      >
        {editSale && (
          <form onSubmit={saveEdit}>
            <div className="form-group">
              <label>Modelo</label>
              <input value={editModel} onChange={(e) => setEditModel(e.target.value)} required />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Invertido (compra)</label>
                <MoneyInput value={editCost} onChange={setEditCost} />
              </div>
              <div className="form-group">
                <label>Precio venta</label>
                <MoneyInput value={editRevenue} onChange={setEditRevenue} />
              </div>
            </div>
            <p className="goal-edit-info">Ganancia estimada: <strong className="sale-profit">{formatCurrency(editProfit)}</strong></p>
            <button type="submit" className="btn btn-primary" disabled={saving}>Guardar cambios</button>
          </form>
        )}
      </Dialog>

      <Dialog
        open={!!deleteTarget}
        onClose={() => !deleting && setDeleteTarget(null)}
        title="Eliminar venta"
        subtitle={deleteTarget ? (deleteTarget.phone_model || deleteTarget.title) : ''}
      >
        {deleteTarget && (
          <>
            <p className="empty-text" style={{ marginBottom: '1.25rem' }}>
              Esta acción no se puede deshacer. La venta dejará de aparecer en Inicio, Ventas y Metas.
            </p>
            <div className="goal-edit-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setDeleteTarget(null)} disabled={deleting}>
                Cancelar
              </button>
              <button type="button" className="btn btn-danger" onClick={confirmDelete} disabled={deleting}>
                {deleting ? 'Eliminando…' : 'Eliminar'}
              </button>
            </div>
          </>
        )}
      </Dialog>
    </div>
  );
}
