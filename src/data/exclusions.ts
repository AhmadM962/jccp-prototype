// The scope-exclusion register: the 19 controls marked Not Applicable, why, and by what.
// The framework measures as 93% universal — only 38 of 576 controls are conditional on
// the five applicability variables — and this government-ministry demo organisation
// triggers exactly one of them (no in-house software development), so all 19 exclusions
// are seeded here; nothing is rolled up.

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
  /** typical Not-Applicable rate for a same-size public-sector entity — low, because 93%
   *  of the framework is universal and most entities trigger at most one or two of the
   *  five conditional variables */
  naRatePct: 5,
};

// All 19 in-scope exclusions — the full register for this organisation, not a sample.
export const EXCLUSIONS: Exclusion[] = [
  { id: 'JNCSF-58', description: 'Perform secure code review on all developed applications', capability: 'dev', triggeredBy: 'Profile declaration', triggerFact: 'inHouseDevelopment = no', justification: '' },
  { id: 'JNCSF-59', description: 'Apply secure coding standards to in-house development', capability: 'dev', triggeredBy: 'Profile declaration', triggerFact: 'inHouseDevelopment = no', justification: 'No in-house development; all software is COTS or vendor-delivered.' },
  { id: 'JNCSF-60', description: 'Maintain a secure coding training programme for developers', capability: 'dev', triggeredBy: 'Profile declaration', triggerFact: 'inHouseDevelopment = no', justification: 'No developers employed by the entity.' },
  { id: 'JNCSF-61', description: 'Apply static application security testing (SAST) in the build pipeline', capability: 'dev', triggeredBy: 'Profile declaration', triggerFact: 'inHouseDevelopment = no', justification: 'No in-house development; all software is COTS or vendor-delivered.' },
  { id: 'JNCSF-62', description: 'Apply software composition analysis to identify vulnerable dependencies', capability: 'dev', triggeredBy: 'Profile declaration', triggerFact: 'inHouseDevelopment = no', justification: '' },
  { id: 'JNCSF-63', description: 'Apply dynamic application security testing (DAST) before release', capability: 'dev', triggeredBy: 'Profile declaration', triggerFact: 'inHouseDevelopment = no', justification: 'No in-house development; all software is COTS or vendor-delivered.' },
  { id: 'JNCSF-64', description: 'Conduct manual penetration testing of developed applications before release', capability: 'dev', triggeredBy: 'Profile declaration', triggerFact: 'inHouseDevelopment = no', justification: 'No developed applications to test; vendor products are assessed under the outsourced-development controls.' },
  { id: 'JNCSF-65', description: 'Remediate application security findings prior to production deployment', capability: 'dev', triggeredBy: 'Profile declaration', triggerFact: 'inHouseDevelopment = no', justification: '' },
  { id: 'JNCSF-66', description: 'Maintain a software bill of materials (SBOM) for developed products', capability: 'dev', triggeredBy: 'Profile declaration', triggerFact: 'inHouseDevelopment = no', justification: '' },
  { id: 'JNCSF-67', description: 'Sign and verify the integrity of build artifacts', capability: 'dev', triggeredBy: 'Profile declaration', triggerFact: 'inHouseDevelopment = no', justification: 'No in-house build pipeline.' },
  { id: 'JNCSF-68', description: 'Operate a secrets-management solution for development pipelines', capability: 'dev', triggeredBy: 'Profile declaration', triggerFact: 'inHouseDevelopment = no', justification: '' },
  { id: 'JNCSF-69', description: 'Scan container images built in-house for vulnerabilities pre-deployment', capability: 'dev', triggeredBy: 'Profile declaration', triggerFact: 'inHouseDevelopment = no', justification: 'No container images are built by the entity.' },
  { id: 'JNCSF-70', description: 'Operate a secure software development lifecycle (SDLC) policy', capability: 'dev', triggeredBy: 'Profile declaration', triggerFact: 'inHouseDevelopment = no', justification: 'No in-house development.' },
  { id: 'JNCSF-71', description: 'Conduct design-stage security reviews for new application features', capability: 'dev', triggeredBy: 'Profile declaration', triggerFact: 'inHouseDevelopment = no', justification: '' },
  { id: 'JNCSF-72', description: 'Separate development, test and production environments for in-house software', capability: 'dev', triggeredBy: 'Profile declaration', triggerFact: 'inHouseDevelopment = no', justification: 'No in-house development.' },
  { id: 'JNCSF-73', description: 'Restrict production data from being used in development or test environments', capability: 'dev', triggeredBy: 'Profile declaration', triggerFact: 'inHouseDevelopment = no', justification: '' },
  { id: 'JNCSF-77', description: 'Manage source code repository access and integrity', capability: 'dev', triggeredBy: 'Profile declaration', triggerFact: 'inHouseDevelopment = no', justification: '' },
  { id: 'JNCSF-79', description: 'Maintain a code-signing key management procedure', capability: 'dev', triggeredBy: 'Profile declaration', triggerFact: 'inHouseDevelopment = no', justification: 'No in-house build pipeline.' },
  { id: 'JNCSF-80', description: 'Threat-model developed applications during design', capability: 'dev', triggeredBy: 'Profile declaration', triggerFact: 'inHouseDevelopment = no', justification: 'No in-house development.' },
];

/** Per-capability count of all 19 exclusions. */
export const EXCLUSION_COUNTS: Record<Exclusion['capability'], number> = {
  arch: 0,
  dev: 19,
  del: 0,
  ops: 0,
  found: 0,
};
// 0 + 19 + 0 + 0 + 0 = 19

export const EXCLUSION_TRIGGERS = [
  { fact: 'inHouseDevelopment = no', label: 'No in-house software development', count: 19 },
];
// 19
