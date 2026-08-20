import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, Pencil, Trash2, Users } from 'lucide-react'
import { peopleApi } from '../api'
import type { Person, PersonStatus } from '../types'
import Modal from '../components/Modal'
import PersonForm from '../components/PersonForm'

const STATUS_OPTIONS: { label: string; value: PersonStatus | '' }[] = [
  { label: 'All', value: '' },
  { label: 'Prospect', value: 'prospect' },
  { label: 'Qualified', value: 'qualified' },
  { label: 'Client', value: 'client' },
]

export default function People() {
  const [people, setPeople] = useState<Person[]>([])
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<PersonStatus | ''>('')
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Person | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Person | null>(null)
  const navigate = useNavigate()

  const load = useCallback(async (q?: string, s?: string) => {
    setLoading(true)
    try {
      const data = await peopleApi.list(q, s)
      setPeople(data)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    const t = setTimeout(() => load(query || undefined, statusFilter || undefined), 250)
    return () => clearTimeout(t)
  }, [query, statusFilter, load])

  async function handleCreate(data: Partial<Person>) {
    await peopleApi.create(data)
    setShowForm(false)
    load(query || undefined, statusFilter || undefined)
  }

  async function handleEdit(data: Partial<Person>) {
    if (!editing) return
    await peopleApi.update(editing.id, data)
    setEditing(null)
    load(query || undefined, statusFilter || undefined)
  }

  async function handleDelete() {
    if (!deleteTarget) return
    await peopleApi.delete(deleteTarget.id)
    setDeleteTarget(null)
    load(query || undefined, statusFilter || undefined)
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2 className="page-title">People</h2>
          <p className="page-subtitle">{people.length} contacts</p>
        </div>
        <button
          id="btn-new-person"
          className="btn btn-primary"
          onClick={() => setShowForm(true)}
        >
          <Plus size={16} /> New Person
        </button>
      </div>

      {/* Toolbar */}
      <div className="toolbar">
        <div className="search-box">
          <Search size={16} className="search-icon" />
          <input
            id="people-search"
            className="search-input"
            placeholder="Search by name or email…"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
        </div>
        <div className="filter-tabs">
          {STATUS_OPTIONS.map(opt => (
            <button
              key={opt.value}
              className={`filter-tab ${statusFilter === opt.value ? 'active' : ''}`}
              onClick={() => setStatusFilter(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="card table-card">
        {loading ? (
          <div className="empty-state"><span className="spinner" /></div>
        ) : people.length === 0 ? (
          <div className="empty-state">
            <Users size={40} className="empty-icon" />
            <p>No people found</p>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Title</th>
                <th>Account</th>
                <th>Email</th>
                <th>Status</th>
                <th style={{ width: 100 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {people.map(person => (
                <tr
                  key={person.id}
                  className="table-row-clickable"
                  onClick={() => navigate(`/people/${person.id}`)}
                >
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="avatar avatar-sm">{person.name.charAt(0)}</div>
                      <strong>{person.name}</strong>
                    </div>
                  </td>
                  <td>{person.job_title || <span className="text-muted">—</span>}</td>
                  <td>
                    {person.account_name
                      ? <span className="badge badge-neutral">{person.account_name}</span>
                      : <span className="text-muted">—</span>}
                  </td>
                  <td>{person.email || <span className="text-muted">—</span>}</td>
                  <td>
                    <span className={`badge badge-status badge-${person.status}`}>
                      {person.status}
                    </span>
                  </td>
                  <td onClick={e => e.stopPropagation()}>
                    <div className="action-btns">
                      <button
                        className="btn btn-ghost btn-icon"
                        title="Edit"
                        onClick={() => setEditing(person)}
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        className="btn btn-ghost btn-icon btn-danger"
                        title="Delete"
                        onClick={() => setDeleteTarget(person)}
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

      {/* Modals */}
      {showForm && (
        <Modal title="New Person" onClose={() => setShowForm(false)}>
          <PersonForm onSubmit={handleCreate} onCancel={() => setShowForm(false)} />
        </Modal>
      )}

      {editing && (
        <Modal title="Edit Person" onClose={() => setEditing(null)}>
          <PersonForm
            initial={editing}
            onSubmit={handleEdit}
            onCancel={() => setEditing(null)}
          />
        </Modal>
      )}

      {deleteTarget && (
        <Modal title="Delete Person" onClose={() => setDeleteTarget(null)}>
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
