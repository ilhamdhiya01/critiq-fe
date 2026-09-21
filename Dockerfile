# syntax=docker/dockerfile:1.7

###############################################################################
# Stage 1: deps — install node_modules only. Cached unless the lockfile changes.
###############################################################################
FROM node:22-alpine AS deps
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@10.33.0 --activate

# Only the files that affect dependency resolution, so app code edits do not
# bust this layer.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# --ignore-scripts skips `prepare: husky`, which exits non-zero without a .git
# directory, and also skips transitive postinstall scripts.
RUN pnpm install --frozen-lockfile --ignore-scripts

###############################################################################
# Stage 2: builder — run next build, producing .next/standalone
###############################################################################
FROM node:22-alpine AS builder
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@10.33.0 --activate

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# NEXT_PUBLIC_* values are inlined into the client bundle at build time, so this
# must be set before `pnpm build`. routes.ts falls back to "" when it is missing,
# which produces a bundle whose API calls all resolve against the frontend origin.
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

RUN test -n "$NEXT_PUBLIC_API_URL" || \
  (echo "ERROR: build-arg NEXT_PUBLIC_API_URL is required (expected /api/v1)" && exit 1)

# Requires outbound network: next/font/google fetches JetBrains Mono here.
RUN pnpm build

###############################################################################
# Stage 3: runner — minimal runtime, standalone server only
###############################################################################
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
# 0.0.0.0 inside the container so Docker's port mapping can reach it. The
# loopback-only restriction is applied host-side in docker-compose.yml.
ENV HOSTNAME="0.0.0.0"

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

# public/ and .next/static are not included in .next/standalone and must be
# copied explicitly, otherwise the app serves HTML while every asset 404s.
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000

# /login rather than /: proxy.ts treats / as a private route and redirects
# unauthenticated requests, which would fail the check permanently.
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/login').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server.js"]
