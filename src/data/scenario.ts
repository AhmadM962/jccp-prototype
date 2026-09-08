// The demo organisation, evidence request plan, and module execution ledger (brief §6, §7.2, §7.3).

/** Architecture toggles are tri-state. Ambiguity must never shrink the denominator:
 *  'unknown' is treated exactly like 'yes' for scoping, and the affected controls are
 *  flagged for verification during collection. */
export type Ternary = 'yes' | 'no' | 'unknown';

export interface OrgProfile {
  orgName: string;
  sector: string;
  sizeBand: string;
  endpoints: number;
  servers: number;
  users: number;
  hostingModel: 'gov-private-cloud' | 'own-datacentre' | 'third-party-jordan' | 'foreign-cloud';
  regulators: string[];
  criticalInfrastructure: boolean;
  namedAttestation: string;
  hasOperationalTech: Ternary;
  usesCloud: Ternary;
  crossBorderCloud: Ternary;
  inHouseDevelopment: Ternary;
  hasSOC: Ternary;
  byodPermitted: Ternary;
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
  users: 620,
  hostingModel: 'gov-private-cloud',
  regulators: ['NCSC'],
  criticalInfrastructure: false,
  namedAttestation: '',
  hasOperationalTech: 'no',
  usesCloud: 'yes',
  crossBorderCloud: 'no',
  inHouseDevelopment: 'no',
  hasSOC: 'yes',
  byodPermitted: 'no',
  pdplHoldings: {
    health: false,
    biometric: false,
    financial: false,
    religiousOrPolitical: false,
  },
};

// Denominator model: baseline applicable when the default profile is set.
export const BASELINE_APPLICABLE = 340;
export const TOTAL_CONTROLS = 576;
export const CLOUD_CONDITIONAL_CONTROLS = 23;
export const SOC_CONDITIONAL_CONTROLS = 6;

/** in scope = 'yes' or 'unknown'; only an explicit 'no' can remove controls */
const inScope = (t: Ternary) => t !== 'no';

export interface ProfileDelta {
  key: keyof OrgProfile;
  label: string;
  /** delta applied when the toggle is in scope ('yes' or 'unknown') */
  inScopeDelta: number;
  /** delta applied when the toggle is an explicit 'no' */
  noDelta: number;
}

export const PROFILE_DELTAS: ProfileDelta[] = [
  { key: 'hasOperationalTech', label: 'Operational technology', inScopeDelta: 41, noDelta: 0 },
  { key: 'usesCloud', label: 'Cloud services', inScopeDelta: 0, noDelta: -CLOUD_CONDITIONAL_CONTROLS },
  { key: 'crossBorderCloud', label: 'Cross-border cloud processing', inScopeDelta: 12, noDelta: 0 },
  { key: 'inHouseDevelopment', label: 'In-house software development', inScopeDelta: 49, noDelta: 0 },
  { key: 'hasSOC', label: 'Security operations centre', inScopeDelta: 0, noDelta: -SOC_CONDITIONAL_CONTROLS },
  { key: 'byodPermitted', label: 'BYOD permitted', inScopeDelta: 8, noDelta: 0 },
];

export function computeApplicable(p: OrgProfile): number {
  let n = BASELINE_APPLICABLE;
  for (const d of PROFILE_DELTAS) {
    const t = p[d.key] as Ternary;
    n += inScope(t) ? d.inScopeDelta : d.noDelta;
  }
  return n;
}

/** Number of controls currently held in scope only by an 'unknown' answer — flagged for
 *  verification during collection. */
export function unknownScopedControls(p: OrgProfile): number {
  let n = 0;
  for (const d of PROFILE_DELTAS) {
    if ((p[d.key] as Ternary) === 'unknown') n += Math.abs(d.inScopeDelta || d.noDelta);
  }
  return n;
}

export const HOSTING_LABEL: Record<OrgProfile['hostingModel'], string> = {
  'gov-private-cloud': 'MoDEE Government Private Cloud',
  'own-datacentre': 'Own data centre',
  'third-party-jordan': 'Third-party hosting in Jordan',
  'foreign-cloud': 'Foreign cloud',
};

// ─── Evidence Request Plan (brief §7.2) ────────────────────────────────────────

export type CollectionMethod = 'automated' | 'manual';

export interface RequestArtifact {
  artifact: string;
  source: string;
  controlsUnlocked: number;
  effort: string;
  command: string;
  method: CollectionMethod;
  owner: string;
  formatHint: string;
  /** controls left permanently Unknown if this artifact is declined */
  declineCost?: number;
}

export const requestPlan: RequestArtifact[] = [
  { artifact: 'All accounts + state', source: 'Active Directory', controlsUnlocked: 22, effort: '3 min', method: 'automated', owner: 'Identity team', formatHint: 'CSV — SamAccountName, Enabled, PasswordLastSet, LastLogonDate', command: 'Get-ADUser -Filter * -Properties Enabled,PasswordLastSet,LastLogonDate | Export-Csv accounts.csv', declineCost: 8 },
  { artifact: 'Linux hardening baseline', source: 'Linux servers', controlsUnlocked: 18, effort: '10 min', method: 'automated', owner: 'Server team', formatHint: 'OpenSCAP XCCDF results XML (CIS profile)', command: 'oscap xccdf eval --profile cis --results cis-results.xml /usr/share/xml/scap/ssg/content/ssg-rhel8-ds.xml', declineCost: 18 },
  { artifact: 'Privileged group membership', source: 'Active Directory', controlsUnlocked: 14, effort: '2 min', method: 'automated', owner: 'Identity team', formatHint: 'CSV — one row per privileged group member, MFAEnforced column', command: 'Get-ADGroupMember "Domain Admins" | Export-Csv adm.csv', declineCost: 6 },
  { artifact: 'GPO baseline export', source: 'Active Directory', controlsUnlocked: 12, effort: '4 min', method: 'automated', owner: 'Server team', formatHint: 'GPO report XML/HTML — all linked policies', command: 'Get-GPOReport -All -ReportType Xml -Path gpo-baseline.xml', declineCost: 12 },
  { artifact: 'EDR agent inventory', source: 'EDR console', controlsUnlocked: 11, effort: '5 min', method: 'manual', owner: 'SOC', formatHint: 'CSV export — hostname, agent version, policy, last seen', command: 'Export agent list as CSV from the EDR console (Hosts → Manage → Export)', declineCost: 5 },
  { artifact: 'Audit policy configuration', source: 'Windows servers', controlsUnlocked: 9, effort: '1 min', method: 'automated', owner: 'Server team', formatHint: 'auditpol.txt — category/subcategory settings', command: 'auditpol /get /category:* > auditpol.txt', declineCost: 9 },
  { artifact: 'Local admin rights inventory', source: 'Windows endpoints', controlsUnlocked: 9, effort: '6 min', method: 'automated', owner: 'Endpoint team', formatHint: 'CSV — host, local administrators group membership', command: 'Collected by the endpoint module of the signed collector', declineCost: 4 },
  { artifact: 'SIEM log source inventory', source: 'SIEM', controlsUnlocked: 8, effort: '5 min', method: 'manual', owner: 'SOC', formatHint: 'CSV — source name, type, alerting Y/N, retention days', command: 'Export source list + retention settings from the SIEM admin console', declineCost: 8 },
  { artifact: 'Firewall rule base', source: 'SIEM', controlsUnlocked: 8, effort: '8 min', method: 'manual', owner: 'Network team', formatHint: 'Config export or CSV — rule, src, dst, service, action', command: 'Export the running configuration from the firewall management console', declineCost: 8 },
  { artifact: 'Defender status', source: 'Windows endpoints', controlsUnlocked: 7, effort: '2 min', method: 'automated', owner: 'Endpoint team', formatHint: 'JSON — Get-MpComputerStatus per host, aggregated', command: 'Get-MpComputerStatus | Select-Object AMRunningMode,AntivirusSignatureAge,RealTimeProtectionEnabled', declineCost: 3 },
  { artifact: 'Vulnerability scan results', source: 'SIEM', controlsUnlocked: 7, effort: '5 min', method: 'automated', owner: 'SOC', formatHint: 'CSV — host, plugin, severity, first seen, age', command: 'Export the latest authenticated scan as CSV', declineCost: 7 },
  { artifact: 'Patch compliance report', source: 'Windows servers', controlsUnlocked: 6, effort: '4 min', method: 'automated', owner: 'Server team', formatHint: 'CSV — host, missing KBs, oldest missing patch age', command: 'Export the compliance summary from the patch console', declineCost: 6 },
  { artifact: 'MFA registration report', source: 'Active Directory', controlsUnlocked: 6, effort: '3 min', method: 'automated', owner: 'Identity team', formatHint: 'CSV — user, MFA methods registered, enforced Y/N', command: 'Collected by the identity module of the signed collector', declineCost: 3 },
  { artifact: 'Backup job report', source: 'Backup system', controlsUnlocked: 5, effort: '3 min', method: 'automated', owner: 'Infrastructure', formatHint: 'CSV/PDF — job name, last status, last success, target', command: 'Collected by the backup module of the signed collector', declineCost: 5 },
  { artifact: 'Joiner/mover/leaver log', source: 'HR & LMS', controlsUnlocked: 5, effort: '7 min', method: 'manual', owner: 'HR', formatHint: 'CSV — employee id, event, effective date, processed date', command: 'Export the last 90 days of lifecycle events', declineCost: 5 },
  { artifact: 'Encryption-at-rest inventory (servers)', source: 'Windows servers', controlsUnlocked: 5, effort: '6 min', method: 'manual', owner: 'Server team', formatHint: 'CSV — host, volume, encryption state, key custodian', command: 'Compile per-server disk encryption state', declineCost: 5 },
  { artifact: 'BitLocker state', source: 'Windows endpoints', controlsUnlocked: 4, effort: '2 min', method: 'automated', owner: 'Endpoint team', formatHint: 'CSV — hostname, protection status, encryption %', command: 'manage-bde -status', declineCost: 2 },
  { artifact: 'Security awareness completion', source: 'HR & LMS', controlsUnlocked: 4, effort: '3 min', method: 'manual', owner: 'HR / L&D', formatHint: 'CSV — user, course, completion date', command: 'Export completion CSV from the LMS reporting module', declineCost: 4 },
  { artifact: 'Incident response plan + exercise record', source: 'SIEM', controlsUnlocked: 4, effort: '5 min', method: 'manual', owner: 'SOC', formatHint: 'PDF — IR plan, most recent tabletop record', command: 'Provide the current IR plan and the latest exercise after-action report', declineCost: 4 },
  { artifact: 'Session/idle-timeout policy', source: 'Active Directory', controlsUnlocked: 4, effort: '2 min', method: 'automated', owner: 'Server team', formatHint: 'Included in the GPO baseline export', command: 'Collected by the configuration module of the signed collector', declineCost: 2 },
  { artifact: 'Removable-media control policy', source: 'Windows endpoints', controlsUnlocked: 3, effort: '3 min', method: 'automated', owner: 'Endpoint team', formatHint: 'CSV/JSON — device control policy and assignment', command: 'Collected by the endpoint module of the signed collector', declineCost: 3 },
  { artifact: 'Media sanitisation records', source: 'HR & LMS', controlsUnlocked: 2, effort: '10 min', method: 'manual', owner: 'Facilities', formatHint: 'PDF — certificates of destruction for the period', command: 'Provide destruction certificates from the asset disposal vendor', declineCost: 2 },
];

export const REQUEST_PLAN_SUMMARY = {
  artifactCount: requestPlan.length, // 22
  systemCount: new Set(requestPlan.map((r) => r.source)).size, // 8
  automatedCount: requestPlan.filter((r) => r.method === 'automated').length, // 14
  manualCount: requestPlan.filter((r) => r.method === 'manual').length, // 8
  automatedControls: requestPlan
    .filter((r) => r.method === 'automated')
    .reduce((s, r) => s + r.controlsUnlocked, 0),
  applicable: 340,
  uncollectable: 24,
  projectedCoveragePct: 94,
};

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
