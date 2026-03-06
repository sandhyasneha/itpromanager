'use client'
// ============================================================
// src/components/DashboardTabs.tsx
// Client wrapper — tabs between My Projects and Portfolio View
// Only rendered for Portfolio Manager role
// ============================================================
import { useState } from 'react'
import PortfolioView from '@/components/PortfolioView'

interface Project {
  id:                  string
  name:                string
  color?:              string
  start_date?:         string
  end_date?:           string
  status?:             string
  budget_total?:       number | null
  budget_currency?:    string
  budget_contingency?: number | null
}
interface Task    { id: string; project_id: string; title: string; status: string; priority: string; due_date?: string; updated_at?: string; assignee_name?: string }
interface Risk    { id: string; project_id: string; rag_status: string; status: string; title: string; type: string }

interface Props {
  projects: Project[]
  tasks:    Task[]
  risks:    Risk[]
}

export default function DashboardTabs({ projects, tasks, risks }: Props) {
  const [tab, setTab] = useState<'my' | 'portfolio'>('my')

  return (
    <div>
      {/* Tab bar */}
      <div className="flex gap-1 p-1 bg-surface2 rounded-xl mb-6 max-w-xs">
        <button onClick={() => setTab('my')}
          className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all
            ${tab === 'my' ? 'bg-surface text-text shadow' : 'text-muted hover:text-text'}`}>
          📋 My Projects
        </button>
        <button onClick={() => setTab('portfolio')}
          className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all
            ${tab === 'portfolio' ? 'bg-surface text-text shadow' : 'text-muted hover:text-text'}`}>
          📊 Portfolio View
        </button>
      </div>

      {/* Portfolio View tab content */}
      {tab === 'portfolio' && (
        <PortfolioView projects={projects} tasks={tasks} risks={risks} />
      )}

      {/* My Projects tab — returns null so parent renders normally */}
      {tab === 'my' && null}
    </div>
  )
}
