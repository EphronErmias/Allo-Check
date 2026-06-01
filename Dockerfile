# Build frontend (same-origin API — no VITE_API_URL needed in the image)
FROM node:20-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
ARG VITE_APP_ORIGIN=https://allo-check.onrender.com
ENV VITE_APP_ORIGIN=$VITE_APP_ORIGIN
RUN npm run build

# Build and run API (+ optional bundled UI in backend/public)
FROM node:20-alpine
WORKDIR /app

COPY backend/package*.json ./backend/
RUN npm ci --prefix backend

COPY backend ./backend
RUN npm run build --prefix backend

COPY --from=frontend-build /app/frontend/dist ./backend/public

WORKDIR /app/backend
ENV NODE_ENV=production

CMD ["npm", "run", "start"]
