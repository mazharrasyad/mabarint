# Mabarint demo site (Next.js standalone) for https://mazharrasyad.tech/mabarint
FROM node:20-alpine AS build
WORKDIR /repo
COPY package.json package-lock.json ./
COPY packages/types/package.json packages/types/
COPY packages/engine/package.json packages/engine/
COPY packages/renderer/package.json packages/renderer/
COPY apps/web/package.json apps/web/
RUN npm ci --no-audit --no-fund
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production PORT=3000 HOSTNAME=0.0.0.0 CACHE_DIR=/data/cache
COPY --from=build /repo/apps/web/.next/standalone ./
COPY --from=build /repo/apps/web/.next/static ./apps/web/.next/static
COPY --from=build /repo/apps/web/public ./apps/web/public
RUN mkdir -p /data/cache && chown -R node:node /data
USER node
EXPOSE 3000
CMD ["node", "apps/web/server.js"]
