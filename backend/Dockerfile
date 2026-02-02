# ---- Base Stage ----
FROM oven/bun:1-alpine AS base

WORKDIR /app

# Install build dependencies for native modules (bcrypt)
RUN apk add --no-cache python3 make g++ linux-headers

# ---- Dependencies Stage ----
FROM base AS deps

WORKDIR /app

# Copy package files
COPY package.json bun.lockb* ./

# Install all dependencies (this compiles bcrypt for Linux)
RUN bun install --frozen-lockfile

# ---- Production Stage ----
FROM oven/bun:1-alpine AS production

WORKDIR /app

# Install runtime dependencies for bcrypt native module
RUN apk add --no-cache libstdc++ libgcc

# Copy node_modules from deps stage (compiled for Linux)
COPY --from=deps /app/node_modules ./node_modules

# Copy source code and migrations
COPY . .

# Create a non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S backend -u 1001 && \
    chown -R backend:nodejs /app

USER backend

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/v1/ || exit 1

# Run migrations then start the server
CMD ["sh", "-c", "bun run db:migrate && bun run start"]
