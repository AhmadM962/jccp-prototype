// lib/scoring.ts — pure, deterministic bounded-score math (brief §8).

export const WEIGHTS = { green: 1.0, red: 0.0 } as const;

// Yellow partial-credit quartiles by deployment share.
export const YELLOW_QUARTILE = { q1: 0.85, q2: 0.5, q3: 0.25, q4: 0.1 };
// q1: share >= 75%, q2: 50-75%, q3: 25-50%, q4: < 25%

export function yellowWeightForShare(sharePct: number | undefined): number {
  if (sharePct === undefined) return 0.5;
  if (sharePct >= 75) return YELLOW_QUARTILE.q1;
  if (sharePct >= 50) return YELLOW_QUARTILE.q2;
  if (sharePct >= 25) return YELLOW_QUARTILE.q3;
  return YELLOW_QUARTILE.q4;
}

export interface BoundedScore {
  lower: number;
  upper: number;
  coverage: number;
  width: number;
  confidence: number;
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
  return {
    lower: numerator / applicable, // all unknowns fail
    upper: (numerator + unknown) / applicable, // all unknowns pass
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
  yellowWeight = 0.5,
) {
  const n = Math.min(controlsUnlocked, unknown);
  const num = green * WEIGHTS.green + yellow * yellowWeight;
  const remainingUnknown = unknown - n;
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
