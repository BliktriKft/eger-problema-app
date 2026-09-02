# Multi-stage Dockerfile for the Eger Város Probléma Térkép NestJS API.
# Designed for Railway: the Dockerfile lives at the monorepo root, and
# the Railway service's "Root Directory" is left empty so the build
# context is the whole monorepo.
#
# Strategy:
#   Stage 1 (builder): install everything, build the shared package,
#                       build the api (creates apps/api/dist/), then
#                       run `pnpm deploy --prod /deploy` to flatten
#                       node_modules into /deploy. pnpm deploy only
#                       copies package.json + src/, NOT the compiled
#                       dist/, so we manually `cp -r apps/api/dist
#                       /deploy/dist` after the deploy step.
#   Stage 2 (runner):  copy /deploy from builder, WORKDIR /deploy,
#                       and run `node dist/main.js` (the dist/ we
#                       manually copied in).

# Bumped 2026-09-02 to invalidate Railway's stale build cache.
ARG CACHE_BUST=2026-09-02-r3

# ---- Stage 1: deps + builds + pnpm deploy ---- ----
FROM node:20-bookworm-slim AS builder
ARG CACHE_BUST
WORKDIR /repo

RUN corepack enable

# Copy manifests first for better Docker layer caching.
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages/shared/package.json packages/shared/
COPY apps/api/package.json apps/api/

# Install everything (devDeps included) so we can build.
RUN pnpm install --frozen-lockfile=false

# Copy the source and build the api (creates apps/api/dist/).
COPY packages/shared/ packages/shared/
COPY apps/api/ apps/api/
RUN pnpm --filter @eger/shared build
RUN pnpm --filter @eger/api build

# Flatten node_modules into /deploy via pnpm deploy.
# Then manually copy the compiled dist/ into /deploy, because
# pnpm deploy's file manifest does not include compiled output
# (it copies only src/ + package.json from the workspace package).
RUN pnpm --filter @eger/api deploy --prod /deploy
RUN cp -r /repo/apps/api/dist /deploy/dist

# ---- Stage 2: production-only runtime ----
FROM node:20-bookworm-slim AS runner
ARG CACHE_BUST
ENV NODE_ENV=production
ENV PORT=8000

RUN corepack enable

# pnpm deploy laid out the runtime tree at /deploy:
#   /deploy/package.json
#   /deploy/dist/main.js, /deploy/dist/app.module.js, ...
#   /deploy/node_modules/@nestjs/core (flat, no symlinks)
#   /deploy/node_modules/.pnpm (resolved)
COPY --from=builder /deploy /deploy

WORKDIR /deploy
EXPOSE 8000
ENTRYPOINT ["node"]
CMD ["dist/main.js"]