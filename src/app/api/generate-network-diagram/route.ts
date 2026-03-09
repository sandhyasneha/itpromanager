import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { freeText, promptFields } = await request.json()

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'API key not configured' }, { status: 500 })

  const fieldSummary = promptFields
    ? Object.entries(promptFields)
        .filter(([, v]) => v)
        .map(([k, v]) => `${k.replace(/_/g, ' ')}: ${v}`)
        .join('\n')
    : ''

  const prompt = `You are a network architecture AI. Generate a network diagram as JSON.

User request:
${freeText ? `Description: ${freeText}` : ''}
${fieldSummary}

Return ONLY valid JSON in this exact format, no explanation, no markdown:
{
  "title": "diagram title",
  "description": "brief description",
  "nodes": [
    { "id": "n1", "type": "internet", "label": "Internet", "x": 400, "y": 50 },
    { "id": "n2", "type": "firewall", "label": "Firewall", "ip": "10.0.0.254", "location": "Singapore HQ", "x": 400, "y": 160 },
    { "id": "n3", "type": "router", "label": "Core Router", "ip": "10.0.0.1", "x": 400, "y": 270 },
    { "id": "n4", "type": "switch", "label": "Distribution Switch", "ip": "10.0.1.1", "x": 250, "y": 380, "isNew": false },
    { "id": "n5", "type": "switch", "label": "New Access Switch", "ip": "192.168.10.1", "location": "Floor 3", "x": 550, "y": 380, "isNew": true }
  ],
  "links": [
    { "id": "l1", "from": "n1", "to": "n2", "type": "wan", "label": "WAN" },
    { "id": "l2", "from": "n2", "to": "n3", "type": "fiber", "label": "10G Fiber" },
    { "id": "l3", "from": "n3", "to": "n4", "type": "ethernet", "label": "1G" },
    { "id": "l4", "from": "n3", "to": "n5", "type": "fiber", "label": "10G Uplink" }
  ]
}

Rules:
- Place nodes at logical positions: internet/cloud at top (y:50), core devices middle (y:150-300), access devices bottom (y:350-500)
- x range: 100-700, y range: 50-500
- Mark newly added devices with "isNew": true
- Use realistic IPs based on the user input
- Include 5-10 nodes for a meaningful diagram
- Node types must be one of: router, switch, firewall, server, cloud, pc, ap, load_balancer, internet
- Link types must be one of: ethernet, fiber, wireless, wan
- Return ONLY the JSON object, nothing else`

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

    const data = await response.json()
    const text = data.content?.[0]?.text ?? ''

    // Strip markdown code fences if present
    const clean = text.replace(/```json|```/g, '').trim()
    const jsonMatch = clean.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return NextResponse.json({ error: 'No diagram data generated' }, { status: 500 })

    const diagram = JSON.parse(jsonMatch[0])
    return NextResponse.json({ diagram })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
