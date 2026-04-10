import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { projectName, originalEndDate, newEndDate, reason, impact, requestedBy } = await request.json()

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'API key not configured' }, { status: 500 })

  const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })

  const prompt = `You are a senior IT Project Manager writing a formal Project Change Request (PCR) document.

Generate a professional PCR document for the following:

Project Name: ${projectName}
Original End Date: ${originalEndDate}
Proposed New End Date: ${newEndDate}
Reason for Change: ${reason}
Impact Description: ${impact}
Requested By: ${requestedBy}
Date: ${today}

Write a complete formal PCR document with these sections:

PROJECT CHANGE REQUEST (PCR)

DOCUMENT DETAILS
PCR Reference: PCR-[auto number based on date]
Project Name: [project name]
Date Raised: ${today}
Requested By: [name]
Status: PENDING APPROVAL

1. CHANGE DESCRIPTION
(Clear description of what is being changed and why)

2. REASON FOR CHANGE
(Detailed justification — technical, resource, or scope reasons)

3. IMPACT ANALYSIS
3.1 Schedule Impact
(How the timeline changes, new end date, affected milestones)
3.2 Cost Impact
(Any budget implications)
3.3 Resource Impact
(Team and resource implications)
3.4 Risk Impact
(New risks introduced by this change)
3.5 Scope Impact
(Any scope changes associated)

4. OPTIONS CONSIDERED
Option 1: Approve the change request
Option 2: Reject and maintain original timeline
Option 3: Partial approval with conditions

5. RECOMMENDATION
(PM recommendation with justification)

6. APPROVAL SECTION
Requested By (PM): ${requestedBy}    Date: ${today}    Signature: ___________
Approved By (Sponsor): _______________    Date: ___________    Signature: ___________
Status: [ ] Approved  [ ] Rejected  [ ] Approved with Conditions

7. NOTES & CONDITIONS
(Space for approver comments)

Be formal, professional and specific. Use the actual project details provided.`

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
    const content = data.content?.[0]?.text
    if (!content) return NextResponse.json({ error: 'No content generated' }, { status: 500 })
    return NextResponse.json({ content })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
