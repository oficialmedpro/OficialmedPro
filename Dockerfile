# Build stage
FROM node:18-alpine as build

WORKDIR /app

# Install dependencies for better compatibility
RUN apk add --no-cache git

# Copy package files
COPY package*.json ./

# Install dependencies with verbose output
RUN npm ci --verbose

# Copy source code
COPY . .

# Accept Vite environment variables at build-time and expose them to the build
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_SERVICE_ROLE_KEY
ARG VITE_SUPABASE_SCHEMA
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL \
    VITE_SUPABASE_SERVICE_ROLE_KEY=$VITE_SUPABASE_SERVICE_ROLE_KEY \
    VITE_SUPABASE_SCHEMA=$VITE_SUPABASE_SCHEMA

# Debug - mostrar se as variáveis estão sendo recebidas (sem expor o valor completo)
RUN echo "🔧 Build Args recebidos:" && \
    echo "VITE_SUPABASE_URL: ${VITE_SUPABASE_URL:0:20}..." && \
    echo "VITE_SUPABASE_SERVICE_ROLE_KEY: ${VITE_SUPABASE_SERVICE_ROLE_KEY:0:10}..." && \
    echo "VITE_SUPABASE_SCHEMA: $VITE_SUPABASE_SCHEMA"

# Debug - mostrar versões
RUN echo "🔧 Versões:" && \
    echo "Node: $(node --version)" && \
    echo "NPM: $(npm --version)" && \
    echo "Vite: $(npx vite --version)"

# Build the app with verbose output
RUN npm run build --verbose

# Production stage
FROM nginx:alpine

# Install bash for the entrypoint script
RUN apk add --no-cache bash

# Copy nginx config
COPY nginx.conf /etc/nginx/nginx.conf

# Copy built app from build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Copy entrypoint script
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Expose port
EXPOSE 80

# Health check (temporariamente desabilitado)
# HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
#   CMD wget --no-verbose --tries=1 --spider http://localhost/health || exit 1

# Use custom entrypoint
ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]