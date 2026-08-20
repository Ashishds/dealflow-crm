import { useForm } from 'react-hook-form'
import { interactionsApi } from '../api'
import type { Interaction } from '../types'

interface InteractionFormProps {
  personId?: number
  opportunityId?: number
  onSubmit: () => void
  onCancel: () => void
}

export default function InteractionForm({ personId, opportunityId, onSubmit, onCancel }: InteractionFormProps) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Partial<Interaction>>({
    defaultValues: {
      type: 'note',
      occurred_at: new Date().toISOString().slice(0, 16),
    }
  })

  async function submit(data: Partial<Interaction>) {
    await interactionsApi.create({
      ...data,
      person_id: personId ?? null,
      opportunity_id: opportunityId ?? null,
    })
    onSubmit()
  }

  return (
    <form onSubmit={handleSubmit(submit)} noValidate>
      <div className="form-grid">
        <div className="form-group">
          <label className="form-label" htmlFor="int-type">Type</label>
          <select id="int-type" className="input" {...register('type')}>
            <option value="note">📝 Note</option>
            <option value="call">📞 Call</option>
            <option value="email">✉️ Email</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="int-occurred">Date</label>
          <input
            id="int-occurred"
            type="datetime-local"
            className="input"
            {...register('occurred_at')}
          />
        </div>
        <div className="form-group" style={{ gridColumn: '1 / -1' }}>
          <label className="form-label" htmlFor="int-desc">Description *</label>
          <textarea
            id="int-desc"
            className="input"
            rows={4}
            placeholder="What happened? What was discussed or decided?"
            style={{ resize: 'vertical' }}
            {...register('description', { required: 'Description is required' })}
          />
          {errors.description && <span className="form-error">{errors.description.message}</span>}
        </div>
        <div className="form-group" style={{ gridColumn: '1 / -1' }}>
          <label className="form-label" htmlFor="int-due">
            Follow-up Due Date <span className="text-muted">(optional — makes this a task)</span>
          </label>
          <input
            id="int-due"
            type="date"
            className="input"
            {...register('due_date')}
          />
        </div>
      </div>
      <div className="modal-footer" style={{ padding: '16px 0 0' }}>
        <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
          {isSubmitting ? 'Saving…' : 'Log Interaction'}
        </button>
      </div>
    </form>
  )
}
