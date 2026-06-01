# AlloCheck

Simple stack: **Node.js (Express) + Postgres** API and **Vite + React 19 + TypeScript + Tailwind 4** web app.

## Layout

- `backend/` — REST API (`/api/v1/devices/lookup`, `/api/v1/health`), Postgres via `pg`, demo seed on empty DB.
- `frontend/` — marketing + IMEI/serial lookup UI.
- `database/schema.sql` — SQLite reference DDL (mirrors what the API creates at startup).

## Run locally

1. **API** — from `backend/`:

   ```bash
   cp .env.example .env
   npm install
   npm run dev
   ```

   Default: `http://localhost:4000`, Postgres connection from `DATABASE_URL`.

2. **Web** — from `frontend/`:

   ```bash
   cp .env.example .env
   npm install
   npm run dev
   ```

   Default UI: `http://localhost:3000`. The dev server proxies `/api` to `http://localhost:4000`, so you do not need `VITE_API_URL` for local work unless the API runs elsewhere.

## Production

**Recommended:** deploy with the repo `Dockerfile`. It builds the Vite app into `backend/public` so the API and UI share one origin (`/api/v1/...` on the same host). No `VITE_API_URL` is required.

**Split hosting** (static UI on Netlify/Vercel, API elsewhere):

1. Build the frontend with `VITE_API_URL=https://your-api-host` (no trailing slash), **or**
2. Serve a `config.json` with `{ "apiUrl": "https://your-api-host" }` and set `PUBLIC_API_URL` on the API if it serves `/config.json`.

Ensure `CORS_ORIGIN` on the API includes your UI origin (or use `*`).

## Environment

| Variable        | Where    | Purpose                          |
|----------------|----------|----------------------------------|
| `PORT`         | backend  | HTTP port (default `4000`)       |
| `DATABASE_URL` | backend  | Postgres connection string     |
| `CORS_ORIGIN`  | backend  | `*` or comma-separated origins |
| `PUBLIC_API_URL` | backend | API URL exposed to the UI via `/config.json` when UI is on another host |
| `VITE_API_URL` | frontend | API base URL at **build** time (split hosting) |
| `VITE_PARTNERS_BANNER_URL` | frontend | Optional partners hero image URL |

## Demo data

If the `devices` table is empty, the API seeds five demo rows (e.g. IMEI `356897123456789`, serial `R58N123456L`).

## Notes

- If you still have old `node_modules` folders from a previous stack, stop any running dev servers, delete `backend/node_modules` and `frontend/node_modules`, then run `npm install` again.
