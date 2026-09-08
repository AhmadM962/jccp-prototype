// Ranked remediation actions and the "what you didn't provide" evidence-request list
// (brief §7.8).

export interface RemediationAction {
  id: string;
  action: string;
  controlsClosed: number;
  controlIds: string[];
  removesExposureTo: string[]; // ATT&CK technique IDs
  effort: 'low' | 'medium' | 'high';
  affectedAssets: string;
}

export const remediationPlan: RemediationAction[] = [
  {
    id: 'rem-mfa',
    action: 'Enforce MFA on all privileged accounts',
    controlsClosed: 11,
    controlIds: ['JNCSF-102', 'JNCSF-435', 'JNCSF-440', 'JNCSF-107', 'JNCSF-116'],
    removesExposureTo: ['T1110', 'T1078', 'T1550'],
    effort: 'medium',
    affectedAssets: '43 privileged accounts',
  },
  {
    id: 'rem-audit',
    action: 'Enable the 3 missing audit subcategories via GPO (Object Access, Process Creation)',
    controlsClosed: 9,
    controlIds: ['JNCSF-30', 'JNCSF-167', 'JNCSF-173', 'JNCSF-179'],
    removesExposureTo: ['T1070', 'T1562'],
    effort: 'low',
    affectedAssets: '38 servers, 400 endpoints (GPO-wide)',
  },
  {
    id: 'rem-patch',
    action: 'Bring patch SLA adherence to policy on internet-facing hosts',
    controlsClosed: 7,
    controlIds: ['JNCSF-307', 'JNCSF-407', 'JNCSF-32'],
    removesExposureTo: ['T1190'],
    effort: 'high',
    affectedAssets: '14 internet-facing services, 22 servers with overdue patches',
  },
  {
    id: 'rem-leavers',
    action: 'Automate the leavers feed from HR to identity for same-day de-provisioning',
    controlsClosed: 6,
    controlIds: ['JNCSF-141', 'JNCSF-515', 'JNCSF-139'],
    removesExposureTo: ['T1078', 'T1098'],
    effort: 'medium',
    affectedAssets: '17 orphaned accounts, HR↔IdP integration',
  },
  {
    id: 'rem-usb',
    action: 'Deploy removable-media authorization policy to all workstations',
    controlsClosed: 4,
    controlIds: ['JNCSF-163', 'JNCSF-105'],
    removesExposureTo: ['T1200'],
    effort: 'low',
    affectedAssets: '400 endpoints',
  },
  {
    id: 'rem-edr',
    action: 'Switch workstation EDR from detect-only to block; close contractor exception',
    controlsClosed: 4,
    controlIds: ['JNCSF-394', 'JNCSF-87'],
    removesExposureTo: ['T1204', 'T1566'],
    effort: 'medium',
    affectedAssets: '~320 workstations, 71 contractor machines',
  },
];

export interface EvidenceRequest {
  id: string;
  artifact: string;
  source: string;
  controlsUnlocked: number;
  command: string;
}

// `controlsUnlocked` = how many currently-Unknown controls this artifact would make
// *known* (pass or fail). The band narrowing is derived from this via projectProvision,
// never stored — see lib/scoring.ts.
export const evidenceRequests: EvidenceRequest[] = [
  { id: 'req-siem', artifact: 'SIEM log source inventory + retention', source: 'SIEM', controlsUnlocked: 8, command: 'Export source list + retention settings from the SIEM admin console' },
  { id: 'req-linux', artifact: 'Linux hardening baseline (CIS)', source: 'Linux servers', controlsUnlocked: 18, command: 'oscap xccdf eval --profile cis --results cis-results.xml ssg-rhel8-ds.xml' },
  { id: 'req-priv', artifact: 'Re-run identity module with endpoint read permission', source: 'Active Directory', controlsUnlocked: 14, command: 'Grant the collector service account "Read" on the endpoint OU, then re-run collector --module endpoint' },
  { id: 'req-backup', artifact: 'Backup job report + restore test log', source: 'Backup system', controlsUnlocked: 5, command: 'Export last 30 days job status from the backup console' },
  { id: 'req-lms', artifact: 'Security awareness completion export', source: 'LMS', controlsUnlocked: 4, command: 'Export completion CSV from the LMS reporting module' },
];

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
