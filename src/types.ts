export interface Account {
  id: number;
  name: string;
  website: string | null;
  industry: string | null;
  notes: string | null;
  created_at: string;
}

export interface AccountDetail extends Account {
  people: Person[];
  opportunities: Opportunity[];
}

export type PersonStatus = 'prospect' | 'qualified' | 'client';

export interface Person {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  job_title: string | null;
  account_id: number | null;
  account_name: string | null;
  status: PersonStatus;
  created_at: string;
}

export interface PersonDetail extends Person {
  interactions: Interaction[];
}

export type OpportunityStage = 'New' | 'Qualified' | 'Proposal' | 'Negotiation' | 'Won' | 'Lost';

export const STAGES: OpportunityStage[] = ['New', 'Qualified', 'Proposal', 'Negotiation', 'Won', 'Lost'];

export interface Opportunity {
  id: number;
  name: string;
  account_id: number | null;
  account_name: string | null;
  contact_id: number | null;
  contact_name: string | null;
  stage: OpportunityStage;
  value: number;
  close_date: string | null;
  created_at: string;
}

export interface OpportunityDetail extends Opportunity {
  interactions: Interaction[];
}

export type InteractionType = 'note' | 'call' | 'email';

export interface Interaction {
  id: number;
  type: InteractionType;
  person_id: number | null;
  opportunity_id: number | null;
  person_name: string | null;
  opportunity_name: string | null;
  description: string;
  occurred_at: string;
  due_date: string | null;
  done: number; // 0 or 1
  created_at: string;
}

export interface MonthStats {
  month: string; // 'YYYY-MM'
  count: number;
  revenue: number;
}
