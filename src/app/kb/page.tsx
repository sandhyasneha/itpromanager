import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'IT Knowledge Base — Free Guides for IT Teams | NexPlan',
  description: 'Free IT guides covering server builds, Cisco configuration, SDWAN, Azure migration, data centre projects and more. Built for IT Project Managers and Network Engineers.',
  keywords: ['IT knowledge base', 'free IT guides', 'Cisco configuration', 'SDWAN', 'Azure migration', 'server setup', 'IT project management'],
}

function titleToSlug(title: string) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

const CATEGORY_ICONS: Record<string, string> = {
  'Networking':          '🌐',
  'Server & VM':         '🖥️',
  'Cloud':               '☁️',
  'Security':            '🔒',
  'Migration':           '🔄',
  'Project Management':  '📋',
  'Operations':          '⚙️',
  'General':             '📄',
}

export default async function KBIndexPage() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data: articles } = await supabase
    .from('kb_articles')
    .select('id, title, category, created_at, tags')
    .order('category', { ascending: true })

  const allArticles = articles ?? []

  // Group by category
  const byCategory = allArticles.reduce((acc: Record<string, typeof allArticles>, a) => {
    const cat = a.category || 'General'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(a)
    return acc
  }, {})

  return (
    <div className="min-h-screen bg-bg text-text">
      <div className="fixed inset-0 grid-bg opacity-30 pointer-events-none"/>
      <div className="fixed w-[400px] h-[400px] rounded-full blur-[120px] opacity-10 bg-accent -top-32 -right-32 pointer-events-none"/>

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-12 py-5 backdrop-blur-xl bg-bg/80 border-b border-border">
        <Link href="/" className="font-syne font-black text-xl">Nex<span className="text-accent">Plan</span></Link>
        <div className="hidden md:flex gap-6">
          <Link href="/kb" className="text-accent text-sm font-semibold">Knowledge Base</Link>
          <Link href="/pricing" className="text-muted text-sm hover:text-text transition-colors">Pricing</Link>
          <Link href="/docs" className="text-muted text-sm hover:text-text transition-colors">Docs</Link>
          <Link href="/about" className="text-muted text-sm hover:text-text transition-colors">About</Link>
        </div>
        <div className="flex gap-3">
          <Link href="/login" className="btn-ghost text-sm px-4 py-2">Sign In</Link>
          <Link href="/login" className="btn-primary text-sm px-4 py-2">Free Sign Up</Link>
        </div>
      </nav>

      <div className="relative z-10 max-w-6xl mx-auto px-6 pt-32 pb-20">

        {/* Header */}
        <div className="text-center mb-14">
          <p className="font-mono-code text-accent text-xs tracking-widest uppercase mb-4">// Free IT Knowledge Base</p>
          <h1 className="font-syne font-black text-5xl md:text-6xl mb-4">
            IT Guides for <span className="text-accent">every project</span>
          </h1>
          <p className="text-muted text-lg max-w-2xl mx-auto mb-6">
            {allArticles.length} free professional guides for IT Project Managers and Network Engineers. Servers, networking, cloud migration, security and more.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap text-sm text-muted">
            <span className="flex items-center gap-1.5">✅ Free forever</span>
            <span>·</span>
            <span className="flex items-center gap-1.5">🤖 AI-powered</span>
            <span>·</span>
            <span className="flex items-center gap-1.5">📚 {allArticles.length} articles</span>
          </div>
        </div>

        {/* Categories */}
        <div className="space-y-12">
          {Object.entries(byCategory).map(([category, catArticles]) => (
            <div key={category}>
              <div className="flex items-center gap-3 mb-5">
                <span className="text-2xl">{CATEGORY_ICONS[category] ?? '📄'}</span>
                <h2 className="font-syne font-black text-2xl">{category}</h2>
                <span className="text-xs font-mono-code text-muted bg-surface2 px-2 py-1 rounded-lg">
                  {catArticles.length} articles
                </span>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {catArticles.map(article => (
                  <Link key={article.id} href={`/kb/${titleToSlug(article.title)}`}
                    className="card hover:border-accent/40 hover:-translate-y-0.5 transition-all group">
                    <p className="font-syne font-semibold mb-2 group-hover:text-accent transition-colors leading-snug">
                      {article.title}
                    </p>
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-xs text-muted font-mono-code">
                        {new Date(article.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                      <span className="text-muted group-hover:text-accent transition-colors text-sm">→</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="card border-accent/30 text-center py-12 mt-16">
          <h3 className="font-syne font-black text-3xl mb-3">Use these guides inside NexPlan</h3>
          <p className="text-muted mb-8 max-w-lg mx-auto">
            Search this knowledge base, generate AI articles on any IT topic, and manage your projects — all free.
          </p>
          <Link href="/login" className="btn-primary px-8 py-3">Start Free — No Credit Card →</Link>
        </div>
      </div>

      <footer className="relative z-10 text-center py-8 text-muted text-sm border-t border-border">
        © 2025 NexPlan ·
        <a href="mailto:info@nexplan.io" className="text-accent hover:underline mx-2">info@nexplan.io</a> ·
        <Link href="/" className="hover:text-text mx-2">Home</Link>
      </footer>
    </div>
  )
}
