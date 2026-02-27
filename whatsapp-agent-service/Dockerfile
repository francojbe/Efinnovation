# Etapa de construcción
FROM node:20-alpine AS builder

WORKDIR /app

# Copiamos solo los archivos de dependencias para aprovechar la cache de Docker
COPY package*.json ./
RUN npm install

# Copiamos el resto del código y construimos el proyecto (TypeScript -> JavaScript)
COPY . .
RUN npm run build

# Etapa de producción
FROM node:20-alpine AS runner

WORKDIR /app

# Solo copiamos lo necesario para correr el servidor
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules

# Exponemos el puerto 3000 (el que configuramos en Express)
EXPOSE 3000

# Comando para iniciar la aplicación
CMD ["node", "dist/index.js"]
