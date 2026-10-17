// Every applicable control of the ACTIVE assessment, as the engine concluded it.
//
// Round 3 removed the 48 invented sample controls. A control's state, evidence class, gap reason, gap basis, partial
// basis, satisfied path and the module run behind an absence-based Gap are the engine's, read from the golden file for
// the active profile (src/data/profiles, through src/data/current.ts): MEASURED. The before-upload state is rule R's
// projection of the same claim: ILLUSTRATIVE.
//
// Two other kinds of material sit beside them and are never mixed in silence:
//   - `catalogue`: control text and ISO/NIST mappings the prototype already carried for some controls (the NCSC's own
//     published content). The golden files carry none, and the rule is that engine text and files do not cross, so a
//     control outside that set has an id and a capability but no title.
//   - `example`: worked-example material invented for the demonstration (required signals, population notes, the
//     ATT&CK chain, evidence quotes). ILLUSTRATIVE. It is attached only to the controls that had it, and the screen
//     marks it on the element.

import { isoNamesFor, nistNamesFor } from './standards';
import { CURRENT, type Claim, type EvidenceKind, type Frac, type GapBasis, type PartialBasis, type StateFigures } from './current';
import { activeProfileId } from './profiles';
import type { CapabilityId, GapReason, ProfileId, WeightBasis } from './profiles/types';
import { AUTHORED_CONTROLS, AUTHORING, SIGNALS_TOTAL } from './authoring';

export type { GapReason } from './profiles/types';
export type ControlState = 'green' | 'yellow' | 'red' | 'grey' | 'unknown';
export type EvidenceClass = 'none' | 'testimonial' | 'artifact' | 'analyst_signed';

/** How a control's deployment share was obtained. `measured`: counted from collected data. `claimed`: asserted by a
 *  person. A claimed share earns at most second-quartile partial credit. (The engine's `established` is a count.) */
export type ShareBasis = 'measured' | 'claimed';

export interface ControlSnapshot {
  state: ControlState;
  evidenceClass: EvidenceClass;
  evidenceKind?: EvidenceKind;
  /** why an Unknown control is Unknown */
  gapReason?: GapReason;
  /** which ground a Gap rests on */
  gapBasis?: GapBasis;
  partialBasis?: PartialBasis;
  /** the evidence path that was satisfied (the engine's label) */
  pathLabel?: string;
  /** the module run that justifies an absence-based Gap */
  runId?: string;
  /** the credit this verdict earns (Compliant 1, Gap 0, a Partial by its basis) */
  credit?: Frac;
}

// Why a signal is (or isn't) negative-capable — the reason a control can be a Gap rather than Unknown.
// ILLUSTRATIVE: assigned to the worked-example controls only.
export type EvidenceBasis = 'negative_capable' | 'by_rule' | 'judgement' | 'uncertainty';

export const EVIDENCE_BASIS_LABEL: Record<EvidenceBasis, string> = {
  negative_capable: 'Negative-capable',
  by_rule: 'By rule',
  judgement: 'Judgement',
  uncertainty: 'Uncertainty',
};

export const EVIDENCE_BASIS_MEANING: Record<EvidenceBasis, string> = {
  negative_capable: 'Absence of a positive finding proves the negative.',
  by_rule: 'Documentary — absence proves nothing, by the nature of the evidence.',
  judgement: 'A named mechanism makes absence uninformative.',
  uncertainty: 'We could not establish completeness — the recoverable case.',
};

/** Worked-example material for a control: invented for the demonstration, never read from an assessment. */
export interface WorkedExample {
  requiredSignals: string[];
  attackKey?: string;
  populationNote?: string;
  exceptionPopulation?: string;
  /** how old the example evidence may be before it goes stale (days) */
  maxAgeDays: number;
  evidenceBasis: EvidenceBasis;
  /** requires an organisational arrangement no module can observe */
  noConclusivePath: boolean;
  showcase: boolean;
}

export interface Control {
  id: string; // "JNCSF-102"
  num: number;
  capability: CapabilityId;
  /** false when no evidence requirement has been authored for this control */
  authored: boolean;
  weight: Frac;
  weightBasis: WeightBasis;
  /** the engine's claim, whole */
  claim: Claim;
  /** the engine's verdict (measured) */
  after: ControlSnapshot;
  /** rule R's projection of it (illustrative) */
  before: ControlSnapshot;
  /** the upload changes this control's state */
  changed: boolean;
  /** control text and ISO/NIST mappings, where the prototype holds them */
  description?: string;
  iso: string[];
  isoNames: string[];
  nist: string[];
  nistNames: string[];
  example?: WorkedExample;
}

interface CatalogueEntry {
  n: number;
  d: string;
  iso: string[];
  nist: string[];
  req: string[];
  attackKey?: string;
  exception?: string;
  population?: string;
  showcase?: boolean;
  maxAge?: number;
}

// The 48 controls the prototype carried text for. `d`, `iso` and `nist` are the NCSC's own published content;
// `req`, `attackKey`, `exception`, `population` are worked-example material (illustrative). Their invented
// before/after states, shares and "changed" flags are gone: a state now comes from the engine's claim.
const CATALOGUE: CatalogueEntry[] = [
  { n: 1, d: 'Develop and document control policies', iso: ['5.1.1', '9.1.1'], nist: ['AC-1', 'AT-1', 'AU-1', 'CA-1', 'CM-1'], req: [] },
  { n: 3, d: 'Address information security requirements and risks in all project management', iso: ['6.1.5', '14.1.1'], nist: [], req: [] },
  { n: 6, d: 'Assign a senior-level executive as the authorizing official for information systems', iso: [], nist: ['CA-6'], req: ['authorization_letter', 'org_chart'] },
  { n: 7, d: 'Develop and document a granular inventory of current, authorized information system components on all information systems', iso: ['8.1.1', '18.1.2'], nist: ['CM-8'], req: ['asset_inventory_export', 'authorization_flag', 'last_sync_timestamp'], attackKey: 'JNCSF-7', population: '512 of 512 AD computer objects reconciled against the CMDB.' },
  { n: 8, d: 'Review and update the inventory of system components on all information systems', iso: ['8.1.1'], nist: ['CM-8'], req: ['inventory_diff_log', 'review_cadence'] },
  { n: 14, d: 'Develop an information security architecture that describes the philosophy, requirements, and approach to managing and protecting information', iso: [], nist: ['PL-8'], req: ['architecture_document', 'approval_record'] },
  { n: 20, d: 'Establish a line item for information security in budgeting documentation', iso: [], nist: ['SA-2'], req: [] },
  { n: 25, d: 'Develop and implement procedures for maintaining privacy and protection of personally identifiable information', iso: ['18.1.4'], nist: [], req: ['pii_handling_procedure', 'dpo_signoff'] },
  { n: 27, d: 'Configure information systems to terminate user sessions after defined conditions or trigger events are met', iso: [], nist: ['AC-12'], req: [] },
  { n: 30, d: 'Configure information systems to generate audit records of all relevant information about every auditable event', iso: ['12.4.1', '12.5.1', '14.2.2', '12.7.1', '12.6.1'], nist: ['AU-3', 'AU-12', 'CM-3'], req: ['auditpol_output', 'event_field_coverage', 'timestamp_source'], attackKey: 'JNCSF-30' },
  { n: 32, d: 'Develop, document, and maintain a baseline configuration of all information systems', iso: ['12.5.1', '12.1.1'], nist: ['CM-2'], req: ['baseline_document', 'drift_report'] },
  { n: 39, d: 'Establish and enforce policies governing the installation of software by users', iso: ['12.5.1', '12.6.2', '18.1.2'], nist: ['CM-11'], req: [] },
  { n: 45, d: 'Ensure authenticators are high-quality and sufficiently secure', iso: ['9.4.3'], nist: ['IA-5'], req: [] },
  { n: 46, d: 'Change default authenticators prior to information system installation', iso: ['9.2.4'], nist: ['IA-5'], req: [] },
  { n: 87, d: 'Employ malicious code protection mechanisms at information system entry and exit points', iso: [], nist: ['SI-3'], req: ['mail_gateway_config', 'proxy_av_config'] },
  { n: 96, d: 'Assign access rights to all user accounts, consistent with control policies', iso: ['9.1.2', '9.2.2', '9.2.3'], nist: ['AC-2'], req: ['joiners_process', 'rbac_matrix'] },
  { n: 100, d: 'Formally separate sensitive duties among multiple individuals to prevent access rights abuses or conflicts of interest', iso: ['6.1.2'], nist: ['AC-5'], req: ['sod_matrix', 'conflict_review'] },
  { n: 102, d: 'Manage access rights to be consistent with the principle of least privilege', iso: ['9.4.4', '9.2.3'], nist: ['AC-6'], req: ['privileged_group_membership', 'mfa_enrolment_state', 'last_recertification'], attackKey: 'JNCSF-102', exception: '43 of 512 privileged accounts have no MFA enforcement', population: '410 of 512 endpoints (denominator: AD computer objects). Sample ratio sufficient for estate-level claim.', showcase: true },
  { n: 105, d: 'Prevent unauthorized access to mobile devices by using physical protection against theft, cryptographic techniques, and secret authentication information', iso: ['6.2.1'], nist: ['AC-19'], req: ['mdm_policy_export', 'encryption_state'] },
  { n: 107, d: 'Assign different user IDs to be used only for privileged access rights, separate from regular business activities', iso: ['9.2.3'], nist: [], req: ['admin_account_naming', 'separation_report'] },
  { n: 116, d: 'Configure information systems to identify and authenticate organizational users', iso: ['9.4.1'], nist: ['IA-2'], req: ['auth_provider_config', 'directory_binding'] },
  { n: 139, d: 'Establish a process to routinely review that user access rights align with control policies', iso: ['9.2.5', '9.2.2', '9.2.3'], nist: ['AC-2'], req: ['recertification_campaign', 'attestation_records'] },
  { n: 141, d: 'Establish a process to appropriately remove or adjust access rights from users as specified in control policies', iso: ['9.2.6', '9.2.2', '9.2.5'], nist: ['AC-2', 'PS-4', 'PS-5'], req: ['leavers_feed', 'disable_latency', 'orphan_account_scan'], attackKey: 'JNCSF-141' },
  { n: 142, d: 'Configure information systems to limit the number of unsuccessful logon attempts within a defined time period', iso: [], nist: ['AC-7'], req: [] },
  { n: 146, d: 'Configure information systems to prevent further user access after a defined period of user inactivity', iso: [], nist: ['AC-11'], req: [] },
  { n: 163, d: 'Configure information systems to require authorization procedures before connecting mobile devices', iso: ['6.2.1'], nist: ['AC-19'], req: ['device_control_policy', 'usb_enforcement_state'], attackKey: 'JNCSF-163' },
  { n: 167, d: 'Ensure information systems are capable of logging events deemed auditable', iso: [], nist: ['AU-2'], req: ['log_source_inventory', 'auditable_event_list'] },
  { n: 173, d: 'Establish cadence to review information system audit records and report any unusual activity to appropriate personnel', iso: ['12.4.1', '12.4.3'], nist: ['AU-6', 'CM-3'], req: ['siem_use_cases', 'review_schedule', 'escalation_records'] },
  { n: 179, d: "Retain audit records for a defined time period consistent with the organization's records retention policy", iso: ['18.1.3'], nist: ['AU-11'], req: ['retention_config', 'storage_capacity', 'oldest_record_date'] },
  { n: 190, d: 'Implement a continuous monitoring program with security control assessments and status monitoring', iso: [], nist: ['CA-7'], req: [] },
  { n: 225, d: 'Conduct frequent backups of user- and system-level information in all information systems', iso: ['12.3.1'], nist: ['CP-9'], req: [] },
  { n: 252, d: 'Implement an incident handling capability including preparation, detection and analysis, containment, eradication, and recovery', iso: ['16.1.1'], nist: ['IR-4'], req: [] },
  { n: 257, d: 'Require users to report suspected security incidents to the incident response capability within a specified time period', iso: ['16.1.2', '16.1.1'], nist: ['IR-6'], req: [] },
  { n: 307, d: 'Scan for vulnerabilities in information systems and hosted applications', iso: ['12.6.1'], nist: ['RA-5'], req: ['scanner_config', 'scan_coverage', 'remediation_sla'], attackKey: 'JNCSF-307' },
  { n: 382, d: 'Configure information systems to protect the confidentiality and integrity of information at rest', iso: [], nist: ['SC-28'], req: [] },
  { n: 394, d: 'Install and regularly update malware detection and repair software to scan computers and media', iso: ['12.2.1'], nist: [], req: ['defender_status', 'signature_age', 'coverage_by_host'], attackKey: 'JNCSF-394', exception: 'Contractor-managed workstations excluded from managed AV' },
  { n: 407, d: 'Identify, report, and correct information system flaws', iso: [], nist: ['SI-2'], req: [] },
  { n: 435, d: 'Establish multifactor authentication for local and network access to privileged accounts and for network access to non-privileged accounts', iso: [], nist: [], req: ['mfa_policy', 'privileged_enrolment', 'nonprivileged_enrolment'], attackKey: 'JNCSF-435', exception: '43 of 512 privileged accounts without MFA' },
  { n: 437, d: 'Establish minimum password complexity, password change, and reuse restriction protocols', iso: [], nist: [], req: [] },
  { n: 438, d: 'Establish cadence to review and update control policies', iso: ['5.1.2'], nist: ['AC-1', 'AT-1', 'AU-1'], req: [] },
  { n: 440, d: 'Ensure all information systems enforce access rights restrictions consistent with control policies', iso: ['9.4.1'], nist: ['AC-3'], req: ['acl_export', 'enforcement_test', 'deny_by_default_flag'], attackKey: 'JNCSF-440' },
  { n: 459, d: 'Provide ongoing security awareness training to employees and contractors upon hiring with continued training at regularly defined intervals', iso: ['7.2.2'], nist: ['AT-2'], req: ['lms_completion_export', 'curriculum', 'cadence'], maxAge: 365 },
  { n: 465, d: 'Document, monitor, and retain individual information system security training activities and records', iso: [], nist: ['AT-4'], req: ['training_records_export', 'retention_period'] },
  { n: 479, d: 'Sanitize media prior to disposal in accordance with organizational policies', iso: ['8.3.2', '11.2.7'], nist: ['MP-6'], req: [] },
  { n: 512, d: 'Establish a process to screen all individuals filling organizational positions', iso: ['7.1.1'], nist: ['PS-2'], req: [] },
  { n: 515, d: 'Revoke all authenticators and security-related property upon termination of employment', iso: ['8.1.4', '13.2.4'], nist: ['PS-4'], req: ['leavers_feed', 'revocation_latency', 'asset_return_log'] },
  { n: 538, d: 'Conduct assessments of risk on all projects, including likelihood or harm from unauthorized access, use, modification or destruction', iso: ['6.1.5'], nist: ['RA-3'], req: [] },
  { n: 573, d: 'Design and apply physical protection against natural disasters, malicious attacks, and accidents', iso: ['11.1.4'], nist: [], req: [] },
];

// Controls requiring an organisational arrangement that no module can observe. ILLUSTRATIVE (worked examples only).
const NO_CONCLUSIVE_PATH_NUMS = new Set([6, 20, 100]);
// Exactly one signal is false through uncertainty rather than rule or judgement — the recoverable case.
const UNCERTAINTY_NUMS = new Set([32]);
// Documentary/policy controls — a document existing doesn't prove the practice is followed.
const BY_RULE_NUMS = new Set([1, 3, 6, 14, 20, 25]);
// Controls where a named mechanism makes an absent finding uninformative rather than proof of a gap.
const JUDGEMENT_NUMS = new Set([100, 190, 252, 479, 512, 538, 573]);

function evidenceBasisFor(n: number, evidenceClass: EvidenceClass): EvidenceBasis {
  if (UNCERTAINTY_NUMS.has(n)) return 'uncertainty';
  if (BY_RULE_NUMS.has(n)) return 'by_rule';
  if (JUDGEMENT_NUMS.has(n)) return 'judgement';
  if (evidenceClass === 'artifact') return 'negative_capable';
  return 'judgement';
}

const afterOf = (c: Claim): ControlSnapshot => ({
  state: c.state,
  evidenceClass: c.evidenceClass,
  evidenceKind: c.evidenceKind,
  gapReason: c.gapReason,
  gapBasis: c.gapBasis,
  partialBasis: c.partialBasis,
  pathLabel: c.pathLabel,
  runId: c.runId,
  credit: c.credit,
});

/** Rule R: before an evidence bundle exists only the verdicts that rest on testimony or documents exist. */
const beforeOf = (c: Claim): ControlSnapshot =>
  c.beforeVerdict
    ? afterOf(c)
    : { state: 'unknown', evidenceClass: 'none', gapReason: c.authored ? 'not_provided' : 'unauthored' };

const BY_NUM = new Map(CATALOGUE.map((e) => [e.n, e]));

function build(c: Claim): Control {
  const num = Number(c.id.split('-')[1]);
  const cat = BY_NUM.get(num);
  const after = afterOf(c);
  const before = beforeOf(c);
  return {
    id: c.id,
    num,
    capability: c.capability,
    authored: c.authored,
    weight: c.weight,
    weightBasis: c.weightBasis,
    claim: c,
    after,
    before,
    changed: before.state !== after.state,
    description: cat?.d,
    iso: cat?.iso ?? [],
    isoNames: cat ? isoNamesFor(cat.iso) : [],
    nist: cat?.nist ?? [],
    nistNames: cat ? nistNamesFor(cat.nist) : [],
    example: cat && {
      requiredSignals: cat.req,
      attackKey: cat.attackKey,
      populationNote: cat.population,
      exceptionPopulation: cat.exception,
      maxAgeDays: cat.maxAge ?? 90,
      evidenceBasis: evidenceBasisFor(num, after.evidenceClass),
      noConclusivePath: NO_CONCLUSIVE_PATH_NUMS.has(num),
      showcase: cat.showcase ?? false,
    },
  };
}

/** Control text, where the prototype holds it (it does not for most controls: the goldens carry none). */
export const controlText = (id: string): string | undefined => BY_NUM.get(Number(id.split('-')[1]))?.d;

let cache: { id: ProfileId; list: Control[]; byId: Map<string, Control> } | null = null;
function current() {
  const id = activeProfileId();
  if (!cache || cache.id !== id) {
    const list = CURRENT.claims.map(build);
    cache = { id, list, byId: new Map(list.map((c) => [c.id, c])) };
  }
  return cache;
}

/** Every applicable control of the active assessment, in control order. */
export const controls = (): Control[] => current().list;
export const controlById = (id: string): Control | undefined => current().byId.get(id);

export function snapshotFor(c: Control, uploaded: boolean): ControlSnapshot {
  return uploaded ? c.after : c.before;
}

// Gap-reason breakdown of the Unknowns, from the active profile's figures. `unauthored` is the tool's limitation and
// is by far the largest; the rest are the organisation's and are itemised by reason. `not_requested` is a design
// invariant — a non-zero value indicates a defect. Rows reconcile exactly to the Unknown count in each state.
export interface GapReasonRow {
  reason: GapReason;
  before: number;
  after: number;
  invariant?: boolean;
}

const reasonCount = (s: StateFigures, r: GapReason) =>
  r === 'unauthored' ? s.unknownUnauthored : (s.unevidencedByReason[r] ?? 0);

const REASON_ORDER: GapReason[] = [
  'unauthored',
  'not_provided',
  'declined',
  'insufficient_permission',
  'module_failed',
  'unparseable',
  'stale',
  'future_dated',
  'insufficient_signal',
  'uncollectable_by_design',
];

export const gapReasonBreakdown = (): GapReasonRow[] => [
  ...REASON_ORDER
    .map((reason) => ({ reason, before: reasonCount(CURRENT.before, reason), after: reasonCount(CURRENT.after, reason) }))
    .filter((row) => row.before > 0 || row.after > 0),
  { reason: 'not_requested', before: 0, after: 0, invariant: true },
];

// Evidence-signal basis breakdown, framework-wide. Of 115 signals, exactly one is false through uncertainty rather than
// rule or judgement — the recoverable case, distinct from a documentary limit or a deliberate design choice.
export interface EvidenceBasisRow {
  basis: EvidenceBasis;
  count: number;
}

// 38 are negative-capable; of the 77 that are not, 45 are so by rule, 31 by judgement and 1 through uncertainty.
// 38 + 45 + 31 + 1 = 115. The negative-capable count is shared with the Authoring Coverage screen.
export const EVIDENCE_BASIS_BREAKDOWN: EvidenceBasisRow[] = [
  { basis: 'negative_capable', count: AUTHORING.signals.negativeCapable },
  { basis: 'by_rule', count: 45 },
  { basis: 'judgement', count: 31 },
  { basis: 'uncertainty', count: 1 },
];
export const EVIDENCE_SIGNAL_TOTAL = SIGNALS_TOTAL;

// No-conclusive-path controls: require an organisational arrangement rather than a system state. Can reach Partial on
// documentary evidence, but never Compliant without analyst attestation.
export const NO_CONCLUSIVE_PATH_STATS = {
  authoredTotal: AUTHORED_CONTROLS,
  noPath: AUTHORING.authoredIndicativeOnly,
};

export const GAP_REASON_LABEL: Record<GapReason, string> = {
  unauthored: 'Not yet authored — no evidence requirement defined',
  not_provided: 'Not provided',
  declined: 'Declined by client',
  module_failed: 'Module failed',
  insufficient_permission: 'Insufficient permission',
  unparseable: 'Unparseable',
  stale: 'Stale',
  future_dated: 'Future-dated',
  insufficient_signal: 'Insufficient signal',
  uncollectable_by_design: 'Uncollectable by design',
  not_requested: 'Not requested',
};

export const EVIDENCE_CLASS_LABEL: Record<EvidenceClass, string> = {
  none: 'No evidence',
  testimonial: 'Testimonial',
  artifact: 'Artifact',
  analyst_signed: 'Analyst-signed',
};

export const EVIDENCE_KIND_LABEL: Record<EvidenceKind, string> = {
  testimony: 'Testimony',
  document: 'Document',
  machine_collected: 'Machine-collected',
  analyst_attestation: 'Analyst attestation',
};

/** The engine's `gap_basis` names, in words. */
export const GAP_BASIS_LABEL: Record<GapBasis, string> = {
  absence: 'Absence — a negative-capable signal from a successful module run',
  observed: 'Observed — an artifact shows the control unmet',
  testimonial_admission: "Testimonial admission — a respondent's own statement of non-enforcement",
};

export const PARTIAL_BASIS_LABEL: Record<PartialBasis, string> = {
  share: 'Deployment share',
  indicative_path: 'Indicative path only',
  monitor_only: 'Monitor-only enforcement',
  testimonial: 'Testimony',
  pilot: 'Pilot enforcement',
};

// State ceiling permitted by each evidence class.
export const EVIDENCE_CEILING: Record<EvidenceClass, ControlState> = {
  none: 'unknown',
  testimonial: 'yellow',
  artifact: 'green',
  analyst_signed: 'green',
};
