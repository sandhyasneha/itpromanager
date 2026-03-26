// src/app/api/generate-insights/route.ts
// Server-side AI insights generation to avoid CORS issues

import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { summary } = await request.json()

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        messages: [{
          role: 'user',
          content: `You are a senior IT project management consultant. Analyse this project portfolio data and provide a concise, actionable intelligence report with 4 sections:

1. **Portfolio Health Summary** (2-3 sentences)
2. **Top 3 Risks & Recommended Actions** (bullet points)
3. **Team Performance Observations** (2-3 sentences)
4. **Priority Recommendations for This Week** (3 bullet points)

Keep it sharp, specific and actionable. No fluff.

Data: ${JSON.stringify(summary, null, 2)}`
        }]
      })
    })

    const data = await res.json()
    const text = data.content?.[0]?.text

    if (!text) {
      return NextResponse.json({ error: 'No insights generated' }, { status: 500 })
    }

    return NextResponse.json({ insights: text })

  } catch (err: any) {
    console.error('[generate-insights]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
