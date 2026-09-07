// Multi-user collaboration fixtures: the interview review queue, contributor task list,
// and scoped-link metadata. Demo-only — no real accounts.

export type ReviewStatus = 'not started' | 'in progress' | 'submitted' | 'under review' | 'accepted';

export interface ReviewRow {
  roleId: string; // interview role id
  roleTitle: string;
  assignee: string;
  status: ReviewStatus;
  submittedAt?: string;
  conflict?: string;
}

export const reviewQueue: ReviewRow[] = [
  { roleId: 'exec', roleTitle: 'Executive / Compliance', assignee: 'D. Haddad (Governance)', status: 'accepted', submittedAt: '2026-09-03' },
  { roleId: 'operator', roleTitle: 'Infrastructure / Operator', assignee: 'M. Qasem (Ops)', status: 'under review', submittedAt: '2026-09-04' },
  { roleId: 'defender', roleTitle: 'Defender / SOC', assignee: 'R. Nabulsi (SOC)', status: 'submitted', submittedAt: '2026-09-05' },
];

export const CONFLICT_FLAG = {
  summary: 'Executive and Operator disagree on MFA enforcement scope',
  detail:
    'Executive stated MFA is enforced for all privileged access. Operator stated rollout is partial (43 accounts outstanding). Operator wins on configuration facts per the trust ordering — machine evidence later confirmed 43 privileged accounts without MFA.',
};

export interface ScopedLink {
  roleId: string;
  token: string;
  scopeLabel: string;
  expiresInDays: number;
}

export const scopedLinkFor = (roleId: string, scopeLabel: string): ScopedLink => ({
  roleId,
  token: Math.random().toString(16).slice(2, 8),
  scopeLabel,
  expiresInDays: 7,
});

// Contributor task list (the Contributor role's home screen).
export interface ContributorTask {
  id: string;
  title: string;
  artifact: string;
  due: string;
  status: 'to do' | 'submitted' | 'accepted' | 'changes requested';
  note?: string;
}

export const contributorTasks: ContributorTask[] = [
  { id: 't1', title: 'Export privileged group membership from AD', artifact: 'Privileged group membership', due: '2026-09-10', status: 'accepted' },
  { id: 't2', title: 'Export SIEM log source inventory + retention', artifact: 'SIEM log source inventory', due: '2026-09-11', status: 'changes requested', note: 'Retention column missing — re-export with retention days per source.' },
  { id: 't3', title: 'Export EDR agent inventory as CSV', artifact: 'EDR agent inventory', due: '2026-09-11', status: 'submitted' },
  { id: 't4', title: 'Provide the current IR plan and last tabletop record', artifact: 'Incident response plan + exercise record', due: '2026-09-14', status: 'to do' },
  { id: 't5', title: 'Export firewall running configuration', artifact: 'Firewall rule base', due: '2026-09-14', status: 'to do' },
];
