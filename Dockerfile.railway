# Multi-stage Dockerfile for the Eger Város Probléma Térkép NestJS API.
# Designed for Railway (which can pick this up if "Builder: Dockerfile"
# is set in the service settings). Root directory in Railway: leave empty
# so the workspace files are visible.

# ---- Stage 1: deps + shared build ----
FROM node:20-bookworm-slim AS builder
WORKDIR /repo

RUN corepack enable

# Copy the lockfile + manifests first so pnpm can resolve and cache them.
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages/shared/package.json packages/shared/
COPY apps/api/package.json apps/api/

# Install the api workspace and its transitive deps.
RUN pnpm install --frozen-lockfile=false

# Copy the rest of the source and build the shared package first
# (the api imports @eger/shared as a workspace package).
COPY packages/shared/ packages/shared/
COPY apps/api/ apps/api/
RUN pnpm --filter @eger/shared build
RUN pnpm --filter @eger/api build

# ---- Stage 2: slim runtime ----
FROM node:20-bookworm-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8000

# Copy only what we need at runtime.
COPY --from=builder /repo/apps/api/dist ./dist
COPY --from=builder /repo/apps/api/package.json ./
COPY --from=builder /repo/apps/api/node_modules ./node_modules
COPY --from=builder /repo/node_modules/.pnpm ./node_modules/.pnpm
COPY --from=builder /repo/packages/shared/dist /repo/packages/shared/dist

EXPOSE 8000
CMD ["node", "dist/main.js"]
