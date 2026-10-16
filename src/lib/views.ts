// The four published views and the width decomposition, from the exact-fraction figures in
// src/data/profiles (read through src/data/current.ts). Everything here is arithmetic on those fractions; nothing is typed in.

import { CURRENT, type Frac, type StateFigures, type ViewFigures, type ViewId, type WidthParts } from '../data/current';
import type { GapReason } from '../data/controls';
import { APPLICABLE_CONTROLS } from '../data/figures';
import { add, eq, sub, toPct } from './frac';
import { IntervalConsistencyError } from './scoring';

export const VIEW_ORDER: ViewId[] = ['unweighted', 'weighted_including_underived', 'weighted_derived_only', 'authored_scope'];

export const VIEW_LABEL: Record<ViewId, string> = {
  unweighted: 'Unweighted',
  weighted_including_underived: 'Weighted, including underived',
  weighted_derived_only: 'Weighted, derived only',
  authored_scope: 'Authored scope',
};

/** The label `authored_scope` always carries. It is the flattering view, so it announces itself. */
export const AUTHORED_SCOPE_LABEL = 'Covers only applicable controls with at least one authored evidence path.';

export const stateFor = (uploaded: boolean): StateFigures => (uploaded ? CURRENT.after : CURRENT.before);

export interface ViewPercents {
  lowerPct: number;
  upperPct: number;
  widthPts: number;
  coveragePct: number;
  applicable: number;
  unknown: number;
  known: number;
}

export const widthOf = (v: ViewFigures): Frac => sub(v.upper, v.lower);

export function viewPercents(v: ViewFigures): ViewPercents {
  return {
    lowerPct: toPct(v.lower),
    upperPct: toPct(v.upper),
    widthPts: toPct(widthOf(v)),
    coveragePct: toPct(v.coverage),
    applicable: v.applicable,
    unknown: v.unknown,
    known: v.known,
  };
}

export type WidthCause = keyof WidthParts;

/** Whose limitation each cause of width is. The wording the screen uses. */
export const WIDTH_OWNER: Record<WidthCause, string> = {
  unauthored: "the tool's limitation",
  unevidenced: "the organisation's",
  uncollectable: 'structural',
};

export interface WidthPart {
  cause: WidthCause;
  frac: Frac;
  pts: number;
}

export const widthParts = (w: WidthParts): WidthPart[] =>
  (['unauthored', 'unevidenced', 'uncollectable'] as const).map((cause) => ({ cause, frac: w[cause], pts: toPct(w[cause]) }));

/** The three causes sum EXACTLY to the width. Asserted, in exact arithmetic, wherever they are shown. */
export function assertWidthPartsSum(parts: WidthParts, width: Frac, where: string): void {
  const total = add(add(parts.unauthored, parts.unevidenced), parts.uncollectable);
  if (!eq(total, width)) {
    throw new IntervalConsistencyError(where, `Width parts do not sum to the width in ${where}: ${total[0]}/${total[1]} != ${width[0]}/${width[1]}`);
  }
}

export const assertWidthSums = (v: ViewFigures, where: string): void => assertWidthPartsSum(v.width, widthOf(v), where);

export interface ReasonRow {
  reason: GapReason;
  count: number;
  /** points of width, on the unweighted view: count / applicable controls */
  pts: number;
}

/** The organisation's share of the width, itemised by reason (unweighted view). */
export function unevidencedRows(state: StateFigures): ReasonRow[] {
  return (Object.entries(state.unevidencedByReason) as [GapReason, number][])
    .filter(([, n]) => n > 0)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([reason, count]) => ({ reason, count, pts: (count * 100) / APPLICABLE_CONTROLS }));
}
