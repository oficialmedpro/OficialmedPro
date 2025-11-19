# Build stage
FROM node:20-alpine as build

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (including devDependencies for build)
RUN npm ci

# Copy source code
COPY . .

# Accept Vite environment variables at build-time and expose them to the build
ARG VITE_SUPABASE_URL=placeholder
ARG VITE_SUPABASE_ANON_KEY=placeholder
ARG VITE_SUPABASE_SCHEMA=api
ARG VITE_SYNC_API_URL=placeholder
ARG NODE_ENV=production
ARG GIT_SHA=unknown

ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL \
    VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY \
    VITE_SUPABASE_SCHEMA=$VITE_SUPABASE_SCHEMA \
    VITE_SYNC_API_URL=$VITE_SYNC_API_URL \
    NODE_ENV=$NODE_ENV

# Debug - mostrar se as variáveis estão sendo recebidas (sem expor o valor completo)
RUN echo "🔧 Build Args recebidos:" && \
    echo "VITE_SUPABASE_URL: ${VITE_SUPABASE_URL:0:20}..." && \
    echo "VITE_SUPABASE_ANON_KEY: ${VITE_SUPABASE_ANON_KEY:0:10}..." && \
    echo "VITE_SUPABASE_SCHEMA: $VITE_SUPABASE_SCHEMA" && \
    echo "VITE_SYNC_API_URL: $VITE_SYNC_API_URL" && \
    echo "GIT_SHA: $GIT_SHA"

# Build the app
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy nginx config
COPY config/nginx.conf /etc/nginx/nginx.conf

# Copy built app from build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Copy entrypoint script
COPY docker/docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Expose port
EXPOSE 80

# Use entrypoint script to load secrets and start nginx
ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]

