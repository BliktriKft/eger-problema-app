# Multi-stage Dockerfile for the Eger Város Probléma Térkép NestJS API.
# Designed for Railway: the Dockerfile lives at the monorepo root, and
# the Railway service's "Root Directory" is left empty so the build
# context is the whole monorepo.
#
# Strategy:
#   Stage 1 (builder): install everything, build the shared package,
#                       build the api (creates apps/api/dist/).
#   Stage 2 (runner):  fresh node_modules installed with pnpm in /app
#                       (so /app/node_modules has real files, not
#                       symlinks), then copy dist/ from builder, then
#                       start with 'node dist/main.js'.
#
# Why this works now: the previous attempts used 'pnpm deploy' which
# placed everything under /deploy and required WORKDIR /deploy, but
# Railway kept resolving the entrypoint against its default /app.
# Putting the runtime tree at /app matches Railway's expectation, so
# 'node dist/main.js' resolves to /app/dist/main.js without any
# WORKDIR overrides needed.

# Bumped 2026-09-02 to invalidate Railway's stale build cache.
ARG CACHE_BUST=2026-09-02-r4

# ---- Stage 1: deps + builds ----
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

# Copy source and build.
COPY packages/shared/ packages/shared/
COPY apps/api/ apps/api/
RUN pnpm --filter @eger/shared build
RUN pnpm --filter @eger/api build

# ---- Stage 2: production-only runtime ----
FROM node:20-bookworm-slim AS runner
ARG CACHE_BUST
ENV NODE_ENV=production
ENV PORT=8000

RUN corepack enable

WORKDIR /app

# Re-install only prod deps in this stage. We do this in /app so the
# runtime tree lives where Railway expects it (/app/node_modules,
# /app/dist, etc.). The pnpm symlinks are created locally and survive
# inside the image because we install into /app directly.
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages/shared/package.json packages/shared/
COPY apps/api/package.json apps/api/

RUN pnpm install --prod --frozen-lockfile=false

# Copy the compiled output from the builder stage.
COPY --from=builder /repo/apps/api/dist ./dist
COPY --from=builder /repo/packages/shared/dist /repo/packages/shared/dist

EXPOSE 8000
CMD ["node", "dist/main.js"]