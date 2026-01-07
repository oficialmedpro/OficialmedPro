# Dockerfile para página estática de pré-checkout
FROM nginx:alpine

# Copiar apenas os arquivos HTML/CSS/JS da pasta .cursor/pedido
COPY .cursor/pedido/index.html /usr/share/nginx/html/
COPY .cursor/pedido/styles.css /usr/share/nginx/html/
COPY .cursor/pedido/app.js /usr/share/nginx/html/
COPY .cursor/pedido/config.js /usr/share/nginx/html/

# Copiar imagens/logos
COPY .cursor/pedido/IMAGOTIPO_WHITE.png /usr/share/nginx/html/
COPY .cursor/pedido/Great\ Place\ to\ Work.png /usr/share/nginx/html/
COPY .cursor/pedido/Reclame\ Aqui\ OV.png /usr/share/nginx/html/
COPY .cursor/pedido/ABF_LOGO2023_ASSOCIADO_V_RGB_Positivo_Final.png /usr/share/nginx/html/

# Copiar script de entrypoint para injetar variáveis de ambiente
COPY .cursor/pedido/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Copiar configuração customizada do nginx
COPY .cursor/pedido/nginx.conf /etc/nginx/conf.d/default.conf

# Expor porta 80
EXPOSE 80

# Usar script customizado de entrypoint (injeta variáveis de ambiente)
ENTRYPOINT ["/entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
