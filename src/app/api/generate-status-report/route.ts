import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { project, tasks, risks, frequency, reportDate } = await request.json()

    const doneTasks     = tasks.filter((t: any) => t.status === 'done')
    const inProgTasks   = tasks.filter((t: any) => t.status === 'in_progress')
    const blockedTasks  = tasks.filter((t: any) => t.status === 'blocked')
    const reviewTasks   = tasks.filter((t: any) => t.status === 'review')
    const backlogTasks  = tasks.filter((t: any) => t.status === 'backlog')
    const openRisks     = risks.filter((r: any) => r.type === 'risk' && r.status === 'open')
    const openIssues    = risks.filter((r: any) => r.type === 'issue' && r.status === 'open')
    const redRisks      = openRisks.filter((r: any) => r.rag_status === 'red')

    const totalProg = tasks.length > 0
      ? Math.round(tasks.reduce((s: number, t: any) => {
          const p: Record<string,number> = { done:100, in_progress:50, review:80, blocked:25, backlog:0 }
          return s + (p[t.status] ?? 0)
        }, 0) / tasks.length)
      : 0

    const prompt = `You are a professional IT Project Manager writing a ${frequency} status report.

PROJECT DETAILS:
- Project Name: ${project.name}
- Start Date: ${project.start_date || 'Not set'}
- End Date: ${project.end_date || 'Not set'}
- Report Date: ${reportDate}
- Overall Progress: ${totalProg}%

TASK SUMMARY:
- Total Tasks: ${tasks.length}
- Done: ${doneTasks.length} (${doneTasks.map((t:any) => t.title).join(', ') || 'None'})
- In Progress: ${inProgTasks.length} (${inProgTasks.map((t:any) => t.title).join(', ') || 'None'})
- In Review: ${reviewTasks.length} (${reviewTasks.map((t:any) => t.title).join(', ') || 'None'})
- Blocked: ${blockedTasks.length} (${blockedTasks.map((t:any) => t.title).join(', ') || 'None'})
- Backlog: ${backlogTasks.length}

RISKS & ISSUES:
- Open Risks: ${openRisks.length} (Red: ${redRisks.length}, Amber: ${openRisks.filter((r:any) => r.rag_status==='amber').length}, Green: ${openRisks.filter((r:any) => r.rag_status==='green').length})
- Open Issues: ${openIssues.length}
${openRisks.length > 0 ? '- Key Risks: ' + openRisks.slice(0,3).map((r:any) => r.title).join(', ') : ''}
${openIssues.length > 0 ? '- Key Issues: ' + openIssues.slice(0,3).map((r:any) => r.title).join(', ') : ''}

Generate a professional ${frequency} project status report. Return a JSON object:
{
  "overall_rag": "green|amber|red",
  "executive_summary": "2-3 sentences for senior stakeholders",
  "period_label": "e.g. Week ending 28 Feb 2026",
  "accomplishments": ["item1", "item2", "item3"],
  "in_progress": ["item1", "item2"],
  "blockers": ["item1"],
  "risks_summary": "1-2 sentences about risks",
  "next_period_plan": ["item1", "item2", "item3"],
  "overall_health": "On Track|At Risk|Off Track",
  "schedule_status": "On Track|At Risk|Delayed",
  "budget_status": "On Track|Under Review|Over Budget",
  "scope_status": "On Track|Change Pending|Changed"
}
Return ONLY the JSON object, no other text.`

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    const data = await response.json()
    const text = data.content[0].text.trim()
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('No JSON found')
    const report = JSON.parse(jsonMatch[0])
    return NextResponse.json({ report })
  } catch (err: any) {
    console.error('Status report error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
