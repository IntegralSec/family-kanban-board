# Multi-stage build for Family Kanban Board
# Supports both ARM (Raspberry Pi) and x86 architectures

# Stage 1: Build frontend
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend

# Copy frontend package files
COPY frontend/package.json ./

# Install dependencies
RUN npm install --no-audit --no-fund

# Copy frontend source
COPY frontend/ ./

# Build frontend
RUN npm run build

# Stage 2: Build backend dependencies
FROM node:20-alpine AS backend-builder

WORKDIR /app/backend

# Install build dependencies for better-sqlite3
RUN apk add --no-cache python3 make g++

# Copy backend package files
COPY backend/package.json ./

# Install production dependencies only
RUN npm install --omit=dev --no-audit --no-fund

# Stage 3: Production image
FROM node:20-alpine AS production

# Add tini for proper signal handling
RUN apk add --no-cache tini

WORKDIR /app

# Create non-root user for security
RUN addgroup -g 1001 -S kanban && \
    adduser -S kanban -u 1001 -G kanban

# Copy backend dependencies
COPY --from=backend-builder /app/backend/node_modules ./backend/node_modules

# Copy backend source
COPY backend/src ./backend/src
COPY backend/package.json ./backend/

# Copy OpenAPI spec for Swagger UI
COPY openapi.yaml ./openapi.yaml

# Copy built frontend
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Create data directory
RUN mkdir -p /data && chown -R kanban:kanban /data

# Set ownership
RUN chown -R kanban:kanban /app

# Switch to non-root user
USER kanban

# Environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV DATA_PATH=/data/board.db

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Volume for persistent data
VOLUME ["/data"]

# Use tini as entrypoint for proper signal handling
ENTRYPOINT ["/sbin/tini", "--"]

# Start the server
CMD ["node", "backend/src/index.js"]

