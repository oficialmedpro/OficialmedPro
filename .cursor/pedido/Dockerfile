# Dockerfile para página estática de pré-checkout
FROM nginx:alpine

# Copiar todos os arquivos da pasta .cursor/pedido para o diretório do nginx
COPY .cursor/pedido/ /usr/share/nginx/html/

# Expor porta 80
EXPOSE 80

# Nginx já inicia automaticamente
