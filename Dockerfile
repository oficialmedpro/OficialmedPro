# Usar uma imagem base que já funciona
FROM nginx:alpine

# Install bash
RUN apk add --no-cache bash

# Copy nginx config
COPY nginx.conf /etc/nginx/nginx.conf

# Criar diretório para arquivos estáticos
RUN mkdir -p /usr/share/nginx/html

# Criar um index.html simples para testar
RUN echo '<!DOCTYPE html><html><head><title>OficialMed BI</title><meta charset="utf-8"></head><body><h1>🚀 OficialMed BI</h1><p>Em construção...</p><p>Versão: 1.0.0</p></body></html>' > /usr/share/nginx/html/index.html

# Copy entrypoint script
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Expose port
EXPOSE 80

# Use custom entrypoint
ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
