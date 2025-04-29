# Stage 1: Build the Next.js application
FROM node:22-slim AS builder

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json (or yarn.lock)
COPY frontend/package.json frontend/package-lock.json* ./

# Install dependencies / force install cause react 19
RUN npm install --force 

# Copy the rest of the application code
COPY frontend/ ./

# Build the Next.js application
RUN npm run build

# Stage 2: Production image
FROM node:22-slim

WORKDIR /app

# Crear un usuario y grupo no root
# Usamos 'node' como usuario y grupo ya que la imagen base node lo suele incluir
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built assets from the builder stage
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.ts ./next.config.ts

# Set ownership to the non-root user
# Solo necesitamos ajustar permisos en la carpeta de la app
RUN chown -R nextjs:nodejs /app

# Cambiar al usuario no root
USER nextjs

# Expose the port the app runs on
EXPOSE 3000

# Command to run the application
CMD ["npm", "start"] 