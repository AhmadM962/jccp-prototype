// Coverage + gap-taxonomy helpers.

import { TOTALS } from '../data/capabilities';

export interface CoverageBreakdown {
  evidenced: number; // artifact-backed
  testimonyOnly: number;
  unevidenced: number;
  uncollectable: number;
  applicable: number;
}

// Before/after coverage donut segments (brief §7.5 Card 2).
export const coverageBreakdown = (uploaded: boolean): CoverageBreakdown => {
  if (!uploaded) {
    // 214 evidenced of which 40 are testimony-only (the Yellows); 126 unknown, 24 uncollectable.
    return { evidenced: 174, testimonyOnly: 40, unevidenced: 102, uncollectable: 24, applicable: TOTALS.applicable };
  }
  return { evidenced: 244, testimonyOnly: 60, unevidenced: 12, uncollectable: 24, applicable: TOTALS.applicable };
};

export const completenessStatement = (uploaded: boolean) => {
  const t = uploaded ? TOTALS.after : TOTALS.before;
  return {
    covered: t.evidenced,
    applicable: TOTALS.applicable,
    unevidenced: t.unknown,
    uncollectable: 24,
    assurance: uploaded ? 'L2 — Tool-evidenced' : 'L1 — Documented',
  };
};
