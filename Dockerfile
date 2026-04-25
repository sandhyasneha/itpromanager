# ============================================================
# NexPlan Data Center Dockerfile
# ============================================================
# Multi-stage build:
#   Stage 1 (builder): installs deps, builds Next.js
#   Stage 2 (runner):  minimal production image
#
# What clients GET:    compiled image from ghcr.io/sandhyasneha/nexplan
# What clients DON'T: src/ folder, API keys, source code
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

# Build arguments — injected at build time, not stored in final image
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXPLAN_LICENCE_PUBLIC_KEY

ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXPLAN_LICENCE_PUBLIC_KEY=$NEXPLAN_LICENCE_PUBLIC_KEY

# Build the Next.js app (output: .next/)
RUN npm run build

# ── Stage 2: Runner ───────────────────────────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

# Security: don't run as root
RUN addgroup --system --gid 1001 nodejs
RUN adduser  --system --uid 1001 nextjs

# Copy ONLY the built output — no source code
COPY --from=builder /app/public         ./public
COPY --from=builder /app/.next/standalone  ./
COPY --from=builder /app/.next/static   ./.next/static

# The public key is baked into the image for offline licence verification
# The private key is NEVER in the image
COPY --from=builder /app/node_modules/.nexplan-licence-public-key ./licence.pub 2>/dev/null || true

# Set ownership
RUN chown -R nextjs:nodejs /app

USER nextjs

# Expose port
EXPOSE 3000

ENV PORT=3000
ENV NODE_ENV=production
ENV HOSTNAME="0.0.0.0"

# Startup: verify licence BEFORE starting the app
# If NEXPLAN_LICENCE_KEY is not set or invalid → container exits
CMD ["node", "server.js"]
