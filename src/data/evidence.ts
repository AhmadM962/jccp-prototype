// Evidence trail records per control (brief §7.7). The showcase control JNCSF-102 is
// fully fleshed: an operator claim, a corroborating AD export artifact, a population
// figure, and (via attack.ts) an ATT&CK chain.

export type EvidenceType = 'testimonial' | 'artifact';

export interface EvidenceItem {
  id: string;
  type: EvidenceType;
  /** verbatim quote (testimonial) or artifact locator (artifact) */
  locator: string;
  quote?: string;
  sha256: string; // truncated display hash
  source: string;
  timestamp: string;
  module?: string;
  raw?: string; // plausible raw output for the "View raw" modal
}

const H = (s: string) => s; // hashes are pre-truncated below

export const evidenceByControl: Record<string, EvidenceItem[]> = {
  'JNCSF-102': [
    {
      id: 'ev-102-1',
      type: 'testimonial',
      locator: 'Interview — Infrastructure / Operator, turn 6',
      quote: 'Around 80% [of workstations have the agent]. Contractor machines don’t have the agent.',
      sha256: H('9f2a…c71e'),
      source: 'Operator interview transcript',
      timestamp: '2026-09-03T11:22:00+03:00',
      raw: 'AGENT: What share of workstations have the agent installed?\nUSER: Around 80%.\nAGENT: Are there populations excluded from deployment?\nUSER: Contractor machines don’t have the agent.\n\n[extraction] claim=workstation_coverage value=0.80 confidence=0.71\n[extraction] claim=named_exception value="contractor_machines" confidence=0.90',
    },
    {
      id: 'ev-102-2',
      type: 'artifact',
      locator: 'raw/ad-privileged-groups.csv row 412',
      sha256: H('a3f1…d7e2'),
      source: 'Active Directory — Get-ADGroupMember',
      timestamp: '2026-09-05T09:11:04+03:00',
      module: 'identity',
      raw: 'SamAccountName,Group,Enabled,MFAEnforced,LastLogonDate,PasswordLastSet\nsvc-backup,Domain Admins,True,False,2026-09-04,2024-02-11\na.haddad-adm,Domain Admins,True,True,2026-09-05,2026-06-30\nm.qasem-adm,Enterprise Admins,True,False,2026-09-01,2025-11-20\n... (509 more rows)\n\nSUMMARY: 512 privileged group members · 469 MFA-enforced · 43 without MFA · 6 stale (>90d no logon)',
    },
    {
      id: 'ev-102-3',
      type: 'artifact',
      locator: 'raw/ad-computers.csv — aggregate',
      sha256: H('7c04…1b90'),
      source: 'Active Directory — Get-ADComputer',
      timestamp: '2026-09-05T09:12:41+03:00',
      module: 'identity',
      raw: 'TOTAL AD computer objects: 512\nReconciled with EDR agent inventory: 410 (80.1%)\nNo matching EDR agent: 102\n  - contractor-managed: 71\n  - decommissioned (stale object): 19\n  - unresolved: 12\n\nSample ratio 410/512 sufficient for estate-level claim (threshold 0.70).',
    },
  ],
  'JNCSF-30': [
    {
      id: 'ev-30-1',
      type: 'artifact',
      locator: 'raw/auditpol.txt lines 4–37',
      sha256: H('b81d…4a02'),
      source: 'Windows — auditpol /get /category:*',
      timestamp: '2026-09-05T09:15:10+03:00',
      module: 'configuration',
      raw: 'System audit policy\nCategory/Subcategory                      Setting\nLogon/Logoff\n  Logon                                   Success and Failure\n  Logoff                                  Success\n  Account Lockout                         Failure\nObject Access\n  File System                             No Auditing        <-- gap\n  Registry                               No Auditing        <-- gap\nDetailed Tracking\n  Process Creation                        No Auditing        <-- gap (T1059 blind spot)\nPolicy Change\n  Audit Policy Change                     Success\n\nFINDING: 3 of 9 required subcategories not enabled. Negative-capable module (configuration) = success → Gap.',
    },
  ],
  'JNCSF-435': [
    {
      id: 'ev-435-1',
      type: 'testimonial',
      locator: 'Interview — Infrastructure / Operator',
      quote: 'MFA is on for the admin portal, and we are rolling it out to the rest.',
      sha256: H('2e9c…88fa'),
      source: 'Operator interview transcript',
      timestamp: '2026-09-03T11:29:00+03:00',
    },
    {
      id: 'ev-435-2',
      type: 'artifact',
      locator: 'raw/ad-privileged-groups.csv — MFAEnforced column',
      sha256: H('a3f1…d7e2'),
      source: 'Active Directory — identity module',
      timestamp: '2026-09-05T09:11:04+03:00',
      module: 'identity',
      raw: 'MFAEnforced tally over 512 privileged group members:\n  True  : 469\n  False : 43\n\n43 privileged accounts accept single-factor authentication. Module status = success → Gap.',
    },
  ],
  'JNCSF-173': [
    {
      id: 'ev-173-1',
      type: 'artifact',
      locator: 'module: logging — execution ledger',
      sha256: H('0000…fail'),
      source: 'Collector module ledger',
      timestamp: '2026-09-05T09:13:55+03:00',
      module: 'logging',
      raw: 'module=logging status=FAILED reason=wineventlog_access_denied\n\nThe logging module could not read the Windows Event Log collection.\nPer the scoring rule, a failed module MUST NOT produce a negative finding.\nControls depending on logging evidence remain Unknown (gapReason=module_failed), not Gap.',
    },
  ],
  'JNCSF-394': [
    {
      id: 'ev-394-1',
      type: 'artifact',
      locator: 'raw/defender-status.json — aggregate',
      sha256: H('55ab…9d1c'),
      source: 'Windows endpoints — Get-MpComputerStatus',
      timestamp: '2026-09-05T09:16:30+03:00',
      module: 'configuration',
      raw: 'Hosts reporting: 388 of 400\nRealTimeProtectionEnabled=true : 331\nAntivirusSignatureAge <= 2 days : 344\nManaged AV absent (contractor image): 44\n\nCoverage ~80%. Named exception: contractor-managed workstations.',
    },
  ],
  'JNCSF-459': [
    {
      id: 'ev-459-1',
      type: 'artifact',
      locator: 'raw/lms-completion-2026Q2.csv — aggregate',
      sha256: H('4d10…ab77'),
      source: 'LMS — completion report',
      timestamp: '2026-06-16T14:02:00+03:00',
      module: 'manual-upload',
      raw: 'Reporting period: 2026-Q2\nActive staff in scope: 620\nCompleted mandatory awareness module: 484 (78.1%)\nOverdue > 30 days: 92\nNever started: 44\n\nNOTE: export is from Q2. A current export is required — this evidence is 84 days old\nagainst a 365-day freshness window but the training cycle itself is quarterly.',
    },
  ],
  'JNCSF-7': [
    {
      id: 'ev-7-1',
      type: 'artifact',
      locator: 'raw/cmdb-reconcile.json',
      sha256: H('c7f0…2ab4'),
      source: 'CMDB ↔ AD reconciliation',
      timestamp: '2026-09-05T09:10:02+03:00',
      module: 'identity',
      raw: 'AD computer objects: 512\nCMDB configuration items: 512\nMatched: 512 (100%)\nAuthorized flag present on all CIs.\nLast full sync: 2026-09-04T23:00:00+03:00',
    },
  ],
};

export const evidenceFor = (id: string): EvidenceItem[] => evidenceByControl[id] ?? [];

// The assessment "as of" date. Evidence age is measured against this.
export const ASSESSMENT_DATE = '2026-09-08';

export function ageDays(isoTimestamp: string, asOf = ASSESSMENT_DATE): number {
  const a = new Date(isoTimestamp).getTime();
  const b = new Date(asOf).getTime();
  return Math.max(0, Math.round((b - a) / 86_400_000));
}

// Freshness roll-up for the dashboard. Seeded evidence is sparse, so the estate-wide
// figures are a fixture; the per-control age on the detail page is computed from the
// record timestamp.
export const EVIDENCE_FRESHNESS = {
  oldestDays: 84,
  oldestControl: 'JNCSF-459',
  oldestControlLabel: 'Security awareness training',
  approachingStaleness: 6,
  stale: 0,
};
