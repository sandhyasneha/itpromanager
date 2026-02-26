import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { projectName, description, startDate, endDate } = await request.json()

    const prompt = `You are an expert IT Project Manager. Based on the project description below, generate a detailed task breakdown with realistic dates.

Project Name: ${projectName}
Description: ${description}
Project Start Date: ${startDate}
Project End Date: ${endDate}

Generate a comprehensive list of IT project tasks. Return ONLY a valid JSON array with this exact structure:
[
  {
    "title": "Task title",
    "description": "Brief task description",
    "status": "backlog",
    "priority": "medium",
    "start_date": "YYYY-MM-DD",
    "end_date": "YYYY-MM-DD",
    "due_date": "YYYY-MM-DD",
    "assignee_name": "",
    "tags": ["tag1"]
  }
]

Rules:
- Generate 6-12 tasks that cover the full project lifecycle
- Tasks must follow logical IT project sequence (planning → design → implementation → testing → deployment → handover)
- All dates must be between ${startDate} and ${endDate}
- Priority must be one of: low, medium, high, critical
- Status must always be: backlog
- Tags should reflect IT domain (e.g. network, security, infrastructure, testing)
- Make tasks specific to the project description provided
- Spread tasks realistically across the timeline
- Return ONLY the JSON array, no other text`

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2000,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    const data = await response.json()
    const text = data.content[0].text.trim()

    // Parse JSON safely
    const jsonMatch = text.match(/\[[\s\S]*\]/)
    if (!jsonMatch) throw new Error('No JSON array found in response')
    const tasks = JSON.parse(jsonMatch[0])

    return NextResponse.json({ tasks })
  } catch (err: any) {
    console.error('AI Project Manager error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
