import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

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

    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 400,
      messages: [{ role: 'user', content: prompt }],
    })

    const mitigation = (message.content[0] as any).text
    return NextResponse.json({ mitigation })
  } catch (err: any) {
    console.error('Mitigation generation error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
