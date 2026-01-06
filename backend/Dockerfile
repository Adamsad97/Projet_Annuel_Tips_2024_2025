FROM node:24-alpine AS base
WORKDIR /app

RUN apk add --no-cache openssl

COPY package*.json ./

FROM base AS production

ENV NODE_ENV=production

RUN npm ci --omit=dev --quiet && \
    npm cache clean --force

COPY prisma ./prisma
COPY prisma.config.ts ./prisma.config.ts
RUN npx prisma generate

COPY tsconfig.json ./
COPY src ./src

RUN npm run build

RUN rm -rf src tsconfig.json

USER node

EXPOSE 3001

CMD ["node", "dist/server.js"]

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

CMD ["npm", "run", "dev"]