import { beforeEach, describe, expect, it } from 'vitest';
import { act, fireEvent, render } from '@testing-library/react';
import type { ReactElement } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import ControlDetail from '../screens/06_ControlDetail';
import Dashboard from '../screens/04_Dashboard';
import ExportScreen from '../screens/08_Export';
import Remediation from '../screens/07_Remediation';
import Chat from '../screens/09_Chat';
import { useAssessment } from '../store/useAssessment';
import { controls } from '../data/controls';
import { CURRENT } from '../data/current';
import { PROFILES, PROFILE_ORDER } from '../data/profiles';
import { dashboardView } from '../lib/derive';
import { evidenceArtifacts } from '../lib/ranking';
import { bandFloorPts, boundedScore, projectFromNumerator, yellowWeightForShare } from '../lib/scoring';

// Source text of every non-test file, to assert strings that must not come back.
const raw = import.meta.glob('/src/**/*.{ts,tsx}', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;
const SRC = Object.entries(raw).filter(([p]) => !p.startsWith('/src/__tests__/') && !p.startsWith('/src/test/'));
const filesContaining = (needle: string) => SRC.filter(([, t]) => t.includes(needle)).map(([p]) => p);

function renderAt(path: string, el: ReactElement, pattern = path) {
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

describe('3.1 the storage claim', () => {
  it.each(['no data is stored', 'Nothing you do here is saved', 'No data was collected or transmitted'])('"%s" is not in src/', (needle) => {
    expect(filesContaining(needle)).toEqual([]);
  });
  it('the replacement text is present', () => {
    expect(filesContaining('nothing leaves this machine — your progress is kept in this browser only.')).toEqual(['/src/App.tsx']);
    expect(filesContaining('Your progress is saved in this browser so you can pick up where you left off.')).toEqual([
      '/src/tour/WelcomeGate.tsx',
    ]);
    expect(filesContaining('Nothing is transmitted, and your progress is kept in this browser only.')).toEqual(['/src/tour/steps.ts']);
  });
});

describe('3.2 partial-credit quartile', () => {
  it('yellowWeightForShare follows the quartile table', () => {
    expect(yellowWeightForShare(0.8)).toBe(0.85);
    expect(yellowWeightForShare(0.6)).toBe(0.5);
    expect(yellowWeightForShare(0.3)).toBe(0.25);
    expect(yellowWeightForShare(0.1)).toBe(0.1);
    // boundaries
    expect(yellowWeightForShare(0.75)).toBe(0.85);
    expect(yellowWeightForShare(0.5)).toBe(0.5);
    expect(yellowWeightForShare(0.25)).toBe(0.25);
    expect(yellowWeightForShare(0)).toBe(0.1);
  });
  it('a claimed share is capped at the second quartile', () => {
    expect(yellowWeightForShare(0.8, 'claimed')).toBe(0.5);
    expect(yellowWeightForShare(0.99, 'claimed')).toBe(0.5);
    expect(yellowWeightForShare(0.3, 'claimed')).toBe(0.25);
    expect(yellowWeightForShare(0.8, 'measured')).toBe(0.85);
  });
  it('yellowWeightForShare has at least one caller in src/screens/', () => {
    const callers = SRC.filter(([p, t]) => p.startsWith('/src/screens/') && t.includes('yellowWeightForShare('));
    expect(callers.length).toBeGreaterThanOrEqual(1);
  });
  // The engine's own data holds the whole quartile table: 117 (0.9) and 118 (0.75) top, 119 (0.6) and 120 (0.5) second,
  // 121 (0.3) third, 123 (0.1) bottom; 24 and 129 are claimed shares capped at the second; 32 is a host census.
  it('Control Detail shows the engine\u2019s credit for a counted share, with its quartile', () => {
    useAssessment.setState({ evidenceUploaded: true });
    const c = renderAt('/control/JNCSF-117', <ControlDetail />, '/control/:id');
    const t = c.getByTestId('measured-share').textContent ?? '';
    expect(t).toContain('90%');
    expect(t).toContain('(established)');
    expect(t).toContain('partial credit 0.85 (top quartile)');
    c.unmount();
    const d = renderAt('/control/JNCSF-121', <ControlDetail />, '/control/:id');
    expect(d.getByTestId('measured-share').textContent).toContain('partial credit 0.25 (third quartile)');
  });
  it('Control Detail applies the cap to a claimed share and says so', () => {
    useAssessment.setState({ evidenceUploaded: true });
    const { getByTestId } = renderAt('/control/JNCSF-24', <ControlDetail />, '/control/:id');
    const t = getByTestId('measured-share').textContent ?? '';
    expect(t).toContain('90%');
    expect(t).toContain('(claimed)');
    expect(t).toContain('partial credit 0.5 (top quartile; capped at the second quartile because the share is claimed, not counted)');
  });
  it('Control Detail shows a host census as a census, and a host the collector did not reach is not a Gap', () => {
    useAssessment.setState({ evidenceUploaded: true });
    const { getByTestId } = renderAt('/control/JNCSF-32', <ControlDetail />, '/control/:id');
    const t = getByTestId('measured-share').textContent ?? '';
    expect(t).toContain('60 of 100 hosts compliant, 40 not reached');
    expect(t).toContain('never a Gap');
  });
  it('Control Detail does not claim credit for a control that is not Partial', () => {
    useAssessment.setState({ evidenceUploaded: true });
    const { container } = renderAt('/control/JNCSF-109', <ControlDetail />, '/control/:id');
    expect(container.textContent).not.toContain('partial credit');
  });
  it('the engine\u2019s credit and the prototype\u2019s quartile model agree for every share-based Partial, in every profile', () => {
    for (const id of PROFILE_ORDER) {
      for (const c of PROFILES[id].claims.filter((x) => x.state === 'yellow' && x.partialBasis === 'share')) {
        const lower = c.share!.interval!.lower;
        const expected = yellowWeightForShare(lower, c.share!.interval!.basis === 'claimed' ? 'claimed' : 'measured');
        expect(c.credit![0] / c.credit![1], `${id} ${c.id}`).toBeCloseTo(expected, 12);
      }
    }
  });
  it('the dashboard says Partials are credited one by one, with the published totals (no flat weight)', () => {
    for (const uploaded of [false, true]) {
      useAssessment.setState({ evidenceUploaded: uploaded });
      const s = uploaded ? CURRENT.after : CURRENT.before;
      const credit = (s.partialCredit[0] / s.partialCredit[1]).toFixed(2);
      const { container, getByTestId, unmount } = renderAt('/dashboard', <Dashboard />);
      expect(getByTestId('partial-credit-note').textContent).toContain(
        `The ${s.yellow} Partial controls here earn ${credit} in total, credited one by one by the engine rather than at a flat weight.`,
      );
      expect(container.textContent).not.toContain('flat 0.5');
      unmount();
    }
    // the figures the sentence quotes: 25 Partials earning 6.15 after the upload (published), 14 earning 1.80 before
    expect([CURRENT.after.yellow, CURRENT.after.partialCredit]).toEqual([25, [123, 20]]);
    expect([CURRENT.before.yellow, CURRENT.before.partialCredit]).toEqual([14, [9, 5]]);
  });
});

describe('3.3 the OSCAL validation claim', () => {
  it('"0 errors" is not in src/', () => {
    expect(filesContaining('0 errors')).toEqual([]);
  });
  it('the card says validation is not done in the preview and is tagged planned', () => {
    const { container } = renderAt('/export', <ExportScreen />);
    const line = Array.from(container.querySelectorAll('p')).find((p) => p.textContent?.includes('Validation runs in the assessment engine'));
    expect(line?.textContent).toContain('OSCAL 1.1.2 · 5 models · 557 control implementations. Validation runs in the assessment engine, not in this preview.');
    expect(line?.closest('[data-tier]')?.getAttribute('data-tier')).toBe('planned');
  });
  it('the line carries a neutral mark, not a green tick', () => {
    const { container } = renderAt('/export', <ExportScreen />);
    const line = Array.from(container.querySelectorAll('p')).find((p) => p.textContent?.includes('Validation runs in the assessment engine'))!;
    expect(line.className).not.toMatch(/emerald|green/);
    expect(line.querySelector('svg')?.getAttribute('class') ?? '').not.toMatch(/check/);
    expect(raw['/src/screens/08_Export.tsx']).not.toContain('BadgeCheck');
  });
});

describe('3.4 projection floor, pool and invariant', () => {
  const after = CURRENT.after;
  const unresolvable = after.unknownUnauthored + after.views.unweighted.width.uncollectable[0];
  const FLOOR = bandFloorPts(CURRENT.totals.applicable, unresolvable);
  const numerator = after.creditNumerator[0] / after.creditNumerator[1];
  it('the floor is the share of controls no evidence can resolve: 491 of 557, 88.15 points', () => {
    expect(unresolvable).toBe(491);
    expect(FLOOR).toBeCloseTo((491 / 557) * 100, 10);
    expect(FLOOR.toFixed(2)).toBe('88.15');
    expect(FLOOR.toFixed(1)).toBe('88.2');
  });
  it('boundedScore throws on an impossible interval', () => {
    expect(() => boundedScore(10, 5, 0, 0, -1)).toThrow(/Impossible interval/);
  });
  it('projectFromNumerator draws only from the collectable Unknowns (the 14 with an authored requirement)', () => {
    const p = projectFromNumerator(CURRENT.totals.applicable, numerator, after.unknown, unresolvable, evidenceArtifacts().reduce((n, a) => n + a.controls.length, 0));
    expect(p.resolved).toBe(after.unknown - unresolvable);
    expect(p.resolved).toBe(14);
    expect(p.resultingWidthPts).toBeCloseTo(FLOOR, 10);
    expect(p.bestCase.lower).toBeLessThanOrEqual(p.bestCase.upper);
  });
  it('the dashboard (before the upload) and the projection card (from the post-upload verdict) each quote their own floor, and they differ by exactly the control observed from the bundle', () => {
    const before = CURRENT.before;
    const FLOOR_BEFORE = bandFloorPts(CURRENT.totals.applicable, before.unknownUnauthored + before.views.unweighted.width.uncollectable[0]);
    expect(FLOOR_BEFORE).toBeCloseTo((492 / 557) * 100, 10);
    expect(FLOOR_BEFORE.toFixed(1)).toBe('88.3');
    expect(((FLOOR_BEFORE - FLOOR) * CURRENT.totals.applicable) / 100).toBeCloseTo(1, 10);
    const dash = renderAt('/dashboard', <Dashboard />);
    expect(dash.container.textContent).toContain(`by the evidence the plan asks for, at best to ${FLOOR_BEFORE.toFixed(1)} points`);
    dash.unmount();
    useAssessment.setState({ evidenceUploaded: true });
    const rem = renderAt('/remediation', <Remediation />);
    fireEvent.click(rem.getByText("What you didn't provide"));
    expect(rem.container.textContent).toContain(`the band cannot fall below ${FLOOR.toFixed(1)} pts of width`);
  });
  it('providing everything lands exactly on the floor', () => {
    useAssessment.setState({ evidenceUploaded: true, providedRequests: evidenceArtifacts().map((a) => a.signal) });
    const { container, getByText } = renderAt('/remediation', <Remediation />);
    fireEvent.click(getByText("What you didn't provide"));
    expect(container.textContent).toContain(`width ${FLOOR.toFixed(1)} points`);
    expect(container.textContent).toContain(`Band width falls to ${FLOOR.toFixed(1)} pts`);
  });
  it('the new invariant never fires for any analyst override of any seeded control', () => {
    for (const state of ['green', 'red', 'unknown'] as const) {
      const overrides = Object.fromEntries(
        controls().map((c) => [c.id, { state, previousState: 'unknown', justification: 'x', analystId: 't', timestamp: 't' }]),
      ) as Parameters<typeof dashboardView>[1];
      for (const uploaded of [false, true]) expect(() => dashboardView(uploaded, overrides)).not.toThrow();
    }
  });
});

describe('3.5 the chat quotes the live interval', () => {
  const quoted = (uploaded: boolean) => {
    const e = dashboardView(uploaded, {}).effective;
    return `Your interval is ${e.lowerPct.toFixed(1)}–${e.upperPct.toFixed(1)}% at ${e.coveragePct.toFixed(1)}% coverage`;
  };
  const askScore = (c: ReturnType<typeof render>) => {
    fireEvent.click(c.getByText('What is our compliance score?', { selector: 'button' }));
    return c.container.textContent ?? '';
  };

  it('differs between before and after upload and matches the dashboard each time', () => {
    const before = askScore(renderAt('/chat', <Chat />));
    expect(before).toContain(quoted(false));
    expect(before).toContain('0.3–97.6% at 2.7% coverage'); // the engine's data under rule R (the pre-upload projection stated in ministry.ts)
    document.body.innerHTML = '';
    useAssessment.setState({ evidenceUploaded: true });
    const after = askScore(renderAt('/chat', <Chat />));
    expect(after).toContain(quoted(true));
    expect(after).toContain('4.9–95.5% at 9.3% coverage'); // the engine's 4.87%–95.54% and 9.34%
    expect(quoted(false)).not.toBe(quoted(true));
  });

  it('an answer already in the thread moves when the state changes', () => {
    const c = renderAt('/chat', <Chat />);
    expect(askScore(c)).toContain(quoted(false));
    act(() => useAssessment.setState({ evidenceUploaded: true }));
    expect(c.container.textContent).toContain(quoted(true));
    expect(c.container.textContent).not.toContain(quoted(false));
  });

  it('answers quoting fixture-only figures are marked illustrative', () => {
    const c = renderAt('/chat', <Chat />);
    fireEvent.click(c.getByText('Why is JNCSF-102 a gap for us?', { selector: 'button' }));
    const p = Array.from(c.container.querySelectorAll('p')).find((e) => e.textContent?.includes('43 of 512'));
    expect(p?.closest('[data-tier]')?.getAttribute('data-tier')).toBe('illustrative');
  });
});
