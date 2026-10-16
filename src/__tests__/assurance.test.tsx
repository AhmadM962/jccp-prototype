import { beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, render } from '@testing-library/react';
import type { ReactElement } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import Dashboard from '../screens/04_Dashboard';
import Intake from '../screens/03_Intake';
import ExportScreen from '../screens/08_Export';
import ControlDetail from '../screens/06_ControlDetail';
import Chat from '../screens/09_Chat';
import Sidebar from '../components/layout/Sidebar';
import { useAssessment } from '../store/useAssessment';
import { TOTALS } from '../data/capabilities';
import { ASSURANCE, MINISTRY, RULE_R_PROVENANCE } from '../data/ministry';
import { controls } from '../data/controls';
import { ASSURANCE_LEVELS } from '../lib/scoring';
import { completenessStatement, unknownResolvedByUpload } from '../lib/coverage';
import { assuranceMeasurement, atOrAbove, headlineLevel, meetsThreshold, pctDown, settledVerdicts } from '../lib/assurance';
import { TOUR_STEPS } from '../tour/steps';

const raw = import.meta.glob('/src/**/*.{ts,tsx}', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;

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

// The numbers the sentence "37 of the 52 verdicts are tool-evidenced or analyst-signed — 71%, under the
// engine's 0.8 threshold" rests on, recomputed from the engine's distribution and held here so a change to
// the data fails a test rather than a screen.
describe('the assurance level is the engine’s, with its measurement', () => {
  it('the distribution is over exactly the settled verdicts of the after state', () => {
    expect(ASSURANCE.distribution).toEqual({ L0: 3, L1: 12, L2: 36, L3: 1 });
    expect(settledVerdicts()).toBe(52);
    const a = MINISTRY.after;
    expect(settledVerdicts()).toBe(a.green + a.yellow + a.red);
    expect(settledVerdicts()).toBe(a.views.unweighted.known);
  });
  it('the engine’s rule, recomputed here, gives the level the data reports: L1', () => {
    expect(headlineLevel()).toBe(ASSURANCE.reported);
    expect(ASSURANCE.reported).toBe('L1');
  });
  it('37 of 52 is below the threshold and 49 of 52 is above it, so the headline is L1 and not L2', () => {
    const thr = ASSURANCE.proportionThreshold;
    expect(thr).toEqual([4, 5]); // 0.8
    expect(atOrAbove('L2')).toBe(37);
    expect(meetsThreshold(37, 52, thr)).toBe(false);
    expect(atOrAbove('L1')).toBe(49);
    expect(meetsThreshold(49, 52, thr)).toBe(true);
    expect(atOrAbove('L3')).toBe(1);
  });
  it('the exact comparison is exact: 80% exactly meets, one verdict fewer does not', () => {
    expect(meetsThreshold(4, 5, [4, 5])).toBe(true);
    expect(meetsThreshold(39, 50, [4, 5])).toBe(false);
    expect(meetsThreshold(40, 50, [4, 5])).toBe(true);
  });
  it('the measurement the screens show', () => {
    const m = assuranceMeasurement();
    expect(m).toMatchObject({ level: 'L1', next: 'L2', count: 37, total: 52, measuredPct: 71, thresholdPct: 80 });
    expect(m.qualifies).toBe('tool-evidenced or analyst-signed');
  });
  it('the percentage is rounded down: a figure under the threshold is never shown as equal to it', () => {
    expect(pctDown(398, 500)).toBe(79); // 79.6% must not read as 80%
    expect(pctDown(37, 52)).toBe(71);
  });
  it('the totals carry the level: L1 before and after', () => {
    expect(TOTALS.before.assurance).toBe('L1');
    expect(TOTALS.after.assurance).toBe('L1');
    expect(completenessStatement(false).assurance).toBe('L1 — Documented');
    expect(completenessStatement(true).assurance).toBe('L1 — Documented');
  });
});

describe('no screen says L2', () => {
  it('Dashboard after the upload: the active level is L1, with the measured value and the threshold beside it', () => {
    useAssessment.setState({ evidenceUploaded: true });
    const { container, getByTestId } = renderAt('/dashboard', <Dashboard />, '/dashboard');
    const text = container.textContent ?? '';
    const active = container.querySelector('[data-tour="dash-assurance"] li.border-accent');
    expect(active?.textContent).toContain('L1');
    expect(active?.textContent).not.toContain('L2');
    expect(getByTestId('assurance-numbers').textContent).toBe('Measured 37 of 52 (71%) · threshold 80% · reported L1');
    expect(getByTestId('assurance-measurement').textContent).toContain('The collection succeeded; the level did not rise.');
    expect(getByTestId('assurance-measurement').textContent).toContain(`${unknownResolvedByUpload().resolved} controls moved out of Unknown`);
    expect(text).toContain('Assurance level: L1 — Documented.');
    expect(text).not.toContain('L2 — Tool-evidenced');
    expect(text).not.toContain('Why L2');
    // the old definition of L1 said "no machine-collected artifacts", which is false once the bundle is in
    expect(text).not.toContain('no machine-collected');
  });
  it('Dashboard before the upload shows no measurement box (nothing was collected to explain)', () => {
    const { queryByTestId, container } = renderAt('/dashboard', <Dashboard />, '/dashboard');
    expect(queryByTestId('assurance-measurement')).toBeNull();
    expect(container.textContent).toContain('Assurance level: L1 — Documented.');
  });
  it('Dashboard, executive view, after the upload', () => {
    useAssessment.setState({ evidenceUploaded: true, role: 'executive' });
    const { container } = renderAt('/dashboard', <Dashboard />, '/dashboard');
    expect(container.textContent).toContain('Assurance L1 — Documented');
    expect(container.textContent).not.toContain('L2 — Tool-evidenced');
  });
  it('the sidebar badge says L1, with the measured value and the threshold', () => {
    useAssessment.setState({ evidenceUploaded: true });
    const { getByTestId, container } = render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>,
    );
    expect(container.textContent).toContain('Evidence bundle loaded · L1');
    expect(container.textContent).not.toContain('Evidence bundle loaded · L2');
    expect(getByTestId('sidebar-assurance-measurement').textContent).toBe('71% tool-evidenced or analyst-signed · L2 needs 80%');
  });
  it('the sidebar badge before the upload is unchanged', () => {
    const { queryByTestId, container } = render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>,
    );
    expect(container.textContent).toContain('Testimony only · L1');
    expect(queryByTestId('sidebar-assurance-measurement')).toBeNull();
  });
  it('the Intake banner says the level stays at L1 and why', () => {
    useAssessment.setState({ evidenceUploaded: true });
    const { container, getByText } = renderAt('/intake', <Intake />, '/intake');
    fireEvent.click(getByText('Evidence bundle'));
    const text = container.textContent ?? '';
    expect(text).toContain('Assurance stays at L1: 37 of 52 verdicts (71%) are tool-evidenced or analyst-signed, and L2 needs 80%.');
    expect(text).not.toContain('assurance L1 → L2');
  });
  it('"stays" is true: the level before equals the level after', () => {
    expect(TOTALS.before.assurance).toBe(TOTALS.after.assurance);
  });
  it('the OSCAL package carries L1', () => {
    useAssessment.setState({ evidenceUploaded: true });
    const { getAllByText, container } = renderAt('/export', <ExportScreen />, '/export');
    const seen: string[] = [];
    for (const b of getAllByText('Preview JSON')) {
      fireEvent.click(b);
      seen.push(container.querySelector('pre')?.textContent ?? '');
    }
    expect(seen.some((t) => t.includes('"assurance-level": "L1 — Documented"'))).toBe(true);
    expect(seen.every((t) => !t.includes('L2 — Tool-evidenced'))).toBe(true);
  });
  it('the Chat answer about assurance gives the measurement, not the old module-failure story', () => {
    useAssessment.setState({ evidenceUploaded: true });
    const { getByText, container } = renderAt('/chat', <Chat />, '/chat');
    fireEvent.click(getByText("What's blocking L3 assurance?", { selector: 'button' }));
    const t = container.textContent ?? '';
    expect(t).toContain('After the evidence bundle the assessment is reported at L1: 37 of 52 verdicts (71%) are tool-evidenced or analyst-signed; L2 needs 80%.');
    expect(t).toContain('L3 would need 80% of the verdicts analyst-signed; here that is 1 of 52.');
    expect(t).not.toContain('every declared-estate module to succeed');
  });
  it('the tour step names the measurement and does not promise L2', () => {
    const step = TOUR_STEPS.find((s) => s.id === 'assurance')!;
    expect(step.body).toContain('the level stays at L1');
    expect(step.body).toContain('37 of 52 verdicts (71%) are tool-evidenced or analyst-signed; L2 needs 80%.');
    expect(step.body).not.toMatch(/72% at L2/);
  });
  it('the ladder definitions describe the engine’s rule, not the best evidence collected', () => {
    const l1 = ASSURANCE_LEVELS.find((l) => l.id === 'L1')!;
    const l2 = ASSURANCE_LEVELS.find((l) => l.id === 'L2')!;
    expect(l1.definition).not.toContain('no machine-collected');
    expect(l2.definition).not.toContain('majority');
    expect(l2.definition).toContain('meets the threshold');
  });
  it('no source file states the old reading of the level', () => {
    const offenders: string[] = [];
    for (const [p, text] of Object.entries(raw)) {
      if (p.startsWith('/src/__tests__/')) continue;
      for (const bad of ["'L2 — Tool-evidenced' : 'L1", "Evidence bundle loaded · L2", 'Why L2, not L3', 'assurance L1 → L2']) {
        if (text.includes(bad)) offenders.push(`${p}: ${bad}`);
      }
    }
    expect(offenders).toEqual([]);
  });
});

describe('the unauthored statement claims only what is true of every unauthored control', () => {
  const un = controls.find((c) => !c.authored)!;
  const show = () => renderAt(`/control/${un.id}`, <ControlDetail />, '/control/:id').getByTestId('unauthored-statement').textContent ?? '';

  it('says an upload cannot establish that the control is met, not that it cannot change anything', () => {
    const t = show();
    expect(t).toContain('Uploading evidence cannot establish that this control is met.');
    expect(t).not.toContain('cannot change this');
  });
  it('for an Unknown control it still calls the Unknown the tool’s limitation', () => {
    const t = show();
    expect(t).toContain('a limitation of the tool, not a finding about the organisation');
    expect(t).toContain('nothing here says the control is met, and nothing says it is not');
  });
  it('once a verdict exists for it (an analyst override), it no longer says nothing says so', () => {
    useAssessment.getState().overrideControl(un.id, {
      state: 'green',
      previousState: 'unknown',
      justification: 'test',
      analystId: 'a',
      timestamp: '2026-09-08T10:00:00+03:00',
    });
    const t = show();
    expect(t).not.toContain('nothing here says the control is met');
    expect(t).not.toContain('nothing says it is not');
    expect(t).toContain('Uploading evidence cannot establish that this control is met.');
  });
  it('the Intake sentence says the same thing about the Unknown controls it counts', () => {
    useAssessment.setState({ evidenceUploaded: true });
    const { container, getByText } = renderAt('/intake', <Intake />, '/intake');
    fireEvent.click(getByText('Evidence bundle'));
    expect(container.textContent).toContain(
      `The other ${MINISTRY.after.unknownUnauthored} Unknown controls have no authored evidence requirement; an upload cannot establish that any of them is met.`,
    );
  });
  it('no screen says an upload "cannot change" an unauthored control', () => {
    const offenders: string[] = [];
    for (const [p, text] of Object.entries(raw)) {
      if (p.startsWith('/src/__tests__/')) continue;
      for (const bad of ['Uploading evidence cannot change this', 'an upload cannot change them']) if (text.includes(bad)) offenders.push(`${p}: ${bad}`);
    }
    expect(offenders).toEqual([]);
  });
});

// The before-state is the engine's data under one stated projection. Its two premises are asserted by the
// generator from the golden file; here they are held against the figures the prototype uses, and against the
// comment that states them in ministry.ts.
describe('provenance of rule R (the before-state)', () => {
  const P = RULE_R_PROVENANCE;
  const header = (raw['/src/data/ministry.ts'] ?? '').split('\n').slice(0, 25).join('\n');

  it('every Compliant verdict is machine-collected, so none can exist before an upload', () => {
    expect(P.compliant).toBe(21);
    expect(P.compliantMachineCollected).toBe(P.compliant);
    expect(MINISTRY.after.green).toBe(P.compliant);
    expect(MINISTRY.before.green).toBe(0);
  });
  it('the before-state’s verdicts are the engine’s L0 and L1 verdicts, plus the one kept control', () => {
    expect(P.beforeVerdictsAtL0OrL1).toBe(ASSURANCE.distribution.L0 + ASSURANCE.distribution.L1);
    expect(P.beforeVerdictsAtL0OrL1).toBe(15);
    expect(P.beforeVerdictsKeptOutsideAuthoredScope).toBe(1);
    expect(P.beforeVerdicts).toBe(P.beforeVerdictsAtL0OrL1 + P.beforeVerdictsKeptOutsideAuthoredScope);
    const b = MINISTRY.before;
    expect(b.green + b.yellow + b.red).toBe(P.beforeVerdicts);
  });
  it('the authored scope moves by the same amount whichever way the kept control is treated', () => {
    // the kept control has no authored path, so it is not in the authored scope in either state
    const scope = unknownResolvedByUpload();
    expect(scope.resolved).toBe(MINISTRY.after.views.authored_scope.known - MINISTRY.before.views.authored_scope.known);
    expect(MINISTRY.before.views.unweighted.known - MINISTRY.before.views.authored_scope.known).toBe(P.beforeVerdictsKeptOutsideAuthoredScope);
    expect(MINISTRY.after.views.unweighted.known - MINISTRY.after.views.authored_scope.known).toBe(P.beforeVerdictsKeptOutsideAuthoredScope);
  });
  it('the comment in ministry.ts states the same figures, names the kept control, and no longer calls the before-state "not an engine figure"', () => {
    expect(header).toContain(`all ${P.compliant} Compliant verdicts rest on machine collection`);
    expect(header).toContain(`has ${P.beforeVerdictsAtL0OrL1} at L0 or L1`);
    expect(header).toContain(`${P.beforeVerdicts} verdicts = ${P.beforeVerdictsAtL0OrL1} + ${P.beforeVerdictsKeptOutsideAuthoredScope}`);
    expect(header).toContain('JNCSF-139');
    expect(header).not.toContain('NOT an engine figure');
  });
});
