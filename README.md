# VAXUI — Panel Vax (React + Vite)

Frontend del panel de administración. Conecta por defecto a la API en producción.

| Entorno | URL UI | API |
|---------|--------|-----|
| Producción | [vax-ui.vercel.app](https://vax-ui.vercel.app) | [vaxback.onrender.com](https://vaxback.onrender.com) |

## Desarrollo local

```bash
cp .env.example .env
npm install
npm run dev
```

Abre `http://localhost:5173` — en desarrollo las peticiones van a `https://vaxback.onrender.com` (`.env.development`).

Para probar un backend local (opcional), cambia en `.env.development`:

```
VITE_API_URL=http://localhost:8000
```

## Variables de entorno

| Variable | Valor en producción |
|----------|---------------------|
| `VITE_API_URL` | `https://vaxback.onrender.com` |

En **Vercel** → Settings → Environment Variables (Production): misma variable, por si se sobrescribe el build.

Tras cambiar variables en Vercel: **Redeploy**.

## Build

```bash
npm run build
```

Salida: `dist/`. El archivo `.env.production` ya define la API para el build.

## Repo relacionado

Backend: [VAXBACK](https://github.com/AndyOjeda/VaxBack) en Render.
