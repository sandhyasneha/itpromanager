import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { type, title, description, rag_status, probability, impact, projectName } = await request.json()

    const prompt = `You are an experienced IT Project Manager. Generate a concise, practical mitigation plan for the following ${type}:

Project: ${projectName}
${type === 'risk' ? 'Risk' : 'Issue'} Title: ${title}
Description: ${description}
RAG Status: ${rag_status.toUpperCase()}
Probability: ${probability}
Impact: ${impact}

Write a clear, actionable mitigation plan in 3-5 bullet points. Be specific to IT projects. Focus on:
- Immediate actions to take
- Who should be involved
- Timeline for resolution
- Escalation path if needed

Keep it concise and practical. No intro text, just the bullet points.`

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 400,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    const data = await response.json()
    const mitigation = data.content[0].text
    return NextResponse.json({ mitigation })
  } catch (err: any) {
    console.error('Mitigation generation error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
