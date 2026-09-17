# syntax=docker/dockerfile:1
FROM node:22-alpine AS builder
WORKDIR /app

COPY package.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm install --no-audit --no-fund --prefer-offline

COPY . .
RUN --mount=type=cache,target=.next/cache \
    npm run build

FROM node:22-alpine AS runner
WORKDIR /app

RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 appuser

COPY --from=builder --chown=appuser:nodejs /app/public ./public
COPY --from=builder --chown=appuser:nodejs /app/.next/standalone ./
COPY --from=builder --chown=appuser:nodejs /app/.next/static ./.next/static

USER appuser
EXPOSE 8095
ENV PORT=8095 HOSTNAME=0.0.0.0

CMD ["node", "server.js"]
