import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, User, Pencil, Trash2 } from 'lucide-react'
import { peopleApi } from '../api'
import type { PersonDetail as PersonDetailType } from '../types'
import Modal from '../components/Modal'
import PersonForm from '../components/PersonForm'
import InteractionTimeline from '../components/InteractionTimeline'
import InteractionForm from '../components/InteractionForm'

export default function PersonDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [person, setPerson] = useState<PersonDetailType | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [logInteraction, setLogInteraction] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const data = await peopleApi.get(Number(id))
      setPerson(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [id])

  async function handleEdit(data: Partial<PersonDetailType>) {
    await peopleApi.update(Number(id), data)
    setEditing(false)
    load()
  }

  async function handleDelete() {
    await peopleApi.delete(Number(id))
    navigate('/people')
  }

  if (loading) return <div className="page"><div className="empty-state"><span className="spinner" /></div></div>
  if (!person) return <div className="page"><div className="empty-state">Person not found.</div></div>

  return (
    <div className="page">
      <div className="page-header">
        <div className="flex items-center gap-3">
          <button className="btn btn-ghost btn-icon" onClick={() => navigate('/people')}>
            <ArrowLeft size={18} />
          </button>
          <div className="avatar">{person.name.charAt(0)}</div>
          <div>
            <h2 className="page-title">{person.name}</h2>
            <p className="page-subtitle">{person.job_title || 'No title'}</p>
          </div>
          <span className={`badge badge-status badge-${person.status}`}>{person.status}</span>
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

      <div className="detail-grid">
        <div className="card detail-card">
          <h3 className="detail-section-title"><User size={16} /> Contact Info</h3>
          <div className="detail-rows">
            <div className="detail-row">
              <span className="detail-label">Email</span>
              <span className="detail-value">
                {person.email
                  ? <a href={`mailto:${person.email}`} className="link">{person.email}</a>
                  : '—'}
              </span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Phone</span>
              <span className="detail-value">{person.phone || '—'}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Account</span>
              <span className="detail-value">
                {person.account_name && person.account_id
                  ? <a href={`/accounts/${person.account_id}`} className="link">{person.account_name}</a>
                  : '—'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Interaction timeline */}
      <div className="section-header">
        <h3 className="section-title">Activity Timeline ({person.interactions.length})</h3>
        <button
          id="btn-log-interaction-person"
          className="btn btn-primary btn-sm"
          onClick={() => setLogInteraction(true)}
        >
          Log Interaction
        </button>
      </div>
      <InteractionTimeline
        interactions={person.interactions}
        onUpdate={load}
      />

      {/* Modals */}
      {editing && (
        <Modal title="Edit Person" onClose={() => setEditing(false)}>
          <PersonForm initial={person} onSubmit={handleEdit} onCancel={() => setEditing(false)} />
        </Modal>
      )}
      {deleting && (
        <Modal title="Delete Person" onClose={() => setDeleting(false)}>
          <p>Are you sure you want to delete <strong>{person.name}</strong>?</p>
          <div className="modal-footer" style={{ padding: '16px 0 0' }}>
            <button className="btn btn-secondary" onClick={() => setDeleting(false)}>Cancel</button>
            <button className="btn btn-danger" onClick={handleDelete}>Delete</button>
          </div>
        </Modal>
      )}
      {logInteraction && (
        <Modal title="Log Interaction" onClose={() => setLogInteraction(false)}>
          <InteractionForm
            personId={Number(id)}
            onSubmit={() => { setLogInteraction(false); load() }}
            onCancel={() => setLogInteraction(false)}
          />
        </Modal>
      )}
    </div>
  )
}
