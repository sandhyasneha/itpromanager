import { NextResponse } from 'next/server'

// Simple AI text generation route — used by Stakeholder Digest
// Takes { prompt: string } → returns { text: string }

export async function POST(request: Request) {
  try {
    const { prompt } = await request.json()
    if (!prompt) return NextResponse.json({ error: 'prompt is required' }, { status: 400 })

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type':    'application/json',
        'x-api-key':       process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model:      'claude-haiku-4-5-20251001',
        max_tokens: 1500,
        messages:   [{ role: 'user', content: prompt }],
      }),
    })

    const data = await response.json()
    if (!response.ok) {
      return NextResponse.json({ error: data.error?.message ?? 'AI request failed' }, { status: 500 })
    }

    const text = data.content?.[0]?.text ?? ''
    return NextResponse.json({ text })

  } catch (err: any) {
    console.error('ai-text error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
