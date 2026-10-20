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
# Stage 2: Production Stage (serveur Nuxt seul)
# Le nginx principal (nginx.conf à la racine) route /api et /socket.io vers le backend
# et le reste vers ce serveur.
# ==========================================
FROM node:24-alpine AS production

ENV NODE_ENV=production     HOST=0.0.0.0     PORT=3000

WORKDIR /app

# Le build Nuxt (.output) est autonome : aucune dépendance npm à installer
COPY --from=builder --chown=node:node /app/.output /app/.output

USER node

EXPOSE 3000

CMD ["node", "/app/.output/server/index.mjs"]

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
