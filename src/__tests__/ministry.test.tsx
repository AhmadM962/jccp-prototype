import { beforeEach, describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Dashboard from '../screens/04_Dashboard';
import { useAssessment, type OverrideRecord } from '../store/useAssessment';
import { MINISTRY, WEIGHT_BASIS_COUNTS, type StateFigures, type ViewId } from '../data/ministry';
import { APPLICABLE_CONTROLS, EXCLUDED_COUNT, TOTAL_CONTROLS } from '../data/figures';
import { capabilities, TOTALS } from '../data/capabilities';
import { GAP_REASON_BREAKDOWN, controls } from '../data/controls';
import { add, eq, fmtPct, frac, sub, sum, toPct } from '../lib/frac';
import { dashboardView } from '../lib/derive';
import { IntervalConsistencyError } from '../lib/scoring';
import { VIEW_ORDER, assertWidthSums, unevidencedRows, widthOf } from '../lib/views';

beforeEach(() => {
  localStorage.clear();
  useAssessment.getState().resetDemo();
});

const STATES = { before: MINISTRY.before, after: MINISTRY.after } as const;

describe('exact fractions', () => {
  it('add, sub and compare without rounding', () => {
    expect(add([1, 3], [1, 6])).toEqual([1, 2]);
    expect(sub([1, 2], [1, 3])).toEqual([1, 6]);
    expect(eq([2, 4], [1, 2])).toBe(true);
    expect(sum([[1, 10], [2, 10], [3, 10]])).toEqual([3, 5]);
    expect(frac(6, -4)).toEqual([-3, 2]);
    expect(() => frac(1, 0)).toThrow();
  });
});

describe('Task 2: the per-state counts, derived from per-control data (see docs/evidence/derive_ministry_figures.py)', () => {
  it('assessed state: 21 Compliant, 25 Partial, 6 Gap, 505 Unknown = 557', () => {
    const a = MINISTRY.after;
    expect([a.green, a.yellow, a.red, a.unknown]).toEqual([21, 25, 6, 505]);
    expect(a.green + a.yellow + a.red + a.unknown).toBe(APPLICABLE_CONTROLS);
  });
  it('pre-upload state (engine data under rule R): 0 / 14 / 2 / 541 = 557', () => {
    const b = MINISTRY.before;
    expect([b.green, b.yellow, b.red, b.unknown]).toEqual([0, 14, 2, 541]);
    expect(b.green + b.yellow + b.red + b.unknown).toBe(APPLICABLE_CONTROLS);
  });
  it('52 carry a verdict unweighted and 51 over the authored scope of 65: both are right, they differ by one control outside the scope', () => {
    const u = MINISTRY.after.views.unweighted;
    const s = MINISTRY.after.views.authored_scope;
    expect(u.known).toBe(52);
    expect(s.applicable).toBe(65);
    expect(s.known).toBe(51);
    // the controls outside the scope: 492 = 557 − 65. 491 are Unknown for want of a requirement; one has a verdict.
    expect(APPLICABLE_CONTROLS - s.applicable).toBe(492);
    expect(MINISTRY.after.unknownUnauthored).toBe(491);
    expect(u.known - s.known).toBe(APPLICABLE_CONTROLS - s.applicable - MINISTRY.after.unknownUnauthored);
    expect(u.known - s.known).toBe(1);
  });
});

describe('Task 2: every published view matches the engine table', () => {
  const A = MINISTRY.after.views;
  const pct = (f: readonly [number, number]) => fmtPct(f, 2);
  it('unweighted: 4.87% – 95.54% over 557, coverage 9.34% (52 of 557), 505 Unknown, width 90.66', () => {
    expect([pct(A.unweighted.lower), pct(A.unweighted.upper)]).toEqual(['4.87', '95.54']);
    expect(A.unweighted.applicable).toBe(557);
    expect(pct(A.unweighted.coverage)).toBe('9.34');
    expect(A.unweighted.coverage).toEqual([52, APPLICABLE_CONTROLS]);
    expect(A.unweighted.unknown).toBe(505);
    expect(pct(widthOf(A.unweighted))).toBe('90.66');
  });
  it('weighted, including underived: 5.14% – 95.57% over 557', () => {
    expect([pct(A.weighted_including_underived.lower), pct(A.weighted_including_underived.upper)]).toEqual(['5.14', '95.57']);
    expect(A.weighted_including_underived.applicable).toBe(557);
  });
  it('weighted, derived only: 5.38% – 94.60% over 390', () => {
    expect([pct(A.weighted_derived_only.lower), pct(A.weighted_derived_only.upper)]).toEqual(['5.38', '94.60']);
    expect(A.weighted_derived_only.applicable).toBe(390);
  });
  it('authored scope: 41.77% – 63.31% over 65, coverage 78.46%, 14 Unknown', () => {
    expect([pct(A.authored_scope.lower), pct(A.authored_scope.upper)]).toEqual(['41.77', '63.31']);
    expect(A.authored_scope.applicable).toBe(65);
    expect(pct(A.authored_scope.coverage)).toBe('78.46');
    expect(A.authored_scope.unknown).toBe(14);
  });
  it('framework: 576 total, 557 applicable, 19 excluded', () => {
    expect([TOTAL_CONTROLS, APPLICABLE_CONTROLS, EXCLUDED_COUNT]).toEqual([576, 557, 19]);
    expect(TOTAL_CONTROLS - APPLICABLE_CONTROLS).toBe(EXCLUDED_COUNT);
  });
});

describe('Task 2: the width decomposition', () => {
  const U = MINISTRY.after.views.unweighted;
  it('unauthored 88.15 points (491 controls), unevidenced 2.51 (14), uncollectable 0.00', () => {
    expect(fmtPct(U.width.unauthored)).toBe('88.15');
    expect(U.width.unauthored).toEqual([491, APPLICABLE_CONTROLS]);
    expect(fmtPct(U.width.unevidenced)).toBe('2.51');
    expect(U.width.unevidenced).toEqual([14, APPLICABLE_CONTROLS]);
    expect(fmtPct(U.width.uncollectable)).toBe('0.00');
  });
  it.each(['before', 'after'] as const)('the three components sum EXACTLY to the width, in every view (%s)', (when) => {
    for (const id of VIEW_ORDER) {
      const v = STATES[when].views[id];
      expect(eq(add(add(v.width.unauthored, v.width.unevidenced), v.width.uncollectable), widthOf(v)), `${when} ${id}`).toBe(true);
      expect(() => assertWidthSums(v, `${when} ${id}`)).not.toThrow();
    }
  });
  it('the sum assertion is not vacuous: a corrupted view throws the consistency error', () => {
    const bad = { ...U, width: { ...U.width, unevidenced: [15, APPLICABLE_CONTROLS] as const } };
    expect(() => assertWidthSums(bad, 'test')).toThrow(IntervalConsistencyError);
  });
  it('unevidenced reasons: not_provided 5, declined 3, insufficient_permission 3, module_failed 2, stale 1 = 14', () => {
    expect(MINISTRY.after.unevidencedByReason).toEqual({ not_provided: 5, declined: 3, insufficient_permission: 3, module_failed: 2, stale: 1 });
    const rows = unevidencedRows(MINISTRY.after);
    expect(rows.reduce((n, r) => n + r.count, 0)).toBe(14);
    // and they add up, as fractions of the 557, to the unevidenced width
    expect(eq(sum(rows.map((r) => frac(r.count, APPLICABLE_CONTROLS))), U.width.unevidenced)).toBe(true);
  });
  it('before the upload every unevidenced authored control is not_provided: 50, so the upload resolves 36', () => {
    expect(MINISTRY.before.unevidencedByReason).toEqual({ not_provided: 50 });
    expect(MINISTRY.before.unknown - MINISTRY.before.unknownUnauthored).toBe(50);
    expect(50 - 14).toBe(36);
  });
});

describe('Task 2: unauthored controls are unaffected by the evidence upload', () => {
  it('491 before and after, and the same width fraction in every view', () => {
    expect(MINISTRY.before.unknownUnauthored).toBe(491);
    expect(MINISTRY.after.unknownUnauthored).toBe(491);
    for (const id of VIEW_ORDER) {
      expect(eq(MINISTRY.before.views[id].width.unauthored, MINISTRY.after.views[id].width.unauthored), id).toBe(true);
    }
  });
  it('nothing outside the authored scope moves: Unknown outside it is 491 in both states', () => {
    for (const when of ['before', 'after'] as const) {
      const s = STATES[when];
      expect(s.views.unweighted.unknown - s.views.authored_scope.unknown, when).toBe(491);
    }
  });
  it('only the organisation\'s share of the width moves, and it narrows', () => {
    const b = MINISTRY.before.views.unweighted.width.unevidenced;
    const a = MINISTRY.after.views.unweighted.width.unevidenced;
    expect(toPct(b)).toBeGreaterThan(toPct(a));
  });
  it('the sample: unauthored controls are Unknown for that reason in both states', () => {
    for (const c of controls.filter((x) => !x.authored)) {
      expect(c.before.gapReason).toBe('unauthored');
      expect(c.after.gapReason).toBe('unauthored');
    }
  });
});

describe('Task 2: weights (the brief\'s "mismatch" is two populations, not an error)', () => {
  const A = WEIGHT_BASIS_COUNTS.applicable;
  const sumOf = (o: Record<string, number>) => Object.values(o).reduce((a, b) => a + b, 0);
  const weight = (o: Record<string, number>) =>
    o.nist_baseline_low * 1 + o.nist_baseline_moderate * 0.7 + o.nist_baseline_high * 0.5 + o.nist_no_baseline * 0.5 + o.underived * 1;
  it('over the 557 applicable controls the table sums to the engine\'s totals: 331.4 derived-only, 498.4 including underived', () => {
    expect(sumOf(A)).toBe(557);
    expect(A.underived).toBe(167);
    expect(sumOf(A) - A.underived).toBe(390);
    expect(weight(A) - A.underived).toBeCloseTo(331.4, 10);
    expect(weight(A)).toBeCloseTo(498.4, 10);
    expect(MINISTRY.after.views.weighted_derived_only.totalWeight).toEqual([1657, 5]);
    expect(MINISTRY.after.views.weighted_including_underived.totalWeight).toEqual([2492, 5]);
  });
  it('over all 576 controls the same table sums to 341.4 / 514.4 with 173 underived — the other population', () => {
    const F = WEIGHT_BASIS_COUNTS.framework;
    expect(sumOf(F)).toBe(576);
    expect(F.underived).toBe(173);
    expect(weight(F) - F.underived).toBeCloseTo(341.4, 10);
    expect(weight(F)).toBeCloseTo(514.4, 10);
  });
  it('the two populations reconcile through the 19 excluded controls', () => {
    const E = WEIGHT_BASIS_COUNTS.excluded;
    const F = WEIGHT_BASIS_COUNTS.framework;
    expect(sumOf(E)).toBe(EXCLUDED_COUNT);
    for (const k of Object.keys(F) as (keyof typeof F)[]) expect(F[k], k).toBe(A[k] + E[k]);
    expect(E.underived).toBe(6);
  });
});

describe('Task 2: the portfolio and the capability rows reconcile exactly', () => {
  it.each(['before', 'after'] as const)('%s: capability rows sum to the portfolio', (when) => {
    const s: StateFigures = STATES[when];
    const caps = Object.values(s.capabilities);
    const total = (k: 'applicable' | 'green' | 'yellow' | 'red' | 'unknown' | 'unknownUnauthored') => caps.reduce((n, c) => n + c[k], 0);
    expect(total('applicable')).toBe(APPLICABLE_CONTROLS);
    expect(total('green')).toBe(s.green);
    expect(total('yellow')).toBe(s.yellow);
    expect(total('red')).toBe(s.red);
    expect(total('unknown')).toBe(s.unknown);
    expect(eq(sum(caps.map((c) => c.creditNumerator)), s.creditNumerator)).toBe(true);
    // 'unknownUnauthored' per capability is Unknown for want of a requirement; JNCSF-139 is unauthored but has a verdict
    expect(total('unknownUnauthored')).toBe(s.unknownUnauthored);
  });
  it('TOTALS and the per-capability stats are computed from the same figures', () => {
    for (const when of ['before', 'after'] as const) {
      const t = TOTALS[when];
      const stats = capabilities.filter((c) => c.organisationallyAssessable).map((c) => c[when]!);
      expect(stats.reduce((n, x) => n + x.unknown, 0)).toBe(t.unknown);
      expect(stats.reduce((n, x) => n + x.evidenced, 0)).toBe(t.evidenced);
    }
  });
  it('Delivery: 44 of 44 authored', () => {
    const del = capabilities.find((c) => c.id === 'del')!;
    expect(del.after!.authored).toBe(44);
    expect(del.after!.applicable).toBe(44);
  });
  it('the gap-reason rows reconcile to the Unknown count and put unauthored first', () => {
    expect(GAP_REASON_BREAKDOWN.reduce((n, r) => n + r.before, 0)).toBe(MINISTRY.before.unknown);
    expect(GAP_REASON_BREAKDOWN.reduce((n, r) => n + r.after, 0)).toBe(MINISTRY.after.unknown);
    expect(GAP_REASON_BREAKDOWN[0].reason).toBe('unauthored');
  });
});

describe('Task 2: the dashboard figures are the published figures, and overrides move them exactly', () => {
  const ov = (state: OverrideRecord['state']): OverrideRecord => ({ state, previousState: 'unknown', justification: 'x', analystId: 't', timestamp: 't' });
  it.each([false, true])('with no override the engine and effective figures are the published unweighted view (uploaded=%s)', (uploaded) => {
    const v = dashboardView(uploaded, {});
    const pub = (uploaded ? MINISTRY.after : MINISTRY.before).views.unweighted;
    for (const f of [v.engine, v.effective]) {
      expect(f.lowerPct).toBeCloseTo(toPct(pub.lower), 10);
      expect(f.upperPct).toBeCloseTo(toPct(pub.upper), 10);
      expect(f.coveragePct).toBeCloseTo(toPct(pub.coverage), 10);
      expect(f.widthPts).toBeCloseTo(toPct(widthOf(pub)), 10);
      expect(f.widthByCause.unauthored + f.widthByCause.unevidenced + f.widthByCause.uncollectable).toBeCloseTo(f.widthPts, 10);
    }
  });
  it('overriding an authored Unknown control to Compliant narrows the organisation\'s share only', () => {
    const c = controls.find((x) => x.authored && x.after.state === 'unknown')!;
    const base = dashboardView(true, {});
    const v = dashboardView(true, { [c.id]: ov('green') });
    expect(v.effective.buckets.unknown).toBe(base.effective.buckets.unknown - 1);
    expect(v.effective.widthByCause.unauthored).toBeCloseTo(base.effective.widthByCause.unauthored, 10);
    expect(v.effective.widthByCause.unevidenced).toBeLessThan(base.effective.widthByCause.unevidenced);
    expect(v.overridesActive).toBe(1);
  });
  it('overriding an unauthored control narrows the tool\'s share, and the parts still sum to the width', () => {
    const c = controls.find((x) => !x.authored)!;
    const base = dashboardView(true, {});
    const v = dashboardView(true, { [c.id]: ov('green') });
    expect(v.effective.buckets.unknownUnauthored).toBe(base.effective.buckets.unknownUnauthored - 1);
    const w = v.effective.widthByCause;
    expect(w.unauthored + w.unevidenced + w.uncollectable).toBeCloseTo(v.effective.widthPts, 10);
  });
});

describe('Task 2: the sample never holds more of a kind than the portfolio (so an override cannot make a bucket negative)', () => {
  it.each(['before', 'after'] as const)('%s: Compliant / Partial / Gap seeds ≤ the aggregate; reasons ≤ their rows', (when) => {
    const s = STATES[when];
    const n = (state: string) => controls.filter((c) => c[when].state === state).length;
    expect(n('green')).toBeLessThanOrEqual(s.green);
    expect(n('yellow')).toBeLessThanOrEqual(s.yellow);
    expect(n('red')).toBeLessThanOrEqual(s.red);
    for (const row of GAP_REASON_BREAKDOWN) {
      const seeded = controls.filter((c) => c[when].state === 'unknown' && c[when].gapReason === row.reason).length;
      expect(seeded, `${when} ${row.reason}`).toBeLessThanOrEqual(row[when]);
    }
  });
  it('before the upload no sample control is Compliant: testimony and documents cannot reach it', () => {
    expect(controls.filter((c) => c.before.state === 'green')).toEqual([]);
  });
  it('before the upload every Unknown authored seed is not_provided (nothing has been collected)', () => {
    for (const c of controls.filter((x) => x.authored && x.before.state === 'unknown')) {
      expect(c.before.gapReason, c.id).toBe('not_provided');
    }
  });
});

describe('Task 2: the whole aggregate is tagged illustrative', () => {
  it('every region on the Dashboard is illustrative; none is measured', () => {
    for (const uploaded of [false, true]) {
      useAssessment.setState({ evidenceUploaded: uploaded });
      const { container, unmount } = render(
        <MemoryRouter>
          <Dashboard />
        </MemoryRouter>,
      );
      const tiers = new Set(Array.from(container.querySelectorAll('[data-tier]')).map((e) => e.getAttribute('data-tier')));
      expect(Array.from(tiers)).toEqual(['illustrative']);
      unmount();
    }
  });
});

const _viewIds: ViewId[] = VIEW_ORDER; // the four views, in display order
void _viewIds;
