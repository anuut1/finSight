# Production Dockerfile for FinSight Backend (Node.js 20 LTS Alpine)
FROM node:20-alpine AS base

# Install security updates
RUN apk update && apk upgrade && apk add --no-cache dumb-init

WORKDIR /app

# Copy package manifests first for optimal Docker layer caching
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy application source code
COPY . .

# Set environment defaults
ENV NODE_ENV=production
ENV PORT=5000

# Run as non-root user for container security
USER node

# Expose backend port
EXPOSE 5000

# Use dumb-init to properly handle PID 1 signals (SIGINT, SIGTERM)
ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["node", "index.js"]
