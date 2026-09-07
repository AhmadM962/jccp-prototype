// Derived dashboard figures: the engine verdict (fixture) plus the effect of any active
// analyst overrides. Overrides move a control between aggregate buckets and the interval
// is re-derived with boundedScore — so an override the analyst makes is visible on the
// dashboard, not just on the control page.

import { TOTALS } from '../data/capabilities';
import { controls, snapshotFor, type ControlState } from '../data/controls';
import type { OverrideRecord } from '../store/useAssessment';
import { applyOverrides, boundedScore, type Buckets } from './scoring';

export function engineBuckets(uploaded: boolean): Buckets {
  const t = uploaded ? TOTALS.after : TOTALS.before;
  return {
    applicable: TOTALS.applicable,
    green: t.green,
    yellow: t.yellow,
    red: t.red,
    unknown: t.unknown,
  };
}

export function engineStateOf(id: string, uploaded: boolean): ControlState | undefined {
  const c = controls.find((x) => x.id === id);
  if (!c) return undefined;
  return snapshotFor(c, uploaded).state;
}

export interface DashboardFigures {
  buckets: Buckets;
  lowerPct: number;
  upperPct: number;
  coveragePct: number;
  widthPts: number;
}

function figures(b: Buckets): DashboardFigures {
  const s = boundedScore(b.applicable, b.green, b.yellow, b.red, b.unknown);
  return {
    buckets: b,
    lowerPct: s.lower * 100,
    upperPct: s.upper * 100,
    coveragePct: s.coverage * 100,
    widthPts: s.width * 100,
  };
}

export interface DashboardView {
  engine: DashboardFigures;
  effective: DashboardFigures;
  overridesActive: number;
}

export function dashboardView(
  uploaded: boolean,
  overrides: Record<string, OverrideRecord>,
): DashboardView {
  const base = engineBuckets(uploaded);
  const flat: Record<string, string> = {};
  for (const [id, rec] of Object.entries(overrides)) flat[id] = rec.state;
  const { buckets, activeCount } = applyOverrides(base, flat, (id) => engineStateOf(id, uploaded));
  return {
    engine: figures(base),
    effective: figures(buckets),
    overridesActive: activeCount,
  };
}
