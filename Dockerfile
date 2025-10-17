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

# Accept build arguments
ARG VITE_SUPABASE_URL=placeholder
ARG VITE_SUPABASE_SERVICE_ROLE_KEY=placeholder
ARG VITE_SUPABASE_SCHEMA=api

# Set environment variables for build
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_SERVICE_ROLE_KEY=$VITE_SUPABASE_SERVICE_ROLE_KEY
ENV VITE_SUPABASE_SCHEMA=$VITE_SUPABASE_SCHEMA

# Build application
RUN npm run build

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

# Copy entrypoint script
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Expose port
EXPOSE 80

# Use custom entrypoint
ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
