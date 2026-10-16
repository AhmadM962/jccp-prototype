// lib/scoring.ts — pure, deterministic bounded-score math (brief §8).

import type { ShareBasis } from '../data/controls';

export const WEIGHTS = { green: 1.0, red: 0.0 } as const;

// Yellow partial-credit quartiles by deployment share (a fraction of the estate, 0–1).
export const YELLOW_QUARTILE = { q1: 0.85, q2: 0.5, q3: 0.25, q4: 0.1 };
// q1: share >= 0.75, q2: >= 0.5, q3: >= 0.25, q4: >= 0

export const YELLOW_QUARTILE_NAME = {
  1: 'top quartile',
  2: 'second quartile',
  3: 'third quartile',
  4: 'bottom quartile',
} as const;

export function yellowQuartileForShare(share: number): 1 | 2 | 3 | 4 {
  if (share >= 0.75) return 1;
  if (share >= 0.5) return 2;
  if (share >= 0.25) return 3;
  return 4;
}

/** Partial credit a Yellow control earns for its deployment share. A `claimed` share — one a
 *  person asserted rather than one counted from collected data — is capped at the second
 *  quartile however high the claim. Whether a share is claimed is a fact in the data
 *  (`ControlSnapshot.deploymentShareBasis`); this function only applies the rule. An unknown
 *  share keeps the flat 0.5. */
export function yellowWeightForShare(share: number | undefined, basis: ShareBasis = 'measured'): number {
  if (share === undefined) return 0.5;
  const credit = YELLOW_QUARTILE[`q${yellowQuartileForShare(share)}` as keyof typeof YELLOW_QUARTILE];
  return basis === 'claimed' ? Math.min(credit, YELLOW_QUARTILE.q2) : credit;
}

export interface BoundedScore {
  lower: number;
  upper: number;
  coverage: number;
  width: number;
  confidence: number;
}

/** Thrown when a figure fails a consistency check. Carries the `where` of the guard that fired so
 *  the boundary that catches it (components/FigureBoundary.tsx) can log it and tell it apart from
 *  an ordinary bug, which it must not swallow. */
export class IntervalConsistencyError extends Error {
  readonly where: string;
  constructor(where: string, message: string) {
    super(message);
    this.name = 'IntervalConsistencyError';
    this.where = where;
  }
}

/** An interval whose lower bound exceeds its upper bound is impossible. A wrong number that
 *  renders is worse than none, so this throws; FigureBoundary turns the throw into a withheld
 *  figure and an honest message instead of a blank page. */
export function assertInterval(lower: number, upper: number, where: string): void {
  if (lower > upper) {
    throw new IntervalConsistencyError(where, `Impossible interval in ${where}: lower ${lower} > upper ${upper}`);
  }
}

/** The runtime guard at the point where an interval reaches the screen (called by
 *  `ScoreInterval`, which every drawn band passes through). Throws unless lower <= upper and,
 *  when a width is given, the width equals upper - lower: the band, the headline numbers and any
 *  caption built from the same width cannot disagree. Units are whatever the caller uses, as
 *  long as lower, upper and width share them. */
export function assertDisplayedInterval(lower: number, upper: number, width: number | undefined, where: string): void {
  assertInterval(lower, upper, where);
  if (width !== undefined && Math.abs(width - (upper - lower)) > 1e-6) {
    throw new IntervalConsistencyError(
      where,
      `Displayed interval inconsistent in ${where}: width ${width} != upper ${upper} - lower ${lower}`,
    );
  }
}

export function boundedScore(
  applicable: number,
  green: number,
  yellow: number,
  red: number,
  unknown: number,
  yellowWeight = 0.5,
): BoundedScore {
  const numerator = green * WEIGHTS.green + yellow * yellowWeight + red * WEIGHTS.red;
  const lower = numerator / applicable; // all unknowns fail
  const upper = (numerator + unknown) / applicable; // all unknowns pass
  assertInterval(lower, upper, 'boundedScore');
  return {
    lower,
    upper,
    coverage: (applicable - unknown) / applicable,
    width: unknown / applicable,
    confidence: 1 - unknown / applicable,
  };
}

export const pct = (x: number, digits = 1) => `${(x * 100).toFixed(digits)}%`;
export const pts = (x: number, digits = 1) => `${(x * 100).toFixed(digits)} points`;

/**
 * Project what happens when an artifact that unlocks `controlsUnlocked` currently-unknown
 * controls is provided. The unlocked controls become *known* — but "known" can mean pass
 * or fail, so the honest projection is an outcome range, not a single narrower band.
 *
 * `n` = how many Unknowns actually get resolved (capped at the Unknown pool).
 * The band narrows by exactly `n / applicable` — that reduction is certain regardless of
 * how the resolved controls land. The *position* of the band is bracketed by best case
 * (all resolved controls pass) and worst case (all fail).
 */
export function projectProvision(
  applicable: number,
  green: number,
  yellow: number,
  unknown: number,
  controlsUnlocked: number,
  uncollectable = 0,
  yellowWeight = 0.5,
) {
  return projectFromNumerator(applicable, green * WEIGHTS.green + yellow * yellowWeight, unknown, uncollectable, controlsUnlocked);
}

/**
 * The same projection from a credit numerator (what the bounds are built from) instead of bucket counts
 * and a flat Partial weight. `unresolvable` is how many of the Unknowns the plan's evidence cannot resolve: the
 * structurally uncollectable ones and, since Round 2, those with no authored evidence requirement. Only
 * the rest — the collectable pool — can be resolved by providing artifacts. (An unauthored control can still be
 * observed unmet by an artifact collected for another control; the plan cannot count on that.)
 */
export function projectFromNumerator(
  applicable: number,
  numerator: number,
  unknown: number,
  unresolvable: number,
  controlsUnlocked: number,
) {
  const collectable = Math.max(0, unknown - unresolvable);
  const n = Math.min(controlsUnlocked, collectable);
  const num = numerator;
  const remainingUnknown = unknown - n;
  assertInterval((num + n) / applicable, (num + n + remainingUnknown) / applicable, 'projectProvision best case');
  assertInterval(num / applicable, (num + remainingUnknown) / applicable, 'projectProvision worst case');
  return {
    resolved: n,
    widthReductionPts: (n / applicable) * 100,
    resultingWidthPts: (remainingUnknown / applicable) * 100,
    bestCase: {
      lower: (num + n) / applicable,
      upper: (num + n + remainingUnknown) / applicable,
    },
    worstCase: {
      lower: num / applicable,
      upper: (num + remainingUnknown) / applicable,
    },
  };
}

/** The narrowest the band can get from the evidence the plan asks for: the controls it cannot resolve stay Unknown,
 *  so the band keeps at least `unresolvable / applicable` of width. In percentage points. */
export const bandFloorPts = (applicable: number, unresolvable: number) =>
  (unresolvable / applicable) * 100;

/**
 * Apply a set of analyst overrides to a bucket of aggregate counts and return the
 * adjusted buckets. `engineStateOf` maps an overridden control id to the state the engine
 * assigned it (so we know which bucket to move it out of). Controls whose override equals
 * the engine verdict are a no-op.
 */
export interface Buckets {
  applicable: number;
  green: number;
  yellow: number;
  red: number;
  unknown: number;
}

export function applyOverrides(
  base: Buckets,
  overrides: Record<string, string>,
  engineStateOf: (id: string) => 'green' | 'yellow' | 'red' | 'grey' | 'unknown' | undefined,
): { buckets: Buckets; activeCount: number } {
  const b: Buckets = { ...base };
  let activeCount = 0;
  const key = (s: string) => (s === 'grey' ? undefined : (s as keyof Buckets));
  for (const [id, next] of Object.entries(overrides)) {
    const prev = engineStateOf(id);
    if (!prev || prev === next) continue;
    const from = key(prev);
    const to = key(next);
    if (from && from in b) (b[from] as number) -= 1;
    if (to && to in b) (b[to] as number) += 1;
    activeCount += 1;
  }
  return { buckets: b, activeCount };
}

// Assurance ladder (brief §7.5).
export const ASSURANCE_LEVELS = [
  { id: 'L0', name: 'Declared' },
  { id: 'L1', name: 'Documented' },
  { id: 'L2', name: 'Tool-evidenced' },
  { id: 'L3', name: 'Analyst-signed' },
] as const;
