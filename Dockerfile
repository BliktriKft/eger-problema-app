# Eger Város Probléma Térkép — NestJS API
# Single-stage Dockerfile. Railway will build this and run
#   node apps/api/dist/main.js
# from the monorepo root, which means:
#   /repo/apps/api/dist/main.js        ← entrypoint (we resolve via WORKDIR)
#   /repo/apps/api/node_modules/      ← dependencies (copied from builder step)
#   /repo/packages/shared/            ← workspace package, inlined
#
# Railway now requires the Dockerfile to be in the repo root and
# the service's "Root Directory" left empty; the previous
# `pnpm deploy` / `/deploy` indirection was the source of every
# path-resolution error in earlier attempts. This Dockerfile
# avoids that indirection entirely: it produces a runtime image
# that already contains the compiled output + a flat, hoisted
# node_modules, copied directly from the monorepo build.

# Bumped to force a fresh build (Railway caches layers).
ARG CACHE_BUST=2026-09-03-r2

# ---- Builder stage: install everything (devDeps too) and build ----
FROM node:22-bookworm-slim AS builder
ARG CACHE_BUST
WORKDIR /repo

RUN corepack enable

# Copy the monorepo manifests first (best Docker layer caching).
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages/shared/package.json packages/shared/
COPY packages/shared/tsconfig.json packages/shared/
COPY packages/shared/tsconfig.build.json packages/shared/
COPY apps/api/package.json apps/api/
COPY apps/api/tsconfig.json apps/api/
COPY apps/api/tsconfig.build.json apps/api/
COPY apps/api/nest-cli.json apps/api/
COPY apps/api/.env.example apps/api/

# Install everything (devDeps included) so we can build.
# --shamefully-hoist lays node_modules flat (no .pnpm symlink layer),
# which is the version that survives being COPYed across stages.
RUN pnpm install --frozen-lockfile=false --shamefully-hoist

# Copy source and build.
COPY packages/shared/ packages/shared/
COPY apps/api/ apps/api/
RUN pnpm --filter @eger/shared build
RUN pnpm --filter @eger/api prisma:generate
RUN pnpm --filter @eger/api build

# ---- Runtime stage: ship the compiled output + flat node_modules ----
FROM node:22-bookworm-slim AS runner
ARG CACHE_BUST
ENV NODE_ENV=production
ENV PORT=8000

# Prisma 6.x ships with OpenSSL 3 binaries, which is what Debian
# bookworm provides natively. No additional system packages needed.

WORKDIR /repo

# Copy everything we need from the builder.
# node_modules is already flat (--shamefully-hoist).
COPY --from=builder /repo/node_modules ./node_modules
COPY --from=builder /repo/apps/api/dist ./apps/api/dist
COPY --from=builder /repo/packages/shared/dist ./packages/shared/dist
COPY --from=builder /repo/apps/api/package.json ./apps/api/package.json

# The pnpm symlink that the builder created is
#   /repo/node_modules/@eger/shared -> ../../packages/shared
# which inside this stage resolves to /packages/shared (one level
# above /repo, which does not exist). The COPY above populated
# /repo/packages/shared/dist/ but the symlink target is the parent,
# not the dist. So Node's module resolver walks:
#   /repo/apps/api/dist/...
#   -> /repo/node_modules/@eger/shared  (symlink)
#   -> /packages/shared                  (broken: outside /repo)
#
# Fix: delete the dangling symlink and replace it with a real
# directory containing the copied dist, so '@eger/shared' resolves
# to /repo/node_modules/@eger/shared/dist/index.js (matching the
# packages/shared/package.json "main": "./dist/index.js").
RUN rm -f /repo/node_modules/@eger/shared \
 && mkdir -p /repo/node_modules/@eger/shared \
 && cp -r /repo/packages/shared/dist/* /repo/node_modules/@eger/shared/

EXPOSE 8000

# Start the compiled api. WORKDIR is /repo (the monorepo root), so
# `node apps/api/dist/main.js` resolves to /repo/apps/api/dist/main.js,
# which is exactly the file the builder produced.
CMD ["node", "apps/api/dist/main.js"]