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

// Assurance ladder (brief §7.5).
export const ASSURANCE_LEVELS = [
  { id: 'L0', name: 'Declared', definition: 'Profile declared; no evidence of any kind supplied.' },
  { id: 'L1', name: 'Documented', definition: 'Policy and testimonial evidence only; no machine-collected artifacts.' },
  { id: 'L2', name: 'Tool-evidenced', definition: 'Machine-collected artifacts corroborate a majority of controls.' },
  { id: 'L3', name: 'Analyst-signed', definition: 'An accredited assessor has reviewed and signed the evidence set.' },
] as const;
