import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { scopeDocument, title, category } = await request.json()

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({
      content: `PROJECT PLAN: ${title || 'New Project'}\n\nAI generation requires an Anthropic API key.\n\nPlease add ANTHROPIC_API_KEY to your Vercel environment variables.\n\nGet your key at: https://console.anthropic.com`
    })
  }

  const isScope = !!scopeDocument

  const prompt = isScope
    ? `You are an expert IT Project Manager. Analyse this project scope document and provide:

1. PROJECT OVERVIEW
   - Project name and description
   - Objectives and goals
   - Scope summary

2. COMPLETE PROJECT PLAN
   - Phase 1: Discovery & Planning (with tasks and owners)
   - Phase 2: Design & Procurement
   - Phase 3: Implementation
   - Phase 4: Testing & Validation
   - Phase 5: Go Live & Handover

3. STEP-BY-STEP HOW-TO GUIDE
   - Detailed technical steps for implementation
   - Tools and resources required
   - Dependencies and prerequisites

4. RISK REGISTER
   - Top 5 risks with mitigation strategies

5. SUCCESS CRITERIA
   - How to measure project success

SCOPE DOCUMENT:
${scopeDocument}

Provide a detailed, practical response that an IT Project Manager can use immediately.`
    : `Write a professional IT knowledge base article for "${title}" in the ${category} category. Include overview, step-by-step guide, best practices, and troubleshooting tips.`

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
        messages: [{ role: 'user', content: prompt }]
      })
    })
    const data = await response.json()
    const content = data.content?.[0]?.text ?? 'Failed to generate content.'
    return NextResponse.json({ content })
  } catch (error) {
    return NextResponse.json({ content: 'Error connecting to AI. Please check your ANTHROPIC_API_KEY.' })
  }
}
