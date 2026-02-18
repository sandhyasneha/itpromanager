import Link from 'next/link'

export default function ProjectPlanPage() {
  return (
    <div className="text-center py-24">
      <p className="text-5xl mb-4">📅</p>
      <h2 className="font-syne font-black text-2xl mb-2">Project Plan</h2>
      <p className="text-muted mb-6 max-w-md mx-auto">Full project plan with Gantt-style timelines, task hierarchies, owners, priorities and status tracking — coming in Phase 2.</p>
      <Link href="/kanban" className="btn-primary">Go to Kanban Board →</Link>
    </div>
  )
}
