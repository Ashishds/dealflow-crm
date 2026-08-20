// Shared utility functions
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value)
}

export function stageColor(stage: string): string {
  const map: Record<string, string> = {
    New: '#64748b',
    Qualified: '#2563eb',
    Proposal: '#7c3aed',
    Negotiation: '#d97706',
    Won: '#16a34a',
    Lost: '#dc2626',
  }
  return map[stage] ?? '#64748b'
}

export function statusColor(status: string): string {
  const map: Record<string, string> = {
    prospect: '#64748b',
    qualified: '#2563eb',
    client: '#16a34a',
  }
  return map[status] ?? '#64748b'
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function formatRelative(iso: string | null | undefined): string {
  if (!iso) return '—'
  const diff = Date.now() - new Date(iso).getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days}d ago`
  if (days < 30) return `${Math.floor(days / 7)}w ago`
  if (days < 365) return `${Math.floor(days / 30)}mo ago`
  return `${Math.floor(days / 365)}y ago`
}

export function isOverdue(due_date: string | null | undefined): boolean {
  if (!due_date) return false
  return new Date(due_date) < new Date()
}
