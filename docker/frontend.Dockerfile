# Stage 1: Build the Next.js application
FROM node:22-slim AS builder

# Set working directory
WORKDIR /app

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

# Copy package.json and pnpm-lock.yaml
COPY frontend/package.json frontend/pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy the rest of the application code
COPY frontend/ ./

# Build the Next.js application
RUN pnpm run build

# Stage 2: Production image
FROM node:22-slim

WORKDIR /app

# Set COREPACK_HOME to a writable location within the app for corepack's cache
ENV COREPACK_HOME=/app/.corepack

# Enable corepack to make pnpm available
RUN corepack enable

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
CMD ["pnpm", "start"] 