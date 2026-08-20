import { useForm } from 'react-hook-form'
import type { Account } from '../types'

interface AccountFormProps {
  initial?: Partial<Account>
  onSubmit: (data: Partial<Account>) => Promise<void>
  onCancel: () => void
}

export default function AccountForm({ initial, onSubmit, onCancel }: AccountFormProps) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Partial<Account>>({
    defaultValues: initial || {}
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className="form-grid">
        <div className="form-group">
          <label className="form-label" htmlFor="acc-name">Company Name *</label>
          <input
            id="acc-name"
            className="input"
            placeholder="e.g. Apex Technologies"
            {...register('name', { required: 'Company name is required' })}
          />
          {errors.name && <span className="form-error">{errors.name.message}</span>}
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="acc-website">Website</label>
          <input
            id="acc-website"
            className="input"
            placeholder="https://example.com"
            {...register('website')}
          />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="acc-industry">Industry</label>
          <input
            id="acc-industry"
            className="input"
            placeholder="e.g. Software, Healthcare"
            {...register('industry')}
          />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="acc-notes">Notes</label>
          <textarea
            id="acc-notes"
            className="input"
            rows={3}
            placeholder="Internal notes about this account..."
            style={{ resize: 'vertical' }}
            {...register('notes')}
          />
        </div>
      </div>
      <div className="modal-footer" style={{ padding: '16px 0 0' }}>
        <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
          {isSubmitting ? 'Saving…' : 'Save Account'}
        </button>
      </div>
    </form>
  )
}
