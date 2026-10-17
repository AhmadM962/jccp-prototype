// Risk weighting — derived from NIST SP 800-53B baselines. An additive disclosure: the unweighted view
// remains the default presentation, and the interval never collapses to a single percentage.
//
// Since Round 2 every figure here is computed from src/data/profiles (read through src/data/current.ts). The table counts the controls
// this assessment applies to (the applicable ones), because that is the population the weighted totals
// are computed over; the earlier table counted all 576 controls in the framework next to totals over 557,
// which is why they did not agree.

import { CURRENT } from './current';
import { toNumber } from '../lib/frac';

export interface RiskWeightRow {
  basis: string;
  controls: number;
  weight: number;
  /** true for the row of controls with no NIST correspondence at all */
  underived?: boolean;
}

import { lazyByProfile } from '../lib/lazyByProfile';

const sum = (o: Record<string, number>) => Object.values(o).reduce((a, b) => a + b, 0);

/** Applicable controls by risk-weight basis. Weights are the engine's published values. */
export const RISK_WEIGHT_TABLE: RiskWeightRow[] = lazyByProfile(() => {
  const C = CURRENT.weightBasisCounts;
  return [
    { basis: 'NIST Low baseline', controls: C.applicable.nist_baseline_low, weight: 1.0 },
    { basis: 'NIST Moderate baseline', controls: C.applicable.nist_baseline_moderate, weight: 0.7 },
    { basis: 'NIST High baseline', controls: C.applicable.nist_baseline_high, weight: 0.5 },
    { basis: 'NIST, no baseline', controls: C.applicable.nist_no_baseline, weight: 0.5 },
    { basis: 'Underived', controls: C.applicable.underived, weight: 1.0, underived: true },
  ];
}, 'array');

/** Controls the table counts (all applicable controls). */
export const RISK_WEIGHT_TABLE_TOTAL = (): number => RISK_WEIGHT_TABLE.reduce((a, r) => a + r.controls, 0);

/** Share of the applicable controls that carry no derived weight, in whole per cent. */
export const underivedSharePct = (): number => Math.round((CURRENT.weightBasisCounts.applicable.underived * 100) / sum(CURRENT.weightBasisCounts.applicable));

// Two totals, always shown together. Never present one as derivable from the other; the gap between them is the
// weight of the underived controls, real uncertainty about weight and not noise to be averaged away. Total weights,
// from the published views.
export const RISK_WEIGHTED_TOTALS = lazyByProfile(() => {
  const derivedOnly = toNumber(CURRENT.after.views.weighted_derived_only.totalWeight);
  const includingUnderived = toNumber(CURRENT.after.views.weighted_including_underived.totalWeight);
  return { derivedOnly, includingUnderived, gap: +(includingUnderived - derivedOnly).toFixed(1) };
});

// The same weights over every control in the framework, before the not-applicable ones are set aside: a
// different population from the totals above, not a different answer. Weights in tenths to stay exact.
const tenths = (o: Record<string, number>) =>
  o.nist_baseline_low * 10 + o.nist_baseline_moderate * 7 + o.nist_baseline_high * 5 + o.nist_no_baseline * 5;
export const FRAMEWORK_WEIGHTED_TOTALS = lazyByProfile(() => {
  const C = CURRENT.weightBasisCounts;
  return {
    controls: sum(C.framework),
    excluded: sum(C.excluded),
    underived: C.framework.underived,
    derivedOnly: tenths(C.framework) / 10,
    includingUnderived: (tenths(C.framework) + C.framework.underived * 10) / 10,
  };
});

export const riskWeightingExplainer = (): string =>
  `${underivedSharePct()}% of the applicable controls carry no derived weight because those controls have no NIST ` +
  'correspondence. They contribute at full weight so that uncertainty never reduces the ' +
  'assessment — and the derived-only figure is published alongside.';
