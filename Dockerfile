# Multi-stage Dockerfile for the Eger Város Probléma Térkép NestJS API.
# Designed for Railway: the Dockerfile lives at the monorepo root, and
# the Railway service's "Root Directory" is left empty so the build
# context is the whole monorepo.
#
# Strategy:
#   Stage 1 (builder): install everything, build the shared package,
#                       build the api, then run `pnpm deploy --prod /deploy`
#                       to flatten node_modules into a self-contained
#                       directory.
#   Stage 2 (runner):  copy /deploy from builder, WORKDIR /deploy,
#                       and run node dist/main.js (the dist/ is the api
#                       dist laid out by pnpm deploy).
#
# Use ENTRYPOINT + CMD explicitly so Railway's override of CMD does not
# break the relative path resolution against WORKDIR. We previously saw
# the container crash with 'Cannot find module /app/dist/main.js'
# because the platform was forcing the path even after we updated the
# WORKDIR to /deploy. Splitting ENTRYPOINT and CMD makes the intent
# unambiguous.

# Bumped 2026-09-02 to invalidate Railway's stale build cache.
ARG CACHE_BUST=2026-09-02-r2

# ---- Stage 1: deps + builds + pnpm deploy ----
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

# Now copy the actual source code and run the builds.
COPY packages/shared/ packages/shared/
COPY apps/api/ apps/api/
RUN pnpm --filter @eger/shared build
RUN pnpm --filter @eger/api build

# Flatten the api workspace into /deploy.
RUN pnpm --filter @eger/api deploy --prod /deploy

# ---- Stage 2: production-only runtime ----
FROM node:20-bookworm-slim AS runner
ARG CACHE_BUST
ENV NODE_ENV=production
ENV PORT=8000

RUN corepack enable

# pnpm deploy lays everything out at /deploy.
COPY --from=builder /deploy /deploy

WORKDIR /deploy
EXPOSE 8000

# ENTRYPOINT explicitly invokes node, CMD provides the script.
# This way, even if Railway overrides CMD with a flag, the WORKDIR
# resolution and entry point are locked in by the Dockerfile.
ENTRYPOINT ["node"]
CMD ["dist/main.js"]