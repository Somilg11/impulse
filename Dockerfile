# syntax=docker/dockerfile:1

# Multi-stage build producing a minimal runtime image from Next.js's
# `output: "standalone"` bundle - only the server and the modules it actually
# imports, not the full node_modules tree.

# ---- deps ------------------------------------------------------------------
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ---- builder ---------------------------------------------------------------
FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# The build compiles the app; it does not need real secrets, only a satisfiable
# env schema. Supply real values at runtime.
ENV SKIP_ENV_VALIDATION=1
ENV NEXT_TELEMETRY_DISABLED=1

# prisma.config.ts reads DATABASE_URL when the config loads, so `prisma generate`
# needs the variable set even though it never opens a connection. This value is
# a placeholder for the build only and is replaced at runtime.
ENV DATABASE_URL=postgresql://placeholder:placeholder@localhost:5432/placeholder

RUN npx prisma generate
RUN npm run build

# ---- runner ----------------------------------------------------------------
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Run as an unprivileged user.
RUN addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Needed to run `prisma migrate deploy` against the container's database.
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/prisma.config.ts ./prisma.config.ts

USER nextjs
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server.js"]
