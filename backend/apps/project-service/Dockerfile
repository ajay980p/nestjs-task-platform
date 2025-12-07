FROM node:20-alpine

WORKDIR /app

COPY backend/package*.json ./
COPY backend/nest-cli.json ./
COPY backend/tsconfig*.json ./
COPY backend/apps/ ./apps/
COPY backend/libs/ ./libs/

RUN npm ci --legacy-peer-deps
RUN npm run build project-service

EXPOSE 3002

CMD ["node", "dist/apps/project-service/main.js"]
