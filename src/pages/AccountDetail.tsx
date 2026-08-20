import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'

import { ArrowLeft, Building2, Users, TrendingUp, Pencil, Trash2 } from 'lucide-react'
import { accountsApi } from '../api'
import type { AccountDetail as AccountDetailType } from '../types'
import Modal from '../components/Modal'
import AccountForm from '../components/AccountForm'
import { formatCurrency, stageColor } from '../utils'

export default function AccountDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [account, setAccount] = useState<AccountDetailType | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const data = await accountsApi.get(Number(id))
      setAccount(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [id])

  async function handleEdit(data: Parameters<typeof accountsApi.update>[1]) {
    await accountsApi.update(Number(id), data)
    setEditing(false)
    load()
  }

  async function handleDelete() {
    await accountsApi.delete(Number(id))
    navigate('/accounts')
  }

  if (loading) return <div className="page"><div className="empty-state"><span className="spinner" /></div></div>
  if (!account) return <div className="page"><div className="empty-state">Account not found.</div></div>

  return (
    <div className="page">
      <div className="page-header">
        <div className="flex items-center gap-3">
          <button className="btn btn-ghost btn-icon" onClick={() => navigate('/accounts')}>
            <ArrowLeft size={18} />
          </button>
          <div className="avatar">{account.name.charAt(0)}</div>
          <div>
            <h2 className="page-title">{account.name}</h2>
            <p className="page-subtitle">{account.industry || 'No industry'}</p>
          </div>
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

      {/* Info cards */}
      <div className="detail-grid">
        <div className="card detail-card">
          <h3 className="detail-section-title">
            <Building2 size={16} /> Account Info
          </h3>
          <div className="detail-rows">
            <div className="detail-row">
              <span className="detail-label">Website</span>
              <span className="detail-value">
                {account.website
                  ? <a href={account.website} target="_blank" rel="noopener noreferrer" className="link">{account.website}</a>
                  : '—'}
              </span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Industry</span>
              <span className="detail-value">{account.industry || '—'}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Notes</span>
              <span className="detail-value">{account.notes || '—'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* People */}
      <div className="section-header">
        <h3 className="section-title"><Users size={16} /> People ({account.people.length})</h3>
      </div>
      <div className="card table-card">
        {account.people.length === 0 ? (
          <div className="empty-state-small">No people linked</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Title</th>
                <th>Email</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {account.people.map(p => (
                <tr key={p.id} className="table-row-clickable" onClick={() => navigate(`/people/${p.id}`)}>
                  <td><strong>{p.name}</strong></td>
                  <td>{p.job_title || '—'}</td>
                  <td>{p.email || '—'}</td>
                  <td><span className={`badge badge-status badge-${p.status}`}>{p.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Opportunities */}
      <div className="section-header">
        <h3 className="section-title"><TrendingUp size={16} /> Deals ({account.opportunities.length})</h3>
      </div>
      <div className="card table-card">
        {account.opportunities.length === 0 ? (
          <div className="empty-state-small">No deals linked</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Deal</th>
                <th>Stage</th>
                <th>Value</th>
                <th>Close Date</th>
              </tr>
            </thead>
            <tbody>
              {account.opportunities.map((opp: any) => (
                <tr key={opp.id} className="table-row-clickable" onClick={() => navigate(`/opportunities/${opp.id}`)}>
                  <td><strong>{opp.name}</strong></td>
                  <td>
                    <span className="badge" style={{ background: stageColor(opp.stage) + '20', color: stageColor(opp.stage) }}>
                      {opp.stage}
                    </span>
                  </td>
                  <td>{formatCurrency(opp.value)}</td>
                  <td>{opp.close_date ? opp.close_date.slice(0, 10) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Edit modal */}
      {editing && (
        <Modal title="Edit Account" onClose={() => setEditing(false)}>
          <AccountForm initial={account} onSubmit={handleEdit} onCancel={() => setEditing(false)} />
        </Modal>
      )}

      {/* Delete confirmation */}
      {deleting && (
        <Modal title="Delete Account" onClose={() => setDeleting(false)}>
          <p>Are you sure you want to delete <strong>{account.name}</strong>?</p>
          <div className="modal-footer" style={{ padding: '16px 0 0' }}>
            <button className="btn btn-secondary" onClick={() => setDeleting(false)}>Cancel</button>
            <button className="btn btn-danger" onClick={handleDelete}>Delete</button>
          </div>
        </Modal>
      )}
    </div>
  )
}
