import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { title, category } = await request.json()

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ content: `# ${title}\n\nThis article covers ${category} topics.\n\nAdd your content here...` })
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
        max_tokens: 1024,
        messages: [{
          role: 'user',
          content: `Write a professional IT knowledge base article for an IT project management tool.
Title: "${title}"
Category: ${category}

Write a clear, structured article with:
- Brief overview (2-3 sentences)
- Key concepts or steps (numbered list)
- Best practices (bullet points)
- Common issues and solutions

Keep it practical and concise. Use plain text, no markdown headers.`
        }]
      })
    })
    const data = await response.json()
    const content = data.content?.[0]?.text ?? 'Failed to generate content.'
    return NextResponse.json({ content })
  } catch (error) {
    return NextResponse.json({ content: `# ${title}\n\nFailed to generate. Please write your content here.` })
  }
}
