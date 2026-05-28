/** API pública en Render (producción). */
export const API_BASE_URL =
  import.meta.env.VITE_API_URL?.replace(/\/$/, '') ||
  'https://vaxback.onrender.com';

export const APP_URL = 'https://vax-ui.vercel.app';
