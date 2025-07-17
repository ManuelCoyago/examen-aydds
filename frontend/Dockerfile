FROM nginx:alpine

COPY ./templates /usr/share/nginx/html
COPY ./static /usr/share/nginx/html/static

# Configuración para manejar rutas en SPA
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80