import { createClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

function titleToSlug(title: string) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

// Generate metadata for SEO
export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const { data: articles } = await supabase.from('kb_articles').select('title, content, category')
  const article = articles?.find(a => titleToSlug(a.title) === params.slug)
  if (!article) return { title: 'Article Not Found — NexPlan' }

  const excerpt = article.content?.split('\n').find((l: string) => l.trim().length > 60) ?? ''

  return {
    title: `${article.title} — NexPlan IT Knowledge Base`,
    description: excerpt.slice(0, 160),
    keywords: [article.title, article.category, 'IT project management', 'NexPlan', 'free IT guide'],
    openGraph: {
      title: article.title,
      description: excerpt.slice(0, 160),
      url: `https://www.nexplan.io/kb/${params.slug}`,
      siteName: 'NexPlan',
      type: 'article',
    },
  }
}

export default async function KBArticlePage({ params }: { params: { slug: string } }) {
  const { data: articles } = await supabase
    .from('kb_articles')
    .select('*')
    .order('created_at', { ascending: false })

  const article = articles?.find(a => titleToSlug(a.title) === params.slug)
  if (!article) notFound()

  // Format content into sections
  const sections = article.content.split(/\n(?=[A-Z][A-Z\s&]+\n)/).filter(Boolean)

  // Related articles — same category
  const related = articles?.filter(a => a.category === article.category && a.id !== article.id).slice(0, 4) ?? []

  return (
    <div className="min-h-screen bg-bg text-text">
      <div className="fixed inset-0 grid-bg opacity-30 pointer-events-none"/>

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-12 py-5 backdrop-blur-xl bg-bg/80 border-b border-border">
        <Link href="/" className="font-syne font-black text-xl">Nex<span className="text-accent">Plan</span></Link>
        <div className="hidden md:flex gap-6">
          <Link href="/kb" className="text-muted text-sm hover:text-accent transition-colors">Knowledge Base</Link>
          <Link href="/pricing" className="text-muted text-sm hover:text-text transition-colors">Pricing</Link>
          <Link href="/docs" className="text-muted text-sm hover:text-text transition-colors">Docs</Link>
        </div>
        <div className="flex gap-3">
          <Link href="/login" className="btn-ghost text-sm px-4 py-2">Sign In</Link>
          <Link href="/login" className="btn-primary text-sm px-4 py-2">Free Sign Up</Link>
        </div>
      </nav>

      <div className="relative z-10 max-w-4xl mx-auto px-6 pt-32 pb-20">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-muted font-mono-code mb-6">
          <Link href="/" className="hover:text-accent transition-colors">Home</Link>
          <span>/</span>
          <Link href="/kb" className="hover:text-accent transition-colors">Knowledge Base</Link>
          <span>/</span>
          <span className="text-accent">{article.category}</span>
        </div>

        {/* Article header */}
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-accent/10 border border-accent/20 rounded-full text-accent text-xs font-mono-code mb-4">
            {article.category}
          </div>
          <h1 className="font-syne font-black text-4xl md:text-5xl leading-tight mb-4">
            {article.title}
          </h1>
          <div className="flex items-center gap-4 text-sm text-muted">
            <span>📖 NexPlan IT Knowledge Base</span>
            <span>·</span>
            <span>🤖 AI Generated</span>
            <span>·</span>
            <span>{new Date(article.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
          </div>
        </div>

        {/* Article content */}
        <div className="card p-8 mb-8">
          <div className="prose prose-invert max-w-none">
            {article.content.split('\n').map((line: string, i: number) => {
              if (!line.trim()) return <div key={i} className="h-3"/>

              // Section headers (ALL CAPS lines)
              if (/^[A-Z][A-Z\s&]+$/.test(line.trim()) && line.trim().length > 3) {
                return (
                  <h2 key={i} className="font-syne font-black text-xl text-accent mt-8 mb-3 pb-2 border-b border-accent/20">
                    {line.trim()}
                  </h2>
                )
              }

              // Numbered steps
              if (/^\d+\.\s/.test(line.trim())) {
                const num = line.match(/^(\d+)\./)?.[1]
                const text = line.replace(/^\d+\.\s/, '')
                return (
                  <div key={i} className="flex gap-3 mb-3">
                    <span className="w-7 h-7 rounded-full bg-accent/10 border border-accent/30 text-accent text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {num}
                    </span>
                    <p className="text-muted leading-relaxed flex-1">{text}</p>
                  </div>
                )
              }

              // Bullet points
              if (/^[-•*]\s/.test(line.trim())) {
                return (
                  <div key={i} className="flex gap-3 mb-2">
                    <span className="text-accent mt-1.5 shrink-0">▸</span>
                    <p className="text-muted leading-relaxed">{line.replace(/^[-•*]\s/, '')}</p>
                  </div>
                )
              }

              // Regular paragraph
              return <p key={i} className="text-muted leading-relaxed mb-3">{line}</p>
            })}
          </div>
        </div>

        {/* CTA box */}
        <div className="card border-accent/30 p-8 text-center mb-10">
          <h3 className="font-syne font-black text-2xl mb-2">Manage your IT projects with NexPlan</h3>
          <p className="text-muted mb-6">Free AI-powered project management built specifically for IT teams. Kanban boards, Gantt charts, AI Knowledge Base and more.</p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Link href="/login" className="btn-primary px-8 py-3">Start Free — No Credit Card →</Link>
            <Link href="/demo" className="btn-ghost px-8 py-3">View Demo</Link>
          </div>
        </div>

        {/* Related articles */}
        {related.length > 0 && (
          <div>
            <h3 className="font-syne font-black text-xl mb-4">Related Articles</h3>
            <div className="grid md:grid-cols-2 gap-4">
              {related.map(r => (
                <Link key={r.id} href={`/kb/${titleToSlug(r.title)}`}
                  className="card hover:border-accent/40 hover:-translate-y-0.5 transition-all">
                  <p className="text-xs font-mono-code text-accent mb-2">{r.category}</p>
                  <p className="font-syne font-semibold">{r.title}</p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      <footer className="relative z-10 text-center py-8 text-muted text-sm border-t border-border">
        © 2025 NexPlan ·
        <a href="mailto:info@nexplan.io" className="text-accent hover:underline mx-2">info@nexplan.io</a> ·
        <Link href="/kb" className="hover:text-text mx-2">Knowledge Base</Link> ·
        <Link href="/" className="hover:text-text mx-2">Home</Link>
      </footer>
    </div>
  )
}
