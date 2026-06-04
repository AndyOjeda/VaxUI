/**
 * - Producción / preview: VITE_API_URL o Render por defecto.
 * - Desarrollo con VITE_API_URL=local: peticiones a /api vía proxy de Vite → backend local.
 */
function resolveApiBaseUrl(): string {
  const raw = import.meta.env.VITE_API_URL?.trim()
  // En dev: '' → mismo origen + proxy Vite (/api → localhost:8000)
  if (import.meta.env.DEV) {
    if (!raw || raw === 'local') return ''
    return raw.replace(/\/$/, '')
  }
  if (raw) return raw.replace(/\/$/, '')
  return 'https://vaxback.onrender.com'
}

export const API_BASE_URL = resolveApiBaseUrl()

export const APP_URL = 'https://vax-ui.vercel.app';
