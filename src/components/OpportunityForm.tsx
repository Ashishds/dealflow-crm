import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { accountsApi, peopleApi } from '../api'
import type { Opportunity, Account, Person } from '../types'
import { STAGES } from '../types'

interface OpportunityFormProps {
  initial?: Partial<Opportunity>
  onSubmit: (data: Partial<Opportunity>) => Promise<void>
  onCancel: () => void
}

export default function OpportunityForm({ initial, onSubmit, onCancel }: OpportunityFormProps) {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [people, setPeople] = useState<Person[]>([])
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Partial<Opportunity>>({
    defaultValues: initial
      ? {
          ...initial,
          close_date: initial.close_date ? initial.close_date.slice(0, 10) : undefined,
        }
      : { stage: 'New', value: 0 }
  })

  useEffect(() => {
    accountsApi.list().then(setAccounts)
    peopleApi.list().then(setPeople)
  }, [])

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className="form-grid">
        <div className="form-group" style={{ gridColumn: '1 / -1' }}>
          <label className="form-label" htmlFor="opp-name">Deal Name *</label>
          <input
            id="opp-name"
            className="input"
            placeholder="e.g. Enterprise Suite — Acme"
            {...register('name', { required: 'Deal name is required' })}
          />
          {errors.name && <span className="form-error">{errors.name.message}</span>}
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="opp-account">Account</label>
          <select id="opp-account" className="input" {...register('account_id', { setValueAs: v => v === '' ? null : Number(v) })}>
            <option value="">— No Account —</option>
            {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="opp-contact">Primary Contact</label>
          <select id="opp-contact" className="input" {...register('contact_id', { setValueAs: v => v === '' ? null : Number(v) })}>
            <option value="">— No Contact —</option>
            {people.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="opp-stage">Stage</label>
          <select id="opp-stage" className="input" {...register('stage')}>
            {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="opp-value">Value (USD)</label>
          <input
            id="opp-value"
            type="number"
            min={0}
            step={1000}
            className="input"
            placeholder="0"
            {...register('value', { valueAsNumber: true })}
          />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="opp-close">Close Date</label>
          <input
            id="opp-close"
            type="date"
            className="input"
            {...register('close_date')}
          />
        </div>
      </div>
      <div className="modal-footer" style={{ padding: '16px 0 0' }}>
        <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
          {isSubmitting ? 'Saving…' : 'Save Deal'}
        </button>
      </div>
    </form>
  )
}
