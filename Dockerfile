# ============================================================
# NexPlan Data Center Dockerfile
# ============================================================
# Multi-stage build:
#   Stage 1 (builder): installs deps, builds Next.js with standalone output
#   Stage 2 (runner):  minimal production image (~100 MB)
#
# What clients GET:    compiled image from ghcr.io/sandhyasneha/nexplan
# What clients DON'T:  src/ folder, your API keys, your source code
#
# Licence flow:
#   1. Container starts → runs scripts/check-licence.js
#   2. check-licence.js calls https://nexplan.io/api/licence/validate
#   3. If valid → starts Next.js server
#   4. If invalid → exits with non-zero (container won't boot)
#   5. Air-gap mode: verifies offline using baked-in public key
# ============================================================

# ── Stage 1: Builder ──────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

# Copy package files first (better layer caching)
COPY package.json package-lock.json ./

# Install all dependencies
RUN npm ci

# Copy source code
COPY . .

# Build args — only used at build time, not stored in final image
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXPLAN_LICENCE_PUBLIC_KEY

ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXPLAN_LICENCE_PUBLIC_KEY=$NEXPLAN_LICENCE_PUBLIC_KEY

# ── KEY BIT: tell next.config.js to switch on standalone output ──────────────
# This is the only line that differs from a normal `npm run build` — it makes
# Next.js produce .next/standalone/ which is the self-contained server we ship.
ENV NEXPLAN_BUILD_TARGET=docker

# Build Next.js (output: .next/standalone/ + .next/static/)
RUN npm run build

# ── Stage 2: Runner ───────────────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

# Security: don't run as root
RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 nextjs

# Copy ONLY the built output — no source code
COPY --from=builder --chown=nextjs:nodejs /app/public                ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone      ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static          ./.next/static

# Copy the licence check script (must run before server.js)
COPY --from=builder --chown=nextjs:nodejs /app/scripts/check-licence.js ./scripts/check-licence.js

# The PUBLIC key is baked in for offline (air-gap) licence verification.
# The PRIVATE key is NEVER in the image — it stays only on nexplan.io.
RUN echo "$NEXPLAN_LICENCE_PUBLIC_KEY" > /app/licence.pub \
 && chown nextjs:nodejs /app/licence.pub

USER nextjs

# Expose the port Next.js standalone listens on
EXPOSE 8080

ENV PORT=8080
ENV NODE_ENV=production
ENV HOSTNAME="0.0.0.0"

# ── Startup sequence ──────────────────────────────────────────────────────────
# 1. Run check-licence.js — exits non-zero if licence invalid (container won't boot)
# 2. If licence passes, start the Next.js server
#
# Using `sh -c` so we can chain the two commands. The `&&` ensures the server
# only starts if the licence check succeeds.
CMD ["sh", "-c", "node scripts/check-licence.js && node server.js"]
