// Exact fractions [numerator, denominator]. The engine's figures are rationals, so sums can be asserted
// exactly (no rounding drift) and a value is only turned into a decimal when it is displayed.

import type { Frac } from '../data/ministry';

const gcd = (a: number, b: number): number => (b === 0 ? Math.abs(a) : gcd(b, a % b));

function safe(n: number): number {
  if (!Number.isSafeInteger(n)) throw new Error(`fraction arithmetic left the safe-integer range: ${n}`);
  return n;
}

export const frac = (n: number, d = 1): Frac => {
  if (d === 0) throw new Error('fraction with a zero denominator');
  const g = gcd(n, d) || 1;
  const s = d < 0 ? -1 : 1;
  return [(s * n) / g, (s * d) / g];
};

export const add = (a: Frac, b: Frac): Frac => frac(safe(a[0] * b[1] + b[0] * a[1]), safe(a[1] * b[1]));
export const sub = (a: Frac, b: Frac): Frac => frac(safe(a[0] * b[1] - b[0] * a[1]), safe(a[1] * b[1]));
export const mul = (a: Frac, b: Frac): Frac => frac(safe(a[0] * b[0]), safe(a[1] * b[1]));
export const div = (a: Frac, b: Frac): Frac => frac(safe(a[0] * b[1]), safe(a[1] * b[0]));
export const sum = (xs: readonly Frac[]): Frac => xs.reduce<Frac>((acc, x) => add(acc, x), [0, 1]);
export const eq = (a: Frac, b: Frac): boolean => safe(a[0] * b[1]) === safe(b[0] * a[1]);
export const toNumber = (f: Frac): number => f[0] / f[1];
/** A fraction of one, as a percentage / percentage points. */
export const toPct = (f: Frac): number => (f[0] * 100) / f[1];
export const fmtPct = (f: Frac, digits = 2): string => toPct(f).toFixed(digits);
