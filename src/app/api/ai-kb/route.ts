import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const { query, category, scopeDocument, title, saveToKB, userId } = await request.json()

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({
      content: 'AI generation requires an ANTHROPIC_API_KEY environment variable. Please add it in Vercel Settings → Environment Variables.',
      saved: false,
    })
  }

  // Build prompt based on request type
  let prompt = ''

  if (scopeDocument) {
    prompt = `You are an expert IT Project Manager. Analyse this project scope document and produce:

1. PROJECT OVERVIEW
   - Project name, objectives, scope summary

2. COMPLETE PROJECT PLAN
   - Phase 1: Discovery & Planning (tasks, owners, duration)
   - Phase 2: Design & Procurement
   - Phase 3: Implementation
   - Phase 4: Testing & Validation
   - Phase 5: Go Live & Handover

3. STEP-BY-STEP TECHNICAL GUIDE
   - Detailed technical steps
   - Tools and resources required
   - Dependencies and prerequisites

4. RISK REGISTER
   - Top 5 risks with likelihood, impact, mitigation

5. SUCCESS CRITERIA & KPIs

SCOPE DOCUMENT:
${scopeDocument.slice(0, 5000)}

Write a detailed, practical response an IT Project Manager can use immediately.`
  } else {
    const topic = query || title || 'IT best practices'
    prompt = `You are a senior IT expert writing for an enterprise IT knowledge base used by IT Project Managers, Network Engineers, and IT Architects.

Write a comprehensive, professional knowledge base article about: "${topic}"
${category ? `Category: ${category}` : ''}

Structure your article as follows:

OVERVIEW
Brief introduction explaining what this is and why it matters (2-3 sentences).

KEY CONCEPTS
The most important concepts an IT professional needs to understand.

STEP-BY-STEP GUIDE
Numbered, detailed implementation steps. Be specific - include actual commands, configuration examples, IP addressing examples, tool names, and real-world details where relevant.

BEST PRACTICES
5-7 industry best practices for this topic.

COMMON ISSUES & TROUBLESHOOTING
The 3-5 most common problems and how to resolve them.

TOOLS & RESOURCES
Recommended tools, software, vendors, or certifications for this topic.

Write at a professional level suitable for experienced IT professionals. Be specific, practical, and detailed. Include real examples, commands, and configurations where relevant.`
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2048,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    const data = await response.json()
    const content = data.content?.[0]?.text ?? 'Failed to generate content.'

    // Auto-save to KB if requested
    let saved = false
    let articleId = null
    if (saveToKB && userId && (query || title) && !scopeDocument) {
      const supabase = createClient()
      const { data: article } = await supabase.from('kb_articles').insert({
        author_id: userId,
        title: query || title,
        content,
        category: category || 'General',
        tags: [category?.toLowerCase() || 'ai-generated'],
        is_ai_generated: true,
      }).select().single()
      if (article) { saved = true; articleId = article.id }
    }

    return NextResponse.json({ content, saved, articleId })
  } catch (error) {
    return NextResponse.json({ content: 'Error connecting to AI. Please check your ANTHROPIC_API_KEY in Vercel settings.', saved: false })
  }
}
