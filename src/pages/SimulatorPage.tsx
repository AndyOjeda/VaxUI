import { useEffect, useState } from 'react';
import { ArrowLeftRight, DollarSign, Plus, Trash2, Save, CheckCircle2, Pencil } from 'lucide-react';
import { calculateTradeProfit, type TradeInPhone } from '../utils/simulator';
import {
  buildVentaDraftPayload,
  buildCambioDraftPayload,
  buildVentaDraftUpdate,
  buildCambioDraftUpdate,
  parseTradeInsFromNotes,
} from '../utils/saleRecords';
import { calcVentaDirecta, ensureDefaultBusiness, formatCurrency, formatDate, formatPercent } from '../utils/format';
import { MoneyInput } from '../components/ui/MoneyInput';
import { Dialog } from '../components/ui/Dialog';
import { useToast } from '../components/ui/Toast';
import { useData } from '../context/DataContext';
import { api } from '../services/api';
import type { ProfitabilityRecord } from '../types';
import '../components/ui/Dialog.css';
import './SimulatorPage.css';

type Mode = null | 'venta' | 'cambio';

const emptyTradeIn = (): TradeInPhone => ({ model: '', receivedPrice: 0, resalePrice: 0 });

export function SimulatorPage() {
  const { showToast } = useToast();
  const { refreshAll } = useData();
  const [mode, setMode] = useState<Mode>(null);
  const [businessId, setBusinessId] = useState(0);
  const [drafts, setDrafts] = useState<ProfitabilityRecord[]>([]);
  const [saving, setSaving] = useState(false);
  const [loadingBusiness, setLoadingBusiness] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<ProfitabilityRecord | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [editTarget, setEditTarget] = useState<ProfitabilityRecord | null>(null);
  const [editSaving, setEditSaving] = useState(false);
  const [editPhoneModel, setEditPhoneModel] = useState('');
  const [editBuyPrice, setEditBuyPrice] = useState(0);
  const [editSellPrice, setEditSellPrice] = useState(0);
  const [editMyModel, setEditMyModel] = useState('');
  const [editMyBuyPrice, setEditMyBuyPrice] = useState(0);
  const [editSellToClient, setEditSellToClient] = useState(0);
  const [editCash, setEditCash] = useState(0);
  const [editTradeIns, setEditTradeIns] = useState<TradeInPhone[]>([emptyTradeIn()]);

  const [phoneModel, setPhoneModel] = useState('');
  const [buyPrice, setBuyPrice] = useState(0);
  const [sellPrice, setSellPrice] = useState(0);

  const [myModel, setMyModel] = useState('');
  const [myBuyPrice, setMyBuyPrice] = useState(0);
  const [sellPriceToClient, setSellPriceToClient] = useState(0);
  const [cashFromCustomer, setCashFromCustomer] = useState(0);
  const [tradeIns, setTradeIns] = useState<TradeInPhone[]>([emptyTradeIn()]);

  const ventaResult = calcVentaDirecta(buyPrice, sellPrice);
  const cambioResult = calculateTradeProfit({
    buyPrice: myBuyPrice,
    sellPriceToClient,
    cashFromCustomer,
    tradeIns,
  });

  const loadDrafts = async (saleType: 'venta' | 'cambio') => {
    const list = await api.get<ProfitabilityRecord[]>(
      `/api/profitability?record_status=draft&sale_type=${saleType}`,
    );
    setDrafts(list);
  };

  useEffect(() => {
    ensureDefaultBusiness()
      .then(setBusinessId)
      .finally(() => setLoadingBusiness(false));
  }, []);

  useEffect(() => {
    if (mode === 'venta' || mode === 'cambio') loadDrafts(mode);
  }, [mode]);

  const updateTradeIn = (index: number, patch: Partial<TradeInPhone>) => {
    setTradeIns((prev) => prev.map((x, j) => (j === index ? { ...x, ...patch } : x)));
  };

  const saveDraft = async () => {
    if (!businessId) {
      showToast('No se pudo cargar el negocio', 'error');
      return;
    }
    if (mode === 'venta' && (!buyPrice || !sellPrice)) {
      showToast('Ingresa precio de compra y venta al cliente', 'error');
      return;
    }
    setSaving(true);
    try {
      if (mode === 'venta') {
        await api.post('/api/profitability', buildVentaDraftPayload(
          businessId, phoneModel, buyPrice, sellPrice,
        ));
        await loadDrafts('venta');
      } else if (mode === 'cambio') {
        await api.post('/api/profitability', buildCambioDraftPayload(
          businessId, myModel, myBuyPrice, sellPriceToClient,
          cashFromCustomer, tradeIns,
        ));
        await loadDrafts('cambio');
      }
      showToast('Venta guardada — marca completado para registrarla');
    } catch {
      showToast('Error al guardar la venta', 'error');
    } finally {
      setSaving(false);
    }
  };

  const completeDraft = async (id: number) => {
    try {
      await api.post(`/api/profitability/${id}/complete`, {});
      if (mode) loadDrafts(mode);
      refreshAll();
      showToast('Venta marcada como completada');
    } catch {
      showToast('Error al completar la venta', 'error');
    }
  };

  const openEditDraft = (draft: ProfitabilityRecord) => {
    setEditTarget(draft);
    if (draft.sale_type === 'cambio') {
      setEditMyModel(draft.phone_model || draft.title);
      setEditMyBuyPrice(+draft.total_cost);
      setEditSellToClient(draft.items[0] ? +draft.items[0].sell_price : +draft.total_revenue);
      setEditCash(+(draft.cash_adjustment ?? 0));
      setEditTradeIns(parseTradeInsFromNotes(draft.notes));
    } else {
      setEditPhoneModel(draft.phone_model || draft.title);
      setEditBuyPrice(parseFloat(draft.total_cost));
      setEditSellPrice(parseFloat(draft.total_revenue));
    }
  };

  const updateEditTradeIn = (index: number, patch: Partial<TradeInPhone>) => {
    setEditTradeIns((prev) => prev.map((x, j) => (j === index ? { ...x, ...patch } : x)));
  };

  const saveEditDraft = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTarget) return;
    setEditSaving(true);
    try {
      const body =
        editTarget.sale_type === 'cambio'
          ? buildCambioDraftUpdate(
              editMyModel,
              editMyBuyPrice,
              editSellToClient,
              editCash,
              editTradeIns,
            )
          : buildVentaDraftUpdate(editPhoneModel, editBuyPrice, editSellPrice);
      await api.put(`/api/profitability/${editTarget.id}`, body);
      setEditTarget(null);
      if (mode) loadDrafts(mode);
      refreshAll();
      showToast('Cifras actualizadas');
    } catch {
      showToast('Error al guardar cambios', 'error');
    } finally {
      setEditSaving(false);
    }
  };

  const editVentaPreview = calcVentaDirecta(editBuyPrice, editSellPrice);
  const editCambioPreview = calculateTradeProfit({
    buyPrice: editMyBuyPrice,
    sellPriceToClient: editSellToClient,
    cashFromCustomer: editCash,
    tradeIns: editTradeIns,
  });

  const confirmDeleteDraft = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/api/profitability/${deleteTarget.id}`);
      setDeleteTarget(null);
      if (mode) loadDrafts(mode);
      refreshAll();
      showToast('Borrador eliminado');
    } catch {
      showToast('Error al eliminar', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const DraftTable = ({ type }: { type: 'venta' | 'cambio' }) => (
    <div className="sim-drafts card">
      <h3 className="section-title">{type === 'venta' ? 'Ventas directas guardadas' : 'Cambios guardados'}</h3>
      {drafts.length === 0 ? (
        <p className="empty-text">Sin simulaciones guardadas. Usa &quot;Guardar venta&quot; arriba.</p>
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Modelo</th>
                <th>Compra</th>
                <th>Venta</th>
                <th>Ganancia est.</th>
                <th>Estado</th>
                <th>Fecha</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {drafts.map((d) => (
                <tr key={d.id}>
                  <td>{d.phone_model || d.title}</td>
                  <td>{formatCurrency(d.total_cost)}</td>
                  <td>{formatCurrency(d.total_revenue)}</td>
                  <td className="sale-profit">{formatCurrency(d.total_profit)}</td>
                  <td><span className="badge badge-pending">Pendiente</span></td>
                  <td>{formatDate(d.created_at.slice(0, 10))}</td>
                  <td className="table-actions">
                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => openEditDraft(d)}>
                      <Pencil size={14} /> Editar
                    </button>
                    <button type="button" className="btn btn-primary btn-sm" onClick={() => completeDraft(d.id)}>
                      <CheckCircle2 size={14} /> Completar
                    </button>
                    <button type="button" className="btn btn-danger btn-sm" onClick={() => setDeleteTarget(d)} aria-label="Eliminar">
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  if (!mode) {
    return (
      <div>
        <div className="page-header">
          <div>
            <h1>Simulador</h1>
            <p>Simula y guarda ventas; al marcarlas completadas aparecen en Inicio y Ventas</p>
          </div>
        </div>
        <div className="mode-cards">
          <button type="button" className="mode-card" onClick={() => setMode('venta')}>
            <div className="mode-card-icon"><DollarSign size={20} /></div>
            <h3>Venta directa</h3>
            <p>Calcula ganancia según compra y precio al cliente.</p>
          </button>
          <button type="button" className="mode-card" onClick={() => setMode('cambio')}>
            <div className="mode-card-icon"><ArrowLeftRight size={20} /></div>
            <h3>Cambio / permuta</h3>
            <p>Efectivo + celulares recibidos como pago.</p>
          </button>
        </div>
      </div>
    );
  }

  if (loadingBusiness) {
    return <div className="card"><p className="empty-text">Cargando...</p></div>;
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>{mode === 'venta' ? 'Simulador de venta' : 'Simulador de cambio'}</h1>
          <p>Guarda la venta y luego márcala como completada para registrarla en Inicio y Ventas</p>
        </div>
        <div className="header-actions">
          <button type="button" className="btn btn-primary" onClick={saveDraft} disabled={saving}>
            <Save size={16} /> Guardar venta
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => setMode(null)}>Cambiar tipo</button>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          {mode === 'venta' ? (
            <>
              <div className="form-group">
                <label>Modelo del celular</label>
                <input value={phoneModel} onChange={(e) => setPhoneModel(e.target.value)} placeholder="iPhone 14 Pro" />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Precio compra</label>
                  <MoneyInput value={buyPrice} onChange={setBuyPrice} />
                </div>
                <div className="form-group">
                  <label>Precio venta cliente</label>
                  <MoneyInput value={sellPrice} onChange={setSellPrice} />
                </div>
              </div>
              <div className="result-box">
                <span>Ganancia</span>
                <div>
                  <strong className={ventaResult.profit >= 0 ? 'sale-profit' : 'text-danger'}>
                    {formatCurrency(ventaResult.profit)}
                  </strong>
                  {buyPrice > 0 && sellPrice > 0 && (
                    <span className="result-diff">
                      {sellPrice >= buyPrice ? '+' : ''}{formatCurrency(ventaResult.profit)} de diferencia
                    </span>
                  )}
                </div>
              </div>
            </>
          ) : (
            <>
              <h3 className="section-title">Tu celular</h3>
              <div className="form-group">
                <label>Modelo</label>
                <input value={myModel} onChange={(e) => setMyModel(e.target.value)} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Precio compra</label>
                  <MoneyInput value={myBuyPrice} onChange={setMyBuyPrice} />
                </div>
                <div className="form-group">
                  <label>Precio venta a cliente</label>
                  <MoneyInput value={sellPriceToClient} onChange={setSellPriceToClient} />
                </div>
                <div className="form-group">
                  <label>Efectivo del cliente</label>
                  <MoneyInput value={cashFromCustomer} onChange={setCashFromCustomer} />
                </div>
              </div>
              <h3 className="section-title">Celulares recibidos</h3>
              {tradeIns.map((t, i) => (
                <div key={i} className="trade-in-block">
                  <div className="trade-in-row">
                    <div className="form-group">
                      <label>Modelo</label>
                      <input value={t.model} onChange={(e) => updateTradeIn(i, { model: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label>Precio recibido</label>
                      <MoneyInput value={t.receivedPrice} onChange={(v) => updateTradeIn(i, { receivedPrice: v })} />
                    </div>
                    <div className="form-group">
                      <label>Precio reventa</label>
                      <MoneyInput value={t.resalePrice} onChange={(v) => updateTradeIn(i, { resalePrice: v })} />
                    </div>
                  </div>
                </div>
              ))}
              {tradeIns.length < 3 && (
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setTradeIns((p) => [...p, emptyTradeIn()])}>
                  <Plus size={14} /> Agregar celular
                </button>
              )}
            </>
          )}
        </div>

        <div className="card card-dark">
          <h3 className="section-title">Resultado</h3>
          {mode === 'venta' ? (
            <>
              <p className="sim-big">{formatPercent(ventaResult.marginPercent)}</p>
              <p className="sim-result-label">Porcentaje de ganancia</p>
              <p>Ganancia: <strong className="sale-profit">{formatCurrency(ventaResult.profit)}</strong></p>
            </>
          ) : (
            <>
              <div className="result-total-box">
                <div><span>Ganancia total</span><strong className="sim-big-inline">{formatCurrency(cambioResult.totalProfit)}</strong></div>
                <div><span>Rentabilidad</span><strong>{formatPercent(cambioResult.marginPercent)}</strong></div>
              </div>
            </>
          )}
        </div>
      </div>

      <DraftTable type={mode} />

      <Dialog
        open={!!editTarget}
        onClose={() => !editSaving && setEditTarget(null)}
        title="Editar antes de completar"
        subtitle={editTarget ? (editTarget.phone_model || editTarget.title) : ''}
        wide
      >
        {editTarget && (
          <form onSubmit={saveEditDraft} className="sim-edit-form">
            {editTarget.sale_type === 'cambio' ? (
              <>
                <div className="form-group">
                  <label>Modelo (tu celular)</label>
                  <input value={editMyModel} onChange={(e) => setEditMyModel(e.target.value)} />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Precio compra</label>
                    <MoneyInput value={editMyBuyPrice} onChange={setEditMyBuyPrice} />
                  </div>
                  <div className="form-group">
                    <label>Precio venta a cliente</label>
                    <MoneyInput value={editSellToClient} onChange={setEditSellToClient} />
                  </div>
                  <div className="form-group">
                    <label>Efectivo del cliente</label>
                    <MoneyInput value={editCash} onChange={setEditCash} />
                  </div>
                </div>
                <h4 className="section-title">Celulares recibidos</h4>
                {editTradeIns.map((t, i) => (
                  <div key={i} className="trade-in-block">
                    <div className="trade-in-row">
                      <div className="form-group">
                        <label>Modelo</label>
                        <input value={t.model} onChange={(e) => updateEditTradeIn(i, { model: e.target.value })} />
                      </div>
                      <div className="form-group">
                        <label>Precio recibido</label>
                        <MoneyInput value={t.receivedPrice} onChange={(v) => updateEditTradeIn(i, { receivedPrice: v })} />
                      </div>
                      <div className="form-group">
                        <label>Precio reventa</label>
                        <MoneyInput value={t.resalePrice} onChange={(v) => updateEditTradeIn(i, { resalePrice: v })} />
                      </div>
                    </div>
                  </div>
                ))}
                {editTradeIns.length < 3 && (
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => setEditTradeIns((p) => [...p, emptyTradeIn()])}
                  >
                    <Plus size={14} /> Agregar celular
                  </button>
                )}
                <p className="goal-edit-info">
                  Ganancia estimada:{' '}
                  <strong className="sale-profit">{formatCurrency(editCambioPreview.totalProfit)}</strong>
                  {' · '}
                  {formatPercent(editCambioPreview.marginPercent)}
                </p>
              </>
            ) : (
              <>
                <div className="form-group">
                  <label>Modelo del celular</label>
                  <input value={editPhoneModel} onChange={(e) => setEditPhoneModel(e.target.value)} />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Precio compra</label>
                    <MoneyInput value={editBuyPrice} onChange={setEditBuyPrice} />
                  </div>
                  <div className="form-group">
                    <label>Precio venta cliente</label>
                    <MoneyInput value={editSellPrice} onChange={setEditSellPrice} />
                  </div>
                </div>
                <p className="goal-edit-info">
                  Ganancia estimada:{' '}
                  <strong className={editVentaPreview.profit >= 0 ? 'sale-profit' : 'text-danger'}>
                    {formatCurrency(editVentaPreview.profit)}
                  </strong>
                </p>
              </>
            )}
            <div className="goal-edit-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setEditTarget(null)} disabled={editSaving}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary" disabled={editSaving}>
                {editSaving ? 'Guardando…' : 'Guardar cambios'}
              </button>
            </div>
          </form>
        )}
      </Dialog>

      <Dialog
        open={!!deleteTarget}
        onClose={() => !deleting && setDeleteTarget(null)}
        title="Eliminar borrador"
        subtitle={deleteTarget ? (deleteTarget.phone_model || deleteTarget.title) : ''}
      >
        {deleteTarget && (
          <>
            <p className="empty-text" style={{ marginBottom: '1.25rem' }}>
              Se eliminará esta simulación guardada. No afecta ventas ya completadas.
            </p>
            <div className="goal-edit-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setDeleteTarget(null)} disabled={deleting}>
                Cancelar
              </button>
              <button type="button" className="btn btn-danger" onClick={confirmDeleteDraft} disabled={deleting}>
                {deleting ? 'Eliminando…' : 'Eliminar'}
              </button>
            </div>
          </>
        )}
      </Dialog>
    </div>
  );
}
