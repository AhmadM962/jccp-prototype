// Derived dashboard figures: the engine's published verdict (src/data/profiles (read through src/data/current.ts)) plus the effect of
// any active analyst overrides. An override moves one control between buckets, and the unweighted
// interval is re-derived from the buckets — so an override the analyst makes is visible on the
// dashboard, not just on the control page.
//
// Re-deriving needs a credit for a Partial. The engine gives each Partial its own credit; the buckets
// do not carry them, so a Partial moved in or out by an override is taken to hold the average credit of
// the Partials in that state (the published total divided by their number). With no override this
// reproduces the published numerator exactly (asserted in tests).
//
// Overrides apply to the unweighted interval only. The weighted and authored-scope views need
// per-control weights and scope that the buckets do not carry, so those show the engine verdict.

import { controlById, snapshotFor, type ControlState } from '../data/controls';
import { CURRENT, type Frac, type StateFigures, type WidthParts } from '../data/current';
import type { OverrideRecord } from '../store/useAssessment';
import { add, div, frac, toPct } from './frac';
import { IntervalConsistencyError } from './scoring';
import { stateFor, type WidthCause } from './views';

export function engineStateOf(id: string, uploaded: boolean): ControlState | undefined {
  const c = controlById(id);
  if (!c) return undefined;
  return snapshotFor(c, uploaded).state;
}

export interface BucketCounts {
  applicable: number;
  green: number;
  yellow: number;
  red: number;
  unknown: number;
  /** of the Unknown: no evidence requirement authored (the tool's limitation) */
  unknownUnauthored: number;
}

export interface DashboardFigures {
  buckets: BucketCounts;
  lowerPct: number;
  upperPct: number;
  coveragePct: number;
  widthPts: number;
  /** points of width by cause; they sum to widthPts */
  widthByCause: Record<WidthCause, number>;
  /** the same, as exact fractions of the applicable controls: the parts and their total */
  widthExact: { parts: WidthParts; total: Frac };
  /** controls behind each part */
  widthControls: Record<WidthCause, number>;
}

export function engineBuckets(uploaded: boolean): BucketCounts {
  const s = stateFor(uploaded);
  return {
    applicable: s.views.unweighted.applicable,
    green: s.green,
    yellow: s.yellow,
    red: s.red,
    unknown: s.unknown,
    unknownUnauthored: s.unknownUnauthored,
  };
}

function figures(b: BucketCounts, s: StateFigures): DashboardFigures {
  const avg: Frac = b.yellow > 0 && s.yellow > 0 ? div(s.partialCredit, [s.yellow, 1]) : [0, 1];
  const numerator = add([b.green, 1], [avg[0] * b.yellow, avg[1]]);
  const n = b.applicable;
  const lower = div(numerator, [n, 1]);
  const upper = div(add(numerator, [b.unknown, 1]), [n, 1]);
  const unevidenced = b.unknown - b.unknownUnauthored;
  if (b.green < 0 || b.yellow < 0 || b.red < 0 || b.unknown < 0 || unevidenced < 0) {
    throw new IntervalConsistencyError('dashboardView', `A bucket went negative: ${JSON.stringify(b)}`);
  }
  const pts = (k: number) => (k * 100) / n;
  return {
    buckets: b,
    lowerPct: toPct(lower),
    upperPct: toPct(upper),
    coveragePct: ((n - b.unknown) * 100) / n,
    widthPts: pts(b.unknown),
    widthByCause: { unauthored: pts(b.unknownUnauthored), unevidenced: pts(unevidenced), uncollectable: 0 },
    widthExact: {
      parts: { unauthored: frac(b.unknownUnauthored, n), unevidenced: frac(unevidenced, n), uncollectable: [0, 1] },
      total: frac(b.unknown, n),
    },
    widthControls: { unauthored: b.unknownUnauthored, unevidenced, uncollectable: 0 },
  };
}

export interface DashboardView {
  engine: DashboardFigures;
  effective: DashboardFigures;
  overridesActive: number;
}

export function dashboardView(uploaded: boolean, overrides: Record<string, OverrideRecord>): DashboardView {
  const s = stateFor(uploaded);
  const base = engineBuckets(uploaded);
  const b: BucketCounts = { ...base };
  let active = 0;
  for (const [id, rec] of Object.entries(overrides)) {
    const from = engineStateOf(id, uploaded);
    const to = rec.state;
    if (!from || from === to || from === 'grey' || to === 'grey') continue;
    const authored = controlById(id)?.authored ?? true;
    b[from] -= 1;
    b[to] += 1;
    if (from === 'unknown' && !authored) b.unknownUnauthored -= 1;
    if (to === 'unknown' && !authored) b.unknownUnauthored += 1;
    active += 1;
  }
  return { engine: figures(base, s), effective: figures(b, s), overridesActive: active };
}
