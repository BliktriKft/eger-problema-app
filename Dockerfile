# Multi-stage Dockerfile for the Eger Város Probléma Térkép NestJS API.
# Designed for Railway: the Dockerfile lives at the monorepo root, and
# the Railway service's "Root Directory" is left empty so the build
# context is the whole monorepo.
#
# Strategy:
#   Stage 1 (builder): install everything with pnpm, build the shared
#                       package, build the api (creates apps/api/dist/).
#   Stage 2 (runner):  copy apps/api/package.json to /app/package.json
#                       (with packages/shared as a file: dep), and
#                       also copy the built shared/dist as the resolved
#                       file source, then 'npm install --omit=dev' to
#                       produce a flat /app/node_modules. Finally
#                       copy the compiled api dist/ on top.
#
# Why this is different from earlier attempts:
#   - pnpm install in the runner stage (even with --shamefully-hoist)
#     would still try to resolve workspaces via pnpm-workspace.yaml,
#     and fail because apps/api/src/ is not present in the runner fs
#     (we only copy package.json, not the source).
#   - npm install is a flat, single-package resolver: it reads
#     package.json's "dependencies", and for each "file:..." entry it
#     copies / links that directory into node_modules. This works
#     perfectly for our needs because we already built the shared
#     package to /repo/packages/shared/dist on the builder fs.
#   - We also copy the builder-installed @nestjs/* packages from
#     /repo/node_modules into /app/node_modules directly, so the
#     runtime doesn't have to run npm install at all if we don't
#     want to.

# Bumped 2026-09-03 to invalidate Railway's stale build cache.
ARG CACHE_BUST=2026-09-03-r1

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

WORKDIR /app

# Bring in the full node_modules from the builder. The builder already
# installed every prod dep, and copying the directory preserves the
# real files (no .pnpm symlink layer because the builder ran with
# --shamefully-hoist). This is the simplest possible "no install at
# runtime" path.
COPY --from=builder /repo/node_modules ./node_modules

# Bring in the compiled shared package (its dist + node_modules).
COPY --from=builder /repo/packages/shared ./packages/shared

# Bring in the compiled api output.
COPY --from=builder /repo/apps/api/dist ./dist

# Bring in the api package.json (read by Nest at runtime to find
# scripts, but not strictly required for the dist).
COPY --from=builder /repo/apps/api/package.json ./package.json

EXPOSE 8000
CMD ["node", "dist/main.js"]