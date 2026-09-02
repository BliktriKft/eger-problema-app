# Multi-stage Dockerfile for the Eger Város Probléma Térkép NestJS API.
# Designed for Railway: the Dockerfile lives at the monorepo root, and
# the Railway service's "Root Directory" is left empty so the build
# context is the whole monorepo.
#
# Strategy:
#   Stage 1 (builder): install everything, build the shared package,
#                       build the api, then run `pnpm deploy --prod /deploy`
#                       to flatten node_modules into a self-contained
#                       directory. The /deploy dir ends up containing:
#                         - apps/api/package.json
#                         - apps/api/dist/main.js, dist/app.module.js, ...
#                         - apps/api/node_modules (flat, prod-only)
#                         - packages/shared/dist
#   Stage 2 (runner):  copy /deploy from builder, WORKDIR into
#                       /deploy/apps/api (where the dist/ lives), run
#                       node dist/main.js.

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

# Now copy the actual source code and run the builds.
COPY packages/shared/ packages/shared/
COPY apps/api/ apps/api/
RUN pnpm --filter @eger/shared build
RUN pnpm --filter @eger/api build

# Flatten the api workspace into /deploy so the runtime image
# does not depend on pnpm symlinks. --prod strips devDeps.
RUN pnpm --filter @eger/api deploy --prod /deploy

# ---- Stage 2: production-only runtime ----
FROM node:20-bookworm-slim AS runner
ENV NODE_ENV=production
ENV PORT=8000

RUN corepack enable

# pnpm deploy lays out apps/api/* at /deploy, including:
#   /deploy/dist/main.js
#   /deploy/dist/app.module.js
#   /deploy/node_modules/@nestjs/core (real file, no symlinks)
#   /deploy/node_modules/.pnpm (resolved)
#   /deploy/package.json
#   /deploy/node_modules/... (every prod dep)
COPY --from=builder /deploy /deploy

WORKDIR /deploy
EXPOSE 8000
CMD ["node", "dist/main.js"]