// JNCSF control catalogue — real content, verbatim from the NCSC Activity & Control
// Mapping (brief §5.2). ~50 seeded, clickable controls; the rest of the 576 live as
// aggregate counts in capabilities.ts.

import { isoNamesFor, nistNamesFor } from './standards';

export type ControlState = 'green' | 'yellow' | 'red' | 'grey' | 'unknown';
export type EvidenceClass = 'none' | 'testimonial' | 'artifact' | 'analyst_signed';
export type GapReason =
  | 'not_provided'
  | 'declined'
  | 'module_failed'
  | 'insufficient_permission'
  | 'unparseable'
  | 'stale'
  | 'insufficient_signal'
  | 'uncollectable_by_design'
  | 'not_requested';

export interface ControlSnapshot {
  state: ControlState;
  evidenceClass: EvidenceClass;
  gapReason?: GapReason;
  providedSignals: string[];
}

// Why a signal is (or isn't) negative-capable — the reason a control can be a Gap
// rather than Unknown (brief §Change 7).
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

export interface Control {
  id: string; // "JNCSF-102"
  num: number;
  description: string;
  capability: 'arch' | 'dev' | 'del' | 'ops' | 'found';
  iso: string[];
  isoNames: string[];
  nist: string[];
  nistNames: string[];
  requiredSignals: string[];
  attackKey?: string; // key into attackBridge
  deploymentSharePct?: number;
  exceptionPopulation?: string;
  populationNote?: string;
  /** how old the evidence for this control may be before it goes stale (days) */
  maxAgeDays: number;
  before: ControlSnapshot;
  after: ControlSnapshot;
  /** promoted / meaningfully changed by the evidence-bundle upload */
  changed: boolean;
  showcase?: boolean;
  /** why this control's evidence is or isn't negative-capable */
  evidenceBasis: EvidenceBasis;
  /** requires an organisational arrangement no module can observe — can reach Partial on
   *  documentary evidence, but never Compliant without analyst attestation */
  noConclusivePath?: boolean;
}

type Snap = [ControlState, EvidenceClass, GapReason?];

interface Seed {
  n: number;
  d: string;
  cap: Control['capability'];
  iso: string[];
  nist: string[];
  req: string[];
  before: Snap;
  after: Snap;
  changed?: boolean;
  attackKey?: string;
  share?: number;
  exception?: string;
  population?: string;
  showcase?: boolean;
  maxAge?: number;
}

const S = (state: ControlState, ev: EvidenceClass, prov: string[] = [], gap?: GapReason): ControlSnapshot => ({
  state,
  evidenceClass: ev,
  gapReason: gap,
  providedSignals: prov,
});

const seeds: Seed[] = [
  { n: 1, d: 'Develop and document control policies', cap: 'arch', iso: ['5.1.1', '9.1.1'], nist: ['AC-1', 'AT-1', 'AU-1', 'CA-1', 'CM-1'], req: ['policy_document', 'approval_record', 'review_date'], before: ['green', 'artifact'], after: ['green', 'artifact'] },
  { n: 3, d: 'Address information security requirements and risks in all project management', cap: 'arch', iso: ['6.1.5', '14.1.1'], nist: [], req: ['project_gate_checklist', 'risk_register_entries'], before: ['yellow', 'testimonial'], after: ['yellow', 'testimonial'] },
  { n: 6, d: 'Assign a senior-level executive as the authorizing official for information systems', cap: 'arch', iso: [], nist: ['CA-6'], req: ['authorization_letter', 'org_chart'], before: ['green', 'artifact'], after: ['green', 'artifact'] },
  { n: 7, d: 'Develop and document a granular inventory of current, authorized information system components on all information systems', cap: 'arch', iso: ['8.1.1', '18.1.2'], nist: ['CM-8'], req: ['asset_inventory_export', 'authorization_flag', 'last_sync_timestamp'], before: ['unknown', 'none', 'not_provided'], after: ['green', 'artifact'], changed: true, attackKey: 'JNCSF-7', population: '512 of 512 AD computer objects reconciled against the CMDB.' },
  { n: 8, d: 'Review and update the inventory of system components on all information systems', cap: 'arch', iso: ['8.1.1'], nist: ['CM-8'], req: ['inventory_diff_log', 'review_cadence'], before: ['unknown', 'none', 'not_provided'], after: ['yellow', 'artifact'], changed: true },
  { n: 14, d: 'Develop an information security architecture that describes the philosophy, requirements, and approach to managing and protecting information', cap: 'arch', iso: [], nist: ['PL-8'], req: ['architecture_document', 'approval_record'], before: ['green', 'artifact'], after: ['green', 'artifact'] },
  { n: 20, d: 'Establish a line item for information security in budgeting documentation', cap: 'arch', iso: [], nist: ['SA-2'], req: ['budget_document', 'line_item_reference'], before: ['yellow', 'testimonial'], after: ['yellow', 'testimonial'] },
  { n: 25, d: 'Develop and implement procedures for maintaining privacy and protection of personally identifiable information', cap: 'arch', iso: ['18.1.4'], nist: [], req: ['pii_handling_procedure', 'dpo_signoff'], before: ['unknown', 'none', 'declined'], after: ['unknown', 'none', 'declined'] },

  { n: 27, d: 'Configure information systems to terminate user sessions after defined conditions or trigger events are met', cap: 'dev', iso: [], nist: ['AC-12'], req: ['session_policy_gpo', 'idle_timeout_value'], before: ['unknown', 'none', 'not_provided'], after: ['green', 'artifact'], changed: true },
  { n: 30, d: 'Configure information systems to generate audit records of all relevant information about every auditable event', cap: 'dev', iso: ['12.4.1', '12.5.1', '14.2.2', '12.7.1', '12.6.1'], nist: ['AU-3', 'AU-12', 'CM-3'], req: ['auditpol_output', 'event_field_coverage', 'timestamp_source'], before: ['unknown', 'none', 'not_provided'], after: ['red', 'artifact'], changed: true, attackKey: 'JNCSF-30' },
  { n: 32, d: 'Develop, document, and maintain a baseline configuration of all information systems', cap: 'dev', iso: ['12.5.1', '12.1.1'], nist: ['CM-2'], req: ['baseline_document', 'drift_report'], before: ['yellow', 'testimonial'], after: ['yellow', 'artifact'], changed: true },
  { n: 39, d: 'Establish and enforce policies governing the installation of software by users', cap: 'dev', iso: ['12.5.1', '12.6.2', '18.1.2'], nist: ['CM-11'], req: ['applocker_policy', 'exception_list'], before: ['green', 'artifact'], after: ['green', 'artifact'] },
  { n: 45, d: 'Ensure authenticators are high-quality and sufficiently secure', cap: 'dev', iso: ['9.4.3'], nist: ['IA-5'], req: ['password_policy_export', 'complexity_setting'], before: ['unknown', 'none', 'not_provided'], after: ['yellow', 'artifact'], changed: true },
  { n: 46, d: 'Change default authenticators prior to information system installation', cap: 'dev', iso: ['9.2.4'], nist: ['IA-5'], req: ['build_checklist', 'default_credential_scan'], before: ['unknown', 'none', 'insufficient_signal'], after: ['unknown', 'none', 'insufficient_signal'] },
  { n: 87, d: 'Employ malicious code protection mechanisms at information system entry and exit points', cap: 'dev', iso: [], nist: ['SI-3'], req: ['mail_gateway_config', 'proxy_av_config'], before: ['yellow', 'testimonial'], after: ['green', 'artifact'], changed: true },

  { n: 96, d: 'Assign access rights to all user accounts, consistent with control policies', cap: 'del', iso: ['9.1.2', '9.2.2', '9.2.3'], nist: ['AC-2'], req: ['joiners_process', 'rbac_matrix'], before: ['green', 'artifact'], after: ['green', 'artifact'] },
  { n: 100, d: 'Formally separate sensitive duties among multiple individuals to prevent access rights abuses or conflicts of interest', cap: 'del', iso: ['6.1.2'], nist: ['AC-5'], req: ['sod_matrix', 'conflict_review'], before: ['yellow', 'testimonial'], after: ['yellow', 'testimonial'] },
  { n: 102, d: 'Manage access rights to be consistent with the principle of least privilege', cap: 'del', iso: ['9.4.4', '9.2.3'], nist: ['AC-6'], req: ['privileged_group_membership', 'mfa_enrolment_state', 'last_recertification'], before: ['yellow', 'testimonial'], after: ['red', 'artifact'], changed: true, attackKey: 'JNCSF-102', share: 80, exception: '43 of 512 privileged accounts have no MFA enforcement', population: '410 of 512 endpoints (denominator: AD computer objects). Sample ratio sufficient for estate-level claim.', showcase: true },
  { n: 105, d: 'Prevent unauthorized access to mobile devices by using physical protection against theft, cryptographic techniques, and secret authentication information', cap: 'del', iso: ['6.2.1'], nist: ['AC-19'], req: ['mdm_policy_export', 'encryption_state'], before: ['unknown', 'none', 'not_provided'], after: ['unknown', 'none', 'not_provided'] },
  { n: 107, d: 'Assign different user IDs to be used only for privileged access rights, separate from regular business activities', cap: 'del', iso: ['9.2.3'], nist: [], req: ['admin_account_naming', 'separation_report'], before: ['green', 'artifact'], after: ['green', 'artifact'] },
  { n: 116, d: 'Configure information systems to identify and authenticate organizational users', cap: 'del', iso: ['9.4.1'], nist: ['IA-2'], req: ['auth_provider_config', 'directory_binding'], before: ['green', 'artifact'], after: ['green', 'artifact'] },

  { n: 139, d: 'Establish a process to routinely review that user access rights align with control policies', cap: 'ops', iso: ['9.2.5', '9.2.2', '9.2.3'], nist: ['AC-2'], req: ['recertification_campaign', 'attestation_records'], before: ['unknown', 'none', 'not_provided'], after: ['green', 'artifact'], changed: true },
  { n: 141, d: 'Establish a process to appropriately remove or adjust access rights from users as specified in control policies', cap: 'ops', iso: ['9.2.6', '9.2.2', '9.2.5'], nist: ['AC-2', 'PS-4', 'PS-5'], req: ['leavers_feed', 'disable_latency', 'orphan_account_scan'], before: ['yellow', 'testimonial'], after: ['red', 'artifact'], changed: true, attackKey: 'JNCSF-141' },
  { n: 142, d: 'Configure information systems to limit the number of unsuccessful logon attempts within a defined time period', cap: 'ops', iso: [], nist: ['AC-7'], req: ['lockout_policy_gpo', 'threshold_value'], before: ['unknown', 'none', 'not_provided'], after: ['green', 'artifact'], changed: true },
  { n: 146, d: 'Configure information systems to prevent further user access after a defined period of user inactivity', cap: 'ops', iso: [], nist: ['AC-11'], req: ['screen_lock_gpo', 'timeout_value'], before: ['unknown', 'none', 'not_provided'], after: ['green', 'artifact'], changed: true },
  { n: 163, d: 'Configure information systems to require authorization procedures before connecting mobile devices', cap: 'ops', iso: ['6.2.1'], nist: ['AC-19'], req: ['device_control_policy', 'usb_enforcement_state'], before: ['unknown', 'none', 'not_provided'], after: ['red', 'artifact'], changed: true, attackKey: 'JNCSF-163' },
  { n: 167, d: 'Ensure information systems are capable of logging events deemed auditable', cap: 'ops', iso: [], nist: ['AU-2'], req: ['log_source_inventory', 'auditable_event_list'], before: ['yellow', 'testimonial'], after: ['yellow', 'testimonial'] },
  { n: 173, d: 'Establish cadence to review information system audit records and report any unusual activity to appropriate personnel', cap: 'ops', iso: ['12.4.1', '12.4.3'], nist: ['AU-6', 'CM-3'], req: ['siem_use_cases', 'review_schedule', 'escalation_records'], before: ['unknown', 'none', 'not_provided'], after: ['unknown', 'none', 'module_failed'], changed: false },
  { n: 179, d: "Retain audit records for a defined time period consistent with the organization's records retention policy", cap: 'ops', iso: ['18.1.3'], nist: ['AU-11'], req: ['retention_config', 'storage_capacity', 'oldest_record_date'], before: ['unknown', 'none', 'not_provided'], after: ['unknown', 'none', 'module_failed'], changed: false },
  { n: 190, d: 'Implement a continuous monitoring program with security control assessments and status monitoring', cap: 'ops', iso: [], nist: ['CA-7'], req: ['conmon_plan', 'metric_dashboard'], before: ['yellow', 'testimonial'], after: ['yellow', 'testimonial'] },
  { n: 225, d: 'Conduct frequent backups of user- and system-level information in all information systems', cap: 'ops', iso: ['12.3.1'], nist: ['CP-9'], req: ['backup_job_report', 'restore_test_log', 'coverage_by_system'], before: ['unknown', 'none', 'not_provided'], after: ['green', 'artifact'], changed: true },
  { n: 252, d: 'Implement an incident handling capability including preparation, detection and analysis, containment, eradication, and recovery', cap: 'ops', iso: ['16.1.1'], nist: ['IR-4'], req: ['ir_plan', 'playbooks', 'exercise_record'], before: ['yellow', 'testimonial'], after: ['yellow', 'testimonial'] },
  { n: 257, d: 'Require users to report suspected security incidents to the incident response capability within a specified time period', cap: 'ops', iso: ['16.1.2', '16.1.1'], nist: ['IR-6'], req: ['reporting_procedure', 'sla_definition', 'awareness_material'], before: ['yellow', 'testimonial'], after: ['green', 'artifact'], changed: true },
  { n: 307, d: 'Scan for vulnerabilities in information systems and hosted applications', cap: 'ops', iso: ['12.6.1'], nist: ['RA-5'], req: ['scanner_config', 'scan_coverage', 'remediation_sla'], before: ['unknown', 'none', 'not_provided'], after: ['red', 'artifact'], changed: true, attackKey: 'JNCSF-307' },
  { n: 382, d: 'Configure information systems to protect the confidentiality and integrity of information at rest', cap: 'ops', iso: [], nist: ['SC-28'], req: ['bitlocker_state', 'server_encryption_state', 'key_escrow'], before: ['unknown', 'none', 'not_provided'], after: ['yellow', 'artifact'], changed: true },
  { n: 394, d: 'Install and regularly update malware detection and repair software to scan computers and media', cap: 'ops', iso: ['12.2.1'], nist: [], req: ['defender_status', 'signature_age', 'coverage_by_host'], before: ['yellow', 'testimonial'], after: ['green', 'artifact'], changed: true, attackKey: 'JNCSF-394', share: 80, exception: 'Contractor-managed workstations excluded from managed AV' },
  { n: 407, d: 'Identify, report, and correct information system flaws', cap: 'ops', iso: [], nist: ['SI-2'], req: ['patch_compliance_report', 'sla_adherence', 'exception_register'], before: ['unknown', 'none', 'not_provided'], after: ['red', 'artifact'], changed: true },
  { n: 435, d: 'Establish multifactor authentication for local and network access to privileged accounts and for network access to non-privileged accounts', cap: 'ops', iso: [], nist: [], req: ['mfa_policy', 'privileged_enrolment', 'nonprivileged_enrolment'], before: ['yellow', 'testimonial'], after: ['red', 'artifact'], changed: true, attackKey: 'JNCSF-435', exception: '43 of 512 privileged accounts without MFA' },
  { n: 437, d: 'Establish minimum password complexity, password change, and reuse restriction protocols', cap: 'ops', iso: [], nist: [], req: ['password_policy_export', 'history_setting', 'min_length'], before: ['unknown', 'none', 'not_provided'], after: ['green', 'artifact'], changed: true },

  { n: 438, d: 'Establish cadence to review and update control policies', cap: 'found', iso: ['5.1.2'], nist: ['AC-1', 'AT-1', 'AU-1'], req: ['review_schedule', 'last_review_date', 'change_log'], before: ['green', 'artifact'], after: ['green', 'artifact'] },
  { n: 440, d: 'Ensure all information systems enforce access rights restrictions consistent with control policies', cap: 'found', iso: ['9.4.1'], nist: ['AC-3'], req: ['acl_export', 'enforcement_test', 'deny_by_default_flag'], before: ['yellow', 'testimonial'], after: ['green', 'artifact'], changed: true, attackKey: 'JNCSF-440' },
  { n: 459, d: 'Provide ongoing security awareness training to employees and contractors upon hiring with continued training at regularly defined intervals', cap: 'found', iso: ['7.2.2'], nist: ['AT-2'], req: ['lms_completion_export', 'curriculum', 'cadence'], before: ['yellow', 'testimonial'], after: ['yellow', 'artifact'], changed: true, share: 78, maxAge: 365 },
  { n: 465, d: 'Document, monitor, and retain individual information system security training activities and records', cap: 'found', iso: [], nist: ['AT-4'], req: ['training_records_export', 'retention_period'], before: ['unknown', 'none', 'not_provided'], after: ['green', 'artifact'], changed: true },
  { n: 479, d: 'Sanitize media prior to disposal in accordance with organizational policies', cap: 'found', iso: ['8.3.2', '11.2.7'], nist: ['MP-6'], req: ['sanitisation_procedure', 'destruction_certificates'], before: ['unknown', 'none', 'uncollectable_by_design'], after: ['unknown', 'none', 'uncollectable_by_design'] },
  { n: 512, d: 'Establish a process to screen all individuals filling organizational positions', cap: 'found', iso: ['7.1.1'], nist: ['PS-2'], req: ['screening_policy', 'completion_records'], before: ['unknown', 'none', 'declined'], after: ['unknown', 'none', 'declined'] },
  { n: 515, d: 'Revoke all authenticators and security-related property upon termination of employment', cap: 'found', iso: ['8.1.4', '13.2.4'], nist: ['PS-4'], req: ['leavers_feed', 'revocation_latency', 'asset_return_log'], before: ['yellow', 'testimonial'], after: ['red', 'artifact'], changed: true },
  { n: 538, d: 'Conduct assessments of risk on all projects, including likelihood or harm from unauthorized access, use, modification or destruction', cap: 'found', iso: ['6.1.5'], nist: ['RA-3'], req: ['risk_assessment_records', 'methodology_document'], before: ['green', 'artifact'], after: ['green', 'artifact'] },
  { n: 573, d: 'Design and apply physical protection against natural disasters, malicious attacks, and accidents', cap: 'found', iso: ['11.1.4'], nist: [], req: ['facility_assessment', 'environmental_controls_report'], before: ['unknown', 'none', 'uncollectable_by_design'], after: ['unknown', 'none', 'uncollectable_by_design'] },
];

// Controls requiring an organisational arrangement (an assigned authorising official, a
// documented separation-of-duties review) that no module can observe. Of 66 authored
// controls framework-wide, 7 have no conclusive path at all; these 3 are represented in
// the seeded catalogue below.
const NO_CONCLUSIVE_PATH_NUMS = new Set([6, 20, 100]);

// Exactly one control is 'uncertainty' rather than 'by_rule' or 'judgement' — the
// recoverable case (brief: "of 115 signals, exactly one is false through uncertainty").
const UNCERTAINTY_NUMS = new Set([32]);

// Documentary/policy controls — a document existing doesn't prove the practice is
// followed, so absence of a finding proves nothing.
const BY_RULE_NUMS = new Set([1, 3, 6, 14, 20, 25]);

// Controls where a named mechanism (a review process, a declined request) makes an
// absent finding uninformative rather than proof of a gap.
const JUDGEMENT_NUMS = new Set([100, 190, 252, 479, 512, 538, 573]);

function evidenceBasisFor(n: number, evidenceClass: EvidenceClass): EvidenceBasis {
  if (UNCERTAINTY_NUMS.has(n)) return 'uncertainty';
  if (BY_RULE_NUMS.has(n)) return 'by_rule';
  if (JUDGEMENT_NUMS.has(n)) return 'judgement';
  if (evidenceClass === 'artifact') return 'negative_capable';
  return 'judgement';
}

export const controls: Control[] = seeds.map((s) => {
  const before = S(s.before[0], s.before[1], [], s.before[2]);
  const after = S(s.after[0], s.after[1], [], s.after[2]);
  return {
    id: `JNCSF-${s.n}`,
    num: s.n,
    description: s.d,
    capability: s.cap,
    iso: s.iso,
    isoNames: isoNamesFor(s.iso),
    nist: s.nist,
    nistNames: nistNamesFor(s.nist),
    requiredSignals: s.req,
    attackKey: s.attackKey,
    deploymentSharePct: s.share,
    exceptionPopulation: s.exception,
    populationNote: s.population,
    maxAgeDays: s.maxAge ?? 90,
    before,
    after,
    changed: s.changed ?? false,
    showcase: s.showcase,
    evidenceBasis: evidenceBasisFor(s.n, after.evidenceClass),
    noConclusivePath: NO_CONCLUSIVE_PATH_NUMS.has(s.n),
  };
});

export const controlById = (id: string) => controls.find((c) => c.id === id);

export function snapshotFor(c: Control, uploaded: boolean): ControlSnapshot {
  return uploaded ? c.after : c.before;
}

// Gap-reason breakdown of the Unknowns (brief §6.4). `not_requested` is a design
// invariant — a non-zero value indicates a defect. `before` sums to 207, `after` to 59 —
// reconciling exactly to TOTALS.before.unknown / TOTALS.after.unknown in capabilities.ts.
export interface GapReasonRow {
  reason: GapReason;
  before: number;
  after: number;
  invariant?: boolean;
}

export const GAP_REASON_BREAKDOWN: GapReasonRow[] = [
  { reason: 'not_provided', before: 117, after: 7 },
  { reason: 'uncollectable_by_design', before: 39, after: 39 },
  { reason: 'insufficient_signal', before: 23, after: 3 },
  { reason: 'declined', before: 15, after: 5 },
  { reason: 'insufficient_permission', before: 8, after: 3 },
  { reason: 'stale', before: 5, after: 2 },
  { reason: 'not_requested', before: 0, after: 0, invariant: true },
];

/** Structurally uncollectable controls — no supported method can ever reach them,
 *  regardless of what evidence is provided. Constant before/after (brief §6.4). */
export const UNCOLLECTABLE_COUNT = 39;

// Evidence-signal basis breakdown, framework-wide (brief §Change 7). Of 115 signals,
// exactly one is false through uncertainty rather than rule or judgement — the
// recoverable case, distinct from a documentary limit or a deliberate design choice.
export interface EvidenceBasisRow {
  basis: EvidenceBasis;
  count: number;
}

export const EVIDENCE_BASIS_BREAKDOWN: EvidenceBasisRow[] = [
  { basis: 'negative_capable', count: 68 },
  { basis: 'by_rule', count: 31 },
  { basis: 'judgement', count: 15 },
  { basis: 'uncertainty', count: 1 },
];
// 68 + 31 + 15 + 1 = 115
export const EVIDENCE_SIGNAL_TOTAL = 115;

// No-conclusive-path controls (brief §Change 7): require an organisational arrangement
// rather than a system state. Can reach Partial on documentary evidence, but never
// Compliant without analyst attestation.
export const NO_CONCLUSIVE_PATH_STATS = {
  authoredTotal: 66,
  noPath: 7,
  seededNoPath: 3,
};

export const GAP_REASON_LABEL: Record<GapReason, string> = {
  not_provided: 'Not provided',
  declined: 'Declined by client',
  module_failed: 'Module failed',
  insufficient_permission: 'Insufficient permission',
  unparseable: 'Unparseable',
  stale: 'Stale',
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

// State ceiling permitted by each evidence class (brief §8).
export const EVIDENCE_CEILING: Record<EvidenceClass, ControlState> = {
  none: 'unknown',
  testimonial: 'yellow',
  artifact: 'green',
  analyst_signed: 'green',
};
