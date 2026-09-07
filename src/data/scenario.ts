// The demo organisation, evidence request plan, and module execution ledger (brief §6, §7.2, §7.3).

export interface OrgProfile {
  orgName: string;
  sector: string;
  sizeBand: string;
  endpoints: number;
  servers: number;
  hasOperationalTech: boolean;
  usesCloud: boolean;
  crossBorderCloud: boolean;
  inHouseDevelopment: boolean;
  hasSOC: boolean;
  byodPermitted: boolean;
  pdplHoldings: {
    health: boolean;
    biometric: boolean;
    financial: boolean;
    religiousOrPolitical: boolean;
  };
}

export const defaultProfile: OrgProfile = {
  orgName: 'Ministry of Digital Services',
  sector: 'Government',
  sizeBand: '250–1000 staff',
  endpoints: 400,
  servers: 38,
  hasOperationalTech: false,
  usesCloud: true,
  crossBorderCloud: false,
  inHouseDevelopment: false,
  hasSOC: true,
  byodPermitted: false,
  pdplHoldings: {
    health: true,
    biometric: false,
    financial: false,
    religiousOrPolitical: false,
  },
};

// Denominator model: baseline applicable when the default profile is set.
export const BASELINE_APPLICABLE = 340;
export const TOTAL_CONTROLS = 576;

// How each toggle shifts the applicable-control denominator (demo approximation).
export const PROFILE_DELTAS: { key: keyof OrgProfile; whenTrue: number; label: string }[] = [
  { key: 'hasOperationalTech', whenTrue: 41, label: 'Operational technology in scope' },
  { key: 'usesCloud', whenTrue: 0, label: 'Cloud services used' },
  { key: 'crossBorderCloud', whenTrue: 12, label: 'Cross-border cloud processing' },
  { key: 'inHouseDevelopment', whenTrue: 49, label: 'In-house software development' },
  { key: 'hasSOC', whenTrue: 0, label: 'Security operations centre' },
  { key: 'byodPermitted', whenTrue: 8, label: 'BYOD permitted' },
];

// When usesCloud is FALSE we subtract the cloud-conditional controls from the denominator.
export const CLOUD_CONDITIONAL_CONTROLS = 23;

export function computeApplicable(p: OrgProfile): number {
  let n = BASELINE_APPLICABLE;
  if (p.hasOperationalTech) n += 41;
  if (!p.usesCloud) n -= CLOUD_CONDITIONAL_CONTROLS;
  if (p.crossBorderCloud) n += 12;
  if (p.inHouseDevelopment) n += 49;
  if (p.byodPermitted) n += 8;
  return n;
}

// ─── Evidence Request Plan (brief §7.2) ────────────────────────────────────────

export interface RequestArtifact {
  artifact: string;
  source: string;
  controlsUnlocked: number;
  effort: string;
  command: string;
  /** projected interval narrowing in points if provided (brief §7.8 Tab B) */
  narrowingPts: number;
}

export const REQUEST_PLAN_SUMMARY = {
  artifactCount: 22,
  systemCount: 6,
  applicable: 340,
};

export const requestPlan: RequestArtifact[] = [
  { artifact: 'All accounts + state', source: 'Active Directory', controlsUnlocked: 22, effort: '3 min', command: 'Get-ADUser -Filter * -Properties Enabled,PasswordLastSet,LastLogonDate | Export-Csv accounts.csv', narrowingPts: 9.4 },
  { artifact: 'Linux hardening baseline', source: 'Linux servers', controlsUnlocked: 18, effort: '10 min', command: 'oscap xccdf eval --profile cis --results cis-results.xml /usr/share/xml/scap/ssg/content/ssg-rhel8-ds.xml', narrowingPts: 6.1 },
  { artifact: 'Privileged group membership', source: 'Active Directory', controlsUnlocked: 14, effort: '2 min', command: 'Get-ADGroupMember "Domain Admins" | Export-Csv adm.csv', narrowingPts: 5.7 },
  { artifact: 'EDR agent inventory', source: 'EDR console', controlsUnlocked: 11, effort: '5 min', command: 'Export agent list as CSV from the EDR console (Hosts → Manage → Export)', narrowingPts: 4.3 },
  { artifact: 'Audit policy configuration', source: 'Windows', controlsUnlocked: 9, effort: '1 min', command: 'auditpol /get /category:* > auditpol.txt', narrowingPts: 3.9 },
  { artifact: 'SIEM log source inventory', source: 'SIEM', controlsUnlocked: 8, effort: '5 min', command: 'Export source list + retention settings from the SIEM admin console', narrowingPts: 8.2 },
  { artifact: 'Defender status', source: 'Windows endpoints', controlsUnlocked: 7, effort: '2 min', command: 'Get-MpComputerStatus | Select-Object AMRunningMode,AntivirusSignatureAge,RealTimeProtectionEnabled', narrowingPts: 3.1 },
  { artifact: 'Backup job report', source: 'Backup system', controlsUnlocked: 5, effort: '3 min', command: 'Export last 30 days job status from the backup console', narrowingPts: 2.4 },
  { artifact: 'BitLocker state', source: 'Windows endpoints', controlsUnlocked: 4, effort: '2 min', command: 'manage-bde -status', narrowingPts: 1.9 },
  { artifact: 'Security awareness completion', source: 'LMS', controlsUnlocked: 4, effort: '3 min', command: 'Export completion CSV from the LMS reporting module', narrowingPts: 1.6 },
];

// ─── Module execution ledger (brief §7.3) ─────────────────────────────────────

export type ModuleStatus = 'success' | 'partial' | 'failed' | 'declined';

export interface ModuleResult {
  module: string;
  status: ModuleStatus;
  detail: string;
  records?: number;
  /** may this module produce a negative (Red) finding? only when status === 'success' */
  negativeCapable: boolean;
}

export const moduleLedger: ModuleResult[] = [
  { module: 'identity', status: 'success', detail: 'identity.json parsed — 1,842 records', records: 1842, negativeCapable: true },
  { module: 'endpoint', status: 'partial', detail: 'insufficient permission — 12 of 400 hosts readable', records: 12, negativeCapable: false },
  { module: 'logging', status: 'failed', detail: 'wineventlog_access_denied', negativeCapable: false },
  { module: 'cloud', status: 'declined', detail: 'declined by client at collection time', negativeCapable: false },
  { module: 'configuration', status: 'success', detail: 'GPO + registry baseline parsed — 214 objects', records: 214, negativeCapable: true },
  { module: 'vulnerability', status: 'success', detail: 'scanner export parsed — 3,908 findings', records: 3908, negativeCapable: true },
  { module: 'backup', status: 'success', detail: 'job history parsed — 30 days', records: 30, negativeCapable: true },
];

export const bundleStages = [
  { label: 'Verifying signature', result: 'ok' as const, detail: 'Ed25519 · collector build 2026.08.2' },
  { label: 'Reading module execution ledger', result: 'ok' as const, detail: '7 modules recorded' },
  { label: 'Parsing identity.json (1,842 records)', result: 'ok' as const, detail: 'accounts, groups, MFA state' },
  { label: 'Parsing endpoint.json', result: 'warn' as const, detail: 'partial — insufficient permission (12 of 400 hosts)' },
  { label: 'Parsing logging.json', result: 'error' as const, detail: 'failed — wineventlog_access_denied' },
  { label: "Module 'cloud'", result: 'error' as const, detail: 'declined by client' },
  { label: 'Corroborating 90 claims', result: 'ok' as const, detail: 'testimony cross-checked against artifacts' },
];

export const BUNDLE_MANIFEST = {
  collector: 'jccp-collector 2026.08.2',
  signatureAlg: 'Ed25519',
  signatureHash: 'a3f1c92e7b40d5188cc21e0f6b9a4d7e2f8c1b06',
  generatedAt: '2026-09-05T09:14:22+03:00',
  identityRecords: 1842,
  claimsCorroborated: 90,
};
