# Fix_Smart_CMS v1.0.3 - Production Docker Image
# Multi-stage build for optimized production deployment

# ============================================================================
# Stage 1: Base Node.js image with dependencies
# ============================================================================
FROM node:20-alpine AS base

# Set working directory
WORKDIR /app

# Install system dependencies for native modules
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    cairo-dev \
    jpeg-dev \
    pango-dev \
    musl-dev \
    giflib-dev \
    pixman-dev \
    pangomm-dev \
    libjpeg-turbo-dev \
    freetype-dev

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies for build)
RUN npm ci --include=dev

# ============================================================================
# Stage 2: Build stage - Compile TypeScript and build React app
# ============================================================================
FROM base AS builder

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate --schema=prisma/schema.prisma

# Build the application
RUN npm run build

# ============================================================================
# Stage 3: Production dependencies
# ============================================================================
FROM node:20-alpine AS deps

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --omit=dev --ignore-scripts

# ============================================================================
# Stage 4: Production runtime image
# ============================================================================
FROM node:20-alpine AS runtime

# Set environment variables
ENV NODE_ENV=production
ENV PORT=4005
ENV TZ=UTC

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nlccms -u 1001

# Set working directory
WORKDIR /app

# Install runtime system dependencies
RUN apk add --no-cache \
    dumb-init \
    curl \
    ca-certificates \
    tzdata

# Copy production dependencies
COPY --from=deps --chown=nlccms:nodejs /app/node_modules ./node_modules

# Copy built application from builder stage
COPY --from=builder --chown=nlccms:nodejs /app/dist ./

# Copy Prisma schema and migrations
COPY --from=builder --chown=nlccms:nodejs /app/prisma/schema.prisma ./prisma/
COPY --from=builder --chown=nlccms:nodejs /app/prisma/migrations ./prisma/migrations/
COPY --from=builder --chown=nlccms:nodejs /app/prisma/seed.prod.js ./prisma/
COPY --from=builder --chown=nlccms:nodejs /app/prisma/seed.common.js ./prisma/
COPY --from=builder --chown=nlccms:nodejs /app/prisma/migration-utils.js ./prisma/

# Copy essential configuration files
COPY --from=builder --chown=nlccms:nodejs /app/ecosystem.prod.config.cjs ./
COPY --from=builder --chown=nlccms:nodejs /app/.env.production.template ./

# Create necessary directories with proper permissions
RUN mkdir -p uploads logs config/ssl && \
    chown -R nlccms:nodejs uploads logs config

# Create health check script
RUN echo '#!/bin/sh\ncurl -f http://localhost:$PORT/api/health || exit 1' > /usr/local/bin/healthcheck.sh && \
    chmod +x /usr/local/bin/healthcheck.sh

# Switch to non-root user
USER nlccms

# Expose port
EXPOSE 4005

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD /usr/local/bin/healthcheck.sh

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Default command
CMD ["node", "server/server.js"]

# ============================================================================
# Build metadata
# ============================================================================
LABEL maintainer="Harihar Upadhyay <hariharupadhyay21@gnu.ac.in>"
LABEL version="1.0.3"
LABEL description="Fix_Smart_CMS - Complaint Management System"
LABEL org.opencontainers.image.title="Fix_Smart_CMS"
LABEL org.opencontainers.image.description="Modern complaint management system for municipal organizations"
LABEL org.opencontainers.image.version="1.0.3"
LABEL org.opencontainers.image.vendor="NLC-CMS"
LABEL org.opencontainers.image.licenses="MIT"
LABEL org.opencontainers.image.source="https://github.com/your-org/Fix_Smart_CMS_v1.0.3"