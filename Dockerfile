# Multi-stage Dockerfile for the Eger Város Probléma Térkép NestJS API.
# Designed for Railway: place the Dockerfile at the monorepo root and
# leave the Railway service's "Root Directory" empty so the Docker
# build context is the entire monorepo.
#
# Strategy:
#   Stage 1 (builder): install everything (dev deps included), build
#                       the shared package, build the api.
#   Stage 2 (runner):  fresh node_modules with --prod only, copy in
#                       the built dist/ tree. Skipping COPY on the
#                       symlinked pnpm node_modules avoids the
#                       "Cannot find module @nestjs/core" error you
#                       get when Docker flattens the .pnpm store.

# ---- Stage 1: deps + builds ----
FROM node:20-bookworm-slim AS builder
WORKDIR /repo

RUN corepack enable

# Copy manifests first so pnpm resolves and caches deps in a separate
# Docker layer.
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages/shared/package.json packages/shared/
COPY apps/api/package.json apps/api/

# Install api workspace + all transitive deps (including devDeps
# we need for nest build / tsc).
RUN pnpm install --frozen-lockfile=false

# Now copy the actual source code and run the builds.
COPY packages/shared/ packages/shared/
COPY apps/api/ apps/api/
RUN pnpm --filter @eger/shared build
RUN pnpm --filter @eger/api build

# ---- Stage 2: production-only runtime ----
FROM node:20-bookworm-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8000

RUN corepack enable

# Re-install only production deps in this stage. The pnpm symlink
# structure (node_modules/@nestjs/core -> node_modules/.pnpm/...)
# survives a clean pnpm install, unlike a `COPY node_modules` from
# the builder stage.
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages/shared/package.json packages/shared/
COPY apps/api/package.json apps/api/
RUN pnpm install --prod --frozen-lockfile=false

# Copy the built artifacts from the builder stage.
COPY --from=builder /repo/apps/api/dist ./dist
COPY --from=builder /repo/packages/shared/dist /repo/packages/shared/dist

EXPOSE 8000
CMD ["node", "dist/main.js"]