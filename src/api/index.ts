import type {
  Account, AccountDetail, Person, PersonDetail,
  Opportunity, OpportunityDetail, Interaction, MonthStats
} from '../types';

const BASE = '/api';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'Request failed');
  }
  return res.json();
}

// ── Accounts ───────────────────────────────────────────────
export const accountsApi = {
  list: (q?: string) =>
    request<Account[]>(`/accounts${q ? `?q=${encodeURIComponent(q)}` : ''}`),
  get: (id: number) =>
    request<AccountDetail>(`/accounts/${id}`),
  create: (data: Partial<Account>) =>
    request<Account>('/accounts', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: Partial<Account>) =>
    request<Account>(`/accounts/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: number) =>
    request<{ ok: boolean }>(`/accounts/${id}`, { method: 'DELETE' }),
};

// ── People ────────────────────────────────────────────────
export const peopleApi = {
  list: (q?: string, status?: string) => {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (status) params.set('status', status);
    const qs = params.toString();
    return request<Person[]>(`/people${qs ? `?${qs}` : ''}`);
  },
  get: (id: number) =>
    request<PersonDetail>(`/people/${id}`),
  create: (data: Partial<Person>) =>
    request<Person>('/people', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: Partial<Person>) =>
    request<Person>(`/people/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: number) =>
    request<{ ok: boolean }>(`/people/${id}`, { method: 'DELETE' }),
};

// ── Opportunities ─────────────────────────────────────────
export const opportunitiesApi = {
  list: (q?: string, stage?: string) => {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (stage) params.set('stage', stage);
    const qs = params.toString();
    return request<Opportunity[]>(`/opportunities${qs ? `?${qs}` : ''}`);
  },
  get: (id: number) =>
    request<OpportunityDetail>(`/opportunities/${id}`),
  create: (data: Partial<Opportunity>) =>
    request<Opportunity>('/opportunities', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: Partial<Opportunity>) =>
    request<Opportunity>(`/opportunities/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  updateStage: (id: number, stage: string) =>
    request<Opportunity>(`/opportunities/${id}/stage`, { method: 'PATCH', body: JSON.stringify({ stage }) }),
  delete: (id: number) =>
    request<{ ok: boolean }>(`/opportunities/${id}`, { method: 'DELETE' }),
  wonByMonth: () =>
    request<MonthStats[]>('/opportunities/stats/won-by-month'),
};

// ── Interactions ──────────────────────────────────────────
export const interactionsApi = {
  list: (filters?: { person_id?: number; opportunity_id?: number }) => {
    const params = new URLSearchParams();
    if (filters?.person_id) params.set('person_id', String(filters.person_id));
    if (filters?.opportunity_id) params.set('opportunity_id', String(filters.opportunity_id));
    const qs = params.toString();
    return request<Interaction[]>(`/interactions${qs ? `?${qs}` : ''}`);
  },
  recent: () =>
    request<Interaction[]>('/interactions/recent'),
  tasks: (done?: boolean) => {
    const qs = done !== undefined ? `?done=${done}` : '';
    return request<Interaction[]>(`/interactions/tasks${qs}`);
  },
  create: (data: Partial<Interaction>) =>
    request<Interaction>('/interactions', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: Partial<Interaction>) =>
    request<Interaction>(`/interactions/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  toggleDone: (id: number, done: boolean) =>
    request<Interaction>(`/interactions/${id}/done`, { method: 'PATCH', body: JSON.stringify({ done }) }),
  delete: (id: number) =>
    request<{ ok: boolean }>(`/interactions/${id}`, { method: 'DELETE' }),
};
