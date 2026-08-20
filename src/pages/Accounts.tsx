import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, Pencil, Trash2, Building2, ExternalLink } from 'lucide-react'
import { accountsApi } from '../api'
import type { Account } from '../types'
import Modal from '../components/Modal'
import AccountForm from '../components/AccountForm'

export default function Accounts() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Account | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Account | null>(null)
  const navigate = useNavigate()

  const load = useCallback(async (q?: string) => {
    setLoading(true)
    try {
      const data = await accountsApi.list(q)
      setAccounts(data)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    const t = setTimeout(() => load(query || undefined), 250)
    return () => clearTimeout(t)
  }, [query, load])

  async function handleCreate(data: Partial<Account>) {
    await accountsApi.create(data)
    setShowForm(false)
    load(query || undefined)
  }

  async function handleEdit(data: Partial<Account>) {
    if (!editing) return
    await accountsApi.update(editing.id, data)
    setEditing(null)
    load(query || undefined)
  }

  async function handleDelete() {
    if (!deleteTarget) return
    await accountsApi.delete(deleteTarget.id)
    setDeleteTarget(null)
    load(query || undefined)
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2 className="page-title">Accounts</h2>
          <p className="page-subtitle">{accounts.length} companies</p>
        </div>
        <button
          id="btn-new-account"
          className="btn btn-primary"
          onClick={() => setShowForm(true)}
        >
          <Plus size={16} /> New Account
        </button>
      </div>

      {/* Search */}
      <div className="toolbar">
        <div className="search-box">
          <Search size={16} className="search-icon" />
          <input
            id="accounts-search"
            className="search-input"
            placeholder="Search accounts…"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div className="card table-card">
        {loading ? (
          <div className="empty-state"><span className="spinner" /></div>
        ) : accounts.length === 0 ? (
          <div className="empty-state">
            <Building2 size={40} className="empty-icon" />
            <p>No accounts found</p>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Company</th>
                <th>Industry</th>
                <th>Website</th>
                <th>Notes</th>
                <th style={{ width: 100 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map(acc => (
                <tr
                  key={acc.id}
                  className="table-row-clickable"
                  onClick={() => navigate(`/accounts/${acc.id}`)}
                >
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="avatar avatar-sm">
                        {acc.name.charAt(0)}
                      </div>
                      <strong>{acc.name}</strong>
                    </div>
                  </td>
                  <td>
                    {acc.industry
                      ? <span className="badge badge-neutral">{acc.industry}</span>
                      : <span className="text-muted">—</span>}
                  </td>
                  <td>
                    {acc.website ? (
                      <a
                        href={acc.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="link"
                        onClick={e => e.stopPropagation()}
                      >
                        <ExternalLink size={12} style={{ display: 'inline', marginRight: 4 }} />
                        {acc.website.replace(/^https?:\/\//, '')}
                      </a>
                    ) : <span className="text-muted">—</span>}
                  </td>
                  <td>
                    <span className="truncate-cell">{acc.notes || '—'}</span>
                  </td>
                  <td onClick={e => e.stopPropagation()}>
                    <div className="action-btns">
                      <button
                        className="btn btn-ghost btn-icon"
                        title="Edit"
                        onClick={() => setEditing(acc)}
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        className="btn btn-ghost btn-icon btn-danger"
                        title="Delete"
                        onClick={() => setDeleteTarget(acc)}
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

      {/* Create modal */}
      {showForm && (
        <Modal title="New Account" onClose={() => setShowForm(false)}>
          <AccountForm onSubmit={handleCreate} onCancel={() => setShowForm(false)} />
        </Modal>
      )}

      {/* Edit modal */}
      {editing && (
        <Modal title="Edit Account" onClose={() => setEditing(null)}>
          <AccountForm
            initial={editing}
            onSubmit={handleEdit}
            onCancel={() => setEditing(null)}
          />
        </Modal>
      )}

      {/* Delete confirmation */}
      {deleteTarget && (
        <Modal title="Delete Account" onClose={() => setDeleteTarget(null)}>
          <p>Are you sure you want to delete <strong>{deleteTarget.name}</strong>? This cannot be undone.</p>
          <div className="modal-footer" style={{ padding: '16px 0 0' }}>
            <button className="btn btn-secondary" onClick={() => setDeleteTarget(null)}>Cancel</button>
            <button className="btn btn-danger" onClick={handleDelete}>Delete</button>
          </div>
        </Modal>
      )}
    </div>
  )
}
