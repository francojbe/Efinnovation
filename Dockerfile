# Utilizar una imagen ligera de Nginx
FROM nginx:alpine

# Force Docker layer cache invalidation on every build
ARG CACHEBUST=1

# Copiar todos los archivos del proyecto al directorio de Nginx
COPY . /usr/share/nginx/html

# Copiar configuración personalizada de Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Exponer el puerto 80
EXPOSE 80

# Comando para ejecutar Nginx
CMD ["nginx", "-g", "daemon off;"]
