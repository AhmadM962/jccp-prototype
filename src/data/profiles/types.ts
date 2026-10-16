// The shape of an engine assessment as the prototype holds it. The three profile modules beside this file are
// GENERATED (docs/evidence/derive_profiles.py) from the engine's golden outputs and conform to `ProfileData`.
//
// Every fraction is [numerator, denominator]. A figure read from a golden file is `measured`; the before-upload
// state is rule R's projection of the same data and is `illustrative` (see src/components/Provenance.tsx).

/** An exact fraction [numerator, denominator]. */
export type Frac = readonly [number, number];
export type ViewId = 'unweighted' | 'weighted_including_underived' | 'weighted_derived_only' | 'authored_scope';
export type CapabilityId = 'arch' | 'dev' | 'del' | 'ops' | 'found';
export type ProfileId = 'ministry' | 'bank' | 'utility';

/** Why a control is Unknown. `future_dated` is the engine's, and arrives with the bank profile. */
export type GapReason =
  | 'unauthored'
  | 'not_provided'
  | 'declined'
  | 'module_failed'
  | 'insufficient_permission'
  | 'unparseable'
  | 'stale'
  | 'future_dated'
  | 'insufficient_signal'
  | 'uncollectable_by_design'
  | 'not_requested';

export type ControlState = 'green' | 'yellow' | 'red' | 'unknown';
export type EvidenceClass = 'none' | 'testimonial' | 'artifact' | 'analyst_signed';
export type EvidenceKind = 'testimony' | 'document' | 'machine_collected' | 'analyst_attestation';
/** Which ground a Gap rests on: absence (a negative-capable signal from a successful run), an observation, or a
 *  respondent's own statement of non-enforcement. */
export type GapBasis = 'absence' | 'observed' | 'testimonial_admission';
export type PartialBasis = 'share' | 'indicative_path' | 'monitor_only' | 'testimonial' | 'pilot';
export type WeightBasis = 'nist_baseline_low' | 'nist_baseline_moderate' | 'nist_baseline_high' | 'nist_no_baseline' | 'underived';
export type AssuranceLevelId = 'L0' | 'L1' | 'L2' | 'L3';

export interface WidthParts {
  /** the tool's limitation: no evidence requirement authored */
  unauthored: Frac;
  /** the organisation's: a requirement exists and evidence was not (or could not be) provided */
  unevidenced: Frac;
  /** structural: no supported method can reach it */
  uncollectable: Frac;
}

export interface ViewFigures {
  applicable: number;
  unknown: number;
  known: number;
  lower: Frac;
  upper: Frac;
  coverage: Frac;
  totalWeight: Frac;
  width: WidthParts;
}

export interface CapabilityFigures {
  applicable: number;
  authored: number;
  green: number;
  yellow: number;
  red: number;
  unknown: number;
  unknownUnauthored: number;
  creditNumerator: Frac;
}

export interface StateFigures {
  green: number;
  yellow: number;
  red: number;
  unknown: number;
  unknownUnauthored: number;
  unevidencedByReason: Partial<Record<GapReason, number>>;
  /** total credit earned by the Partial controls */
  partialCredit: Frac;
  /** green controls plus partial credit: the numerator of the unweighted lower bound */
  creditNumerator: Frac;
  views: Record<ViewId, ViewFigures>;
  capabilities: Record<CapabilityId, CapabilityFigures>;
}

export type CheckCause = 'declined_module' | 'unresolved_profile_challenge' | 'unusable_evidence_proportion' | 'na_rate_above_baseline';
export type CheckStatus = 'passed' | 'triggered' | 'not_assessed';
/** One of the engine's demotion checks. An assessed check carries its measured value (count of `of`) and the
 *  threshold it was compared with; a check that could not run carries neither. `detail` is the engine's own. */
export interface DemotionCheck {
  cause: CheckCause;
  status: CheckStatus;
  count: number | null;
  of: number | null;
  threshold: Frac | null;
  detail: string;
  components: readonly (readonly [string, number])[];
}

export interface ShareInterval {
  basis: string;
  lower: number;
  upper: number;
  lowerBoundSource: string;
  census: unknown;
}

/** Testimony the conclusion went against, retained on the claim with what contradicted it (the engine's words). */
export interface ContradictedTestimony {
  basis: string;
  contradictedBy: string;
  locator: string;
  signalKey: string;
  stance: string;
  respondentRole: string;
  sourceRef: string;
}

/** One claim: the engine's verdict on one applicable control, with the grounds it recorded. */
export interface Claim {
  id: string;
  capability: CapabilityId;
  weight: Frac;
  weightBasis: WeightBasis;
  /** false when no evidence requirement has been authored for this control */
  authored: boolean;
  state: ControlState;
  evidenceClass: EvidenceClass;
  evidenceKind?: EvidenceKind;
  gapReason?: GapReason;
  gapBasis?: GapBasis;
  partialBasis?: PartialBasis;
  /** the evidence path that was satisfied (the engine's label) */
  pathLabel?: string;
  /** the module run that justifies an absence-based Gap */
  runId?: string;
  share?: { value: number | null; basis: string | null; interval: ShareInterval | null };
  enforcement?: { mode: string; basis: string | null };
  population?: string;
  exceptionPopulation?: unknown;
  reasoning?: string;
  contradicted?: readonly ContradictedTestimony[];
  overruled?: readonly unknown[];
  /** the credit this verdict earns: Compliant 1, Gap 0, a Partial by its basis. Absent for Unknown. */
  credit?: Frac;
  /** rule R: whether this verdict exists before an evidence bundle (it rests on testimony or a document) */
  beforeVerdict: boolean;
}

export interface Attack {
  exposure: string;
  broadCount: number;
  diffuseCount: number;
  /** techniques the engine withheld from the list, and the count it withheld */
  suppressedCount: number;
  techniqueIds: readonly string[];
}

/** One ranked action. Items of equal magnitude share a rank; their order within the rank is presentation only. */
export interface RankItem {
  rank: number;
  controlId: string;
  actionType: string;
  description: string;
  effort: number | null;
  tieGroupSize: number;
  signalsRequested: readonly string[];
  magnitude: Frac;
  magnitudePoints: number;
  unweightedMagnitude: Frac;
  unweightedMagnitudePoints: number;
  attack: Attack;
}

export interface Exclusion {
  controlId: string;
  justification: string;
  reason: string;
  triggeringFlag: string;
  triggeringValue: string;
}

export interface DualCounts {
  counts: { impliedCovered: number; impliedGap: number; impliedPartial: number; unknown: number };
  excludedCodeCount: number;
  reachableCodeCount: number;
  standard: string;
}

export interface ProfileData {
  id: ProfileId;
  source: { file: string; sha256: string };
  framework: { name: string; version: string };
  asOf: string;
  parameters: Record<string, unknown>;
  cicsc: {
    applies: boolean;
    basis: string;
    criticalInfrastructure: string;
    sectorCode: string;
    sectorName: string;
    sectorNameArabic: string;
  };
  totals: { framework: number; applicable: number; excluded: number };
  exclusions: readonly Exclusion[];
  before: StateFigures;
  after: StateFigures;
  weightBasisCounts: { applicable: Record<string, number>; framework: Record<string, number>; excluded: Record<string, number> };
  assurance: {
    distribution: Record<AssuranceLevelId, number>;
    proportionThreshold: Frac;
    reported: AssuranceLevelId;
    baseLevel: AssuranceLevelId;
    demotionsApplied: number;
    checks: readonly DemotionCheck[];
  };
  assuranceBefore: { distribution: Record<AssuranceLevelId, number>; reported: AssuranceLevelId };
  ruleR: {
    compliant: number;
    compliantMachineCollected: number;
    beforeVerdicts: number;
    beforeVerdictsAtL0OrL1: number;
    /** controls with a verdict and no authored path: observed from an artifact, so they arrive with the bundle */
    verdictsOutsideAuthoredScope: readonly { id: string; state: 'green' | 'yellow' | 'red'; gapBasis: string | null }[];
  };
  /** "coverage implied by mapping, not an assessment": the engine's label, and the projection it labels */
  dual: {
    label: string;
    unmappedControlCount: number;
    iso27002: DualCounts;
    nist80053: DualCounts;
  };
  coverage: {
    gaps: readonly { controls: readonly string[]; reason: string; signalKey: string }[];
    provided: readonly (readonly [string, string])[];
    required: readonly string[];
    uncollectableApplicable: number;
  };
  ranking: {
    items: readonly RankItem[];
    /** controls the ranking cannot act on because no evidence requirement is authored for them */
    unauthoredExcluded: readonly string[];
    uncollectableExcluded: readonly string[];
    conflictingEvidenceExcluded: readonly string[];
    tieOrderNote: string;
  };
  claims: readonly Claim[];
}
