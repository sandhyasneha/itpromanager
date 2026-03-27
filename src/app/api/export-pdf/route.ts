// src/app/api/export-pdf/route.ts
// Generates a white-label PDF portfolio report using jsPDF

import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { projects, tasks, risks, orgName, generatedBy, aiInsights, workspaces: wsData } = await request.json()

    // Use jsPDF via dynamic import
    const { jsPDF } = await import('jspdf')

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
    const W = 210  // A4 width
    const H = 297  // A4 height
    const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })

    // Colours (RGB)
    const C = {
      dark:    [15, 23, 42]   as [number,number,number],
      surface: [30, 41, 59]   as [number,number,number],
      accent:  [0, 212, 255]  as [number,number,number],
      violet:  [124, 58, 237] as [number,number,number],
      green:   [34, 211, 165] as [number,number,number],
      amber:   [245, 158, 11] as [number,number,number],
      red:     [239, 68, 68]  as [number,number,number],
      white:   [241, 245, 249] as [number,number,number],
      muted:   [148, 163, 184] as [number,number,number],
      border:  [51, 65, 85]   as [number,number,number],
    }

    function setFill(c: [number,number,number]) { doc.setFillColor(c[0], c[1], c[2]) }
    function setDraw(c: [number,number,number]) { doc.setDrawColor(c[0], c[1], c[2]) }
    function setFont(c: [number,number,number]) { doc.setTextColor(c[0], c[1], c[2]) }

    function ragColor(rag: string): [number,number,number] {
      if (rag === 'green') return C.green
      if (rag === 'amber') return C.amber
      return C.red
    }

    const totalTasks   = tasks?.length || 0
    const doneTasks    = tasks?.filter((t: any) => t.status === 'done').length || 0
    const overdueTasks = tasks?.filter((t: any) => t.due_date && new Date(t.due_date) < new Date() && t.status !== 'done').length || 0
    const blockedTasks = tasks?.filter((t: any) => t.status === 'blocked').length || 0
    const inProgress   = tasks?.filter((t: any) => t.status === 'in_progress').length || 0
    const pct          = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0

    // ── PAGE 1: Cover ──────────────────────────────────────────
    setFill(C.dark); doc.rect(0, 0, W, H, 'F')

    // Top accent bar
    setFill(C.accent); doc.rect(0, 0, W, 3, 'F')

    // NexPlan logo text
    setFont(C.accent); doc.setFontSize(22); doc.setFont('helvetica', 'bold')
    doc.text('NexPlan', 20, 25)
    setFont(C.muted); doc.setFontSize(10); doc.setFont('helvetica', 'normal')
    doc.text('AI-Powered IT Project Management', 20, 32)

    // Title
    setFont(C.white); doc.setFontSize(32); doc.setFont('helvetica', 'bold')
    doc.text('Project Intelligence', 20, 80)
    doc.text('Report', 20, 95)

    // Org name
    setFont(C.accent); doc.setFontSize(18); doc.setFont('helvetica', 'normal')
    doc.text(orgName || 'IT Portfolio', 20, 115)

    // Divider
    setDraw(C.border); doc.setLineWidth(0.5)
    doc.line(20, 125, 190, 125)

    // Meta
    setFont(C.muted); doc.setFontSize(11)
    doc.text(`Generated: ${today}`, 20, 140)
    doc.text(`Prepared by: ${generatedBy || 'Portfolio Manager'}`, 20, 150)
    doc.text(`Total Projects: ${projects?.length || 0}  |  Completion: ${pct}%  |  Overdue: ${overdueTasks}`, 20, 160)

    // Bottom bar
    setFill(C.violet); doc.rect(0, H - 15, W, 15, 'F')
    setFont(C.white); doc.setFontSize(9); doc.setFont('helvetica', 'normal')
    doc.text('Powered by NexPlan  |  nexplan.io  |  Confidential', W/2, H - 6, { align: 'center' })

    // ── PAGE 2: Portfolio Summary ──────────────────────────────
    doc.addPage()
    setFill(C.dark); doc.rect(0, 0, W, H, 'F')
    setFill(C.accent); doc.rect(0, 0, W, 3, 'F')

    setFont(C.white); doc.setFontSize(20); doc.setFont('helvetica', 'bold')
    doc.text('Portfolio Summary', 20, 20)
    setDraw(C.border); doc.line(20, 24, 190, 24)

    // KPI boxes
    const kpis = [
      { label: 'Total Projects', value: String(projects?.length || 0), color: C.accent },
      { label: 'Completion Rate', value: `${pct}%`, color: C.green },
      { label: 'Overdue Tasks', value: String(overdueTasks), color: overdueTasks > 0 ? C.red : C.green },
      { label: 'Blocked Tasks', value: String(blockedTasks), color: blockedTasks > 0 ? C.amber : C.green },
    ]

    kpis.forEach((kpi, i) => {
      const x = 15 + i * 46
      setFill(C.surface); setDraw(kpi.color)
      doc.setLineWidth(0.8)
      doc.roundedRect(x, 30, 42, 28, 2, 2, 'FD')
      setFont(kpi.color); doc.setFontSize(22); doc.setFont('helvetica', 'bold')
      doc.text(kpi.value, x + 21, 46, { align: 'center' })
      setFont(C.muted); doc.setFontSize(8); doc.setFont('helvetica', 'normal')
      doc.text(kpi.label, x + 21, 53, { align: 'center' })
    })

    // Task breakdown
    setFont(C.white); doc.setFontSize(13); doc.setFont('helvetica', 'bold')
    doc.text('Task Breakdown', 20, 72)

    const statuses = [
      { label: 'Done', count: doneTasks, color: C.green },
      { label: 'In Progress', count: inProgress, color: C.accent },
      { label: 'Blocked', count: blockedTasks, color: C.red },
      { label: 'Overdue', count: overdueTasks, color: C.amber },
    ]

    statuses.forEach((s, i) => {
      const x = 20 + i * 45
      setFill(s.color); doc.rect(x, 77, 38, 4, 'F')
      setFont(s.color); doc.setFontSize(9)
      doc.text(`${s.label}: ${s.count}`, x + 19, 87, { align: 'center' })
    })

    // Progress bar
    setFont(C.white); doc.setFontSize(11); doc.setFont('helvetica', 'bold')
    doc.text(`Overall Progress: ${pct}%`, 20, 100)
    setFill(C.surface); doc.rect(20, 104, 170, 6, 'F')
    if (pct > 0) { setFill(C.green); doc.rect(20, 104, 170 * pct / 100, 6, 'F') }
    setFont(C.muted); doc.setFontSize(9)
    doc.text(`${doneTasks} of ${totalTasks} tasks completed`, 20, 116)

    // Workspace breakdown
    const projList  = projects || []
    const wsList    = wsData   || []

    setFont(C.white); doc.setFontSize(13); doc.setFont('helvetica', 'bold')
    doc.text('Client Workspace Overview', 20, 130)

    // Workspace header
    setFill(C.surface); doc.rect(20, 134, 170, 8, 'F')
    setFont(C.muted); doc.setFontSize(9); doc.setFont('helvetica', 'bold')
    doc.text('CLIENT WORKSPACE', 25, 140)
    doc.text('PROJECTS', 115, 140)
    doc.text('HEALTH', 140, 140)
    doc.text('DONE%', 162, 140)
    doc.text('STATUS', 178, 140)

    const wsToShow = wsList.length > 0 ? wsList : projList.slice(0, 8)
    wsToShow.slice(0, 8).forEach((ws: any, i: number) => {
      const y = 146 + i * 10
      if (i % 2 === 0) { setFill([20, 30, 48]); doc.rect(20, y - 4, 170, 10, 'F') }
      const col = ragColor(ws.rag || 'green')
      setFill(col); doc.circle(25, y + 1, 2, 'F')
      setFont(C.white); doc.setFontSize(9); doc.setFont('helvetica', 'normal')
      const label = ws.client_name ? `${ws.name} — ${ws.client_name}` : (ws.name || ws.clientName || 'Project')
      doc.text(label.substring(0, 40), 30, y + 2)
      doc.text(String(ws.projectCount || ws.taskCount || '—'), 118, y + 2)
      setFont(col); doc.text(`${ws.score || 80}/100`, 140, y + 2)
      setFont(C.white); doc.text(`${ws.pct || 0}%`, 162, y + 2)
      const ragText = (ws.rag || 'green') === 'green' ? 'On Track' : (ws.rag || 'green') === 'amber' ? 'Attention' : 'At Risk'
      setFont(col); doc.text(ragText, 178, y + 2)
    })

    setFill(C.violet); doc.rect(0, H - 15, W, 15, 'F')
    setFont(C.white); doc.setFontSize(9)
    doc.text(`${orgName || 'NexPlan'} Portfolio Report  |  ${today}  |  Page 2`, W/2, H - 6, { align: 'center' })

    // ── PAGE 3: Risk Summary ───────────────────────────────────
    doc.addPage()
    setFill(C.dark); doc.rect(0, 0, W, H, 'F')
    setFill(C.red); doc.rect(0, 0, W, 3, 'F')

    setFont(C.white); doc.setFontSize(20); doc.setFont('helvetica', 'bold')
    doc.text('Risk Summary & Alerts', 20, 20)
    setDraw(C.border); doc.line(20, 24, 190, 24)

    const riskAlerts: { text: string; level: string }[] = []
    if (overdueTasks > 0) riskAlerts.push({ text: `${overdueTasks} overdue task(s) require immediate attention`, level: 'critical' })
    if (blockedTasks > 0) riskAlerts.push({ text: `${blockedTasks} blocked task(s) waiting on dependencies`, level: 'high' })
    projList.forEach((p: any) => {
      if (p.rag === 'red') riskAlerts.push({ text: `"${p.name}" is at critical risk — health score ${p.score || 0}/100`, level: 'critical' })
      else if (p.rag === 'amber') riskAlerts.push({ text: `"${p.name}" needs attention`, level: 'high' })
    })
    const openRisks = (risks || []).filter((r: any) => r.rag_status === 'red' && r.status === 'open')
    openRisks.slice(0, 5).forEach((r: any) => {
      riskAlerts.push({ text: `Risk Register: "${r.title}"`, level: 'critical' })
    })
    if (riskAlerts.length === 0) riskAlerts.push({ text: 'No critical risks detected — portfolio looks healthy', level: 'ok' })

    riskAlerts.slice(0, 12).forEach((alert, i) => {
      const y = 32 + i * 16
      const col = alert.level === 'critical' ? C.red : alert.level === 'high' ? C.amber : C.green
      const bg: [number,number,number] = alert.level === 'critical' ? [60, 20, 20] : alert.level === 'high' ? [60, 45, 10] : [15, 50, 40]
      setFill(bg); setDraw(col); doc.setLineWidth(0.5)
      doc.roundedRect(20, y, 170, 12, 1, 1, 'FD')
      setFill(col); doc.rect(20, y, 3, 12, 'F')
      const icon = alert.level === 'critical' ? '! ' : alert.level === 'high' ? '~ ' : '✓ '
      setFont(col); doc.setFontSize(10); doc.setFont('helvetica', 'bold')
      doc.text(icon + alert.text.substring(0, 70), 27, y + 8)
    })

    // Open risks from register
    if (openRisks.length > 0) {
      const y = 32 + Math.min(riskAlerts.length, 12) * 16 + 10
      setFont(C.white); doc.setFontSize(13); doc.setFont('helvetica', 'bold')
      doc.text('Open Risk Register Items', 20, y)
      openRisks.slice(0, 5).forEach((r: any, i: number) => {
        const ry = y + 8 + i * 9
        setFont(C.red); doc.setFontSize(9); doc.setFont('helvetica', 'normal')
        doc.text(`• ${r.title?.substring(0, 60) || 'Risk'} — Owner: ${r.owner || '—'}`, 25, ry)
      })
    }

    setFill(C.violet); doc.rect(0, H - 15, W, 15, 'F')
    setFont(C.white); doc.setFontSize(9)
    doc.text(`${orgName || 'NexPlan'} Portfolio Report  |  ${today}  |  Page 3`, W/2, H - 6, { align: 'center' })

    // ── PAGE 4: Team Performance ───────────────────────────────
    doc.addPage()
    setFill(C.dark); doc.rect(0, 0, W, H, 'F')
    setFill(C.accent); doc.rect(0, 0, W, 3, 'F')

    setFont(C.white); doc.setFontSize(20); doc.setFont('helvetica', 'bold')
    doc.text('Team Performance Analytics', 20, 20)
    setDraw(C.border); doc.line(20, 24, 190, 24)

    // Build assignee stats
    const assigneeMap: Record<string, { total: number; done: number; overdue: number }> = {}
    ;(tasks || []).forEach((t: any) => {
      if (!t.assignee_name) return
      if (!assigneeMap[t.assignee_name]) assigneeMap[t.assignee_name] = { total: 0, done: 0, overdue: 0 }
      assigneeMap[t.assignee_name].total++
      if (t.status === 'done') assigneeMap[t.assignee_name].done++
      if (t.due_date && new Date(t.due_date) < new Date() && t.status !== 'done') assigneeMap[t.assignee_name].overdue++
    })

    const teamStats = Object.entries(assigneeMap)
      .map(([name, s]) => ({ name, ...s, rate: Math.round((s.done / (s.total || 1)) * 100) }))
      .sort((a, b) => b.rate - a.rate)

    if (teamStats.length === 0) {
      setFont(C.muted); doc.setFontSize(12)
      doc.text('No assignee data available. Assign team members to tasks to see performance.', 20, 50)
    } else {
      // Table header
      setFill(C.surface); doc.rect(20, 30, 170, 8, 'F')
      setFont(C.muted); doc.setFontSize(9); doc.setFont('helvetica', 'bold')
      doc.text('TEAM MEMBER', 25, 36)
      doc.text('TASKS', 110, 36)
      doc.text('DONE', 130, 36)
      doc.text('OVERDUE', 150, 36)
      doc.text('RATE', 178, 36)

      teamStats.slice(0, 15).forEach((m, i) => {
        const y = 42 + i * 11
        if (i % 2 === 0) { setFill([20, 30, 48]); doc.rect(20, y - 3, 170, 11, 'F') }

        const barColor = m.rate >= 70 ? C.green : m.rate >= 40 ? C.amber : C.red
        setFont(C.white); doc.setFontSize(9); doc.setFont('helvetica', 'normal')
        doc.text(m.name.substring(0, 30), 25, y + 4)

        // Mini progress bar
        setFill(C.surface); doc.rect(80, y, 25, 4, 'F')
        setFill(barColor); doc.rect(80, y, 25 * m.rate / 100, 4, 'F')

        doc.text(String(m.total), 113, y + 4)
        doc.text(String(m.done), 133, y + 4)
        setFont(m.overdue > 0 ? C.red : C.muted)
        doc.text(String(m.overdue), 155, y + 4)
        setFont(barColor); doc.setFont('helvetica', 'bold')
        doc.text(`${m.rate}%`, 178, y + 4)
      })
    }

    setFill(C.violet); doc.rect(0, H - 15, W, 15, 'F')
    setFont(C.white); doc.setFontSize(9)
    doc.text(`${orgName || 'NexPlan'} Portfolio Report  |  ${today}  |  Page 4`, W/2, H - 6, { align: 'center' })

    // ── PAGE 5: AI Insights (if available) ────────────────────
    if (aiInsights) {
      doc.addPage()
      setFill(C.dark); doc.rect(0, 0, W, H, 'F')
      setFill(C.violet); doc.rect(0, 0, W, 3, 'F')

      setFont(C.white); doc.setFontSize(20); doc.setFont('helvetica', 'bold')
      doc.text('AI Intelligence Summary', 20, 20)
      setFont(C.muted); doc.setFontSize(10); doc.setFont('helvetica', 'italic')
      doc.text('Powered by Claude AI — NexPlan', 20, 28)
      setDraw(C.border); doc.line(20, 32, 190, 32)

      setFill(C.surface); doc.roundedRect(18, 36, 174, 230, 2, 2, 'F')

      const cleanText = aiInsights.replace(/\*\*/g, '').replace(/#{1,3} /g, '').trim()
      const lines = doc.splitTextToSize(cleanText, 162)
      setFont(C.white); doc.setFontSize(10); doc.setFont('helvetica', 'normal')
      doc.text(lines.slice(0, 35), 25, 46)

      setFill(C.violet); doc.rect(0, H - 15, W, 15, 'F')
      setFont(C.white); doc.setFontSize(9)
      doc.text(`${orgName || 'NexPlan'} Portfolio Report  |  ${today}  |  Page 5`, W/2, H - 6, { align: 'center' })
    }

    // ── Output ─────────────────────────────────────────────────
    const pdfBytes = doc.output('arraybuffer')
    const uint8    = new Uint8Array(pdfBytes)

    return new NextResponse(uint8, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="NexPlan-Portfolio-Report-${new Date().toISOString().split('T')[0]}.pdf"`,
      },
    })

  } catch (err: any) {
    console.error('[export-pdf]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
