import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { accountsApi } from '../api'
import type { Person, Account } from '../types'

interface PersonFormProps {
  initial?: Partial<Person>
  onSubmit: (data: Partial<Person>) => Promise<void>
  onCancel: () => void
}

export default function PersonForm({ initial, onSubmit, onCancel }: PersonFormProps) {
  const [accounts, setAccounts] = useState<Account[]>([])
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Partial<Person>>({
    defaultValues: initial || {}
  })

  useEffect(() => {
    accountsApi.list().then(setAccounts)
  }, [])

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className="form-grid">
        <div className="form-group">
          <label className="form-label" htmlFor="p-name">Full Name *</label>
          <input
            id="p-name"
            className="input"
            placeholder="e.g. Sarah Mitchell"
            {...register('name', { required: 'Name is required' })}
          />
          {errors.name && <span className="form-error">{errors.name.message}</span>}
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="p-email">Email</label>
          <input
            id="p-email"
            type="email"
            className="input"
            placeholder="name@company.com"
            {...register('email')}
          />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="p-phone">Phone</label>
          <input
            id="p-phone"
            className="input"
            placeholder="+1-555-0100"
            {...register('phone')}
          />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="p-title">Job Title</label>
          <input
            id="p-title"
            className="input"
            placeholder="e.g. VP of Engineering"
            {...register('job_title')}
          />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="p-account">Account</label>
          <select id="p-account" className="input" {...register('account_id', { setValueAs: v => v === '' ? null : Number(v) })}>
            <option value="">— No Account —</option>
            {accounts.map(a => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="p-status">Status</label>
          <select id="p-status" className="input" {...register('status')}>
            <option value="prospect">Prospect</option>
            <option value="qualified">Qualified</option>
            <option value="client">Client</option>
          </select>
        </div>
      </div>
      <div className="modal-footer" style={{ padding: '16px 0 0' }}>
        <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
          {isSubmitting ? 'Saving…' : 'Save Person'}
        </button>
      </div>
    </form>
  )
}
