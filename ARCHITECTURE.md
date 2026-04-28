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

   Default UI: `http://localhost:3000`. Point `VITE_API_URL` at the API (or use the default `http://localhost:4000`).

## Environment

| Variable        | Where    | Purpose                          |
|----------------|----------|----------------------------------|
| `PORT`         | backend  | HTTP port (default `4000`)       |
| `DATABASE_URL` | backend  | Postgres connection string     |
| `CORS_ORIGIN`  | backend  | `*` or comma-separated origins |
| `VITE_API_URL` | frontend | API base URL                    |
| `VITE_PARTNERS_BANNER_URL` | frontend | Optional partners hero image URL |

## Demo data

If the `devices` table is empty, the API seeds five demo rows (e.g. IMEI `356897123456789`, serial `R58N123456L`).

## Notes

- If you still have old `node_modules` folders from a previous stack, stop any running dev servers, delete `backend/node_modules` and `frontend/node_modules`, then run `npm install` again.
