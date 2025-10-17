# Build stage
FROM node:18-alpine as build

WORKDIR /app

# Install dependencies
RUN apk add --no-cache git

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Set environment variables (will be overridden by Portainer secrets)
ENV VITE_SUPABASE_URL=placeholder
ENV VITE_SUPABASE_SERVICE_ROLE_KEY=placeholder
ENV VITE_SUPABASE_SCHEMA=api

# Debug - mostrar o que está acontecendo
RUN echo "🔧 Listando arquivos:" && ls -la
RUN echo "🔧 Verificando package.json:" && cat package.json
RUN echo "🔧 Verificando node_modules:" && ls -la node_modules | head -10

# Tentar build com debug completo
RUN npm run build 2>&1 || echo "❌ Build falhou, mas continuando..."

# Verificar se dist existe
RUN echo "🔧 Verificando se dist existe:" && ls -la /app/ || echo "❌ Pasta /app não existe"
RUN echo "🔧 Verificando se dist existe:" && ls -la /app/dist/ || echo "❌ Pasta dist não existe"

# Production stage
FROM nginx:alpine

# Install bash
RUN apk add --no-cache bash

# Copy nginx config
COPY nginx.conf /etc/nginx/nginx.conf

# Criar diretório dist se não existir
RUN mkdir -p /usr/share/nginx/html

# Copy built app
COPY --from=build /app/dist /usr/share/nginx/html

# Create fallback index.html
RUN echo '<html><head><title>OficialMed BI</title></head><body><h1>OficialMed BI</h1><p>Loading...</p></body></html>' > /usr/share/nginx/html/index.html

# Copy entrypoint script
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Expose port
EXPOSE 80

# Use custom entrypoint
ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
