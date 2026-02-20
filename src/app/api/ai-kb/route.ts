import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const body = await request.json()
  const { query, category, scopeDocument, title, saveToKB, userId } = body

  // Check API key
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({
      content: 'ERROR: ANTHROPIC_API_KEY not found in environment variables. Please add it in Vercel Settings.',
      saved: false,
    })
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  const topic = query || title || 'IT best practices'

  const prompt = scopeDocument
    ? `You are an expert IT Project Manager. Analyse this project scope document and produce a complete project plan with phases, steps, risks and success criteria.\n\nSCOPE:\n${scopeDocument.slice(0, 4000)}`
    : `You are a senior IT expert. Write a comprehensive knowledge base article about: "${topic}"\nCategory: ${category || 'Networking'}\n\nInclude: Overview, Key Concepts, Step-by-Step Guide, Best Practices, Troubleshooting. Be detailed and practical.`

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2048,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      return NextResponse.json({
        content: `API Error ${response.status}: ${err}`,
        saved: false,
      })
    }

    const data = await response.json()
    const content = data.content?.[0]?.text

    if (!content) {
      return NextResponse.json({
        content: `No content returned. API response: ${JSON.stringify(data)}`,
        saved: false,
      })
    }

    // Auto-save to KB
    let saved = false
    let articleId = null
    if (saveToKB && userId && query && !scopeDocument) {
      try {
        const { createClient } = await import('@/lib/supabase/server')
        const supabase = createClient()
        const { data: article } = await supabase.from('kb_articles').insert({
          author_id: userId,
          title: query,
          content,
          category: category || 'General',
          tags: [category?.toLowerCase() || 'ai-generated', 'ai-generated'],
        }).select().single()
        if (article) { saved = true; articleId = article.id }
      } catch (saveErr) {
        console.error('Save to KB failed:', saveErr)
      }
    }

    return NextResponse.json({ content, saved, articleId })

  } catch (error: any) {
    return NextResponse.json({
      content: `Network error: ${error?.message ?? 'Unknown error'}. Check ANTHROPIC_API_KEY is valid.`,
      saved: false,
    })
  }
}
