import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Banknote, Eye, EyeOff } from 'lucide-react';
import { APP_NAME } from '../config/brand';
import { useAuth } from '../context/AuthContext';
import './AuthPage.css';

export function LoginPage() {
  const { login, user, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    document.title = APP_NAME;
  }, []);

  if (!loading && user) return <Navigate to="/dashboard" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al iniciar sesión');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-split">
      <aside className="auth-split-visual" aria-hidden="true">
        <img src="/login-hero.png" alt="" className="auth-split-image" />
        <div className="auth-split-overlay" />
        <div className="auth-split-content">
          <div className="auth-split-brand">
            <span className="auth-split-logo" aria-hidden="true">
              <Banknote size={18} strokeWidth={2.25} />
            </span>
            <span>{APP_NAME}</span>
          </div>
          <h2>Gestiona tus negocios</h2>
          <p>Ingresa para ver pagos, ventas, metas y el simulador en un solo panel.</p>
        </div>
      </aside>

      <main className="auth-split-form-panel">
        <div className="auth-split-form-inner">
          <header className="auth-form-header">
            <h1>Iniciar sesión</h1>
            <p>Ingresa tu correo y contraseña para acceder a tu cuenta.</p>
          </header>

          {error && <div className="alert alert-error auth-alert">{error}</div>}

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="login-email">Correo electrónico</label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ej. tu@correo.com"
                required
                autoComplete="email"
              />
            </div>
            <div className="form-group">
              <label htmlFor="login-password">Contraseña</label>
              <div className="auth-password-wrap">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Ingresa tu contraseña"
                  required
                  minLength={8}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="auth-password-toggle"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <span className="auth-field-hint">Mínimo 8 caracteres.</span>
            </div>
            <button type="submit" className="auth-btn-primary" disabled={submitting}>
              {submitting ? 'Ingresando…' : 'Iniciar sesión'}
            </button>
          </form>

          <p className="auth-switch">
            ¿No tienes cuenta? <Link to="/register">Regístrate</Link>
          </p>
        </div>
      </main>
    </div>
  );
}
