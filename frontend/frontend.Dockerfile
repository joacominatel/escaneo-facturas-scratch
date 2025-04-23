FROM node:22-alpine3.20 AS builder

WORKDIR /app

COPY package*.json ./

# Instala las dependencias
RUN npm install --force

# Copia el resto del código fuente de la aplicación
COPY . .

# Declara un argumento que se pasará durante el build (desde docker-compose)
ARG VITE_BACKEND_URL_ARG

# Establece la variable de entorno VITE_BACKEND_URL para que Vite pueda usarla
ENV VITE_BACKEND_URL=${VITE_BACKEND_URL_ARG}

# Ejecuta el comando de build de Vite (asegúrate que sea 'npm run build')
RUN npm run build

# ---- Stage 2: Serve ----
FROM nginx:stable-alpine AS runner

# Copia los archivos construidos desde el stage 'builder' al directorio web de Nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# (Opcional pero recomendado) Copia una configuración personalizada de Nginx
# Esto es importante para que el enrutamiento de Vue/React funcione correctamente (Single Page Application)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expone el puerto 80 (puerto por defecto de Nginx)
EXPOSE 80

# Comando por defecto para iniciar Nginx cuando el contenedor arranque
CMD ["nginx", "-g", "daemon off;"]