# ---- Base Stage ----
FROM oven/bun:1-alpine AS base

WORKDIR /app

# ---- Dependencies Stage ----
FROM base AS deps

# Copy package files
COPY package.json bun.lockb* ./

# Install all dependencies
RUN bun install --frozen-lockfile

# ---- Builder Stage ----
FROM base AS builder

WORKDIR /app

# Copy node_modules from deps
COPY --from=deps /app/node_modules ./node_modules

# Copy source code
COPY . .

# Build CSS for production
RUN bun run build:css:once

# ---- Production Stage ----
FROM oven/bun:1-alpine AS production

WORKDIR /app

# Copy node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy built assets from builder
COPY --from=builder /app/dist ./dist

# Copy source code
COPY . .

# Create a non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S frontend -u 1001 && \
    chown -R frontend:nodejs /app

USER frontend

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3001/ || exit 1

# Start the frontend server
CMD ["bun", "run", "start"]
