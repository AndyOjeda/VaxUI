import { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { api } from '../services/api';
import { formatCurrency, formatDate } from '../utils/format';
import type { Business, ProfitabilityRecord } from '../types';
import './ProfitabilityPage.css';

export function ProfitabilityPage() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [records, setRecords] = useState<ProfitabilityRecord[]>([]);
  const [businessId, setBusinessId] = useState<number>(0);
  const [title, setTitle] = useState('');
  const [productName, setProductName] = useState('');
  const [buyPrice, setBuyPrice] = useState('');
  const [sellPrice, setSellPrice] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(true);

  const load = async () => {
    const [b, r] = await Promise.all([
      api.get<Business[]>('/api/businesses'),
      api.get<ProfitabilityRecord[]>('/api/profitability'),
    ]);
    setBusinesses(b);
    setRecords(r);
    if (b.length && !businessId) setBusinessId(b[0].id);
  };

  useEffect(() => {
    load();
  }, []);

  const qty = Number(quantity) || 1;
  const cost = (Number(buyPrice) || 0) * qty;
  const revenue = (Number(sellPrice) || 0) * qty;
  const profit = revenue - cost;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      await api.post('/api/profitability', {
        business_id: businessId,
        title: title || productName,
        notes: null,
        items: [{
          name: productName,
          quantity_received: qty,
          quantity_bought: qty,
          quantity_to_sell: qty,
          buy_price: Number(buyPrice),
          sell_price: Number(sellPrice),
        }],
      });
      setSuccess('Venta registrada');
      setTitle('');
      setProductName('');
      setBuyPrice('');
      setSellPrice('');
      setQuantity('1');
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Ventas</h1>
          <p>Registra lo que vendes y suma a tu meta mensual</p>
        </div>
        <button type="button" className="btn btn-secondary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Ocultar formulario' : 'Nueva venta'}
        </button>
      </div>

      {showForm && (
        <div className="card card-spaced">
          {error && <div className="alert alert-error">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}
          {businesses.length === 0 ? (
            <p className="empty-text">Primero crea un negocio en la sección Negocios.</p>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>Negocio</label>
                  <select value={businessId} onChange={(e) => setBusinessId(Number(e.target.value))} required>
                    {businesses.map((b) => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Producto / descripción</label>
                  <input value={productName} onChange={(e) => setProductName(e.target.value)} placeholder="Ej: iPhone 13" required />
                </div>
                <div className="form-group">
                  <label>Cantidad</label>
                  <input type="number" min={1} value={quantity} onChange={(e) => setQuantity(e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Costo unitario</label>
                  <input type="number" min={0} step="0.01" value={buyPrice} onChange={(e) => setBuyPrice(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label>Precio venta</label>
                  <input type="number" min={0} step="0.01" value={sellPrice} onChange={(e) => setSellPrice(e.target.value)} required />
                </div>
              </div>

              <div className="sale-preview">
                Ganancia estimada: <strong>{formatCurrency(profit)}</strong>
              </div>

              <button type="submit" className="btn btn-primary">
                <Plus size={16} /> Registrar venta
              </button>
            </form>
          )}
        </div>
      )}

      <div className="card">
        <h3 className="section-title">Historial reciente</h3>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Descripción</th>
                <th>Ganancia</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {records.slice(0, 20).map((r) => (
                <tr key={r.id}>
                  <td>{formatDate(r.created_at.slice(0, 10))}</td>
                  <td>{r.title}</td>
                  <td className="profit-positive">{formatCurrency(r.total_profit)}</td>
                  <td>
                    <button type="button" className="btn btn-danger btn-sm" onClick={() => api.delete(`/api/profitability/${r.id}`).then(load)}>
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {records.length === 0 && <p className="empty-text">Aún no hay ventas registradas.</p>}
        </div>
      </div>
    </div>
  );
}
