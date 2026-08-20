import { useState } from 'react'
import { MessageSquare, Phone, Mail, CheckCircle2, Circle, Trash2, Calendar } from 'lucide-react'
import { interactionsApi } from '../api'
import type { Interaction } from '../types'
import { formatRelative, formatDate, isOverdue } from '../utils'

const TYPE_ICON: Record<string, React.ReactNode> = {
  note: <MessageSquare size={15} />,
  call: <Phone size={15} />,
  email: <Mail size={15} />,
}

const TYPE_COLOR: Record<string, string> = {
  note: '#ecad0a',
  call: '#209dd7',
  email: '#753991',
}

interface InteractionTimelineProps {
  interactions: Interaction[]
  onUpdate: () => void
}

export default function InteractionTimeline({ interactions, onUpdate }: InteractionTimelineProps) {
  const [toggling, setToggling] = useState<number | null>(null)
  const [deleting, setDeleting] = useState<number | null>(null)

  async function handleToggle(int: Interaction) {
    setToggling(int.id)
    try {
      await interactionsApi.toggleDone(int.id, !int.done)
      onUpdate()
    } finally {
      setToggling(null)
    }
  }

  async function handleDelete(id: number) {
    setDeleting(id)
    try {
      await interactionsApi.delete(id)
      onUpdate()
    } finally {
      setDeleting(null)
    }
  }

  if (interactions.length === 0) {
    return <div className="empty-state-small">No interactions yet — log the first one!</div>
  }

  return (
    <div className="timeline">
      {interactions.map((int, idx) => {
        const color = TYPE_COLOR[int.type] || '#64748b'
        const overdue = int.due_date && !int.done && isOverdue(int.due_date)
        return (
          <div key={int.id} className={`timeline-item ${int.done ? 'timeline-item-done' : ''}`}>
            <div className="timeline-icon" style={{ background: color + '1a', color }}>
              {TYPE_ICON[int.type]}
            </div>
            <div className="timeline-content">
              <div className="timeline-header">
                <div className="flex items-center gap-2">
                  <span className="timeline-type" style={{ color }}>{int.type}</span>
                  {int.opportunity_name && (
                    <span className="badge badge-neutral">{int.opportunity_name}</span>
                  )}
                  {int.person_name && (
                    <span className="badge badge-neutral">{int.person_name}</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="timeline-date">{formatRelative(int.occurred_at)}</span>
                  <button
                    className="btn btn-ghost btn-icon btn-danger"
                    title="Delete"
                    disabled={deleting === int.id}
                    onClick={() => handleDelete(int.id)}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
              <p className="timeline-description">{int.description}</p>
              {int.due_date && (
                <div className={`timeline-task ${overdue ? 'timeline-task-overdue' : ''}`}>
                  <button
                    className="task-toggle-btn"
                    disabled={toggling === int.id}
                    onClick={() => handleToggle(int)}
                    title={int.done ? 'Mark not done' : 'Mark done'}
                  >
                    {int.done
                      ? <CheckCircle2 size={16} style={{ color: '#16a34a' }} />
                      : <Circle size={16} style={{ color: overdue ? '#dc2626' : '#9ca3af' }} />}
                  </button>
                  <Calendar size={12} />
                  <span className={`task-due ${overdue ? 'text-danger' : ''}`}>
                    {overdue ? 'Overdue · ' : 'Due · '}
                    {formatDate(int.due_date)}
                  </span>
                  {int.done && <span className="task-done-label">Done</span>}
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
