// MITRE ATT&CK bridge — real technique IDs (brief §5.3).
//
// Two methods produce these mappings, with different evidentiary weight, and the
// prototype discloses which was used per entry rather than presenting uniform output:
//   'official' — the control corresponds to an area covered by the CICSC Threat Annex's
//                official NIST-800-53-to-ATT&CK mapping (access control, authentication,
//                malware protection).
//   'derived'  — constructed transitively (JNCSF → NIST 800-53 → ATT&CK) and then
//                manually reviewed. Plausible, but not an official mapping.

export interface AttackTechnique {
  id: string;
  name: string;
}

export type AttackSource = 'official' | 'derived';

export interface AttackEntry {
  mitigation: string;
  mitigationName: string;
  techniques: AttackTechnique[];
  source: AttackSource;
  sourceLabel: string;
}

const OFFICIAL = 'Official (CICSC Threat Annex, NIST-to-ATT&CK)';
const DERIVED = 'Derived (transitive via NIST 800-53, manually reviewed)';

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
};
