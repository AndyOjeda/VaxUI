import { useEffect, useState } from 'react';
import { Smartphone, Store } from 'lucide-react';
import { api } from '../services/api';
import type { Business } from '../types';

const DEFAULT_NAME = 'Mi tienda de celulares';

export function BusinessPage() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [name, setName] = useState(DEFAULT_NAME);
  const [description, setDescription] = useState('Compra, venta y cambio de celulares');

  const load = () => api.get<Business[]>('/api/businesses').then((b) => {
    setBusinesses(b);
    if (b[0]) {
      setName(b[0].name);
      setDescription(b[0].description || 'Compra, venta y cambio de celulares');
    }
  });
  useEffect(() => { load(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (businesses.length > 0) {
      await api.put(`/api/businesses/${businesses[0].id}`, { name, description });
    } else {
      await api.post('/api/businesses', { name, description });
    }
    load();
  };

  const biz = businesses[0];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Mi negocio</h1>
          <p>Tu tienda especializada en celulares</p>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <h3 className="section-title"><Store size={18} /> Configuración</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Nombre de la tienda</label>
              <input value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Descripción</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
            </div>
            <button type="submit" className="btn btn-primary">{biz ? 'Actualizar' : 'Crear negocio'}</button>
          </form>
        </div>

        <div className="card card-dark">
          <h3 className="section-title"><Smartphone size={18} /> Operaciones</h3>
          <ul className="biz-features">
            <li><strong>Venta directa</strong> — Compras celulares y los revendes con margen</li>
            <li><strong>Cambio / permuta</strong> — Recibes equipos como parte del pago</li>
            <li><strong>Control mensual</strong> — Ventas, metas y pagos fijos</li>
            <li><strong>Simulador</strong> — Calcula precio ideal antes de cerrar negocio</li>
          </ul>
          {biz && (
            <p className="biz-active">Activo desde {new Date(biz.created_at).toLocaleDateString('es-CO')}</p>
          )}
        </div>
      </div>
    </div>
  );
}
