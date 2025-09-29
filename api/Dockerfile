# api/Dockerfile
FROM node:18-alpine

WORKDIR /app

# Instalar dependências do sistema
RUN apk add --no-cache git

# Dependências
COPY api/package*.json ./
RUN npm ci --omit=dev

# Código da API
COPY api/ ./

# Porta da API
EXPOSE 3002

# Healthcheck simples (opcional)
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s \
  CMD wget -qO- http://localhost:3002/api/sync-status || exit 1

CMD ["node", "server.js"]
