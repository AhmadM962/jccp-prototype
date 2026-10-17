// The ranked remediation list and the evidence requests are the engine's (CURRENT.ranking, src/lib/ranking.ts).
// What remains here is the NCSC-facing sector rollup, which is illustrative.

// National rollup (brief §7.9) — anonymised, NCSC-facing sector view.
// Distribution is over INTERVAL bands (not point estimates), segmented by assurance level.
export const nationalRollup = {
  sector: 'Defence, Security & Government Services',
  entitiesInScope: 47,
  submitted: 12,
  overdue: 8,
  kAnonymityFloor: 5,
  // each row: lower-bound band; split by how the evidence was established
  distribution: [
    { band: 'lower ≥ 80%', L1: 0, L2: 2, L3: 1 },
    { band: 'lower 70–80%', L1: 1, L2: 3, L3: 0 },
    { band: 'lower 55–70%', L1: 2, L2: 1, L3: 0 },
    { band: 'lower < 55%', L1: 2, L2: 0, L3: 0 },
    // one cell suppressed for k-anonymity
  ],
  mostFailedControls: [
    { id: 'JNCSF-435', description: 'MFA for privileged and non-privileged access', failingEntities: 9 },
    { id: 'JNCSF-307', description: 'Vulnerability scanning', failingEntities: 8 },
    { id: 'JNCSF-141', description: 'Timely removal of access rights', failingEntities: 7 },
    { id: 'JNCSF-30', description: 'Audit record generation', failingEntities: 7 },
    { id: 'JNCSF-407', description: 'Flaw remediation', failingEntities: 6 },
  ],
  imports: [
    { entity: 'Entity A-14', received: '2026-09-07 08:12', signature: 'verified', assurance: 'L2', note: '' },
    { entity: 'Entity A-31', received: '2026-09-07 09:40', signature: 'verified', assurance: 'L1', note: '' },
    { entity: 'Entity A-06', received: '2026-09-07 11:03', signature: 'rejected', assurance: '—', note: 'signature does not match published key — not ingested' },
    { entity: 'Entity A-22', received: '2026-09-08 07:55', signature: 'verified', assurance: 'L2', note: '' },
  ],
};
