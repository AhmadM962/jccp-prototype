// MITRE ATT&CK bridge — real technique IDs (brief §5.3).
//
// Two methods produce these mappings, with different evidentiary weight, and the
// prototype discloses which was used per entry rather than presenting uniform output:
//   'official' — the edge comes from the NCSC's own published Threat Annex (a curated,
//                direct NIST-800-53-to-ATT&CK correspondence).
//   'derived'  — constructed transitively (JNCSF → NIST 800-53 → ATT&CK) and then
//                manually reviewed. Plausible, but not an official mapping, and the
//                transitive path produces many more candidate techniques per control —
//                61% of derived edges are diffuse (median 19 techniques/control, p90 215).
//
// Measured coverage: only 203 of 576 controls (35.2%) carry any ATT&CK mapping at all —
// this is a governance framework, and most controls (procedural, organisational) have no
// direct adversary-technique correspondence. Of those 203, 93 (16.1% of 576) additionally
// carry at least one officially-sourced edge from the Threat Annex.

export interface AttackTechnique {
  id: string;
  name: string;
}

export type AttackSource = 'official' | 'derived';

export interface AttackEntry {
  mitigation: string;
  mitigationName: string;
  /** ordered highest-confidence first — the UI shows the top few and collapses the rest */
  techniques: AttackTechnique[];
  source: AttackSource;
  sourceLabel: string;
}

const OFFICIAL = 'Official — NCSC Threat Annex';
const DERIVED = 'Derived — transitive via NIST 800-53, manually reviewed';

// Framework-wide ATT&CK bridge coverage stats (brief §Change 4).
export const ATTACK_COVERAGE = {
  totalControls: 576,
  mappedControls: 203,
  mappedPct: 35.2,
  bySource: [
    { source: 'official' as AttackSource, controls: 93, controlsPct: 16.1, edges: 405, edgesPerControl: 4.4 },
    { source: 'derived' as AttackSource, controls: 203, controlsPct: 35.2, edges: 13226, edgesPerControl: 65.2 },
  ],
  diffuse: {
    /** share of derived edges belonging to a control with many candidate techniques */
    diffuseEdgeSharePct: 61,
    medianTechniquesPerControl: 19,
    p90TechniquesPerControl: 215,
  },
};

/** How many top techniques to show before collapsing the rest behind a count. */
export const DIFFUSE_COLLAPSE_THRESHOLD = 4;

export const attackBridge: Record<string, AttackEntry> = {
  // Least privilege — AC-6. Covered by the Threat Annex's access-control mapping.
  'JNCSF-102': {
    mitigation: 'M1026',
    mitigationName: 'Privileged Account Management',
    techniques: [
      { id: 'T1078', name: 'Valid Accounts' },
      { id: 'T1548', name: 'Abuse Elevation Control Mechanism' },
      { id: 'T1021', name: 'Remote Services' },
    ],
    source: 'official',
    sourceLabel: OFFICIAL,
  },
  // Access enforcement — AC-3. Covered by the Threat Annex's access-control mapping.
  'JNCSF-440': {
    mitigation: 'M1018',
    mitigationName: 'User Account Management',
    techniques: [
      { id: 'T1078', name: 'Valid Accounts' },
      { id: 'T1098', name: 'Account Manipulation' },
    ],
    source: 'official',
    sourceLabel: OFFICIAL,
  },
  // Audit record generation — AU-3/AU-12. No official Threat Annex mapping; derived.
  'JNCSF-30': {
    mitigation: 'M1047',
    mitigationName: 'Audit',
    techniques: [
      { id: 'T1070', name: 'Indicator Removal' },
      { id: 'T1562', name: 'Impair Defenses' },
    ],
    source: 'derived',
    sourceLabel: DERIVED,
  },
  // Multi-factor authentication — IA-2/IA-5. Covered by the Threat Annex's auth mapping.
  'JNCSF-435': {
    mitigation: 'M1032',
    mitigationName: 'Multi-factor Authentication',
    techniques: [
      { id: 'T1110', name: 'Brute Force' },
      { id: 'T1078', name: 'Valid Accounts' },
      { id: 'T1550', name: 'Use Alternate Authentication Material' },
    ],
    source: 'official',
    sourceLabel: OFFICIAL,
  },
  // Component inventory — CM-8. Derived.
  'JNCSF-7': {
    mitigation: 'M1013',
    mitigationName: 'Application Developer Guidance',
    techniques: [{ id: 'T1200', name: 'Hardware Additions' }],
    source: 'derived',
    sourceLabel: DERIVED,
  },
  // Authorise mobile devices before connection — AC-19. Derived.
  'JNCSF-163': {
    mitigation: 'M1028',
    mitigationName: 'Operating System Configuration',
    techniques: [{ id: 'T1200', name: 'Hardware Additions' }],
    source: 'derived',
    sourceLabel: DERIVED,
  },
  // Malware protection — SI-3. Covered by the Threat Annex's malware-protection mapping.
  'JNCSF-394': {
    mitigation: 'M1049',
    mitigationName: 'Antivirus/Antimalware',
    techniques: [
      { id: 'T1204', name: 'User Execution' },
      { id: 'T1566', name: 'Phishing' },
    ],
    source: 'official',
    sourceLabel: OFFICIAL,
  },
  // Vulnerability scanning / flaw remediation — RA-5/SI-2. Derived.
  'JNCSF-307': {
    mitigation: 'M1051',
    mitigationName: 'Update Software',
    techniques: [{ id: 'T1190', name: 'Exploit Public-Facing Application' }],
    source: 'derived',
    sourceLabel: DERIVED,
  },
  // Timely removal of access rights — AC-2/PS-4/PS-5. Derived and diffuse: the transitive
  // path through NIST turns up a long tail of candidate techniques. Shown as the demo's
  // example of a diffuse derived mapping — the UI collapses the low-confidence tail.
  'JNCSF-141': {
    mitigation: 'M1018',
    mitigationName: 'User Account Management',
    techniques: [
      { id: 'T1078', name: 'Valid Accounts' },
      { id: 'T1098', name: 'Account Manipulation' },
      { id: 'T1136', name: 'Create Account' },
      { id: 'T1136.001', name: 'Create Account: Local Account' },
      { id: 'T1136.002', name: 'Create Account: Domain Account' },
      { id: 'T1087', name: 'Account Discovery' },
      { id: 'T1069', name: 'Permission Groups Discovery' },
      { id: 'T1531', name: 'Account Access Removal' },
      { id: 'T1548', name: 'Abuse Elevation Control Mechanism' },
      { id: 'T1556', name: 'Modify Authentication Process' },
      { id: 'T1484', name: 'Domain or Tenant Policy Modification' },
      { id: 'T1098.001', name: 'Account Manipulation: Additional Cloud Credentials' },
      { id: 'T1021.001', name: 'Remote Services: RDP' },
      { id: 'T1021.002', name: 'Remote Services: SMB/Windows Admin Shares' },
      { id: 'T1078.002', name: 'Valid Accounts: Domain Accounts' },
      { id: 'T1078.003', name: 'Valid Accounts: Local Accounts' },
      { id: 'T1550.002', name: 'Use Alternate Authentication Material: Pass the Hash' },
      { id: 'T1552', name: 'Unsecured Credentials' },
      { id: 'T1110.003', name: 'Brute Force: Password Spraying' },
    ],
    source: 'derived',
    sourceLabel: DERIVED,
  },
};
