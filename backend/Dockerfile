FROM node:24-alpine AS base
WORKDIR /app

RUN apk add --no-cache openssl

COPY package*.json ./

# ---------- Build : toutes les dépendances pour compiler le TypeScript ----------
FROM base AS build

RUN npm ci --quiet

COPY prisma ./prisma
COPY prisma.config.ts ./prisma.config.ts
RUN npx prisma generate

COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# ---------- Production : dépendances d'exécution et code compilé uniquement ----------
FROM base AS production

ENV NODE_ENV=production

RUN npm ci --omit=dev --quiet && \
    npm cache clean --force

# Schéma et migrations : le client Prisma est généré ici, les migrations sont appliquées au démarrage
COPY prisma ./prisma
COPY prisma.config.ts ./prisma.config.ts
RUN npx prisma generate

COPY --from=build /app/dist ./dist

RUN mkdir -p uploads && chown node:node uploads

USER node

EXPOSE 3001

# Applique les migrations en attente (verrou Prisma : sûr avec plusieurs instances) puis démarre
CMD ["npm", "run", "start:prod"]

# ---------- Développement : rechargement à chaud, code monté en volume ----------
FROM base AS development

ENV NODE_ENV=development

RUN npm ci --quiet && \
    npm cache clean --force && \
    rm -rf /root/.npm

COPY prisma ./prisma
COPY prisma.config.ts ./prisma.config.ts
RUN npx prisma generate

USER node

EXPOSE 3001

# Code monté en volume (Windows/macOS) : surveillance par scrutation, les événements fichiers ne traversent pas le montage
CMD ["npm", "run", "dev:docker"]
