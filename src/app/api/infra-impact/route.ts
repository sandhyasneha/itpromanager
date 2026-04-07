import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const { description, projectName, serviceNowChange, changeDate } = await req.json()

    if (!description) {
      return NextResponse.json({ error: 'Description is required' }, { status: 400 })
    }

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    const systemPrompt = `You are an expert IT Infrastructure Change Manager with deep knowledge of ITIL, ITSM, network engineering, cloud infrastructure, and enterprise IT operations.

Analyse the infrastructure change described and produce a comprehensive impact analysis. Return ONLY valid JSON matching this exact structure:
{
  "summary": "2-3 sentence executive summary",
  "changeType": "Standard|Normal|Emergency",
  "affectedCIs": [{"name": "CI name", "type": "Server|Network|Application|Database|Storage|Cloud", "impact": "Direct|Indirect|Dependency"}],
  "risks": [{"risk": "Risk description", "level": "critical|high|medium|low", "mitigation": "Mitigation action"}],
  "justification": "Business and technical justification for this change",
  "implementationPlan": ["Step 1", "Step 2"],
  "preTestPlan": ["Pre-implementation test 1"],
  "postTestPlan": ["Post-implementation test 1"],
  "backoutPlan": ["Backout step 1"],
  "stakeholders": ["Role/Team to notify"],
  "estimatedDuration": "e.g. 4-6 weeks",
  "suggestedTasks": [{"title": "Task title", "priority": "low|medium|high|critical", "description": "Task description"}],
  "serviceNowFields": {"category": "Infrastructure", "impact": "1-High|2-Medium|3-Low", "urgency": "1-High|2-Medium|3-Low", "risk": "High|Moderate|Low|Very Low", "changeType": "Standard|Normal|Emergency"}
}

Generate 5-8 affected CIs, 4-6 risks, 6-10 implementation steps, 4-6 pre-tests, 4-6 post-tests, 4-6 backout steps, and 8-12 suggested tasks.`

    const userMessage = `Project: ${projectName ?? 'Unknown'}
Change Description: ${description}
${serviceNowChange ? `ServiceNow Change Number: ${serviceNowChange}` : ''}
${changeDate ? `Planned Change Date: ${changeDate}` : ''}`

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    })

    const text = message.content[0].type === 'text' ? message.content[0].text : ''
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('Invalid response format')

    const result = JSON.parse(jsonMatch[0])
    return NextResponse.json({ result })

  } catch (error) {
    console.error('Infra impact analysis error:', error)
    return NextResponse.json({ error: 'Analysis failed' }, { status: 500 })
  }
}
