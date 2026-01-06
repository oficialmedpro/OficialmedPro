# Dockerfile para página estática de pré-checkout
FROM nginx:alpine

# Copiar apenas os arquivos necessários para o diretório do nginx
COPY index.html styles.css app.js config.js config.example.js /usr/share/nginx/html/

# Expor porta 80
EXPOSE 80

# Nginx já inicia automaticamente
