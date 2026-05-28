import { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { api } from '../services/api';
import { formatDate } from '../utils/format';
import type { Business, CalendarEvent } from '../types';
import './CalendarPage.css';

const typeLabels: Record<string, string> = {
  payment: 'Pago',
  reminder: 'Recordatorio',
  task: 'Tarea',
  meeting: 'Reunión',
};

export function CalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [upcoming, setUpcoming] = useState<CalendarEvent[]>([]);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    event_date: '',
    event_time: '',
    event_type: 'reminder',
    business_id: '',
  });

  const load = async () => {
    const [e, u, b] = await Promise.all([
      api.get<CalendarEvent[]>(`/api/calendar?month=${month}&year=${year}`),
      api.get<CalendarEvent[]>(`/api/calendar/upcoming?days=14`),
      api.get<Business[]>('/api/businesses'),
    ]);
    setEvents(e);
    setUpcoming(u);
    setBusinesses(b);
  };

  useEffect(() => {
    load();
  }, [month, year]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.post('/api/calendar', {
      title: form.title,
      description: form.description || null,
      event_date: form.event_date,
      event_time: form.event_time || null,
      event_type: form.event_type,
      business_id: form.business_id ? Number(form.business_id) : null,
    });
    setForm({ title: '', description: '', event_date: '', event_time: '', event_type: 'reminder', business_id: '' });
    setShowForm(false);
    load();
  };

  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDay = new Date(year, month - 1, 1).getDay();
  const eventDates = new Set(events.map((e) => e.event_date));

  const calendarCells = [];
  for (let i = 0; i < firstDay; i++) calendarCells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    calendarCells.push({ day: d, dateStr, hasEvent: eventDates.has(dateStr) });
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Calendario</h1>
          <p>Eventos, recordatorios y vencimientos</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          <Plus size={16} /> Nuevo evento
        </button>
      </div>

      {showForm && (
        <div className="card card-spaced">
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label>Título</label>
                <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Fecha</label>
                <input type="date" value={form.event_date} onChange={(e) => setForm({ ...form, event_date: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Hora</label>
                <input type="time" value={form.event_time} onChange={(e) => setForm({ ...form, event_time: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Tipo</label>
                <select value={form.event_type} onChange={(e) => setForm({ ...form, event_type: e.target.value })}>
                  <option value="reminder">Recordatorio</option>
                  <option value="payment">Pago</option>
                  <option value="task">Tarea</option>
                  <option value="meeting">Reunión</option>
                </select>
              </div>
              <div className="form-group">
                <label>Negocio</label>
                <select value={form.business_id} onChange={(e) => setForm({ ...form, business_id: e.target.value })}>
                  <option value="">General</option>
                  {businesses.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label>Descripción</label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
            </div>
            <button type="submit" className="btn btn-primary">Guardar evento</button>
          </form>
        </div>
      )}

      <div className="calendar-layout">
        <div className="card calendar-grid-card">
          <div className="calendar-nav">
            <select value={month} onChange={(e) => setMonth(Number(e.target.value))}>
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1}>{new Date(2000, i).toLocaleString('es', { month: 'long' })}</option>
              ))}
            </select>
            <input type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} />
          </div>
          <div className="calendar-weekdays">
            {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((d) => (
              <span key={d}>{d}</span>
            ))}
          </div>
          <div className="calendar-grid">
            {calendarCells.map((cell, i) => (
              <div key={i} className={`calendar-day ${cell?.hasEvent ? 'has-event' : ''} ${!cell ? 'empty' : ''}`}>
                {cell?.day}
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h3 className="section-title">Eventos del mes</h3>
          <ul className="event-list">
            {events.map((ev) => (
              <li key={ev.id}>
                <div>
                  <strong>{ev.title}</strong>
                  <span>{formatDate(ev.event_date)} {ev.event_time ? `· ${ev.event_time.slice(0, 5)}` : ''}</span>
                  <span className="event-type">{typeLabels[ev.event_type] || ev.event_type}</span>
                </div>
                <button type="button" className="btn btn-danger btn-sm" onClick={() => api.delete(`/api/calendar/${ev.id}`).then(load)}>
                  <Trash2 size={14} />
                </button>
              </li>
            ))}
          </ul>
          {events.length === 0 && <p className="empty-text">Sin eventos este mes.</p>}

          <h3 className="section-title section-title-spaced">Próximos 14 días</h3>
          <ul className="event-list">
            {upcoming.map((ev) => (
              <li key={ev.id}>
                <div>
                  <strong>{ev.title}</strong>
                  <span>{formatDate(ev.event_date)}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
