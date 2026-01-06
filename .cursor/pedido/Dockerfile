# Dockerfile para página estática de pré-checkout
FROM nginx:alpine

# Copiar arquivos da pasta .cursor/pedido para o diretório do nginx
COPY .cursor/pedido/index.html .cursor/pedido/styles.css .cursor/pedido/app.js .cursor/pedido/config.js .cursor/pedido/config.example.js /usr/share/nginx/html/

# Expor porta 80
EXPOSE 80

# Nginx já inicia automaticamente
