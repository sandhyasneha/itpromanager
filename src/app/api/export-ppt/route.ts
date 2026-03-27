// src/app/api/export-ppt/route.ts
import { NextResponse } from 'next/server'
// @ts-ignore
import PptxGenJS from 'pptxgenjs'

const B = {
  dark:   '0f172a', darker: '060d1b', surface: '1e293b',
  accent: '00d4ff', violet: '7c3aed', green:   '22d3a5',
  amber:  'f59e0b', red:    'ef4444', text:    'f1f5f9',
  muted:  '94a3b8', border: '334155',
}

function rag(r: string) { return r === 'green' ? B.green : r === 'amber' ? B.amber : B.red }

export async function POST(request: Request) {
  try {
    const { projects, tasks, risks, orgName, generatedBy, aiInsights, workspaces: wsData } = await request.json()

    const pres    = new PptxGenJS()
    pres.layout   = 'LAYOUT_16x9'
    pres.author   = generatedBy || 'NexPlan'
    pres.title    = `${orgName || 'Portfolio'} - Project Intelligence Report`
    const today   = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })

    const totalTasks   = tasks?.length || 0
    const doneTasks    = tasks?.filter((t: any) => t.status === 'done').length || 0
    const overdueTasks = tasks?.filter((t: any) => t.due_date && new Date(t.due_date) < new Date() && t.status !== 'done').length || 0
    const blockedTasks = tasks?.filter((t: any) => t.status === 'blocked').length || 0
    const pct          = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0

    // ── SLIDE 1: Title ──────────────────────────────────────────
    const s1 = pres.addSlide()
    s1.background = { color: B.dark }
    s1.addShape(pres.ShapeType.rect, { x: 0, y: 0, w: '100%', h: 0.08, fill: { color: B.accent } })
    s1.addText('NexPlan', { x: 0.5, y: 0.3, w: 4, h: 0.5, fontSize: 18, bold: true, color: B.accent, fontFace: 'Arial' })
    s1.addText('Project Intelligence Report', { x: 0.5, y: 1.2, w: 9, h: 1.2, fontSize: 44, bold: true, color: B.text, fontFace: 'Arial' })
    s1.addText(orgName || 'IT Portfolio', { x: 0.5, y: 2.4, w: 9, h: 0.7, fontSize: 24, color: B.accent, fontFace: 'Arial' })
    s1.addText(`Generated: ${today}  |  Prepared by: ${generatedBy || 'Portfolio Manager'}`, { x: 0.5, y: 4.8, w: 9, h: 0.4, fontSize: 11, color: B.muted, fontFace: 'Arial' })
    s1.addShape(pres.ShapeType.rect, { x: 0, y: 5.5, w: '100%', h: 0.12, fill: { color: B.violet } })

    // ── SLIDE 2: Portfolio Summary ──────────────────────────────
    const s2 = pres.addSlide()
    s2.background = { color: B.dark }
    s2.addShape(pres.ShapeType.rect, { x: 0, y: 0, w: '100%', h: 0.08, fill: { color: B.accent } })
    s2.addText('Portfolio Overview', { x: 0.5, y: 0.25, w: 9, h: 0.6, fontSize: 28, bold: true, color: B.text, fontFace: 'Arial' })

    const kpis = [
      { label: 'Total Projects', value: String(projects?.length || 0), color: B.accent },
      { label: 'Completion',     value: `${pct}%`,                      color: B.green },
      { label: 'Overdue Tasks',  value: String(overdueTasks),           color: overdueTasks > 0 ? B.red : B.green },
      { label: 'Blocked Tasks',  value: String(blockedTasks),           color: blockedTasks > 0 ? B.amber : B.green },
    ]
    kpis.forEach((k, i) => {
      const x = 0.3 + i * 2.4
      s2.addShape(pres.ShapeType.rect, { x, y: 1.1, w: 2.2, h: 1.4, fill: { color: B.surface }, line: { color: k.color, width: 1.5 } })
      s2.addText(k.value, { x, y: 1.2, w: 2.2, h: 0.7, fontSize: 36, bold: true, color: k.color, align: 'center', fontFace: 'Arial' })
      s2.addText(k.label, { x, y: 1.9, w: 2.2, h: 0.4, fontSize: 11, color: B.muted, align: 'center', fontFace: 'Arial' })
    })

    s2.addText('Overall Completion', { x: 0.5, y: 2.9, w: 4, h: 0.4, fontSize: 14, bold: true, color: B.text, fontFace: 'Arial' })
    s2.addShape(pres.ShapeType.rect, { x: 0.5, y: 3.4, w: 9, h: 0.3, fill: { color: B.surface } })
    if (pct > 0) s2.addShape(pres.ShapeType.rect, { x: 0.5, y: 3.4, w: 9 * pct / 100, h: 0.3, fill: { color: B.green } })
    s2.addText(`${doneTasks} of ${totalTasks} tasks completed`, { x: 0.5, y: 3.8, w: 9, h: 0.3, fontSize: 11, color: B.muted, fontFace: 'Arial' })
    s2.addShape(pres.ShapeType.rect, { x: 0, y: 5.5, w: '100%', h: 0.12, fill: { color: B.violet } })

    // ── SLIDE 3: Client Workspace Health ───────────────────────
    const s3 = pres.addSlide()
    s3.background = { color: B.dark }
    s3.addShape(pres.ShapeType.rect, { x: 0, y: 0, w: '100%', h: 0.08, fill: { color: B.accent } })
    s3.addText('Client Workspace Health', { x: 0.5, y: 0.25, w: 9, h: 0.6, fontSize: 28, bold: true, color: B.text, fontFace: 'Arial' })

    const wsList    = wsData || []
    const projList  = projects || []
    const rowData   = wsList.length > 0 ? wsList : projList
    const maxRows   = Math.min(rowData.length, 8)

    rowData.slice(0, maxRows).forEach((p: any, i: number) => {
      const y      = 1.1 + i * 0.52
      const score  = p.score || 80
      const ragCol = rag(p.rag || 'green')
      s3.addShape(pres.ShapeType.ellipse, { x: 0.3, y: y + 0.1, w: 0.25, h: 0.25, fill: { color: ragCol } })
      const label = p.client_name ? `${p.name} - ${p.client_name}` : (p.clientName ? `${p.name} - ${p.clientName}` : p.name || 'Unnamed')
      s3.addText(label.substring(0, 45), { x: 0.7, y, w: 4.5, h: 0.45, fontSize: 13, color: B.text, fontFace: 'Arial', bold: true })
      s3.addShape(pres.ShapeType.rect, { x: 5.3, y: y + 0.1, w: 3, h: 0.22, fill: { color: B.surface } })
      s3.addShape(pres.ShapeType.rect, { x: 5.3, y: y + 0.1, w: 3 * (score / 100), h: 0.22, fill: { color: ragCol } })
      s3.addText(`${score}/100`, { x: 8.4, y, w: 1.2, h: 0.45, fontSize: 13, color: ragCol, bold: true, align: 'right', fontFace: 'Arial' })
    })
    s3.addShape(pres.ShapeType.rect, { x: 0, y: 5.5, w: '100%', h: 0.12, fill: { color: B.violet } })

    // ── SLIDE 4: Risk Alerts ────────────────────────────────────
    const s4 = pres.addSlide()
    s4.background = { color: B.dark }
    s4.addShape(pres.ShapeType.rect, { x: 0, y: 0, w: '100%', h: 0.08, fill: { color: B.red } })
    s4.addText('Risk Alerts', { x: 0.5, y: 0.25, w: 9, h: 0.6, fontSize: 28, bold: true, color: B.text, fontFace: 'Arial' })

    const riskAlerts: { text: string; isRed: boolean }[] = []
    if (overdueTasks > 0) riskAlerts.push({ text: `${overdueTasks} overdue task(s) require immediate attention`, isRed: true })
    if (blockedTasks > 0) riskAlerts.push({ text: `${blockedTasks} blocked task(s) waiting on dependencies`, isRed: false })
    projList.forEach((p: any) => {
      if (p.rag === 'red')   riskAlerts.push({ text: `"${p.name}" is at critical risk - score ${p.score || 0}/100`, isRed: true })
      if (p.rag === 'amber') riskAlerts.push({ text: `"${p.name}" needs attention`, isRed: false })
    })
    if (riskAlerts.length === 0) riskAlerts.push({ text: 'No critical risks detected - portfolio looks healthy', isRed: false })

    riskAlerts.slice(0, 8).forEach((alert, i) => {
      const y = 1.1 + i * 0.52
      s4.addShape(pres.ShapeType.rect, { x: 0.3, y, w: 9.4, h: 0.42, fill: { color: alert.isRed ? '3c141420' : '3c2d0a20' }, line: { color: alert.isRed ? B.red : B.amber, width: 0.75 } })
      s4.addText(alert.text.substring(0, 80), { x: 0.5, y: y + 0.05, w: 9, h: 0.35, fontSize: 13, color: alert.isRed ? B.red : B.amber, fontFace: 'Arial' })
    })
    s4.addShape(pres.ShapeType.rect, { x: 0, y: 5.5, w: '100%', h: 0.12, fill: { color: B.violet } })

    // ── SLIDE 5: AI Insights ────────────────────────────────────
    if (aiInsights) {
      const s5 = pres.addSlide()
      s5.background = { color: B.dark }
      s5.addShape(pres.ShapeType.rect, { x: 0, y: 0, w: '100%', h: 0.08, fill: { color: B.violet } })
      s5.addText('AI Intelligence Summary', { x: 0.5, y: 0.25, w: 9, h: 0.6, fontSize: 28, bold: true, color: B.text, fontFace: 'Arial' })
      s5.addText('Powered by Claude AI - NexPlan', { x: 0.5, y: 0.85, w: 9, h: 0.3, fontSize: 11, color: B.muted, fontFace: 'Arial', italic: true })
      s5.addShape(pres.ShapeType.rect, { x: 0.3, y: 1.2, w: 9.4, h: 4.1, fill: { color: B.surface }, line: { color: B.violet, width: 1 } })
      const cleanInsights = aiInsights.replace(/\*\*/g, '').replace(/#{1,3} /g, '').trim()
      s5.addText(cleanInsights, { x: 0.5, y: 1.3, w: 9, h: 3.9, fontSize: 12, color: B.text, fontFace: 'Arial', valign: 'top', wrap: true })
      s5.addShape(pres.ShapeType.rect, { x: 0, y: 5.5, w: '100%', h: 0.12, fill: { color: B.violet } })
    }

    // ── SLIDE 6+: Per-project detail ────────────────────────────
    projList.slice(0, 6).forEach((p: any) => {
      const ps  = pres.addSlide()
      ps.background = { color: B.dark }
      const col = rag(p.rag || 'green')
      ps.addShape(pres.ShapeType.rect, { x: 0, y: 0, w: '100%', h: 0.08, fill: { color: col } })
      ps.addText(p.name || 'Project', { x: 0.5, y: 0.25, w: 8, h: 0.6, fontSize: 26, bold: true, color: B.text, fontFace: 'Arial' })
      const wsName = p.workspaceName || p.clientName || ''
      if (wsName) ps.addText(`Client: ${wsName}`, { x: 0.5, y: 0.85, w: 5, h: 0.3, fontSize: 13, color: col, fontFace: 'Arial' })

      const pt      = tasks?.filter((t: any) => t.project_id === p.id) || []
      const pDone   = pt.filter((t: any) => t.status === 'done').length
      const pOver   = pt.filter((t: any) => t.due_date && new Date(t.due_date) < new Date() && t.status !== 'done').length
      const pBlock  = pt.filter((t: any) => t.status === 'blocked').length
      const pPct    = pt.length > 0 ? Math.round((pDone / pt.length) * 100) : 0

      const stats = [
        { label: 'Tasks', value: String(pt.length), col: B.accent },
        { label: 'Done',  value: String(pDone),     col: B.green },
        { label: 'Overdue', value: String(pOver),   col: pOver > 0 ? B.red : B.muted },
        { label: 'Blocked', value: String(pBlock),  col: pBlock > 0 ? B.amber : B.muted },
      ]
      stats.forEach((s, i) => {
        const x = 0.3 + i * 2.4
        ps.addShape(pres.ShapeType.rect, { x, y: 1.4, w: 2.2, h: 1.1, fill: { color: B.surface }, line: { color: s.col, width: 1 } })
        ps.addText(s.value, { x, y: 1.5, w: 2.2, h: 0.55, fontSize: 32, bold: true, color: s.col, align: 'center', fontFace: 'Arial' })
        ps.addText(s.label, { x, y: 2.05, w: 2.2, h: 0.3, fontSize: 11, color: B.muted, align: 'center', fontFace: 'Arial' })
      })

      ps.addText(`Completion: ${pPct}%`, { x: 0.5, y: 2.7, w: 9, h: 0.3, fontSize: 13, color: B.text, fontFace: 'Arial', bold: true })
      ps.addShape(pres.ShapeType.rect, { x: 0.5, y: 3.05, w: 9, h: 0.28, fill: { color: B.surface } })
      if (pPct > 0) ps.addShape(pres.ShapeType.rect, { x: 0.5, y: 3.05, w: 9 * pPct / 100, h: 0.28, fill: { color: col } })
      ps.addShape(pres.ShapeType.rect, { x: 0, y: 5.5, w: '100%', h: 0.12, fill: { color: B.violet } })
    })

    // ── Last slide ───────────────────────────────────────────────
    const sEnd = pres.addSlide()
    sEnd.background = { color: B.darker }
    sEnd.addShape(pres.ShapeType.rect, { x: 0, y: 0, w: '100%', h: 0.08, fill: { color: B.accent } })
    sEnd.addText('NexPlan', { x: 0.5, y: 1.5, w: 9, h: 0.7, fontSize: 40, bold: true, color: B.accent, align: 'center', fontFace: 'Arial' })
    sEnd.addText('AI-Powered IT Project Management', { x: 0.5, y: 2.3, w: 9, h: 0.5, fontSize: 20, color: B.muted, align: 'center', fontFace: 'Arial' })
    sEnd.addText('nexplan.io', { x: 0.5, y: 3.0, w: 9, h: 0.4, fontSize: 16, color: B.violet, align: 'center', fontFace: 'Arial' })
    sEnd.addText(`Report generated: ${today}`, { x: 0.5, y: 4.5, w: 9, h: 0.3, fontSize: 12, color: B.muted, align: 'center', fontFace: 'Arial' })
    sEnd.addShape(pres.ShapeType.rect, { x: 0, y: 5.5, w: '100%', h: 0.12, fill: { color: B.violet } })

    const buffer = await pres.write({ outputType: 'nodebuffer' }) as Buffer
    const uint8  = new Uint8Array(buffer)

    return new NextResponse(uint8, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'Content-Disposition': `attachment; filename="NexPlan-Portfolio-${new Date().toISOString().split('T')[0]}.pptx"`,
      },
    })

  } catch (err: any) {
    console.error('[export-ppt]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
