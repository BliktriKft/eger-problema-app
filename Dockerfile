# Multi-stage Dockerfile for the Eger Város Probléma Térkép NestJS API.
# Designed for Railway: the Dockerfile lives at the monorepo root, and
# the Railway service's "Root Directory" is left empty so the build
# context is the whole monorepo.
#
# Strategy:
#   Stage 1 (builder): install everything, build the shared package,
#                       build the api, then run `pnpm deploy` to flatten
#                       node_modules (symlinks resolved) into a self-
#                       contained /deploy dir.
#   Stage 2 (runner):  copy ONLY the flattened /deploy dir from builder
#                       into a slim runtime image. The /deploy dir
#                       already contains:
#                         - apps/api/dist (built code)
#                         - apps/api/node_modules (flat, prod-only,
#                           symlinks resolved)
#                         - packages/shared/dist + node_modules
#                       No further install or symlink resolution needed.

# ---- Stage 1: deps + builds + pnpm deploy ----
FROM node:20-bookworm-slim AS builder
WORKDIR /repo

RUN corepack enable

# Copy manifests first for better Docker layer caching.
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages/shared/package.json packages/shared/
COPY apps/api/package.json apps/api/

# Install everything (devDeps included) so we can build.
RUN pnpm install --frozen-lockfile=false

# Now copy the source code and run the builds.
COPY packages/shared/ packages/shared/
COPY apps/api/ apps/api/
RUN pnpm --filter @eger/shared build
RUN pnpm --filter @eger/api build

# Run `pnpm deploy` to flatten node_modules into a self-contained
# directory. This resolves all pnpm symlinks into real files in
# /deploy/apps/api/node_modules, which Docker COPYs cleanly.
# The --prod flag excludes devDeps.
RUN pnpm --filter @eger/api deploy --prod /deploy

# ---- Stage 2: production-only runtime ----
FROM node:20-bookworm-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8000

# Copy the entire flattened deployment bundle. This contains:
#   - apps/api/package.json
#   - apps/api/dist/main.js, dist/app.module.js, ...
#   - apps/api/node_modules/@nestjs/core (real file, not symlink)
#   - apps/api/node_modules/.pnpm (resolved)
#   - packages/shared/dist (the compiled shared package)
#   - packages/shared/package.json
COPY --from=builder /deploy /app

EXPOSE 8000
CMD ["node", "dist/main.js"]