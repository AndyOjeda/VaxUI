import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Bell, Target, CreditCard } from 'lucide-react';
import { Spinner } from '../components/ui/Spinner';
import { useData } from '../context/DataContext';
import { api } from '../services/api';
import type { AlertItem } from '../types';
import './AlertsPage.css';

const ICONS: Record<string, typeof Bell> = {
  payment_due: CreditCard,
  goal_behind: Target,
};

export function AlertsPage() {
  const { tick } = useData();
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await api.get<AlertItem[]>('/api/dashboard/alerts');
      setAlerts(list);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load, tick]);

  if (loading) {
    return (
      <div className="alerts-page">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="alerts-page">
      <div className="page-header">
        <div>
          <h1>Alertas</h1>
          <p>Pagos que vencen en 3 días y metas por debajo del 50%</p>
        </div>
      </div>

      {alerts.length === 0 ? (
        <div className="card alerts-empty">
          <Bell size={32} className="alerts-empty-icon" />
          <p className="empty-text">Todo al día. No hay alertas activas.</p>
        </div>
      ) : (
        <div className="alerts-list">
          {alerts.map((a) => {
            const Icon = ICONS[a.type] ?? AlertTriangle;
            return (
              <div key={a.id} className={`card alert-card alert-card--${a.severity}`}>
                <div className="alert-card-icon">
                  <Icon size={20} />
                </div>
                <div className="alert-card-body">
                  <strong>{a.title}</strong>
                  <p>{a.message}</p>
                  {a.link && (
                    <Link to={a.link} className="alert-card-link">
                      Ver detalle →
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
