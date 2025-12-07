FROM node:20-alpine

WORKDIR /app

# Build argument for API URL
ARG VITE_API_BASE_URL=http://localhost:3000

# Set environment variable for build
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

COPY package*.json ./
COPY . .

RUN npm ci
RUN npm run build

EXPOSE 5173

CMD ["npx", "vite", "preview", "--host", "0.0.0.0", "--port", "5173"]
