'use client'
// ============================================================
// src/components/TaskCommentsActivity.tsx
// NEW FILE — does not replace anything existing
// Drop this into your TaskModal in KanbanBoard.tsx
// ============================================================

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Comment {
  id: string
  task_id: string
  author_name: string
  author_email: string
  content: string
  is_edited: boolean
  created_at: string
  updated_at: string
}

interface ActivityEntry {
  id: string
  task_id: string
  actor_name: string
  actor_email: string
  action_type: string
  field_changed: string | null
  old_value: string | null
  new_value: string | null
  created_at: string
}

interface Props {
  taskId: string
  projectId: string
  currentUserName: string
  currentUserEmail: string
}

const ACTION_ICONS: Record<string, string> = {
  task_created:     '✨',
  status_change:    '🔄',
  priority_change:  '🎯',
  assignee_change:  '👤',
  due_date_change:  '📅',
  title_change:     '✏️',
  comment_added:    '💬',
  attachment_added: '📎',
}

const STATUS_LABELS: Record<string, string> = {
  backlog:     'Not Started',
  in_progress: 'In Progress',
  review:      'In Review',
  blocked:     'Blocked',
  done:        'Done',
}

function timeAgo(dateStr: string): string {
  const diff  = Date.now() - new Date(dateStr).getTime()
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days  = Math.floor(diff / 86400000)
  if (mins  < 1)  return 'just now'
  if (mins  < 60) return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days  <  7) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function formatActivity(entry: ActivityEntry): string {
  switch (entry.action_type) {
    case 'task_created':
      return 'created this task'
    case 'status_change':
      return `changed status: ${STATUS_LABELS[entry.old_value ?? ''] ?? entry.old_value} → ${STATUS_LABELS[entry.new_value ?? ''] ?? entry.new_value}`
    case 'priority_change':
      return `changed priority: ${entry.old_value} → ${entry.new_value}`
    case 'assignee_change':
      return entry.new_value
        ? `assigned to ${entry.new_value}`
        : 'removed assignee'
    case 'due_date_change':
      return entry.new_value
        ? `set due date to ${new Date(entry.new_value).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`
        : 'removed due date'
    case 'title_change':
      return `renamed to "${entry.new_value}"`
    case 'comment_added':
      return 'added a comment'
    case 'attachment_added':
      return 'added an attachment'
    default:
      return entry.action_type.replace(/_/g, ' ')
  }
}

export default function TaskCommentsActivity({
  taskId,
  projectId,
  currentUserName,
  currentUserEmail,
}: Props) {
  const supabase = createClient()

  const [tab, setTab]               = useState<'comments' | 'activity'>('comments')
  const [comments, setComments]     = useState<Comment[]>([])
  const [activity, setActivity]     = useState<ActivityEntry[]>([])
  const [loading, setLoading]       = useState(true)
  const [newComment, setNewComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [editingId, setEditingId]   = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => { load() }, [taskId])

  async function load() {
    setLoading(true)
    const [{ data: c }, { data: a }] = await Promise.all([
      supabase
        .from('task_comments')
        .select('*')
        .eq('task_id', taskId)
        .order('created_at', { ascending: true }),
      supabase
        .from('task_activity_log')
        .select('*')
        .eq('task_id', taskId)
        .order('created_at', { ascending: false })
        .limit(50),
    ])
    setComments((c ?? []) as Comment[])
    setActivity((a ?? []) as ActivityEntry[])
    setLoading(false)
  }

  async function submitComment() {
    if (!newComment.trim()) return
    setSubmitting(true)
    const { data } = await supabase
      .from('task_comments')
      .insert({
        task_id:      taskId,
        project_id:   projectId,
        author_name:  currentUserName,
        author_email: currentUserEmail,
        content:      newComment.trim(),
      })
      .select()
      .single()

    if (data) {
      setComments(c => [...c, data as Comment])
      // Log activity
      await supabase.from('task_activity_log').insert({
        task_id:     taskId,
        project_id:  projectId,
        actor_name:  currentUserName,
        actor_email: currentUserEmail,
        action_type: 'comment_added',
      })
      setNewComment('')
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
    }
    setSubmitting(false)
  }

  async function saveEdit(id: string) {
    if (!editContent.trim()) return
    const { data } = await supabase
      .from('task_comments')
      .update({ content: editContent.trim(), is_edited: true })
      .eq('id', id)
      .select()
      .single()
    if (data) setComments(c => c.map(x => x.id === id ? data as Comment : x))
    setEditingId(null)
  }

  async function deleteComment(id: string) {
    if (!confirm('Delete this comment?')) return
    await supabase.from('task_comments').delete().eq('id', id)
    setComments(c => c.filter(x => x.id !== id))
  }

  return (
    <div className="border-t border-border mt-2 pt-4">

      {/* ── Tab bar ── */}
      <div className="flex gap-1 p-1 bg-surface2 rounded-xl mb-4">
        <button
          onClick={() => setTab('comments')}
          className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5
            ${tab === 'comments' ? 'bg-surface text-text shadow' : 'text-muted hover:text-text'}`}>
          💬 Comments
          {comments.length > 0 && (
            <span className="px-1.5 py-0.5 rounded-md bg-accent/15 text-accent font-mono-code text-[10px]">
              {comments.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setTab('activity')}
          className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5
            ${tab === 'activity' ? 'bg-surface text-text shadow' : 'text-muted hover:text-text'}`}>
          📋 Activity
          {activity.length > 0 && (
            <span className="px-1.5 py-0.5 rounded-md bg-surface2 text-muted font-mono-code text-[10px] border border-border">
              {activity.length}
            </span>
          )}
        </button>
      </div>

      {/* ── Loading ── */}
      {loading ? (
        <p className="text-center text-xs text-muted py-6 animate-pulse">Loading…</p>

      ) : tab === 'comments' ? (
        <>
          {/* ── Comment list ── */}
          <div className="space-y-3 max-h-52 overflow-y-auto mb-3 pr-0.5">
            {comments.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-2xl mb-2">💬</p>
                <p className="text-xs text-muted">No comments yet. Be the first!</p>
              </div>
            ) : comments.map(comment => {
              const isOwn     = comment.author_email === currentUserEmail
              const isEditing = editingId === comment.id
              return (
                <div key={comment.id} className="flex gap-2.5 group">
                  {/* Avatar */}
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-accent2 to-accent flex items-center justify-center text-[10px] font-black text-white shrink-0 mt-0.5">
                    {getInitials(comment.author_name)}
                  </div>

                  <div className="flex-1 min-w-0">
                    {/* Meta */}
                    <div className="flex items-baseline gap-2 mb-1 flex-wrap">
                      <span className="font-syne font-bold text-xs">{comment.author_name}</span>
                      <span className="text-[10px] text-muted font-mono-code">{timeAgo(comment.created_at)}</span>
                      {comment.is_edited && (
                        <span className="text-[10px] text-muted italic">(edited)</span>
                      )}
                    </div>

                    {/* Edit mode */}
                    {isEditing ? (
                      <div>
                        <textarea
                          className="input text-xs resize-none w-full h-16 mb-1.5"
                          value={editContent}
                          onChange={e => setEditContent(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); saveEdit(comment.id) }
                            if (e.key === 'Escape') setEditingId(null)
                          }}
                          autoFocus
                        />
                        <div className="flex gap-1.5">
                          <button onClick={() => saveEdit(comment.id)}
                            className="btn-primary text-[10px] px-2.5 py-1">
                            Save
                          </button>
                          <button onClick={() => setEditingId(null)}
                            className="btn-ghost text-[10px] px-2.5 py-1">
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Comment bubble */
                      <div className="bg-surface2 rounded-xl px-3 py-2 text-xs text-text/90 leading-relaxed relative">
                        {comment.content}
                        {/* Edit / Delete — own comments only, shown on hover */}
                        {isOwn && (
                          <div className="absolute right-2 top-1.5 hidden group-hover:flex items-center gap-0.5">
                            <button
                              onClick={() => { setEditingId(comment.id); setEditContent(comment.content) }}
                              title="Edit comment"
                              className="p-1 rounded hover:bg-surface text-muted hover:text-accent transition-colors text-[11px]">
                              ✏️
                            </button>
                            <button
                              onClick={() => deleteComment(comment.id)}
                              title="Delete comment"
                              className="p-1 rounded hover:bg-surface text-muted hover:text-danger transition-colors text-[11px]">
                              🗑
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
            <div ref={bottomRef} />
          </div>

          {/* ── New comment input ── */}
          <div className="flex gap-2 items-start">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-accent to-accent2 flex items-center justify-center text-[10px] font-black text-black shrink-0 mt-0.5">
              {getInitials(currentUserName || 'U')}
            </div>
            <div className="flex-1">
              <textarea
                className="input text-xs resize-none w-full h-14"
                placeholder="Add a comment… (Enter to post · Shift+Enter for new line)"
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitComment() }
                }}
              />
              {newComment.trim() && (
                <div className="flex gap-1.5 mt-1.5">
                  <button
                    onClick={submitComment}
                    disabled={submitting}
                    className="btn-primary text-[10px] px-3 py-1.5 disabled:opacity-40">
                    {submitting ? 'Posting…' : 'Post Comment'}
                  </button>
                  <button
                    onClick={() => setNewComment('')}
                    className="btn-ghost text-[10px] px-3 py-1.5">
                    Clear
                  </button>
                </div>
              )}
            </div>
          </div>
        </>

      ) : (
        /* ── Activity tab ── */
        <div className="space-y-0.5 max-h-64 overflow-y-auto pr-0.5">
          {activity.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-2xl mb-2">📋</p>
              <p className="text-xs text-muted">No activity recorded yet.</p>
              <p className="text-[10px] text-muted mt-1">Activity is logged when fields are saved.</p>
            </div>
          ) : activity.map(entry => (
            <div key={entry.id}
              className="flex gap-2.5 py-2 border-b border-border/30 last:border-0">
              <div className="w-6 h-6 rounded-full bg-surface2 border border-border flex items-center justify-center text-xs shrink-0 mt-0.5">
                {ACTION_ICONS[entry.action_type] ?? '•'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs leading-relaxed">
                  <span className="font-semibold">{entry.actor_name}</span>
                  {' '}
                  <span className="text-muted">{formatActivity(entry)}</span>
                </p>
                <p className="text-[10px] text-muted font-mono-code mt-0.5">
                  {timeAgo(entry.created_at)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
