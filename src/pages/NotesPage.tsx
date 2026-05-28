import { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { api } from '../services/api';
import type { Business, Note } from '../types';

const priorityLabels: Record<string, string> = {
  low: 'Baja',
  medium: 'Media',
  high: 'Alta',
};

export function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', content: '', priority: 'medium', tags: '', business_id: '' });

  const load = async () => {
    const [n, b] = await Promise.all([api.get<Note[]>('/api/notes'), api.get<Business[]>('/api/businesses')]);
    setNotes(n);
    setBusinesses(b);
  };

  useEffect(() => {
    load();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.post('/api/notes', {
      title: form.title,
      content: form.content,
      priority: form.priority,
      tags: form.tags || null,
      business_id: form.business_id ? Number(form.business_id) : null,
    });
    setForm({ title: '', content: '', priority: 'medium', tags: '', business_id: '' });
    setShowForm(false);
    load();
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Notas</h1>
          <p>Apuntes rápidos por negocio o generales</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          <Plus size={16} /> Nueva nota
        </button>
      </div>

      {showForm && (
        <div className="card card-spaced">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Título</label>
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Contenido</label>
              <textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} rows={4} required />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Prioridad</label>
                <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                  <option value="low">Baja</option>
                  <option value="medium">Media</option>
                  <option value="high">Alta</option>
                </select>
              </div>
              <div className="form-group">
                <label>Etiquetas</label>
                <input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="proveedor, urgente" />
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
            <button type="submit" className="btn btn-primary">Guardar nota</button>
          </form>
        </div>
      )}

      <div className="notes-grid">
        {notes.map((note) => (
          <div key={note.id} className={`card note-card priority-${note.priority}`}>
            <div className="note-header">
              <h3>{note.title}</h3>
              <button type="button" className="btn btn-danger btn-sm" onClick={() => api.delete(`/api/notes/${note.id}`).then(load)}>
                <Trash2 size={14} />
              </button>
            </div>
            <p>{note.content}</p>
            <div className="note-meta">
              <span className={`badge priority-badge-${note.priority}`}>{priorityLabels[note.priority]}</span>
              {note.tags && <span className="note-tags">{note.tags}</span>}
            </div>
          </div>
        ))}
      </div>
      {notes.length === 0 && <p className="empty-text">No hay notas. Crea la primera.</p>}
    </div>
  );
}
