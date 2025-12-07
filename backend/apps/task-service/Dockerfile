FROM node:20-alpine

WORKDIR /app

COPY backend/package*.json ./
COPY backend/nest-cli.json ./
COPY backend/tsconfig*.json ./
COPY backend/apps/ ./apps/
COPY backend/libs/ ./libs/

RUN npm ci --legacy-peer-deps
RUN npm run build task-service

EXPOSE 3003

CMD ["node", "dist/apps/task-service/main.js"]
