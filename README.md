# VAXUI — Panel Vax (React + Vite)

Frontend del panel de administración (metas, pagos, ventas, simulador, alertas).

## Requisitos

- Node.js 18+

## Desarrollo local

```bash
cp .env.example .env
npm install
npm run dev
```

Abre `http://localhost:5173`

En `.env`:

```
VITE_API_URL=http://localhost:8000
```

La API debe estar corriendo en **VAXBACK** (mismo puerto u otra URL en producción).

## Producción

- Build: `npm run build`
- Carpeta de salida: `dist`
- Variable obligatoria: `VITE_API_URL` (URL pública del API, sin `/` al final)

Despliegue típico: [Vercel](https://vercel.com) conectado a este repo.

## Repo relacionado

Backend: repositorio **VAXBACK** en GitHub.
