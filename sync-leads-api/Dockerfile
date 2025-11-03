FROM node:18-alpine

# Instalar curl para health checks
RUN apk add --no-cache curl

# Criar diretório da aplicação
WORKDIR /app

# Copiar package.json
COPY package.json .

# Instalar dependências
RUN npm install --production

# Copiar arquivo da API
COPY index.js .

# Criar usuário não-root
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Mudar permissões
RUN chown -R nextjs:nodejs /app
USER nextjs

# Expor porta
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1

# Comando para iniciar
CMD ["node", "index.js"]

