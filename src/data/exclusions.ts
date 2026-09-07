// The scope-exclusion register: the 236 controls marked Not Applicable, why, and by what.
// The demo seeds a representative, inspectable subset; the rest roll up as a count.

export interface Exclusion {
  id: string;
  description: string;
  capability: 'arch' | 'dev' | 'del' | 'ops' | 'found';
  /** the profile fact that removed it from scope */
  triggeredBy: string;
  triggerFact: string; // machine-readable-ish, for filtering
  /** recorded rationale — empty string means UNJUSTIFIED (flagged) */
  justification: string;
}

export const SECTOR_BASELINE = {
  sector: 'Government',
  sizeBand: '250–1000 staff',
  /** typical Not-Applicable rate for this sector/size */
  naRatePct: 34,
  /** typical count of cloud-conditional controls a same-profile entity keeps in scope */
  cloudServicesTypical: 1,
};

// 30 seeded exclusions of the 236. Counts by capability roll the rest up.
export const EXCLUSIONS: Exclusion[] = [
  { id: 'JNCSF-58', description: 'Perform secure code review on all developed applications', capability: 'dev', triggeredBy: 'Profile declaration', triggerFact: 'inHouseDevelopment = no', justification: '' },
  { id: 'JNCSF-61', description: 'Apply static application security testing in the build pipeline', capability: 'dev', triggeredBy: 'Profile declaration', triggerFact: 'inHouseDevelopment = no', justification: 'No in-house development; all software is COTS or SaaS.' },
  { id: 'JNCSF-63', description: 'Apply dynamic application security testing before release', capability: 'dev', triggeredBy: 'Profile declaration', triggerFact: 'inHouseDevelopment = no', justification: 'No in-house development; all software is COTS or SaaS.' },
  { id: 'JNCSF-66', description: 'Maintain a software bill of materials for developed products', capability: 'dev', triggeredBy: 'Profile declaration', triggerFact: 'inHouseDevelopment = no', justification: '' },
  { id: 'JNCSF-70', description: 'Operate a secure software development lifecycle policy', capability: 'dev', triggeredBy: 'Profile declaration', triggerFact: 'inHouseDevelopment = no', justification: 'No in-house development.' },
  { id: 'JNCSF-72', description: 'Separate development, test and production environments for in-house software', capability: 'dev', triggeredBy: 'Profile declaration', triggerFact: 'inHouseDevelopment = no', justification: 'No in-house development.' },
  { id: 'JNCSF-77', description: 'Manage source code repository access and integrity', capability: 'dev', triggeredBy: 'Profile declaration', triggerFact: 'inHouseDevelopment = no', justification: '' },
  { id: 'JNCSF-80', description: 'Threat-model developed applications during design', capability: 'dev', triggeredBy: 'Profile declaration', triggerFact: 'inHouseDevelopment = no', justification: 'No in-house development.' },

  { id: 'JNCSF-210', description: 'Segregate operational technology networks from corporate IT', capability: 'ops', triggeredBy: 'Profile declaration', triggerFact: 'hasOperationalTech = no', justification: 'No OT, ICS or SCADA assets operated by the entity.' },
  { id: 'JNCSF-213', description: 'Apply an OT-specific patch and change management regime', capability: 'ops', triggeredBy: 'Profile declaration', triggerFact: 'hasOperationalTech = no', justification: 'No OT assets.' },
  { id: 'JNCSF-216', description: 'Monitor OT protocols for anomalous commands', capability: 'ops', triggeredBy: 'Profile declaration', triggerFact: 'hasOperationalTech = no', justification: 'No OT assets.' },
  { id: 'JNCSF-219', description: 'Maintain an OT asset inventory with safety classification', capability: 'ops', triggeredBy: 'Profile declaration', triggerFact: 'hasOperationalTech = no', justification: '' },
  { id: 'JNCSF-222', description: 'Establish OT incident response procedures with safety authority', capability: 'ops', triggeredBy: 'Profile declaration', triggerFact: 'hasOperationalTech = no', justification: '' },

  { id: 'JNCSF-158', description: 'Enforce mobile device management on personally-owned devices', capability: 'ops', triggeredBy: 'Profile declaration', triggerFact: 'byodPermitted = no', justification: 'BYOD not permitted; only corporate-managed devices connect.' },
  { id: 'JNCSF-160', description: 'Containerise corporate data on personally-owned devices', capability: 'ops', triggeredBy: 'Profile declaration', triggerFact: 'byodPermitted = no', justification: 'BYOD not permitted.' },
  { id: 'JNCSF-165', description: 'Apply conditional access checks for unmanaged devices', capability: 'ops', triggeredBy: 'Profile declaration', triggerFact: 'byodPermitted = no', justification: '' },

  { id: 'JNCSF-291', description: 'Apply data-residency controls for cross-border cloud processing', capability: 'ops', triggeredBy: 'Profile declaration', triggerFact: 'crossBorderCloud = no', justification: 'All cloud processing is within Jordan.' },
  { id: 'JNCSF-293', description: 'Assess foreign lawful-access exposure for cloud providers', capability: 'ops', triggeredBy: 'Profile declaration', triggerFact: 'crossBorderCloud = no', justification: 'All cloud processing is within Jordan.' },
  { id: 'JNCSF-296', description: 'Maintain standard contractual clauses for international transfers', capability: 'arch', triggeredBy: 'Profile declaration', triggerFact: 'crossBorderCloud = no', justification: '' },

  { id: 'JNCSF-121', description: 'Operate a public key infrastructure certificate authority', capability: 'del', triggeredBy: 'Scoping decision', triggerFact: 'no internal CA operated', justification: 'Certificates issued by a government shared CA; entity does not run a CA.' },
  { id: 'JNCSF-124', description: 'Manage HSM key ceremonies for an internal CA', capability: 'del', triggeredBy: 'Scoping decision', triggerFact: 'no internal CA operated', justification: '' },
  { id: 'JNCSF-330', description: 'Operate a bug bounty or coordinated disclosure programme', capability: 'ops', triggeredBy: 'Scoping decision', triggerFact: 'no public-facing products', justification: '' },
  { id: 'JNCSF-333', description: 'Publish a security.txt disclosure contact', capability: 'ops', triggeredBy: 'Scoping decision', triggerFact: 'no public-facing products', justification: 'No externally-marketed products; citizen portal disclosure handled by NCSC route.' },
  { id: 'JNCSF-347', description: 'Maintain a supplier code security assurance programme', capability: 'del', triggeredBy: 'Scoping decision', triggerFact: 'no software suppliers under contract', justification: '' },
  { id: 'JNCSF-402', description: 'Operate a container image registry hardening baseline', capability: 'ops', triggeredBy: 'Profile declaration', triggerFact: 'inHouseDevelopment = no', justification: 'No container platform operated by the entity.' },
  { id: 'JNCSF-405', description: 'Scan container images for vulnerabilities pre-deployment', capability: 'ops', triggeredBy: 'Profile declaration', triggerFact: 'inHouseDevelopment = no', justification: '' },
  { id: 'JNCSF-511', description: 'Operate a physical security operations centre with guard force', capability: 'found', triggeredBy: 'Scoping decision', triggerFact: 'facilities managed by MoPWH', justification: 'Building physical security is provided by the Ministry of Public Works; covered under their assessment.' },
  { id: 'JNCSF-518', description: 'Maintain a fleet vehicle tracking and security programme', capability: 'found', triggeredBy: 'Scoping decision', triggerFact: 'no operational vehicle fleet', justification: '' },
  { id: 'JNCSF-540', description: 'Conduct penetration testing of developed products before release', capability: 'found', triggeredBy: 'Profile declaration', triggerFact: 'inHouseDevelopment = no', justification: 'No in-house development.' },
];

/** Per-capability count of ALL exclusions (seeded + rolled-up), summing to 236. */
export const EXCLUSION_COUNTS: Record<Exclusion['capability'], number> = {
  arch: 3,
  dev: 49,
  del: 4,
  ops: 119,
  found: 61,
};
// 3 + 49 + 4 + 119 + 61 = 236

export const EXCLUSION_TRIGGERS = [
  { fact: 'inHouseDevelopment = no', label: 'No in-house software development', count: 62 },
  { fact: 'hasOperationalTech = no', label: 'No operational technology', count: 41 },
  { fact: 'crossBorderCloud = no', label: 'No cross-border cloud processing', count: 12 },
  { fact: 'byodPermitted = no', label: 'BYOD not permitted', count: 8 },
  { fact: 'scoping decision', label: 'Scoping decision (documented)', count: 89 },
  { fact: 'national obligation', label: 'National-level obligation (Capability 6)', count: 24 },
];
// 62 + 41 + 12 + 8 + 89 + 24 = 236
