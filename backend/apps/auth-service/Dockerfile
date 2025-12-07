FROM node:20-alpine

WORKDIR /app

COPY backend/package*.json ./
COPY backend/nest-cli.json ./
COPY backend/tsconfig*.json ./
COPY backend/apps/ ./apps/
COPY backend/libs/ ./libs/

RUN npm ci --legacy-peer-deps
RUN npm run build auth-service

EXPOSE 3001

CMD ["node", "dist/apps/auth-service/main.js"]
