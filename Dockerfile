FROM node:20-alpine

WORKDIR /app

COPY backend/package*.json ./backend/
RUN npm ci --prefix backend

COPY backend ./backend
RUN npm run build --prefix backend

WORKDIR /app/backend
ENV NODE_ENV=production

CMD ["npm", "run", "start"]
