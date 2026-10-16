import { beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, render } from '@testing-library/react';
import type { ReactElement } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import Dashboard from '../screens/04_Dashboard';
import GapMatrix from '../screens/05_GapMatrix';
import Intake from '../screens/03_Intake';
import Exclusions from '../screens/10_Exclusions';
import { useAssessment } from '../store/useAssessment';
import { TOTALS } from '../data/capabilities';
import { GAP_REASON_BREAKDOWN, controls } from '../data/controls';
import { APPLICABLE_CONTROLS } from '../data/figures';
import { MINISTRY } from '../data/ministry';
import { evidenceRequests } from '../data/remediation';
import { bandFloorPts, projectFromNumerator } from '../lib/scoring';

const raw = import.meta.glob('/src/**/*.{ts,tsx}', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;
const dashboardSrc = raw['/src/screens/04_Dashboard.tsx'];
const intakeSrc = raw['/src/screens/03_Intake.tsx'];

function renderAt(path: string, el: ReactElement, pattern: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path={pattern} element={el} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  localStorage.clear();
  useAssessment.getState().resetDemo();
});

describe('4.1 each "resolved" figure is computed from its own source and named precisely', () => {
  // Round 2: the upload only moves controls that have an authored evidence requirement, so "resolved" is
  // stated inside the authored scope. The framework-wide Unknown count (541 before, 505 after) also moves
  // by 36, because nothing outside the scope moves; the sample is a different population again.
  const scope = { b: MINISTRY.before.views.authored_scope, a: MINISTRY.after.views.authored_scope };
  const resolved = scope.b.unknown - scope.a.unknown;
  const changed = controls.filter((c) => c.changed).length;

  it('the sources: 541 → 505 Unknown overall, 50 → 14 inside the 65-control authored scope, 36 resolved', () => {
    expect(MINISTRY.before.unknown).toBe(541);
    expect(MINISTRY.after.unknown).toBe(505);
    expect(scope.b.applicable).toBe(65);
    expect([scope.b.unknown, scope.a.unknown]).toEqual([50, 14]);
    expect(resolved).toBe(36);
    expect(MINISTRY.before.unknown - MINISTRY.after.unknown).toBe(resolved);
    expect(controls.length).toBe(48);
    // the sample's own count: seeds whose snapshot the upload changes
    expect(changed).toBe(21);
  });
  it('the literal 90 is gone from the dashboard copy', () => {
    expect(dashboardSrc).not.toContain('closed 90 evidence gaps');
    expect(dashboardSrc).not.toContain('the 90 promoted controls');
    expect(intakeSrc).not.toContain('148 evidence gaps closed');
  });
  it('the dashboard names 36 of the 50 Unknown controls in the authored scope, and 21 of the 48 in this sample', () => {
    useAssessment.setState({ evidenceUploaded: true });
    const { container } = renderAt('/dashboard', <Dashboard />, '/dashboard');
    expect(container.textContent).toContain(`resolved ${resolved} of the ${scope.b.unknown} Unknown controls in the authored scope.`);
    expect(container.textContent).toContain(
      `See the ${changed} of the ${controls.length} controls in this sample that the upload changed in the Gap Matrix`,
    );
    // 'seeded' is a developer's word; the sample-versus-framework distinction is kept in plain words
    expect(container.textContent).not.toContain('seeded controls changed');
  });
  it('Intake names the same 36, its before/after counts, and says the rest cannot move', () => {
    useAssessment.setState({ evidenceUploaded: true });
    const { container, getByText } = renderAt('/intake', <Intake />, '/intake');
    fireEvent.click(getByText('Evidence bundle'));
    expect(container.textContent).toContain(
      `${resolved} of the ${scope.b.unknown} Unknown controls in the authored scope resolved (${scope.b.unknown} → ${scope.a.unknown})`,
    );
    expect(container.textContent).toContain(`The other ${MINISTRY.after.unknownUnauthored} Unknown controls have no authored evidence requirement; an upload cannot change them.`);
  });
  it('the Gap Matrix filter the link opens shows exactly the changed seeds', () => {
    useAssessment.setState({ evidenceUploaded: true });
    const { container } = renderAt('/gap-matrix?changed=1', <GapMatrix />, '/gap-matrix');
    const shown = Array.from((container.textContent ?? '').matchAll(/(\d+) of \d+ in this sample shown/g)).reduce(
      (n, m) => n + Number(m[1]),
      0,
    );
    expect(shown).toBe(changed);
  });
});

describe('4.2 the gap-reason chart accounts for every Unknown', () => {
  it('has a module_failed row, and it is the engine\'s figure (2), not a chosen one', () => {
    expect(GAP_REASON_BREAKDOWN.map((r) => r.reason)).toContain('module_failed');
    expect(GAP_REASON_BREAKDOWN.find((r) => r.reason === 'module_failed')).toMatchObject({ before: 0, after: 2 });
  });
  it('rows reconcile to the Unknown count before and after, unauthored included', () => {
    expect(GAP_REASON_BREAKDOWN.reduce((s, r) => s + r.before, 0)).toBe(TOTALS.before.unknown);
    expect(GAP_REASON_BREAKDOWN.reduce((s, r) => s + r.after, 0)).toBe(TOTALS.after.unknown);
    expect(GAP_REASON_BREAKDOWN[0]).toMatchObject({ reason: 'unauthored', before: 491, after: 491 });
  });
  it('every reason a seeded Unknown carries has a row at least as large as the seeds that carry it', () => {
    for (const when of ['before', 'after'] as const) {
      const seeded: Record<string, number> = {};
      for (const c of controls) {
        const snap = c[when];
        if (snap.state === 'unknown' && snap.gapReason) seeded[snap.gapReason] = (seeded[snap.gapReason] ?? 0) + 1;
      }
      for (const [reason, n] of Object.entries(seeded)) {
        const row = GAP_REASON_BREAKDOWN.find((r) => r.reason === reason);
        expect(row, `${when}: no row for ${reason}`).toBeDefined();
        expect(row![when], `${when}: ${reason}`).toBeGreaterThanOrEqual(n);
      }
    }
  });
  it('the dashboard chart subtitle total is the Unknown count (the bars themselves need a layout engine)', () => {
    const { container } = renderAt('/dashboard', <Dashboard />, '/dashboard');
    expect(container.textContent).toContain(`Breakdown of the ${TOTALS.before.unknown} Unknowns`);
  });
});

describe('4.3 starting the guided tour keeps the user\'s work', () => {
  it('a profile field, an upload slot and an override survive startTour', () => {
    const s = useAssessment.getState();
    s.setProfile({ namedAttestation: 'A. Officer' });
    s.uploadSlot('Defender status');
    s.overrideControl('JNCSF-102', {
      state: 'green',
      previousState: 'red',
      justification: 'reviewed the export',
      analystId: 'tester',
      timestamp: 't',
    });
    s.setRole('analyst');
    useAssessment.getState().startTour();
    const after = useAssessment.getState();
    expect(after.tourActive).toBe(true);
    expect(after.tourStep).toBe(0);
    expect(after.profile.namedAttestation).toBe('A. Officer');
    expect(after.uploadedSlots['Defender status']).toBeDefined();
    expect(after.overriddenControls['JNCSF-102']?.justification).toBe('reviewed the export');
    expect(after.role).toBe('analyst');
  });
  it('a role that cannot open the tour screens is switched to owner, and nothing else changes', () => {
    const s = useAssessment.getState();
    s.setProfile({ namedAttestation: 'B' });
    s.setRole('contributor');
    useAssessment.getState().startTour();
    expect(useAssessment.getState().role).toBe('owner');
    expect(useAssessment.getState().profile.namedAttestation).toBe('B');
  });
  it('Reset demo is still the explicit reset', () => {
    useAssessment.getState().setProfile({ namedAttestation: 'C' });
    useAssessment.getState().resetDemo();
    expect(useAssessment.getState().profile.namedAttestation).toBe('');
  });
});

// Figures the Round 1 report states, committed so they are guarded rather than asserted once.
describe('the seeded sample behind the 4.2 choice', () => {
  const unknownAfter = controls.filter((c) => c.after.state === 'unknown');
  it('48 seeded controls; 25 are Unknown after the upload: 21 unauthored and 4 collection failures, 2 of them module_failed', () => {
    expect(controls.length).toBe(48);
    expect(unknownAfter.length).toBe(25);
    expect(unknownAfter.filter((c) => c.after.gapReason === 'unauthored').length).toBe(21);
    expect(unknownAfter.filter((c) => c.after.gapReason !== 'unauthored').length).toBe(4);
    expect(unknownAfter.filter((c) => c.after.gapReason === 'module_failed').map((c) => c.id)).toEqual(['JNCSF-173', 'JNCSF-179']);
  });
  it('both module_failed controls were not_provided before the upload', () => {
    for (const id of ['JNCSF-173', 'JNCSF-179']) {
      expect(controls.find((c) => c.id === id)!.before.gapReason).toBe('not_provided');
    }
  });
});

describe('fixture: the five Remediation artifacts claim more than the Unknown pool they draw from', () => {
  // 49 = sum of controlsUnlocked over the five evidenceRequests (src/data/remediation.ts).
  // 14 = the Unknowns evidence can resolve: those with an authored requirement (505 − 491 unauthored − 0
  // uncollectable). Round 1 had 20 (59 − 39); the Round 2 restructure moved the pool to 14 and the floor
  // from 7.0 to 88.15 points. The per-artifact counts overlap or are overstated; they cannot be added. The
  // cap in projectFromNumerator keeps the projection honest; the fixture itself is replaced in Round 3.
  const claimed = evidenceRequests.reduce((s, r) => s + r.controlsUnlocked, 0);
  const after = MINISTRY.after;
  const unresolvable = after.unknownUnauthored + after.views.unweighted.width.uncollectable[0];
  const pool = after.unknown - unresolvable;
  it('names both numbers', () => {
    expect(claimed).toBe(49);
    expect(pool).toBe(14);
    expect(claimed).toBeGreaterThan(pool);
  });
  it('providing all five resolves exactly the pool, and the band stops at the floor', () => {
    const p = projectFromNumerator(APPLICABLE_CONTROLS, after.creditNumerator[0] / after.creditNumerator[1], after.unknown, unresolvable, claimed);
    expect(p.resolved).toBe(pool);
    expect(p.resultingWidthPts).toBeCloseTo(bandFloorPts(APPLICABLE_CONTROLS, unresolvable), 10);
  });
});

// 'seeded' is a developer's word. What the screen means is "in this sample" (or, for the
// exclusions register, which is complete, just the count).
describe('on-screen vocabulary: no "seeded"', () => {
  it.each([
    ['/dashboard', <Dashboard key="d" />, '/dashboard'],
    ['/gap-matrix', <GapMatrix key="g" />, '/gap-matrix'],
    ['/exclusions', <Exclusions key="e" />, '/exclusions'],
  ] as const)('%s renders no "seeded"', (path, el, pattern) => {
    for (const uploaded of [false, true]) {
      useAssessment.setState({ evidenceUploaded: uploaded });
      const { container, unmount } = renderAt(path, el, pattern);
      expect(container.textContent).not.toMatch(/seeded/i);
      unmount();
    }
  });
  it('Gap Matrix counts are phrased "in this sample"', () => {
    const { container } = renderAt('/gap-matrix', <GapMatrix />, '/gap-matrix');
    expect(container.textContent).toMatch(/\d+ of \d+ in this sample shown/);
  });
  it('the exclusions register lists all 19 and says so plainly', () => {
    const { container } = renderAt('/exclusions', <Exclusions />, '/exclusions');
    expect(container.textContent).toContain('Exclusions — 19 shown of 19');
  });
});
