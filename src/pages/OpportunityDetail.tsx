import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Pencil, Trash2, TrendingUp, Building2, User, Calendar, DollarSign } from 'lucide-react'
import { opportunitiesApi } from '../api'
import type { OpportunityDetail as OpportunityDetailType } from '../types'
import Modal from '../components/Modal'
import OpportunityForm from '../components/OpportunityForm'
import InteractionTimeline from '../components/InteractionTimeline'
import InteractionForm from '../components/InteractionForm'
import { formatCurrency, formatDate, stageColor } from '../utils'

export default function OpportunityDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [opp, setOpp] = useState<OpportunityDetailType | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [logInteraction, setLogInteraction] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const data = await opportunitiesApi.get(Number(id))
      setOpp(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [id])

  async function handleEdit(data: Partial<OpportunityDetailType>) {
    await opportunitiesApi.update(Number(id), data)
    setEditing(false)
    load()
  }

  async function handleDelete() {
    await opportunitiesApi.delete(Number(id))
    navigate('/opportunities')
  }

  if (loading) return <div className="page"><div className="empty-state"><span className="spinner" /></div></div>
  if (!opp) return <div className="page"><div className="empty-state">Opportunity not found.</div></div>

  return (
    <div className="page">
      <div className="page-header">
        <div className="flex items-center gap-3">
          <button className="btn btn-ghost btn-icon" onClick={() => navigate('/opportunities')}>
            <ArrowLeft size={18} />
          </button>
          <div>
            <h2 className="page-title">{opp.name}</h2>
            <p className="page-subtitle">{opp.account_name || 'No account'}</p>
          </div>
          <span
            className="badge"
            style={{
              background: stageColor(opp.stage) + '1a',
              color: stageColor(opp.stage),
              border: `1px solid ${stageColor(opp.stage)}40`,
              fontSize: '0.8rem',
              padding: '4px 10px'
            }}
          >
            {opp.stage}
          </span>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-secondary" onClick={() => setEditing(true)}>
            <Pencil size={15} /> Edit
          </button>
          <button className="btn btn-danger" onClick={() => setDeleting(true)}>
            <Trash2 size={15} /> Delete
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#ecad0a1a', color: '#ecad0a' }}>
            <DollarSign size={18} />
          </div>
          <div>
            <div className="stat-value">{formatCurrency(opp.value)}</div>
            <div className="stat-label">Deal Value</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#209dd71a', color: '#209dd7' }}>
            <Calendar size={18} />
          </div>
          <div>
            <div className="stat-value">{opp.close_date ? formatDate(opp.close_date) : '—'}</div>
            <div className="stat-label">Close Date</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#7539911a', color: '#753991' }}>
            <Building2 size={18} />
          </div>
          <div>
            <div className="stat-value">{opp.account_name || '—'}</div>
            <div className="stat-label">Account</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#16a34a1a', color: '#16a34a' }}>
            <User size={18} />
          </div>
          <div>
            <div className="stat-value">{opp.contact_name || '—'}</div>
            <div className="stat-label">Primary Contact</div>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="section-header">
        <h3 className="section-title">Activity Timeline ({opp.interactions.length})</h3>
        <button
          id="btn-log-interaction-opp"
          className="btn btn-primary btn-sm"
          onClick={() => setLogInteraction(true)}
        >
          Log Interaction
        </button>
      </div>
      <InteractionTimeline interactions={opp.interactions} onUpdate={load} />

      {editing && (
        <Modal title="Edit Deal" onClose={() => setEditing(false)}>
          <OpportunityForm initial={opp} onSubmit={handleEdit} onCancel={() => setEditing(false)} />
        </Modal>
      )}
      {deleting && (
        <Modal title="Delete Deal" onClose={() => setDeleting(false)}>
          <p>Are you sure you want to delete <strong>{opp.name}</strong>?</p>
          <div className="modal-footer" style={{ padding: '16px 0 0' }}>
            <button className="btn btn-secondary" onClick={() => setDeleting(false)}>Cancel</button>
            <button className="btn btn-danger" onClick={handleDelete}>Delete</button>
          </div>
        </Modal>
      )}
      {logInteraction && (
        <Modal title="Log Interaction" onClose={() => setLogInteraction(false)}>
          <InteractionForm
            opportunityId={Number(id)}
            onSubmit={() => { setLogInteraction(false); load() }}
            onCancel={() => setLogInteraction(false)}
          />
        </Modal>
      )}
    </div>
  )
}
