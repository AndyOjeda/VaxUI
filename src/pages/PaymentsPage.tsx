import { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, Trash2, ChevronLeft, ChevronRight, Check, Pencil, Wallet, CircleDollarSign, Percent, Banknote } from 'lucide-react';
import { Dialog } from '../components/ui/Dialog';
import { MoneyInput } from '../components/ui/MoneyInput';
import { Spinner } from '../components/ui/Spinner';
import { useToast } from '../components/ui/Toast';
import { useData } from '../context/DataContext';
import '../components/ui/Dialog.css';
import { api } from '../services/api';
import { formatCurrency, formatDate, formatMonthYear } from '../utils/format';
import {
  fetchPaymentsMonth,
  fetchRecurringConcepts,
  getCachedPayments,
  invalidatePaymentsCache,
  prefetchAdjacentMonths,
  shiftMonth,
  sortPayments,
} from '../utils/paymentsCache';
import { invalidateMonthsOverviewCache } from '../utils/monthsOverviewCache';
import { getAbonoTotal, serializePaymentNotes } from '../utils/paymentNotes';
import type { Payment } from '../types';
import './PaymentsPage.css';

const emptyForm = {
  concept: '',
  amount: 0,
  due_date: '',
  category: '',
  is_recurring: false,
  recurring_day: '1',
};

type PaymentFormData = typeof emptyForm;

function defaultDueDate(month: number, year: number, day = 1): string {
  const safeDay = Math.min(Math.max(day, 1), 28);
  return `${year}-${String(month).padStart(2, '0')}-${String(safeDay).padStart(2, '0')}`;
}

interface PaymentFormProps {
  form: PaymentFormData;
  setForm: React.Dispatch<React.SetStateAction<PaymentFormData>>;
  onSubmit: (e: React.FormEvent) => void;
  submitLabel: string;
  saving?: boolean;
  isRecurringEdit?: boolean;
  applyToAll?: boolean;
  onApplyToAllChange?: (v: boolean) => void;
}

function PaymentForm({
  form,
  setForm,
  onSubmit,
  submitLabel,
  saving,
  isRecurringEdit,
  applyToAll,
  onApplyToAllChange,
}: PaymentFormProps) {
  return (
    <form onSubmit={onSubmit}>
      <div className="form-row">
        <div className="form-group">
          <label>Concepto</label>
          <input value={form.concept} onChange={(e) => setForm({ ...form, concept: e.target.value })} placeholder="Ej: Arriendo local" required />
        </div>
        <div className="form-group">
          <label>Monto</label>
          <MoneyInput value={form.amount} onChange={(v) => setForm({ ...form, amount: v })} />
        </div>
        <div className="form-group">
          <label>Vencimiento</label>
          <input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} required />
        </div>
        <div className="form-group">
          <label>Categoría</label>
          <input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Local, servicios..." />
        </div>
      </div>
      <label className="checkbox-row">
        <input type="checkbox" checked={form.is_recurring} onChange={(e) => setForm({ ...form, is_recurring: e.target.checked })} />
        Repetir automáticamente cada mes
      </label>
      {form.is_recurring && (
        <div className="form-group">
          <label>Día del mes (1-28)</label>
          <input type="number" min={1} max={28} value={form.recurring_day} onChange={(e) => setForm({ ...form, recurring_day: e.target.value })} />
        </div>
      )}
      {isRecurringEdit && onApplyToAllChange && (
        <label className="checkbox-row apply-all-row">
          <input type="checkbox" checked={!!applyToAll} onChange={(e) => onApplyToAllChange(e.target.checked)} />
          Afectar todos los meses (plantilla y futuros)
        </label>
      )}
      <button type="submit" className="btn btn-primary" disabled={saving}>{submitLabel}</button>
    </form>
  );
}

export function PaymentsPage() {
  const { showToast } = useToast();
  const { tick, refreshAll } = useData();
  const now = new Date();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [recurringConcepts, setRecurringConcepts] = useState<Set<string>>(new Set());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [createOpen, setCreateOpen] = useState(false);
  const [editPayment, setEditPayment] = useState<Payment | null>(null);
  const [applyToAllRecurring, setApplyToAllRecurring] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [abonoTarget, setAbonoTarget] = useState<Payment | null>(null);
  const [abonoAmount, setAbonoAmount] = useState(0);
  const [abonoSaving, setAbonoSaving] = useState(false);

  const loadMonth = useCallback(async (m: number, y: number, opts?: { silent?: boolean }) => {
    const cached = getCachedPayments(m, y);
    if (cached) setPayments(cached);
    if (!cached && !opts?.silent) setRefreshing(true);

    try {
      const [list, recurring] = await Promise.all([
        fetchPaymentsMonth(m, y),
        fetchRecurringConcepts(),
      ]);
      setPayments(list);
      setRecurringConcepts(recurring);
      prefetchAdjacentMonths(m, y);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const cached = getCachedPayments(month, year);
    if (cached) setPayments(cached);
    loadMonth(month, year, { silent: !!cached });
  }, [month, year, tick, loadMonth]);

  const sorted = useMemo(() => sortPayments(payments), [payments]);

  const monthTotal = sorted.reduce((s, p) => s + parseFloat(p.amount), 0);
  const paidTotal = sorted.filter((p) => p.status === 'paid').reduce((s, p) => s + parseFloat(p.amount), 0);
  const pendingTotal = monthTotal - paidTotal;
  const percentComplete = monthTotal > 0 ? Math.round((paidTotal / monthTotal) * 100) : 0;
  const percentRemaining = 100 - percentComplete;
  const paidCount = sorted.filter((p) => p.status === 'paid').length;

  const openCreate = () => {
    setForm({ ...emptyForm, due_date: defaultDueDate(month, year) });
    setCreateOpen(true);
  };

  const goMonth = (delta: number) => {
    const next = shiftMonth(month, year, delta);
    const cached = getCachedPayments(next.month, next.year);
    if (cached) setPayments(cached);
    setMonth(next.month);
    setYear(next.year);
  };

  const afterMutation = () => {
    invalidatePaymentsCache();
    invalidateMonthsOverviewCache();
    refreshAll();
    return loadMonth(month, year, { silent: true });
  };

  const togglePaid = async (p: Payment) => {
    const nextStatus = p.status === 'paid' ? 'pending' : 'paid';
    setPayments((prev) => sortPayments(prev.map((x) => (x.id === p.id ? { ...x, status: nextStatus } : x))));
    try {
      await api.put(`/api/payments/${p.id}`, { status: nextStatus });
      invalidatePaymentsCache();
      refreshAll();
      prefetchAdjacentMonths(month, year);
      showToast(nextStatus === 'paid' ? 'Pago marcado como completado' : 'Pago marcado como pendiente');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Error al actualizar el pago', 'error');
      loadMonth(month, year);
    }
  };

  const openEdit = (p: Payment, e: React.MouseEvent) => {
    e.stopPropagation();
    setApplyToAllRecurring(false);
    setEditPayment(p);
    setForm({
      concept: p.concept,
      amount: parseFloat(p.amount),
      due_date: p.due_date,
      category: p.category || '',
      is_recurring: false,
      recurring_day: String(p.recurring_day || new Date(p.due_date + 'T00:00:00').getDate()),
    });
  };

  const validateForm = (): boolean => {
    if (!form.concept.trim()) {
      showToast('Ingresa un concepto', 'error');
      return false;
    }
    if (!form.amount || form.amount <= 0) {
      showToast('Ingresa un monto mayor a 0', 'error');
      return false;
    }
    if (!form.due_date) {
      showToast('Selecciona una fecha de vencimiento', 'error');
      return false;
    }
    return true;
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setSaving(true);
    try {
      await api.post('/api/payments', {
        concept: form.concept.trim(),
        amount: form.amount,
        due_date: form.due_date,
        category: form.category || null,
        is_recurring: form.is_recurring,
        recurring_day: form.is_recurring ? Number(form.recurring_day) : null,
      });
      setForm(emptyForm);
      setCreateOpen(false);
      await afterMutation();
      showToast('Pago creado correctamente');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Error al guardar el pago', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editPayment || !validateForm()) return;
    setSaving(true);
    try {
      const isRecurring =
        !!editPayment.recurring_template_id || recurringConcepts.has(editPayment.concept);
      await api.put(`/api/payments/${editPayment.id}`, {
        concept: form.concept.trim(),
        amount: form.amount,
        due_date: form.due_date,
        category: form.category || null,
        apply_to_all_recurring: isRecurring && applyToAllRecurring,
      });
      setEditPayment(null);
      setApplyToAllRecurring(false);
      setForm(emptyForm);
      await afterMutation();
      showToast('Pago actualizado correctamente');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Error al actualizar el pago', 'error');
    } finally {
      setSaving(false);
    }
  };

  const openAbono = (p: Payment, e: React.MouseEvent) => {
    e.stopPropagation();
    setAbonoTarget(p);
    setAbonoAmount(getAbonoTotal(p.notes));
  };

  const saveAbono = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!abonoTarget) return;
    const total = parseFloat(abonoTarget.amount);
    if (abonoAmount < 0) {
      showToast('Ingresa un abono válido', 'error');
      return;
    }
    if (abonoAmount > total) {
      showToast('El abono no puede superar el monto del pago', 'error');
      return;
    }
    setAbonoSaving(true);
    try {
      await api.put(`/api/payments/${abonoTarget.id}`, {
        notes: serializePaymentNotes({ abono_total: abonoAmount }, abonoTarget.notes),
      });
      setAbonoTarget(null);
      await afterMutation();
      showToast(abonoAmount > 0 ? 'Abono registrado' : 'Abono eliminado');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Error al guardar abono', 'error');
    } finally {
      setAbonoSaving(false);
    }
  };

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.delete(`/api/payments/${id}`);
      await afterMutation();
      showToast('Pago eliminado');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Error al eliminar', 'error');
    }
  };

  if (refreshing && payments.length === 0) {
    return (
      <div className="payments-page">
        <Spinner />
      </div>
    );
  }

  return (
    <div className={`payments-page ${refreshing ? 'is-refreshing' : ''}`}>
      <div className="page-header">
        <div>
          <h1>Pagos</h1>
          <p>{paidCount}/{sorted.length} completados este mes</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={openCreate}>
          <Plus size={16} /> Agregar
        </button>
      </div>

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

      <div className="payments-summary">
        <div className="summary-card">
          <div className="summary-icon"><Wallet size={20} /></div>
          <div>
            <span className="summary-label">Total del mes</span>
            <strong className="summary-value">{formatCurrency(monthTotal)}</strong>
          </div>
        </div>
        <div className="summary-card summary-card-accent">
          <div className="summary-icon"><CircleDollarSign size={20} /></div>
          <div>
            <span className="summary-label">Por pagar</span>
            <strong className="summary-value">{formatCurrency(pendingTotal)}</strong>
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-icon"><Percent size={20} /></div>
          <div>
            <span className="summary-label">Te falta</span>
            <strong className="summary-value">{percentRemaining}%</strong>
            <span className="summary-sub">para completar el 100%</span>
          </div>
        </div>
      </div>

      <div className="progress-block card">
        <div className="progress-header">
          <span>Progreso del mes</span>
          <strong>{percentComplete}% pagado</strong>
        </div>
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${percentComplete}%` }} />
        </div>
        <div className="progress-footer">
          <span>Pagado: {formatCurrency(paidTotal)}</span>
          <span>Falta: {formatCurrency(pendingTotal)}</span>
        </div>
      </div>

      <div className="payments-list">
        {sorted.map((p) => {
          const isPaid = p.status === 'paid';
          const isOverdue = p.status === 'overdue';
          const isMonthly = recurringConcepts.has(p.concept);
          const totalAmount = parseFloat(p.amount);
          const abono = getAbonoTotal(p.notes);
          const remaining = Math.max(totalAmount - abono, 0);
          return (
            <div key={p.id} className={`payment-list-card ${isPaid ? 'is-paid' : ''} ${isOverdue ? 'is-overdue' : ''}`}>
              <button type="button" className="payment-toggle" onClick={() => togglePaid(p)}>
                <span className={`payment-check ${isPaid ? 'checked' : ''}`}>
                  {isPaid && <Check size={14} strokeWidth={3} />}
                </span>
                <div className="payment-list-body">
                  <span className="payment-list-concept">{p.concept}</span>
                  <div className="payment-list-meta">
                    <span className={isPaid ? 'struck' : ''}>{formatDate(p.due_date)}</span>
                    {p.category && <span className="payment-list-cat">{p.category}</span>}
                    {isMonthly && <span className="payment-monthly-tag">Mensual</span>}
                    {isOverdue && !isPaid && <span className="payment-overdue-tag">Vencido</span>}
                  </div>
                </div>
              </button>
              <div className="payment-list-end">
                <div className={`payment-list-amounts ${isPaid ? 'is-paid' : ''}`}>
                  <span className={`payment-list-amount ${isPaid ? 'struck' : ''}`}>{formatCurrency(p.amount)}</span>
                  {abono > 0 && !isPaid && (
                    <>
                      <span className="payment-list-abono">Abono {formatCurrency(abono)}</span>
                      <span className="payment-list-remaining">Falta {formatCurrency(remaining)}</span>
                    </>
                  )}
                </div>
                <div className="payment-actions">
                  <button type="button" className="payment-action-btn payment-action-abono" onClick={(e) => openAbono(p, e)} aria-label="Abono" title="Registrar abono">
                    <Banknote size={15} />
                  </button>
                  <button type="button" className="payment-action-btn" onClick={(e) => openEdit(p, e)} aria-label="Editar">
                    <Pencil size={15} />
                  </button>
                  <button type="button" className="payment-action-btn payment-action-delete" onClick={(e) => handleDelete(p.id, e)} aria-label="Eliminar">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {sorted.length === 0 && !refreshing && (
        <div className="payments-empty card">
          <p className="empty-text">No hay pagos en {formatMonthYear(month, year)}.</p>
          <button type="button" className="btn btn-secondary" onClick={openCreate}>Agregar primer pago</button>
        </div>
      )}

      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} title="Nuevo pago" subtitle="Se repetirá solo si lo marcas como mensual" wide>
        <PaymentForm form={form} setForm={setForm} onSubmit={handleCreate} submitLabel="Guardar pago" saving={saving} />
      </Dialog>

      <Dialog
        open={!!abonoTarget}
        onClose={() => !abonoSaving && setAbonoTarget(null)}
        title="Registrar abono"
        subtitle={abonoTarget?.concept}
      >
        {abonoTarget && (
          <form onSubmit={saveAbono}>
            <p className="payment-abono-hint">
              Monto del pago: <strong>{formatCurrency(abonoTarget.amount)}</strong>
            </p>
            <div className="form-group">
              <label>Total abonado hasta ahora</label>
              <MoneyInput value={abonoAmount} onChange={setAbonoAmount} />
            </div>
            {abonoAmount > 0 && (
              <p className="payment-abono-preview">
                Falta por pagar: <strong>{formatCurrency(Math.max(parseFloat(abonoTarget.amount) - abonoAmount, 0))}</strong>
              </p>
            )}
            <div className="goal-edit-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setAbonoTarget(null)} disabled={abonoSaving}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary" disabled={abonoSaving}>
                {abonoSaving ? 'Guardando…' : 'Guardar abono'}
              </button>
            </div>
          </form>
        )}
      </Dialog>

      <Dialog
        open={!!editPayment}
        onClose={() => { setEditPayment(null); setApplyToAllRecurring(false); }}
        title="Editar pago"
        subtitle={
          editPayment && (editPayment.recurring_template_id || recurringConcepts.has(editPayment.concept))
            ? `${editPayment.concept} · Solo este mes salvo que marques afectar todos`
            : editPayment?.concept
        }
        wide
      >
        <PaymentForm
          form={form}
          setForm={setForm}
          onSubmit={handleEdit}
          submitLabel="Guardar cambios"
          saving={saving}
          isRecurringEdit={
            !!editPayment && (!!editPayment.recurring_template_id || recurringConcepts.has(editPayment.concept))
          }
          applyToAll={applyToAllRecurring}
          onApplyToAllChange={setApplyToAllRecurring}
        />
      </Dialog>
    </div>
  );
}
