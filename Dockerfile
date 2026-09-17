# syntax=docker/dockerfile:1
# Next.js is pre-built on the CI runner; this image just packages the output.
FROM node:22-alpine AS runner
WORKDIR /app

RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 appuser

# Pre-built output uploaded by the build-app CI job
COPY --chown=appuser:nodejs public ./public
COPY --chown=appuser:nodejs .next/standalone ./
COPY --chown=appuser:nodejs .next/static ./.next/static

# Reinstall bcrypt for the target architecture.
# standalone bundles the amd64 build-machine binary; replace with the correct arch.
COPY package.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm install bcrypt --no-audit --no-fund && \
    cp -r node_modules/bcrypt .next/standalone/node_modules/bcrypt && \
    rm -rf node_modules package.json

USER appuser
EXPOSE 8095
ENV PORT=8095 HOSTNAME=0.0.0.0

CMD ["node", "server.js"]
