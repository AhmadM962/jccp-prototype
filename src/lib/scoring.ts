// lib/scoring.ts — pure, deterministic bounded-score math (brief §8).

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

/** Partial credit a Yellow control earns for its deployment share. A share that rests on
 *  testimony alone is capped at the second quartile however high the claim. An unknown
 *  share keeps the flat 0.5. */
export function yellowWeightForShare(share: number | undefined, testimonyOnly = false): number {
  if (share === undefined) return 0.5;
  const credit = YELLOW_QUARTILE[`q${yellowQuartileForShare(share)}` as keyof typeof YELLOW_QUARTILE];
  return testimonyOnly ? Math.min(credit, YELLOW_QUARTILE.q2) : credit;
}

export interface BoundedScore {
  lower: number;
  upper: number;
  coverage: number;
  width: number;
  confidence: number;
}

/** An interval whose lower bound exceeds its upper bound is impossible. A wrong number that
 *  renders is worse than a crash in a demo of a measurement tool, so this throws. */
export function assertInterval(lower: number, upper: number, where: string): void {
  if (lower > upper) {
    throw new Error(`Impossible interval in ${where}: lower ${lower} > upper ${upper}`);
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
  // Only collectable Unknowns can be resolved by providing artifacts; the uncollectable ones
  // stay Unknown whatever is provided.
  const collectable = Math.max(0, unknown - uncollectable);
  const n = Math.min(controlsUnlocked, collectable);
  const num = green * WEIGHTS.green + yellow * yellowWeight;
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

/** The narrowest the band can ever get: the uncollectable controls stay Unknown, so the band
 *  keeps at least `uncollectable / applicable` of width. In percentage points. */
export const bandFloorPts = (applicable: number, uncollectable: number) =>
  (uncollectable / applicable) * 100;

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
  { id: 'L0', name: 'Declared', definition: 'Profile declared; no evidence of any kind supplied.' },
  { id: 'L1', name: 'Documented', definition: 'Policy and testimonial evidence only; no machine-collected artifacts.' },
  { id: 'L2', name: 'Tool-evidenced', definition: 'Machine-collected artifacts corroborate a majority of controls.' },
  { id: 'L3', name: 'Analyst-signed', definition: 'An accredited assessor has reviewed and signed the evidence set.' },
] as const;
