export type UserRole = 'IT Project Manager' | 'Network Engineer' | 'Sponsor' | 'Stakeholder' | 'Other'

export interface Profile {
  id: string
  email: string
  full_name: string
  role: UserRole
  country: string
  avatar_url?: string
  created_at: string
}

export type TaskStatus = 'backlog' | 'in_progress' | 'review' | 'blocked' | 'done'
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical'

export interface Task {
  id: string
  project_id: string
  title: string
  description?: string
  status: TaskStatus
  priority: TaskPriority
  assignee_id?: string
  assignee_name?: string
  assignee_email?: string
  tags: string[]
  due_date?: string
  start_date?: string
  end_date?: string
  duration?: number
  dependencies?: string[]
  position: number
  created_at: string
}

export interface Project {
  id: string
  owner_id: string
  name: string
  description?: string
  scope?: string
  attachment_url?: string
  attachment_name?: string
  status: 'active' | 'completed' | 'on_hold' | 'cancelled'
  progress: number
  start_date?: string
  end_date?: string
  color: string
  created_at: string
}

export interface KanbanColumn {
  id: TaskStatus
  title: string
  emoji: string
  color: string
  tasks: Task[]
}
