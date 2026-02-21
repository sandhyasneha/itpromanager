import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { query, category, scopeDocument, title, saveToKB, userId } = await request.json()

  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json({
      content: 'ERROR: GEMINI_API_KEY not found. Please add it in Vercel Settings → Environment Variables.',
      saved: false,
    })
  }

  const topic = query || title || 'IT best practices'

  const prompt = scopeDocument
    ? `You are an expert IT Project Manager. Analyse this project scope document and produce:

1. PROJECT OVERVIEW - name, objectives, scope summary
2. COMPLETE PROJECT PLAN - Phase 1 Discovery, Phase 2 Design, Phase 3 Implementation, Phase 4 Testing, Phase 5 Go Live (each with tasks, owners, duration)
3. STEP-BY-STEP TECHNICAL GUIDE - detailed steps, tools, dependencies
4. RISK REGISTER - top 5 risks with likelihood, impact, mitigation
5. SUCCESS CRITERIA & KPIs

SCOPE DOCUMENT:
${scopeDocument.slice(0, 4000)}`
    : `You are a senior IT expert writing for an enterprise IT knowledge base used by IT Project Managers and Network Engineers.

Write a comprehensive professional article about: "${topic}"
Category: ${category || 'Networking'}

Structure:
OVERVIEW
(2-3 sentence introduction)

KEY CONCEPTS
(most important concepts)

STEP-BY-STEP GUIDE
(numbered detailed steps with real commands, IPs, tool names)

BEST PRACTICES
(5-7 industry best practices)

COMMON ISSUES & TROUBLESHOOTING
(3-5 common problems and solutions)

TOOLS & RESOURCES
(recommended tools, vendors, certifications)

Be specific, practical and detailed. Include real examples and configurations.`

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: 2048, temperature: 0.7 },
        }),
      }
    )

    if (!response.ok) {
      const err = await response.text()
      return NextResponse.json({ content: `Gemini API Error ${response.status}: ${err}`, saved: false })
    }

    const data = await response.json()
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text

    if (!content) {
      return NextResponse.json({ content: `No content returned: ${JSON.stringify(data)}`, saved: false })
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
          tags: [category?.toLowerCase() || 'general', 'ai-generated'],
        }).select().single()
        if (article) { saved = true; articleId = article.id }
      } catch (e) {
        console.error('KB save error:', e)
      }
    }

    return NextResponse.json({ content, saved, articleId })

  } catch (error: any) {
    return NextResponse.json({
      content: `Network error: ${error?.message ?? 'Unknown'}. Check GEMINI_API_KEY is valid.`,
      saved: false,
    })
  }
}
