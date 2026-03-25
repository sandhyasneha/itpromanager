// src/app/api/export-excel/route.ts
// Exports project tasks as a colour-coded Excel file with Gantt sheet

import { NextResponse } from 'next/server'
import * as XLSX from 'xlsx'

const STATUS_COLORS: Record<string, string> = {
  done:        'FF22d3a5',
  in_progress: 'FF00d4ff',
  review:      'FFf59e0b',
  blocked:     'FFef4444',
  backlog:     'FF94a3b8',
}

const PRIORITY_COLORS: Record<string, string> = {
  critical: 'FFef4444',
  high:     'FFf59e0b',
  medium:   'FF00d4ff',
  low:      'FF94a3b8',
}

const STATUS_LABELS: Record<string, string> = {
  done: 'Done', in_progress: 'In Progress',
  review: 'In Review', blocked: 'Blocked', backlog: 'Backlog',
}

export async function POST(request: Request) {
  try {
    const { project, tasks } = await request.json()
    if (!project) return NextResponse.json({ error: 'No project' }, { status: 400 })

    const projectTasks = (tasks || []).filter((t: any) => t.project_id === project.id)

    const wb = XLSX.utils.book_new()

    // ── Sheet 1: Task List ────────────────────────────────────
    const taskHeaders = ['#', 'Task Title', 'Status', 'Priority', 'Assignee', 'Start Date', 'End Date', 'Due Date', 'Est. Hours', 'Tags', 'Description']
    const taskRows = projectTasks.map((t: any, i: number) => [
      i + 1,
      t.title || '',
      STATUS_LABELS[t.status] || t.status || '',
      t.priority ? t.priority.charAt(0).toUpperCase() + t.priority.slice(1) : '',
      t.assignee_name || '',
      t.start_date ? new Date(t.start_date).toLocaleDateString('en-GB') : '',
      t.end_date   ? new Date(t.end_date).toLocaleDateString('en-GB')   : '',
      t.due_date   ? new Date(t.due_date).toLocaleDateString('en-GB')   : '',
      t.estimated_hours || '',
      Array.isArray(t.tags) ? t.tags.join(', ') : '',
      t.description || '',
    ])

    const ws1 = XLSX.utils.aoa_to_sheet([taskHeaders, ...taskRows])

    // Column widths
    ws1['!cols'] = [
      { wch: 4 }, { wch: 40 }, { wch: 14 }, { wch: 10 },
      { wch: 18 }, { wch: 12 }, { wch: 12 }, { wch: 12 },
      { wch: 10 }, { wch: 20 }, { wch: 40 },
    ]

    // Header style
    taskHeaders.forEach((_, i) => {
      const cellRef = XLSX.utils.encode_cell({ r: 0, c: i })
      if (!ws1[cellRef]) ws1[cellRef] = { v: taskHeaders[i], t: 's' }
      ws1[cellRef].s = {
        font: { bold: true, color: { rgb: 'FFFFFFFF' }, sz: 11 },
        fill: { fgColor: { rgb: 'FF1e293b' } },
        alignment: { horizontal: 'center', vertical: 'center' },
        border: {
          bottom: { style: 'thin', color: { rgb: 'FF334155' } },
          right:  { style: 'thin', color: { rgb: 'FF334155' } },
        }
      }
    })

    // Row styles — colour by status
    projectTasks.forEach((t: any, rowIdx: number) => {
      const row = rowIdx + 1
      const statusColor = STATUS_COLORS[t.status] || STATUS_COLORS.backlog
      const priorityColor = PRIORITY_COLORS[t.priority] || PRIORITY_COLORS.low
      const isEven = rowIdx % 2 === 0

      taskHeaders.forEach((_, colIdx) => {
        const cellRef = XLSX.utils.encode_cell({ r: row, c: colIdx })
        if (!ws1[cellRef]) ws1[cellRef] = { v: '', t: 's' }

        let fillColor = isEven ? 'FFF8FAFC' : 'FFFFFFFF'

        // Status column (col 2) — colour by status
        if (colIdx === 2) fillColor = statusColor + '30'
        // Priority column (col 3) — colour by priority
        if (colIdx === 3) fillColor = priorityColor + '30'

        ws1[cellRef].s = {
          font: { sz: 10 },
          fill: { fgColor: { rgb: fillColor } },
          alignment: { vertical: 'center', wrapText: colIdx === 10 },
          border: {
            bottom: { style: 'thin', color: { rgb: 'FFe2e8f0' } },
            right:  { style: 'thin', color: { rgb: 'FFe2e8f0' } },
          }
        }
      })

      // Row height
      if (!ws1['!rows']) ws1['!rows'] = []
      ws1['!rows'][row] = { hpt: 22 }
    })

    // Header row height
    if (!ws1['!rows']) ws1['!rows'] = []
    ws1['!rows'][0] = { hpt: 28 }

    XLSX.utils.book_append_sheet(wb, ws1, '📋 Task List')

    // ── Sheet 2: Project Summary ──────────────────────────────
    const done       = projectTasks.filter((t: any) => t.status === 'done').length
    const inProgress = projectTasks.filter((t: any) => t.status === 'in_progress').length
    const blocked    = projectTasks.filter((t: any) => t.status === 'blocked').length
    const backlog    = projectTasks.filter((t: any) => t.status === 'backlog').length
    const overdue    = projectTasks.filter((t: any) => t.due_date && new Date(t.due_date) < new Date() && t.status !== 'done').length
    const pct        = projectTasks.length > 0 ? Math.round((done / projectTasks.length) * 100) : 0

    const summaryData = [
      ['PROJECT SUMMARY', ''],
      ['', ''],
      ['Project Name',    project.name],
      ['Start Date',      project.start_date ? new Date(project.start_date).toLocaleDateString('en-GB') : '—'],
      ['End Date',        project.end_date   ? new Date(project.end_date).toLocaleDateString('en-GB')   : '—'],
      ['Status',          project.status || 'Active'],
      ['', ''],
      ['TASK SUMMARY', ''],
      ['Total Tasks',     projectTasks.length],
      ['✅ Done',         done],
      ['⚡ In Progress',  inProgress],
      ['🚫 Blocked',      blocked],
      ['🗂 Backlog',      backlog],
      ['⚠️ Overdue',      overdue],
      ['Completion %',    `${pct}%`],
      ['', ''],
      ['Generated by',    'NexPlan — nexplan.io'],
      ['Generated on',    new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })],
    ]

    const ws2 = XLSX.utils.aoa_to_sheet(summaryData)
    ws2['!cols'] = [{ wch: 20 }, { wch: 40 }]

    // Title style
    if (ws2['A1']) {
      ws2['A1'].s = {
        font: { bold: true, sz: 16, color: { rgb: 'FF00d4ff' } },
        fill: { fgColor: { rgb: 'FF0f172a' } },
      }
    }

    XLSX.utils.book_append_sheet(wb, ws2, '📊 Summary')

    // ── Sheet 3: Gantt Data ───────────────────────────────────
    const ganttTasks = projectTasks.filter((t: any) => t.start_date && t.end_date)
    const ganttHeaders = ['Task', 'Assignee', 'Priority', 'Status', 'Start Date', 'End Date', 'Duration (days)', 'Progress %']
    const ganttRows = ganttTasks.map((t: any) => {
      const start    = new Date(t.start_date)
      const end      = new Date(t.end_date)
      const duration = Math.ceil((end.getTime() - start.getTime()) / 86400000)
      const progress = t.status === 'done' ? 100 : t.status === 'review' ? 80 : t.status === 'in_progress' ? 50 : t.status === 'blocked' ? 25 : 0
      return [
        t.title,
        t.assignee_name || '',
        t.priority ? t.priority.charAt(0).toUpperCase() + t.priority.slice(1) : '',
        STATUS_LABELS[t.status] || t.status,
        start.toLocaleDateString('en-GB'),
        end.toLocaleDateString('en-GB'),
        duration,
        progress,
      ]
    })

    const ws3 = XLSX.utils.aoa_to_sheet([ganttHeaders, ...ganttRows])
    ws3['!cols'] = [{ wch: 40 }, { wch: 18 }, { wch: 10 }, { wch: 14 }, { wch: 12 }, { wch: 12 }, { wch: 16 }, { wch: 12 }]

    // Header style
    ganttHeaders.forEach((_, i) => {
      const cellRef = XLSX.utils.encode_cell({ r: 0, c: i })
      if (!ws3[cellRef]) ws3[cellRef] = { v: ganttHeaders[i], t: 's' }
      ws3[cellRef].s = {
        font: { bold: true, color: { rgb: 'FFFFFFFF' }, sz: 11 },
        fill: { fgColor: { rgb: 'FF0f172a' } },
        alignment: { horizontal: 'center' },
      }
    })

    // Colour rows by status
    ganttTasks.forEach((t: any, rowIdx: number) => {
      const row = rowIdx + 1
      const statusColor = STATUS_COLORS[t.status] || STATUS_COLORS.backlog
      ganttHeaders.forEach((_, colIdx) => {
        const cellRef = XLSX.utils.encode_cell({ r: row, c: colIdx })
        if (!ws3[cellRef]) ws3[cellRef] = { v: '', t: 's' }
        ws3[cellRef].s = {
          font: { sz: 10 },
          fill: { fgColor: { rgb: colIdx === 3 ? statusColor + '40' : rowIdx % 2 === 0 ? 'FFF8FAFC' : 'FFFFFFFF' } },
          alignment: { vertical: 'center' },
          border: { bottom: { style: 'thin', color: { rgb: 'FFe2e8f0' } } }
        }
      })
    })

    XLSX.utils.book_append_sheet(wb, ws3, '📅 Gantt Data')

    // Generate buffer
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx', cellStyles: true })

    return new NextResponse(buf, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${project.name.replace(/[^a-zA-Z0-9]/g, '-')}-NexPlan.xlsx"`,
      },
    })

  } catch (err: any) {
    console.error('[export-excel]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
