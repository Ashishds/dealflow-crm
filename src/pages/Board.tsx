import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
} from '@dnd-kit/core'
import { useDraggable } from '@dnd-kit/core'
import { opportunitiesApi } from '../api'
import type { Opportunity, OpportunityStage } from '../types'
import { STAGES } from '../types'
import { formatCurrency, stageColor } from '../utils'
import { Building2, User, DollarSign } from 'lucide-react'

// ── Kanban Card ─────────────────────────────────────────────
function KanbanCard({ opp, isDragging }: { opp: Opportunity; isDragging?: boolean }) {
  const navigate = useNavigate()
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ id: opp.id })

  const style = transform
    ? { transform: `translate(${transform.x}px, ${transform.y}px)` }
    : undefined

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`kanban-card ${isDragging ? 'kanban-card-dragging' : ''}`}
      {...listeners}
      {...attributes}
      onClick={(e) => {
        // Only navigate if no drag happened
        if (!isDragging) navigate(`/opportunities/${opp.id}`)
      }}
    >
      <div className="kanban-card-header">
        <p className="kanban-card-name">{opp.name}</p>
        <span className="kanban-value">{formatCurrency(opp.value)}</span>
      </div>
      {opp.account_name && (
        <div className="kanban-meta">
          <Building2 size={12} />
          <span>{opp.account_name}</span>
        </div>
      )}
      {opp.contact_name && (
        <div className="kanban-meta">
          <User size={12} />
          <span>{opp.contact_name}</span>
        </div>
      )}
      {opp.close_date && (
        <div className="kanban-meta">
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
            Close: {opp.close_date.slice(0, 10)}
          </span>
        </div>
      )}
    </div>
  )
}

// ── Droppable Column ─────────────────────────────────────────
function KanbanColumn({ stage, opps }: { stage: OpportunityStage; opps: Opportunity[] }) {
  const { setNodeRef, isOver } = useDroppable({ id: stage })
  const color = stageColor(stage)
  const total = opps.reduce((s, o) => s + o.value, 0)

  return (
    <div className={`kanban-col ${isOver ? 'kanban-col-over' : ''}`}>
      <div className="kanban-col-header">
        <div className="kanban-col-title">
          <span className="kanban-stage-dot" style={{ background: color }} />
          <span style={{ color }}>{stage}</span>
        </div>
        <div className="kanban-col-meta">
          <span className="badge badge-neutral">{opps.length}</span>
          <span className="kanban-total">{formatCurrency(total)}</span>
        </div>
      </div>
      <div ref={setNodeRef} className="kanban-cards">
        {opps.map(opp => (
          <KanbanCard key={opp.id} opp={opp} />
        ))}
        {opps.length === 0 && (
          <div className="kanban-empty">Drop cards here</div>
        )}
      </div>
    </div>
  )
}

// ── Board Page ───────────────────────────────────────────────
export default function Board() {
  const [opps, setOpps] = useState<Opportunity[]>([])
  const [loading, setLoading] = useState(true)
  const [activeId, setActiveId] = useState<number | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  async function load() {
    setLoading(true)
    try {
      const data = await opportunitiesApi.list()
      setOpps(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  function handleDragStart(event: DragStartEvent) {
    setActiveId(Number(event.active.id))
  }

  async function handleDragEnd(event: DragEndEvent) {
    setActiveId(null)
    const { active, over } = event
    if (!over) return
    const oppId = Number(active.id)
    const newStage = over.id as OpportunityStage
    const opp = opps.find(o => o.id === oppId)
    if (!opp || opp.stage === newStage) return

    // Optimistic update
    setOpps(prev => prev.map(o => o.id === oppId ? { ...o, stage: newStage } : o))
    try {
      await opportunitiesApi.updateStage(oppId, newStage)
    } catch {
      // Revert on error
      load()
    }
  }

  const grouped = STAGES.reduce<Record<OpportunityStage, Opportunity[]>>((acc, s) => {
    acc[s] = opps.filter(o => o.stage === s)
    return acc
  }, {} as any)

  const activeOpp = activeId ? opps.find(o => o.id === activeId) : null

  return (
    <div className="page page-board">
      <div className="page-header">
        <div>
          <h2 className="page-title">Pipeline Board</h2>
          <p className="page-subtitle">{opps.length} deals across {STAGES.length} stages</p>
        </div>
      </div>

      {loading ? (
        <div className="empty-state"><span className="spinner" /></div>
      ) : (
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="kanban-board">
            {STAGES.map(stage => (
              <KanbanColumn key={stage} stage={stage} opps={grouped[stage]} />
            ))}
          </div>
          <DragOverlay>
            {activeOpp ? <KanbanCard opp={activeOpp} isDragging /> : null}
          </DragOverlay>
        </DndContext>
      )}
    </div>
  )
}
