// MITRE ATT&CK bridge — real technique IDs (brief §5.3).

export interface AttackTechnique {
  id: string;
  name: string;
}

export interface AttackEntry {
  mitigation: string;
  mitigationName: string;
  techniques: AttackTechnique[];
}

export const attackBridge: Record<string, AttackEntry> = {
  'JNCSF-102': {
    mitigation: 'M1026',
    mitigationName: 'Privileged Account Management',
    techniques: [
      { id: 'T1078', name: 'Valid Accounts' },
      { id: 'T1548', name: 'Abuse Elevation Control Mechanism' },
      { id: 'T1021', name: 'Remote Services' },
    ],
  },
  'JNCSF-440': {
    mitigation: 'M1018',
    mitigationName: 'User Account Management',
    techniques: [
      { id: 'T1078', name: 'Valid Accounts' },
      { id: 'T1098', name: 'Account Manipulation' },
    ],
  },
  'JNCSF-30': {
    mitigation: 'M1047',
    mitigationName: 'Audit',
    techniques: [
      { id: 'T1070', name: 'Indicator Removal' },
      { id: 'T1562', name: 'Impair Defenses' },
    ],
  },
  'JNCSF-435': {
    mitigation: 'M1032',
    mitigationName: 'Multi-factor Authentication',
    techniques: [
      { id: 'T1110', name: 'Brute Force' },
      { id: 'T1078', name: 'Valid Accounts' },
      { id: 'T1550', name: 'Use Alternate Authentication Material' },
    ],
  },
  'JNCSF-7': {
    mitigation: 'M1013',
    mitigationName: 'Application Developer Guidance',
    techniques: [{ id: 'T1200', name: 'Hardware Additions' }],
  },
  'JNCSF-163': {
    mitigation: 'M1028',
    mitigationName: 'Operating System Configuration',
    techniques: [{ id: 'T1200', name: 'Hardware Additions' }],
  },
  'JNCSF-394': {
    mitigation: 'M1049',
    mitigationName: 'Antivirus/Antimalware',
    techniques: [
      { id: 'T1204', name: 'User Execution' },
      { id: 'T1566', name: 'Phishing' },
    ],
  },
  'JNCSF-307': {
    mitigation: 'M1051',
    mitigationName: 'Update Software',
    techniques: [{ id: 'T1190', name: 'Exploit Public-Facing Application' }],
  },
};
