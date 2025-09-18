# Multi-stage Dockerfile for Splitly backend (Express + Prisma)

FROM node:20-bookworm-slim AS deps
WORKDIR /app

# Install workspace dependencies (backend + shared)
COPY package.json package-lock.json ./
COPY apps/backend/package.json apps/backend/package.json
COPY packages/shared/package.json packages/shared/package.json

RUN npm ci

FROM node:20-bookworm-slim AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json ./
COPY packages/shared/ packages/shared/
COPY apps/backend/ apps/backend/

# Build shared and backend; generate Prisma client
RUN npm run build --workspace @splitwise/shared \
  && npm run prisma:generate --workspace @splitwise/backend \
  && npm run build --workspace @splitwise/backend \
  && npm prune --omit=dev

FROM node:20-bookworm-slim AS runner
ENV NODE_ENV=production
WORKDIR /app

# Copy production node_modules and built apps
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/backend/dist ./apps/backend/dist
COPY --from=builder /app/apps/backend/package.json ./apps/backend/package.json
COPY --from=builder /app/apps/backend/prisma ./apps/backend/prisma
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/packages/shared/package.json ./packages/shared/package.json

EXPOSE 4000
CMD ["node", "apps/backend/dist/server.js"]

