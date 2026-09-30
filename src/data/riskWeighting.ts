// Risk weighting — derived from NIST SP 800-53B baselines (brief §Change 6). A toggle on
// the dashboard; unweighted (the bounded interval in lib/scoring.ts) remains the default
// presentation. This is an additive disclosure, not a replacement for the compliance
// interval — the interval still never collapses to a single percentage.

export interface RiskWeightRow {
  basis: string;
  controls: number;
  weight: number;
  /** true for the row of controls with no NIST correspondence at all */
  underived?: boolean;
}

export const RISK_WEIGHT_TABLE: RiskWeightRow[] = [
  { basis: 'NIST Low baseline', controls: 251, weight: 1.0 },
  { basis: 'NIST Moderate baseline', controls: 72, weight: 0.7 },
  { basis: 'NIST High baseline', controls: 14, weight: 0.5 },
  { basis: 'NIST, no baseline', controls: 66, weight: 0.5 },
  { basis: 'Underived', controls: 173, weight: 1.0, underived: true },
];
// 251 + 72 + 14 + 66 + 173 = 576

export const UNDERIVED_SHARE_PCT = 30; // 173 of 576

// For this ministry profile — two totals, always shown together. Never present one as
// derivable from the other; the 167-control gap between them is real uncertainty, not
// noise to be averaged away.
export const RISK_WEIGHTED_TOTALS = {
  derivedOnly: 331.4,
  includingUnderived: 498.4,
  get gap() {
    return +(this.includingUnderived - this.derivedOnly).toFixed(1);
  },
};

// Under weighting, an unknown high-weight control widens the interval more than a
// low-weight one — width is no longer (100 − coverage). This is the weighted-mode width
// for the current (unresolved) state; it is NOT derivable from coveragePct, and the UI
// must present the two as independent figures.
export const WEIGHTED_WIDTH_PTS = 14.9;

export const RISK_WEIGHTING_EXPLAINER =
  '30% of the framework carries no derived weight because those controls have no NIST ' +
  'correspondence. They contribute at full weight so that uncertainty never reduces the ' +
  'assessment — and the derived-only figure is published alongside.';
