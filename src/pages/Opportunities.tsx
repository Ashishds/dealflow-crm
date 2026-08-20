import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, Pencil, Trash2, TrendingUp } from 'lucide-react'
import { opportunitiesApi } from '../api'
import type { Opportunity, OpportunityStage } from '../types'
import { STAGES } from '../types'
import Modal from '../components/Modal'
import OpportunityForm from '../components/OpportunityForm'
import { formatCurrency, stageColor, formatDate } from '../utils'

const STAGE_OPTIONS: { label: string; value: OpportunityStage | '' }[] = [
  { label: 'All', value: '' },
  ...STAGES.map(s => ({ label: s, value: s as OpportunityStage })),
]

export default function Opportunities() {
  const [opps, setOpps] = useState<Opportunity[]>([])
  const [query, setQuery] = useState('')
  const [stageFilter, setStageFilter] = useState<OpportunityStage | ''>('')
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Opportunity | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Opportunity | null>(null)
  const navigate = useNavigate()

  const load = useCallback(async (q?: string, s?: string) => {
    setLoading(true)
    try {
      const data = await opportunitiesApi.list(q, s)
      setOpps(data)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    const t = setTimeout(() => load(query || undefined, stageFilter || undefined), 250)
    return () => clearTimeout(t)
  }, [query, stageFilter, load])

  async function handleCreate(data: Partial<Opportunity>) {
    await opportunitiesApi.create(data)
    setShowForm(false)
    load(query || undefined, stageFilter || undefined)
  }

  async function handleEdit(data: Partial<Opportunity>) {
    if (!editing) return
    await opportunitiesApi.update(editing.id, data)
    setEditing(null)
    load(query || undefined, stageFilter || undefined)
  }

  async function handleDelete() {
    if (!deleteTarget) return
    await opportunitiesApi.delete(deleteTarget.id)
    setDeleteTarget(null)
    load(query || undefined, stageFilter || undefined)
  }

  const totalValue = opps.reduce((s, o) => s + o.value, 0)

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2 className="page-title">Opportunities</h2>
          <p className="page-subtitle">{opps.length} deals · {formatCurrency(totalValue)} pipeline</p>
        </div>
        <button
          id="btn-new-opportunity"
          className="btn btn-primary"
          onClick={() => setShowForm(true)}
        >
          <Plus size={16} /> New Deal
        </button>
      </div>

      <div className="toolbar">
        <div className="search-box">
          <Search size={16} className="search-icon" />
          <input
            id="opps-search"
            className="search-input"
            placeholder="Search deals…"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
        </div>
        <div className="filter-tabs">
          {STAGE_OPTIONS.map(opt => (
            <button
              key={opt.value}
              className={`filter-tab ${stageFilter === opt.value ? 'active' : ''}`}
              onClick={() => setStageFilter(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="card table-card">
        {loading ? (
          <div className="empty-state"><span className="spinner" /></div>
        ) : opps.length === 0 ? (
          <div className="empty-state">
            <TrendingUp size={40} className="empty-icon" />
            <p>No deals found</p>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Deal</th>
                <th>Account</th>
                <th>Contact</th>
                <th>Stage</th>
                <th>Value</th>
                <th>Close Date</th>
                <th style={{ width: 100 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {opps.map(opp => (
                <tr
                  key={opp.id}
                  className="table-row-clickable"
                  onClick={() => navigate(`/opportunities/${opp.id}`)}
                >
                  <td><strong>{opp.name}</strong></td>
                  <td>{opp.account_name || <span className="text-muted">—</span>}</td>
                  <td>{opp.contact_name || <span className="text-muted">—</span>}</td>
                  <td>
                    <span
                      className="badge"
                      style={{ background: stageColor(opp.stage) + '1a', color: stageColor(opp.stage), border: `1px solid ${stageColor(opp.stage)}40` }}
                    >
                      {opp.stage}
                    </span>
                  </td>
                  <td><strong>{formatCurrency(opp.value)}</strong></td>
                  <td>{formatDate(opp.close_date)}</td>
                  <td onClick={e => e.stopPropagation()}>
                    <div className="action-btns">
                      <button
                        className="btn btn-ghost btn-icon"
                        title="Edit"
                        onClick={() => setEditing(opp)}
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        className="btn btn-ghost btn-icon btn-danger"
                        title="Delete"
                        onClick={() => setDeleteTarget(opp)}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showForm && (
        <Modal title="New Deal" onClose={() => setShowForm(false)}>
          <OpportunityForm onSubmit={handleCreate} onCancel={() => setShowForm(false)} />
        </Modal>
      )}
      {editing && (
        <Modal title="Edit Deal" onClose={() => setEditing(null)}>
          <OpportunityForm
            initial={editing}
            onSubmit={handleEdit}
            onCancel={() => setEditing(null)}
          />
        </Modal>
      )}
      {deleteTarget && (
        <Modal title="Delete Deal" onClose={() => setDeleteTarget(null)}>
          <p>Are you sure you want to delete <strong>{deleteTarget.name}</strong>?</p>
          <div className="modal-footer" style={{ padding: '16px 0 0' }}>
            <button className="btn btn-secondary" onClick={() => setDeleteTarget(null)}>Cancel</button>
            <button className="btn btn-danger" onClick={handleDelete}>Delete</button>
          </div>
        </Modal>
      )}
    </div>
  )
}
