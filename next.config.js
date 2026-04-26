const withPWA = require('@ducanh2912/next-pwa').default({
  dest: 'public',
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  swcMinify: true,
  disable: process.env.NODE_ENV === 'development',
  workboxOptions: {
    disableDevLogs: true,
  },
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      'lh3.googleusercontent.com',
      'avatars.githubusercontent.com',
      'graph.facebook.com',
    ],
  },

  // ── DC / Docker build only ──────────────────────────────────────────────
  // Vercel deployments leave NEXPLAN_BUILD_TARGET unset → output stays default
  // (current behaviour, PWA works as today).
  //
  // Docker builds set NEXPLAN_BUILD_TARGET=docker (in the Dockerfile) → output
  // switches to 'standalone' which produces a self-contained .next/standalone/
  // folder for shipping to enterprise customers.
  ...(process.env.NEXPLAN_BUILD_TARGET === 'docker' ? { output: 'standalone' } : {}),
}

module.exports = withPWA(nextConfig)
