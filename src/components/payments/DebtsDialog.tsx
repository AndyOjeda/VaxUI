import { useCallback, useEffect, useState, useRef } from 'react';
import { Landmark, Plus, Trash2, TrendingDown } from 'lucide-react';
import { Dialog } from '../ui/Dialog';
import { MoneyInput } from '../ui/MoneyInput';
import { Spinner } from '../ui/Spinner';
import { useToast } from '../ui/Toast';
import { api } from '../../services/api';
import { formatCurrency } from '../../utils/format';
import type { Debt, DebtSuggestion, DebtsSummary } from '../../types';
import '../../pages/PaymentsPage.css';

interface DebtsDialogProps {
  open: boolean;
  onClose: () => void;
}

function DebtMoneyField({
  label,
  value,
  onSave,
  disabled,
}: {
  label: string;
  value: number;
  onSave: (v: number) => void;
  disabled?: boolean;
}) {
  const [local, setLocal] = useState(value);
  const prev = useRef(value);
  useEffect(() => {
    if (value !== prev.current) {
      setLocal(value);
      prev.current = value;
    }
  }, [value]);

  return (
    <div className="form-group">
      <label>{label}</label>
      <MoneyInput value={local} onChange={setLocal} />
      <button
        type="button"
        className="debts-save-field-btn"
        disabled={disabled || local === value}
        onClick={() => onSave(local)}
      >
        Guardar
      </button>
    </div>
  );
}

export function DebtsDialog({ open, onClose }: DebtsDialogProps) {
  const { showToast } = useToast();
  const [summary, setSummary] = useState<DebtsSummary | null>(null);
  const [suggestions, setSuggestions] = useState<DebtSuggestion[]>([]);
  const [targetMonths, setTargetMonths] = useState(12);
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState<number | null>(null);

  const load = useCallback(async (months: number) => {
    setLoading(true);
    try {
      const [data, sug] = await Promise.all([
        api.get<DebtsSummary>(`/api/debts?target_months=${months}`),
        api.get<DebtSuggestion[]>('/api/debts/suggestions'),
      ]);
      setSummary(data);
      setSuggestions(sug);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al cargar deudas'
      const hint =
        msg.toLowerCase().includes('not found') || msg.includes('404')
          ? ' La API de deudas no está en Render aún: sube VAXBACK o usa VITE_API_URL=local con el backend local.'
          : ''
      showToast(msg + hint, 'error')
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    if (open) load(targetMonths);
  }, [open, targetMonths, load]);

  const updatePaid = async (debt: Debt, amountPaid: number) => {
    setSavingId(debt.id);
    try {
      await api.put(`/api/debts/${debt.id}`, { amount_paid: amountPaid });
      await load(targetMonths);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Error al guardar', 'error');
    } finally {
      setSavingId(null);
    }
  };

  const updateTotal = async (debt: Debt, total: number) => {
    if (!total || total <= 0) return;
    setSavingId(debt.id);
    try {
      await api.put(`/api/debts/${debt.id}`, { total_amount: total });
      await load(targetMonths);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Error al guardar', 'error');
    } finally {
      setSavingId(null);
    }
  };

  const addFromSuggestion = async (s: DebtSuggestion) => {
    try {
      await api.post('/api/debts', {
        concept: s.concept,
        total_amount: parseFloat(s.amount),
        amount_paid: 0,
        recurring_template_id: s.recurring_template_id,
      });
      showToast('Deuda agregada');
      await load(targetMonths);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Error al agregar', 'error');
    }
  };

  const removeDebt = async (id: number) => {
    try {
      await api.delete(`/api/debts/${id}`);
      showToast('Deuda eliminada');
      await load(targetMonths);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Error al eliminar', 'error');
    }
  };

  const totalRemaining = summary ? parseFloat(summary.total_remaining) : 0;
  const recommended = summary ? parseFloat(summary.recommended_monthly) : 0;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Deudas"
      subtitle="Seguimiento aparte de los pagos mensuales"
      wide
    >
      {loading && !summary ? (
        <Spinner />
      ) : (
        <div className="debts-dialog">
          <div className="debts-summary-row">
            <div className="debts-summary-card">
              <Landmark size={18} />
              <div>
                <span className="debts-summary-label">Te falta por pagar</span>
                <strong>{formatCurrency(totalRemaining)}</strong>
              </div>
            </div>
            <div className="debts-summary-card debts-summary-accent">
              <TrendingDown size={18} />
              <div>
                <span className="debts-summary-label">Cuota mensual sugerida</span>
                <strong>{formatCurrency(recommended)}</strong>
              </div>
            </div>
          </div>

          <div className="debts-target-row">
            <label htmlFor="debts-target-months">Meses para saldar todo</label>
            <input
              id="debts-target-months"
              type="number"
              min={1}
              max={120}
              value={targetMonths}
              onChange={(e) => setTargetMonths(Math.max(1, Math.min(120, Number(e.target.value) || 1)))}
            />
          </div>

          {suggestions.length > 0 && (
            <div className="debts-suggestions">
              <p className="debts-section-title">Desde tus pagos recurrentes</p>
              <div className="debts-suggestion-chips">
                {suggestions.map((s) => (
                  <button
                    key={s.concept}
                    type="button"
                    className="debts-suggestion-chip"
                    onClick={() => addFromSuggestion(s)}
                  >
                    <Plus size={14} />
                    {s.concept} · {formatCurrency(s.amount)}/mes
                  </button>
                ))}
              </div>
            </div>
          )}

          {summary && summary.debts.length > 0 ? (
            <ul className="debts-list">
              {summary.debts.map((d) => {
                const remaining = parseFloat(d.remaining);
                const pct = parseFloat(d.total_amount) > 0
                  ? Math.round((parseFloat(d.amount_paid) / parseFloat(d.total_amount)) * 100)
                  : 0;
                return (
                  <li key={d.id} className="debts-item">
                    <div className="debts-item-header">
                      <span className="debts-item-concept">{d.concept}</span>
                      <button
                        type="button"
                        className="payment-action-btn payment-action-delete"
                        onClick={() => removeDebt(d.id)}
                        aria-label="Eliminar deuda"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <div className="debts-item-progress">
                      <div className="debts-item-progress-fill" style={{ width: `${pct}%` }} />
                    </div>
                    <div className="debts-item-fields">
                      <DebtMoneyField
                        label="Total deuda"
                        value={parseFloat(d.total_amount)}
                        onSave={(v) => updateTotal(d, v)}
                        disabled={savingId === d.id}
                      />
                      <DebtMoneyField
                        label="Ya pagaste"
                        value={parseFloat(d.amount_paid)}
                        onSave={(v) => updatePaid(d, v)}
                        disabled={savingId === d.id}
                      />
                      <div className="debts-item-remaining">
                        <span>Falta</span>
                        <strong>{formatCurrency(remaining)}</strong>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="debts-empty">
              Agrega deudas desde los pagos recurrentes arriba o crea pagos mensuales primero.
            </p>
          )}
        </div>
      )}
    </Dialog>
  );
}
