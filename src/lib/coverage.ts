// Coverage + gap-taxonomy helpers.

import { TOTALS } from '../data/capabilities';
import { UNCOLLECTABLE_COUNT, controls } from '../data/controls';

export interface CoverageBreakdown {
  evidenced: number; // artifact-backed (green + red)
  testimonyOnly: number;
  unevidenced: number;
  uncollectable: number;
  applicable: number;
}

// Before/after coverage donut segments (brief §7.5 Card 2). "Evidenced" here is the
// artifact-backed, definitive slice (green + red); yellow (testimony-capped) is shown
// separately, and the unknown pool splits into collectable vs structurally uncollectable.
export const coverageBreakdown = (uploaded: boolean): CoverageBreakdown => {
  const t = uploaded ? TOTALS.after : TOTALS.before;
  return {
    evidenced: t.green + t.red,
    testimonyOnly: t.yellow,
    unevidenced: t.unknown - UNCOLLECTABLE_COUNT,
    uncollectable: UNCOLLECTABLE_COUNT,
    applicable: TOTALS.applicable,
  };
};

/** Unknown controls the evidence bundle resolves, across all applicable controls:
 *  TOTALS.before.unknown − TOTALS.after.unknown. */
export const unknownResolvedByUpload = () => ({
  resolved: TOTALS.before.unknown - TOTALS.after.unknown,
  from: TOTALS.before.unknown,
  to: TOTALS.after.unknown,
});

/** Seeded controls (the clickable sample) whose snapshot the upload changes: `changed: true`. */
export const seededChangedCount = () => ({
  changed: controls.filter((c) => c.changed).length,
  seeded: controls.length,
});

export const completenessStatement = (uploaded: boolean) => {
  const t = uploaded ? TOTALS.after : TOTALS.before;
  return {
    covered: t.evidenced,
    applicable: TOTALS.applicable,
    unevidenced: t.unknown,
    uncollectable: UNCOLLECTABLE_COUNT,
    assurance: uploaded ? 'L2 — Tool-evidenced' : 'L1 — Documented',
  };
};
