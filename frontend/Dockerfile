# ==========================================
# Stage 1: Build Stage
# ==========================================
FROM node:24-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --quiet && \
    npm cache clean --force

# Copy application code
COPY . .

# Build the Nuxt application
RUN npm run build

# ==========================================
# Stage 2: Production Stage with Nginx
# ==========================================
FROM nginx:1.27-alpine AS production

# Install Node.js for Nuxt server
RUN apk add --no-cache nodejs npm

WORKDIR /app

# Copy built application from builder
COPY --from=builder /app/.output /app/.output
COPY --from=builder /app/package*.json /app/

# Copy nginx configuration
COPY nginx/default.conf /etc/nginx/conf.d/default.conf

# Create startup script
RUN echo '#!/bin/sh' > /start.sh && \
    echo 'node /app/.output/server/index.mjs &' >> /start.sh && \
    echo 'nginx -g "daemon off;"' >> /start.sh && \
    chmod +x /start.sh

EXPOSE 80 3000

CMD ["/start.sh"]

# ==========================================
# Stage 3: Development Stage
# ==========================================
FROM node:24-alpine AS development

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev)
RUN npm ci --quiet && \
    npm cache clean --force

USER node

EXPOSE 3000

CMD ["npm", "run", "dev:host"]
