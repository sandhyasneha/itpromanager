import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/dashboard', '/kanban', '/project-plan', '/knowledge', '/admin', '/settings', '/feedback'],
    },
    sitemap: 'https://www.nexplan.io/sitemap.xml',
  }
}
