'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const CATEGORIES = ['All', 'Networking', 'Security', 'Cloud', 'Project Management', 'Runbooks', 'Templates', 'Lessons Learned']

export default function KnowledgeClient({ articles, userId }: { articles: any[], userId: string }) {
  const supabase = createClient()
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [showAdd, setShowAdd] = useState(false)
  const [showView, setShowView] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const [localArticles, setLocalArticles] = useState(articles)
  const [generating, setGenerating] = useState(false)
  const [newArticle, setNewArticle] = useState({ title: '', content: '', category: 'General', tags: '' })

  const filtered = localArticles.filter(a => {
    const matchSearch = a.title.toLowerCase().includes(search.toLowerCase()) || (a.content ?? '').toLowerCase().includes(search.toLowerCase())
    const matchCat = category === 'All' || a.category === category
    return matchSearch && matchCat
  })

  async function saveArticle() {
    if (!newArticle.title.trim()) return
    setSaving(true)
    const tags = newArticle.tags.split(',').map(t => t.trim()).filter(Boolean)
    const { data } = await supabase.from('kb_articles').insert({
      author_id: userId, title: newArticle.title, content: newArticle.content,
      category: newArticle.category, tags,
    }).select('*, profiles(full_name, email)').single()
    if (data) setLocalArticles(a => [data, ...a])
    setNewArticle({ title: '', content: '', category: 'General', tags: '' })
    setShowAdd(false); setSaving(false)
  }

  async function generateWithAI() {
    if (!newArticle.title.trim()) return
    setGenerating(true)
    try {
      const response = await fetch('/api/ai-kb', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newArticle.title, category: newArticle.category }),
      })
      const data = await response.json()
      if (data.content) setNewArticle(a => ({ ...a, content: data.content }))
    } catch (e) {
      console.error('AI generation failed', e)
    }
    setGenerating(false)
  }

  return (
    <div className="space-y-6">
      {/* Search + Add */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex-1 flex items-center gap-3 bg-surface border border-border rounded-xl px-4 py-3 min-w-[200px]">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted shrink-0">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted" placeholder="Search knowledge base..." value={search} onChange={e => setSearch(e.target.value)}/>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-primary text-sm px-4 py-2">+ New Article</button>
      </div>

      <div className="flex gap-5">
        {/* Category Sidebar */}
        <div className="w-48 shrink-0">
          <div className="card p-4">
            <p className="font-mono-code text-xs text-muted uppercase tracking-widest mb-3">Categories</p>
            {CATEGORIES.map(cat => (
              <button key={cat} onClick={() => setCategory(cat)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm mb-1 transition-colors ${category === cat ? 'bg-accent/10 text-accent' : 'text-muted hover:text-text hover:bg-surface2'}`}>
                {cat}
                <span className="float-right text-xs">
                  {cat === 'All' ? localArticles.length : localArticles.filter(a => a.category === cat).length}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Articles */}
        <div className="flex-1 space-y-3">
          {filtered.length === 0 ? (
            <div className="card text-center py-16">
              <p className="text-4xl mb-3">📚</p>
              <h3 className="font-syne font-bold text-lg mb-2">No articles found</h3>
              <p className="text-muted text-sm mb-4">
                {search ? 'Try a different search term' : 'Create your first knowledge base article'}
              </p>
              <button onClick={() => setShowAdd(true)} className="btn-primary text-sm px-4 py-2">+ Create Article</button>
            </div>
          ) : filtered.map(article => (
            <div key={article.id} onClick={() => setShowView(article)}
              className="card hover:border-accent/40 cursor-pointer transition-all hover:-translate-y-0.5 group">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-syne font-bold group-hover:text-accent transition-colors">{article.title}</h3>
                <span className="text-xs bg-accent2/10 text-purple-300 px-2 py-1 rounded-lg font-mono-code ml-3 shrink-0">{article.category}</span>
              </div>
              <p className="text-sm text-muted line-clamp-2 mb-3">{article.content?.slice(0, 150)}...</p>
              <div className="flex items-center gap-4 text-xs text-muted font-mono-code flex-wrap">
                <span>By {article.profiles?.full_name ?? 'Unknown'}</span>
                <span>{new Date(article.created_at).toLocaleDateString()}</span>
                {article.tags?.length > 0 && (
                  <div className="flex gap-1">
                    {article.tags.slice(0, 3).map((tag: string) => (
                      <span key={tag} className="px-2 py-0.5 bg-surface2 rounded text-muted">{tag}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* View Article Modal */}
      {showView && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowView(null)}>
          <div className="card w-full max-w-2xl max-h-[80vh] overflow-y-auto p-8" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <span className="text-xs bg-accent2/10 text-purple-300 px-2 py-1 rounded-lg font-mono-code">{showView.category}</span>
                <h2 className="font-syne font-black text-2xl mt-2">{showView.title}</h2>
                <p className="text-xs text-muted font-mono-code mt-1">
                  By {showView.profiles?.full_name ?? 'Unknown'} · {new Date(showView.created_at).toLocaleDateString()}
                </p>
              </div>
              <button onClick={() => setShowView(null)} className="text-muted hover:text-text text-xl font-bold ml-4">x</button>
            </div>
            <div className="prose prose-sm text-text leading-relaxed whitespace-pre-wrap border-t border-border pt-4">
              {showView.content}
            </div>
            {showView.tags?.length > 0 && (
              <div className="flex gap-2 mt-4 pt-4 border-t border-border flex-wrap">
                {showView.tags.map((tag: string) => (
                  <span key={tag} className="px-2 py-1 bg-surface2 rounded text-xs text-muted">{tag}</span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Article Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="card w-full max-w-2xl p-8 max-h-[90vh] overflow-y-auto">
            <h3 className="font-syne font-black text-xl mb-6">New Knowledge Base Article</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-syne font-semibold text-muted mb-1.5">Title *</label>
                <input className="input" placeholder="e.g. VPN Setup Guide" value={newArticle.title} onChange={e => setNewArticle(a => ({...a, title: e.target.value}))} autoFocus/>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-syne font-semibold text-muted mb-1.5">Category</label>
                  <select className="select" value={newArticle.category} onChange={e => setNewArticle(a => ({...a, category: e.target.value}))}>
                    {CATEGORIES.filter(c => c !== 'All').map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-syne font-semibold text-muted mb-1.5">Tags (comma separated)</label>
                  <input className="input" placeholder="vpn, cisco, network" value={newArticle.tags} onChange={e => setNewArticle(a => ({...a, tags: e.target.value}))}/>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-syne font-semibold text-muted">Content</label>
                  <button onClick={generateWithAI} disabled={generating || !newArticle.title}
                    className="text-xs text-accent hover:underline font-mono-code disabled:opacity-40">
                    {generating ? 'Generating...' : 'AI Draft'}
                  </button>
                </div>
                <textarea className="input min-h-[200px] resize-y" placeholder="Write your article content here..." value={newArticle.content} onChange={e => setNewArticle(a => ({...a, content: e.target.value}))}/>
              </div>
            </div>
            <div className="flex gap-3 justify-end mt-6">
              <button onClick={() => setShowAdd(false)} className="btn-ghost">Cancel</button>
              <button onClick={saveArticle} className="btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save Article'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
