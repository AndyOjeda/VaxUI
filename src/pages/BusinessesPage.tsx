import { useEffect, useState } from 'react';
import { Plus, Target, Trash2 } from 'lucide-react';
import { api } from '../services/api';
import { formatCurrency, formatMonthYear } from '../utils/format';
import type { Business, GoalProgress } from '../types';
import './BusinessesPage.css';

export function BusinessesPage() {
  const now = new Date();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [goals, setGoals] = useState<GoalProgress[]>([]);
  const [name, setName] = useState('');
  const [goalBusinessId, setGoalBusinessId] = useState<number>(0);
  const [targetAmount, setTargetAmount] = useState('');
  const [goalMonth, setGoalMonth] = useState(now.getMonth() + 1);
  const [goalYear, setGoalYear] = useState(now.getFullYear());

  const load = async () => {
    const [b, g] = await Promise.all([
      api.get<Business[]>('/api/businesses'),
      api.get<GoalProgress[]>('/api/goals'),
    ]);
    setBusinesses(b);
    setGoals(g);
    if (b.length && !goalBusinessId) setGoalBusinessId(b[0].id);
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreateBusiness = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.post('/api/businesses', { name, description: null });
    setName('');
    load();
  };

  const handleSetGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalBusinessId) return;
    await api.post(`/api/goals/businesses/${goalBusinessId}`, {
      year: goalYear,
      month: goalMonth,
      target_amount: Number(targetAmount),
    });
    setTargetAmount('');
    load();
  };

  const goalForBusiness = (id: number) =>
    goals.find((g) => g.business_id === id && g.year === now.getFullYear() && g.month === now.getMonth() + 1);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Negocios</h1>
          <p>Crea tus negocios y define metas mensuales de ganancia</p>
        </div>
      </div>

      <div className="card card-spaced">
        <h3 className="section-title">Nuevo negocio</h3>
        <form onSubmit={handleCreateBusiness} className="inline-form">
          <div className="form-group">
            <label>Nombre</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Celulares Andrés" required />
          </div>
          <button type="submit" className="btn btn-primary">
            <Plus size={16} /> Crear
          </button>
        </form>
      </div>

      {businesses.length > 0 && (
        <div className="card card-spaced">
          <h3 className="section-title">
            <Target size={18} /> Meta mensual
          </h3>
          <form onSubmit={handleSetGoal} className="goal-form">
            <div className="form-group">
              <label>Negocio</label>
              <select value={goalBusinessId} onChange={(e) => setGoalBusinessId(Number(e.target.value))} required>
                {businesses.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Mes</label>
              <select value={goalMonth} onChange={(e) => setGoalMonth(Number(e.target.value))}>
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {formatMonthYear(i + 1, goalYear)}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Año</label>
              <input type="number" value={goalYear} onChange={(e) => setGoalYear(Number(e.target.value))} />
            </div>
            <div className="form-group">
              <label>Meta (COP)</label>
              <input
                type="number"
                min={1}
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
                placeholder="Ej: 3000000"
                required
              />
            </div>
            <button type="submit" className="btn btn-primary">Guardar meta</button>
          </form>
        </div>
      )}

      <div className="businesses-grid">
        {businesses.map((b) => {
          const goal = goalForBusiness(b.id);
          const pct = goal ? Math.min(parseFloat(goal.percent_complete), 100) : 0;
          return (
            <div key={b.id} className="card business-card">
              <div className="business-card-top">
                <h3>{b.name}</h3>
                <button
                  type="button"
                  className="btn btn-danger btn-sm"
                  onClick={() => api.delete(`/api/businesses/${b.id}`).then(load)}
                >
                  <Trash2 size={14} />
                </button>
              </div>

              {goal ? (
                <div className="goal-progress-block">
                  <div className="goal-progress-header">
                    <span>Meta {formatMonthYear(goal.month, goal.year)}</span>
                    <span className="goal-pct">{pct.toFixed(0)}%</span>
                  </div>
                  <div className="goal-bar">
                    <div className="goal-bar-fill" style={{ width: `${pct}%` }} />
                  </div>
                  <div className="goal-stats">
                    <div>
                      <span>Llevado</span>
                      <strong>{formatCurrency(goal.current_amount)}</strong>
                    </div>
                    <div>
                      <span>Meta</span>
                      <strong>{formatCurrency(goal.target_amount)}</strong>
                    </div>
                    <div>
                      <span>Falta</span>
                      <strong className="goal-remaining">{formatCurrency(goal.remaining)}</strong>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="empty-text">Sin meta este mes. Define una arriba.</p>
              )}
            </div>
          );
        })}
      </div>

      {businesses.length === 0 && (
        <p className="empty-text">Crea tu primer negocio para empezar.</p>
      )}
    </div>
  );
}
