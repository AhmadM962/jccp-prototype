// Scoped-link metadata for the respondent view. Demo-only: no real accounts, and the link goes nowhere.
// (The interview review queue, the conflict flag and the contributor task list that used to sit here described people
// and findings that are not in the assessment; the testimony view and the task list are derived from it now.)

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
