import { beforeEach, describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Dashboard from '../screens/04_Dashboard';
import { useAssessment, type OverrideRecord } from '../store/useAssessment';
import { CURRENT, type StateFigures, type ViewId } from '../data/current';
import { APPLICABLE_CONTROLS, EXCLUDED_COUNT, TOTAL_CONTROLS } from '../data/figures';
import { capabilities, TOTALS } from '../data/capabilities';
import { gapReasonBreakdown, controls } from '../data/controls';
import { add, eq, fmtPct, frac, mul, sub, sum, toPct } from '../lib/frac';
import { dashboardView } from '../lib/derive';
import { IntervalConsistencyError } from '../lib/scoring';
import { VIEW_ORDER, assertWidthSums, unevidencedRows, widthOf } from '../lib/views';

beforeEach(() => {
  localStorage.clear();
  useAssessment.getState().resetDemo();
});

const STATES = { before: CURRENT.before, after: CURRENT.after } as const;

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

describe('Task 2: the per-state counts, derived from per-control data (see docs/evidence/derive_profiles.py)', () => {
  it('assessed state: 21 Compliant, 25 Partial, 6 Gap, 505 Unknown = 557', () => {
    const a = CURRENT.after;
    expect([a.green, a.yellow, a.red, a.unknown]).toEqual([21, 25, 6, 505]);
    expect(a.green + a.yellow + a.red + a.unknown).toBe(APPLICABLE_CONTROLS);
  });
  it('pre-upload state (engine data under rule R): 0 / 14 / 1 / 542 = 557', () => {
    const b = CURRENT.before;
    expect([b.green, b.yellow, b.red, b.unknown]).toEqual([0, 14, 1, 542]);
    expect(b.green + b.yellow + b.red + b.unknown).toBe(APPLICABLE_CONTROLS);
  });
  it('52 carry a verdict unweighted and 51 over the authored scope of 65: both are right, they differ by one control outside the scope', () => {
    const u = CURRENT.after.views.unweighted;
    const s = CURRENT.after.views.authored_scope;
    expect(u.known).toBe(52);
    expect(s.applicable).toBe(65);
    expect(s.known).toBe(51);
    // the controls outside the scope: 492 = 557 − 65. 491 are Unknown for want of a requirement; one has a verdict.
    expect(APPLICABLE_CONTROLS - s.applicable).toBe(492);
    expect(CURRENT.after.unknownUnauthored).toBe(491);
    expect(u.known - s.known).toBe(APPLICABLE_CONTROLS - s.applicable - CURRENT.after.unknownUnauthored);
    expect(u.known - s.known).toBe(1);
  });
});

describe('Task 2: every published view matches the engine table', () => {
  const A = CURRENT.after.views;
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
  const U = CURRENT.after.views.unweighted;
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
    expect(CURRENT.after.unevidencedByReason).toEqual({ not_provided: 5, declined: 3, insufficient_permission: 3, module_failed: 2, stale: 1 });
    const rows = unevidencedRows(CURRENT.after);
    expect(rows.reduce((n, r) => n + r.count, 0)).toBe(14);
    // and they add up, as fractions of the 557, to the unevidenced width
    expect(eq(sum(rows.map((r) => frac(r.count, APPLICABLE_CONTROLS))), U.width.unevidenced)).toBe(true);
  });
  it('before the upload every unevidenced authored control is not_provided: 50, so the upload resolves 36', () => {
    expect(CURRENT.before.unevidencedByReason).toEqual({ not_provided: 50 });
    expect(CURRENT.before.unknown - CURRENT.before.unknownUnauthored).toBe(50);
    expect(50 - 14).toBe(36);
  });
});

describe('Task 2: the upload moves a control outside the authored scope only by observation', () => {
  // JNCSF-139 has no authored path, yet carries a Gap observed from an artifact. An artifact arrives with the
  // bundle, so it is Unknown before and a Gap after. The attribution of the upload's effect to the authored scope
  // is therefore NOT clean, and that is correct: observation can reach any control.
  it('492 unauthored controls are Unknown before and 491 after: exactly the controls observed from the bundle', () => {
    expect(CURRENT.before.unknownUnauthored).toBe(492);
    expect(CURRENT.after.unknownUnauthored).toBe(491);
    expect(CURRENT.before.unknownUnauthored - CURRENT.after.unknownUnauthored).toBe(CURRENT.ruleR.verdictsOutsideAuthoredScope.length);
    expect(CURRENT.ruleR.verdictsOutsideAuthoredScope).toEqual([{ id: 'JNCSF-139', state: 'red', gapBasis: 'observed' }]);
  });
  it('the tool\u2019s share of the width falls by exactly that one control, in every view', () => {
    for (const id of VIEW_ORDER.filter((v) => v !== 'authored_scope')) {
      const b = toPct(CURRENT.before.views[id].width.unauthored);
      const a = toPct(CURRENT.after.views[id].width.unauthored);
      expect(b, id).toBeGreaterThan(a);
    }
    // the authored-scope view holds no unauthored control, so the observation cannot touch it
    expect(CURRENT.before.views.authored_scope.width.unauthored).toEqual(CURRENT.after.views.authored_scope.width.unauthored);
    const u = (s: typeof CURRENT.before) => s.views.unweighted.width.unauthored;
    expect(u(CURRENT.before)).toEqual([492, APPLICABLE_CONTROLS]);
    expect(u(CURRENT.after)).toEqual([491, APPLICABLE_CONTROLS]);
  });
  it('inside the authored scope the rest is as before; outside it, Unknown falls by that one control and no more', () => {
    const outsideUnknown = (s: typeof CURRENT.before) => s.views.unweighted.unknown - s.views.authored_scope.unknown;
    expect(outsideUnknown(CURRENT.before)).toBe(492);
    expect(outsideUnknown(CURRENT.after)).toBe(491);
    // the one that moved is a Gap, so it adds no credit: outside the authored scope the credit is zero in both states
    for (const when of ['before', 'after'] as const) {
      const s = CURRENT[when];
      const inScope = mul(s.views.authored_scope.lower, [s.views.authored_scope.applicable, 1]);
      expect(eq(sub(s.creditNumerator, inScope), [0, 1]), when).toBe(true);
    }
  });
  it('only the organisation\'s share of the width moves, and it narrows', () => {
    const b = CURRENT.before.views.unweighted.width.unevidenced;
    const a = CURRENT.after.views.unweighted.width.unevidenced;
    expect(toPct(b)).toBeGreaterThan(toPct(a));
  });
  it('every unauthored control is Unknown for that reason before the upload, and after it except the ones observed from the bundle', () => {
    const observed = new Set(CURRENT.ruleR.verdictsOutsideAuthoredScope.map((v) => v.id));
    for (const c of controls().filter((x) => !x.authored)) {
      expect(c.before.state, c.id).toBe('unknown');
      expect(c.before.gapReason, c.id).toBe('unauthored');
      if (observed.has(c.id)) expect(c.after.state, c.id).not.toBe('unknown');
      else expect(c.after.gapReason, c.id).toBe('unauthored');
    }
  });
});

describe('Task 2: weights (the brief\'s "mismatch" is two populations, not an error)', () => {
  const A = CURRENT.weightBasisCounts.applicable;
  const sumOf = (o: Record<string, number>) => Object.values(o).reduce((a, b) => a + b, 0);
  const weight = (o: Record<string, number>) =>
    o.nist_baseline_low * 1 + o.nist_baseline_moderate * 0.7 + o.nist_baseline_high * 0.5 + o.nist_no_baseline * 0.5 + o.underived * 1;
  it('over the 557 applicable controls the table sums to the engine\'s totals: 331.4 derived-only, 498.4 including underived', () => {
    expect(sumOf(A)).toBe(557);
    expect(A.underived).toBe(167);
    expect(sumOf(A) - A.underived).toBe(390);
    expect(weight(A) - A.underived).toBeCloseTo(331.4, 10);
    expect(weight(A)).toBeCloseTo(498.4, 10);
    expect(CURRENT.after.views.weighted_derived_only.totalWeight).toEqual([1657, 5]);
    expect(CURRENT.after.views.weighted_including_underived.totalWeight).toEqual([2492, 5]);
  });
  it('over all 576 controls the same table sums to 341.4 / 514.4 with 173 underived — the other population', () => {
    const F = CURRENT.weightBasisCounts.framework;
    expect(sumOf(F)).toBe(576);
    expect(F.underived).toBe(173);
    expect(weight(F) - F.underived).toBeCloseTo(341.4, 10);
    expect(weight(F)).toBeCloseTo(514.4, 10);
  });
  it('the two populations reconcile through the 19 excluded controls', () => {
    const E = CURRENT.weightBasisCounts.excluded;
    const F = CURRENT.weightBasisCounts.framework;
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
    expect(gapReasonBreakdown().reduce((n, r) => n + r.before, 0)).toBe(CURRENT.before.unknown);
    expect(gapReasonBreakdown().reduce((n, r) => n + r.after, 0)).toBe(CURRENT.after.unknown);
    expect(gapReasonBreakdown()[0].reason).toBe('unauthored');
  });
});

describe('Task 2: the dashboard figures are the published figures, and overrides move them exactly', () => {
  const ov = (state: OverrideRecord['state']): OverrideRecord => ({ state, previousState: 'unknown', justification: 'x', analystId: 't', timestamp: 't' });
  it.each([false, true])('with no override the engine and effective figures are the published unweighted view (uploaded=%s)', (uploaded) => {
    const v = dashboardView(uploaded, {});
    const pub = (uploaded ? CURRENT.after : CURRENT.before).views.unweighted;
    for (const f of [v.engine, v.effective]) {
      expect(f.lowerPct).toBeCloseTo(toPct(pub.lower), 10);
      expect(f.upperPct).toBeCloseTo(toPct(pub.upper), 10);
      expect(f.coveragePct).toBeCloseTo(toPct(pub.coverage), 10);
      expect(f.widthPts).toBeCloseTo(toPct(widthOf(pub)), 10);
      expect(f.widthByCause.unauthored + f.widthByCause.unevidenced + f.widthByCause.uncollectable).toBeCloseTo(f.widthPts, 10);
    }
  });
  it('overriding an authored Unknown control to Compliant narrows the organisation\'s share only', () => {
    const c = controls().find((x) => x.authored && x.after.state === 'unknown')!;
    const base = dashboardView(true, {});
    const v = dashboardView(true, { [c.id]: ov('green') });
    expect(v.effective.buckets.unknown).toBe(base.effective.buckets.unknown - 1);
    expect(v.effective.widthByCause.unauthored).toBeCloseTo(base.effective.widthByCause.unauthored, 10);
    expect(v.effective.widthByCause.unevidenced).toBeLessThan(base.effective.widthByCause.unevidenced);
    expect(v.overridesActive).toBe(1);
  });
  it('overriding an unauthored control narrows the tool\'s share, and the parts still sum to the width', () => {
    const c = controls().find((x) => !x.authored && x.after.state === 'unknown')!;
    const base = dashboardView(true, {});
    const v = dashboardView(true, { [c.id]: ov('green') });
    expect(v.effective.buckets.unknownUnauthored).toBe(base.effective.buckets.unknownUnauthored - 1);
    const w = v.effective.widthByCause;
    expect(w.unauthored + w.unevidenced + w.uncollectable).toBeCloseTo(v.effective.widthPts, 10);
  });
});

describe('Task 2 (Round 3): the controls ARE the portfolio: no sample, so nothing is held to be "at most" the aggregate', () => {
  it.each(['before', 'after'] as const)('%s: the controls, counted by state and by reason, equal the figures exactly', (when) => {
    const s = STATES[when];
    const n = (state: string) => controls().filter((c) => c[when].state === state).length;
    expect([n('green'), n('yellow'), n('red'), n('unknown')]).toEqual([s.green, s.yellow, s.red, s.unknown]);
    for (const row of gapReasonBreakdown()) {
      const have = controls().filter((c) => c[when].state === 'unknown' && c[when].gapReason === row.reason).length;
      expect(have, `${when} ${row.reason}`).toBe(row[when]);
    }
  });
  it('before the upload no control is Compliant: testimony and documents cannot reach it', () => {
    expect(controls().filter((c) => c.before.state === 'green')).toEqual([]);
  });
  it('before the upload every Unknown authored control is not_provided (nothing has been collected)', () => {
    for (const c of controls().filter((x) => x.authored && x.before.state === 'unknown')) {
      expect(c.before.gapReason, c.id).toBe('not_provided');
    }
  });
});

describe('Task 3: the aggregate is measured after the upload and a projection before it', () => {
  const tiersOnDashboard = (uploaded: boolean) => {
    useAssessment.setState({ evidenceUploaded: uploaded });
    const { container, unmount } = render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>,
    );
    const out = Array.from(container.querySelectorAll('[data-tier]')).map((e) => [e.getAttribute('data-tier'), e.getAttribute('data-source')] as const);
    unmount();
    return out;
  };
  it('before the upload only the scope exclusions are measured on the Dashboard; every other region is rule R\u2019s projection or invented', () => {
    expect(new Set(tiersOnDashboard(false).map(([t]) => t))).toEqual(new Set(['illustrative', 'measured']));
    // the only measured region before the upload is the scope exclusions, which do not depend on it
    expect(tiersOnDashboard(false).filter(([t]) => t === 'measured').every(([, from]) => from === 'exclusions')).toBe(true);
  });
  it('after the upload the figures are measured, each with its source: the interval, coverage, assurance, capabilities, views, reasons', () => {
    const measured = new Set(tiersOnDashboard(true).filter(([t]) => t === 'measured').map(([, from]) => from));
    for (const from of ['after.views.unweighted', 'after.partialCredit', 'assurance', 'after.capabilities', 'after.views', 'after.unevidencedByReason', 'exclusions']) {
      expect(measured.has(from), from).toBe(true);
    }
  });
});

const _viewIds: ViewId[] = VIEW_ORDER; // the four views, in display order
void _viewIds;
