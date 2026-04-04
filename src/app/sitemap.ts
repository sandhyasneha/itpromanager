import { MetadataRoute } from 'next'
import { createClient } from '@supabase/supabase-js'

function titleToSlug(title: string) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://www.nexplan.io'

  const staticPages: MetadataRoute.Sitemap = [
    // ── Core public pages ──────────────────────────────────────────
    { url: baseUrl,                          lastModified: new Date(), changeFrequency: 'weekly',  priority: 1.0 },
    { url: `${baseUrl}/demo`,                lastModified: new Date(), changeFrequency: 'monthly', priority: 0.9 },
    { url: `${baseUrl}/pricing`,             lastModified: new Date(), changeFrequency: 'monthly', priority: 0.9 },
    { url: `${baseUrl}/about`,               lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/kb`,                  lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.9 },
    { url: `${baseUrl}/login`,               lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },

    // ── Docs (now at docs.nexplan.io) ──────────────────────────────
    { url: 'https://docs.nexplan.io',        lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.9 },

    // ── Core app pages ─────────────────────────────────────────────
    { url: `${baseUrl}/dashboard`,           lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.8 },
    { url: `${baseUrl}/kanban`,              lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.8 },
    { url: `${baseUrl}/project-plan`,        lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.8 },
    { url: `${baseUrl}/network`,             lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.8 },
    { url: `${baseUrl}/knowledge`,           lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.7 },
    { url: `${baseUrl}/reports`,             lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.7 },
    { url: `${baseUrl}/analytics`,           lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.7 },
    { url: `${baseUrl}/help`,                lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.8 },

    // ── Phase 4 — Mobile & My Tasks ────────────────────────────────
    { url: `${baseUrl}/my-tasks`,            lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.8 },

    // ── Organisation & team ────────────────────────────────────────
    { url: `${baseUrl}/organisation`,        lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.7 },
    { url: `${baseUrl}/client-portal`,       lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.7 },

    // ── User pages ─────────────────────────────────────────────────
    { url: `${baseUrl}/settings`,            lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/feedback`,            lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
  ]

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { data: articles } = await supabase
      .from('kb_articles')
      .select('title, created_at')
      .order('created_at', { ascending: false })

    const articlePages: MetadataRoute.Sitemap = (articles ?? []).map(article => ({
      url: `${baseUrl}/kb/${titleToSlug(article.title)}`,
      lastModified: new Date(article.created_at),
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    }))

    return [...staticPages, ...articlePages]
  } catch {
    return staticPages
  }
}
