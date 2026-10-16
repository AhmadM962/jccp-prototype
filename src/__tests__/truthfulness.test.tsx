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
import { TOTALS } from '../data/capabilities';
import { UNCOLLECTABLE_COUNT } from '../data/controls';
import { dashboardView } from '../lib/derive';
import { bandFloorPts, boundedScore, projectProvision, yellowWeightForShare } from '../lib/scoring';

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
  it.each(['no data is stored', 'Nothing you do here is saved'])('"%s" is not in src/', (needle) => {
    expect(filesContaining(needle)).toEqual([]);
  });
  it('the replacement text is present', () => {
    expect(filesContaining('nothing leaves this machine — your progress is kept in this browser only.')).toEqual(['/src/App.tsx']);
    expect(filesContaining('Your progress is saved in this browser so you can pick up where you left off.')).toEqual([
      '/src/tour/WelcomeGate.tsx',
    ]);
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
  it('a share known only from testimony is capped at the second quartile', () => {
    expect(yellowWeightForShare(0.8, true)).toBe(0.5);
    expect(yellowWeightForShare(0.99, true)).toBe(0.5);
    expect(yellowWeightForShare(0.3, true)).toBe(0.25);
  });
  it('yellowWeightForShare has at least one caller in src/screens/', () => {
    const callers = SRC.filter(([p, t]) => p.startsWith('/src/screens/') && t.includes('yellowWeightForShare('));
    expect(callers.length).toBeGreaterThanOrEqual(1);
  });
  it('Control Detail shows the actual credit (artifact-backed share, Partial)', () => {
    useAssessment.setState({ evidenceUploaded: true });
    const { container } = renderAt('/control/JNCSF-459', <ControlDetail />, '/control/:id');
    expect(container.textContent).toContain('Deployment share 78% — partial credit 0.85 (top quartile) for this control.');
    expect(container.textContent).not.toContain('partial-credit quartile applied to the Yellow weighting');
  });
  it('Control Detail applies the testimony cap before upload and says so', () => {
    const { container } = renderAt('/control/JNCSF-102', <ControlDetail />, '/control/:id');
    expect(container.textContent).toContain(
      'Deployment share 80% — partial credit 0.5 (second quartile; capped because the share rests on testimony alone) for this control.',
    );
  });
  it('Control Detail does not claim credit for a control that is not Partial', () => {
    useAssessment.setState({ evidenceUploaded: true });
    const { container } = renderAt('/control/JNCSF-102', <ControlDetail />, '/control/:id');
    expect(container.textContent).toContain('this control is currently Gap, so none applies.');
  });
  it('the dashboard says the aggregate applies a flat 0.5', () => {
    const { container } = renderAt('/dashboard', <Dashboard />);
    expect(container.textContent).toContain(
      "The aggregate here applies a flat 0.5 to every Partial. Per-control quartile credit is shown on each control's page.",
    );
    // and that sentence is true: the engine calls boundedScore with the default yellow weight
    expect(boundedScore(10, 4, 4, 0, 2).lower).toBe((4 + 4 * 0.5) / 10);
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
});

describe('3.4 projection floor, pool and invariant', () => {
  const FLOOR = bandFloorPts(TOTALS.applicable, UNCOLLECTABLE_COUNT);
  it('floor is computed from the uncollectable count', () => {
    expect(FLOOR).toBeCloseTo((39 / 557) * 100, 10);
    expect(FLOOR.toFixed(1)).toBe('7.0');
  });
  it('boundedScore throws on an impossible interval', () => {
    expect(() => boundedScore(10, 5, 0, 0, -1)).toThrow(/Impossible interval/);
  });
  it('projectProvision draws only from the collectable Unknowns', () => {
    const a = TOTALS.applicable;
    const b = TOTALS.after;
    const p = projectProvision(a, b.green, b.yellow, b.unknown, 49, UNCOLLECTABLE_COUNT);
    expect(p.resolved).toBe(b.unknown - UNCOLLECTABLE_COUNT);
    expect(p.resultingWidthPts).toBeCloseTo(FLOOR, 10);
    expect(p.bestCase.lower).toBeLessThanOrEqual(p.bestCase.upper);
  });
  it('the dashboard and the projection card quote the same floor', () => {
    const dash = renderAt('/dashboard', <Dashboard />);
    expect(dash.container.textContent).toContain(`to narrow this toward ${FLOOR.toFixed(1)} points.`);
    expect(dash.container.textContent).not.toContain('~10 points');
    dash.unmount();
    const rem = renderAt('/remediation', <Remediation />);
    fireEvent.click(rem.getByText("What you didn't provide"));
    expect(rem.container.textContent).toContain(`The band cannot fall below ${FLOOR.toFixed(1)} pts of width`);
  });
  it('providing everything lands exactly on the floor', () => {
    useAssessment.setState({ providedRequests: ['req-siem', 'req-linux', 'req-priv', 'req-backup', 'req-lms'] });
    const { container, getByText } = renderAt('/remediation', <Remediation />);
    fireEvent.click(getByText("What you didn't provide"));
    expect(container.textContent).toContain(`width ${FLOOR.toFixed(1)} points`);
    expect(container.textContent).toContain(`Band width falls to ${FLOOR.toFixed(1)} pts`);
  });
  it('the new invariant never fires for any analyst override of any seeded control', () => {
    for (const state of ['green', 'red', 'unknown'] as const) {
      const overrides = Object.fromEntries(
        controls.map((c) => [c.id, { state, previousState: 'unknown', justification: 'x', analystId: 't', timestamp: 't' }]),
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
    expect(before).toContain('49.9–87.1% at 62.8% coverage');
    document.body.innerHTML = '';
    useAssessment.setState({ evidenceUploaded: true });
    const after = askScore(renderAt('/chat', <Chat />));
    expect(after).toContain(quoted(true));
    expect(after).toContain('70.8–81.4% at 89.4% coverage');
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
