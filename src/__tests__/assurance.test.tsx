import { beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, render } from '@testing-library/react';
import type { ReactElement } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import Dashboard from '../screens/04_Dashboard';
import Intake from '../screens/03_Intake';
import ExportScreen from '../screens/08_Export';
import ControlDetail from '../screens/06_ControlDetail';
import Chat from '../screens/09_Chat';
import RequestPlan from '../screens/02_RequestPlan';
import Remediation from '../screens/07_Remediation';
import Sidebar from '../components/layout/Sidebar';
import { useAssessment } from '../store/useAssessment';
import { TOTALS } from '../data/capabilities';
import { CURRENT, type DemotionCheck } from '../data/current';
import { PROFILES, PROFILE_ORDER } from '../data/profiles';
import { checkDetail } from '../components/DemotionChecks';
import { controls } from '../data/controls';
import { ASSURANCE_LEVELS } from '../lib/scoring';
import { completenessStatement, movedOutOfUnknown, outsideScopeSentence, unknownResolvedByUpload } from '../lib/coverage';
import { assuranceMeasurement, atOrAbove, headlineLevel, heldLevelReading, levelDefinition, levelHolds, meetsThreshold, pctDown, settledVerdicts } from '../lib/assurance';
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
    expect(CURRENT.assurance.distribution).toEqual({ L0: 3, L1: 12, L2: 36, L3: 1 });
    expect(settledVerdicts()).toBe(52);
    const a = CURRENT.after;
    expect(settledVerdicts()).toBe(a.green + a.yellow + a.red);
    expect(settledVerdicts()).toBe(a.views.unweighted.known);
  });
  it('the engine’s rule, recomputed here, gives the level the data reports: L1', () => {
    expect(headlineLevel()).toBe(CURRENT.assurance.reported);
    expect(CURRENT.assurance.reported).toBe('L1');
  });
  it('37 of 52 is below the threshold and 49 of 52 is above it, so the headline is L1 and not L2', () => {
    const thr = CURRENT.assurance.proportionThreshold;
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
    expect(getByTestId('assurance-measurement').textContent).toContain('37 controls moved out of Unknown (36 in the authored scope, 1 outside it)');
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
    expect(container.textContent).toContain('Testimony and documents · L1');
    expect(container.textContent).not.toContain('Testimony only');
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
  it('the four definitions are the threshold rule, word for word (the threshold read from the data)', () => {
    expect(levelDefinition('L0')).toBe('Fewer than 80% of verdicts rest on documents, tool evidence or an analyst\u2019s signature.');
    expect(levelDefinition('L1')).toBe(
      'At least 80% of verdicts rest on documents, tool evidence or an analyst\u2019s signature, but fewer than 80% rest on tool evidence or an analyst\u2019s signature.',
    );
    expect(levelDefinition('L2')).toBe(
      'At least 80% of verdicts rest on tool evidence or an analyst\u2019s signature, but fewer than 80% rest on an analyst\u2019s signature.',
    );
    expect(levelDefinition('L3')).toBe('At least 80% of verdicts rest on an analyst\u2019s signature.');
  });
  it('no definition says what is missing: none uses "no", "only" or "without"', () => {
    for (const l of ASSURANCE_LEVELS) expect(levelDefinition(l.id), l.id).not.toMatch(/\b(no|only|without|never)\b/i);
  });
  it('exactly one level\u2019s definition is true of the engine\u2019s distribution, and it is the reported level', () => {
    const holding = ASSURANCE_LEVELS.filter((l) => levelHolds(l.id)).map((l) => l.id);
    expect(holding).toEqual([CURRENT.assurance.reported]);
  });
  it('the Dashboard shows the active level\u2019s definition, and the numbers beside it satisfy it', () => {
    useAssessment.setState({ evidenceUploaded: true });
    const { getByTestId } = renderAt('/dashboard', <Dashboard />, '/dashboard');
    expect(getByTestId('level-definition').textContent).toBe(levelDefinition('L1'));
    // 49 of 52 verdicts are at L1 or above (at least 80%), 37 at L2 or above (fewer than 80%)
    expect(meetsThreshold(atOrAbove('L1'), settledVerdicts(), CURRENT.assurance.proportionThreshold)).toBe(true);
    expect(meetsThreshold(atOrAbove('L2'), settledVerdicts(), CURRENT.assurance.proportionThreshold)).toBe(false);
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
  const un = controls().find((c) => !c.authored && c.after.state === 'unknown')!;
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
      `The other ${CURRENT.after.unknownUnauthored} Unknown controls have no authored evidence requirement; an upload cannot establish that any of them is met.`,
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
// comment that states them in the generated profile modules.
describe('provenance of rule R (the before-state)', () => {
  const P = CURRENT.ruleR;

  it('every Compliant verdict is machine-collected, so none can exist before an upload', () => {
    expect(P.compliant).toBe(21);
    expect(P.compliantMachineCollected).toBe(P.compliant);
    expect(CURRENT.after.green).toBe(P.compliant);
    expect(CURRENT.before.green).toBe(0);
  });
  it('the before-state\u2019s verdicts are exactly the engine\u2019s L0 and L1 verdicts, with no exception', () => {
    expect(P.beforeVerdictsAtL0OrL1).toBe(CURRENT.assurance.distribution.L0 + CURRENT.assurance.distribution.L1);
    expect(P.beforeVerdictsAtL0OrL1).toBe(15);
    expect(P.beforeVerdicts).toBe(P.beforeVerdictsAtL0OrL1);
    const b = CURRENT.before;
    expect(b.green + b.yellow + b.red).toBe(P.beforeVerdicts);
  });
  it('a verdict outside the authored scope arrives with the bundle: Unknown before, a Gap after, by observation', () => {
    expect(P.verdictsOutsideAuthoredScope).toEqual([{ id: 'JNCSF-139', state: 'red', gapBasis: 'observed' }]);
    const known = (st: typeof CURRENT.before) => st.views.unweighted.known - st.views.authored_scope.known;
    expect(known(CURRENT.before)).toBe(0);
    expect(known(CURRENT.after)).toBe(P.verdictsOutsideAuthoredScope.length);
    expect(movedOutOfUnknown()).toMatchObject({ total: 37, inside: 36, outside: 1 });
  });
  it('the premises hold in every profile, not only the ministry: the figures are generated with their assertions', () => {
    for (const id of PROFILE_ORDER) {
      const R = PROFILES[id].ruleR;
      expect(R.compliantMachineCollected, id).toBe(R.compliant);
      expect(R.beforeVerdicts, id).toBe(R.beforeVerdictsAtL0OrL1);
      expect(R.beforeVerdicts, id).toBe(PROFILES[id].assurance.distribution.L0 + PROFILES[id].assurance.distribution.L1);
      for (const v of R.verdictsOutsideAuthoredScope) expect(v.gapBasis, `${id} ${v.id}`).toBe('observed');
    }
  });
});

describe('the before-state sits on the threshold and says so', () => {
  it('its own distribution gives L1, and 12 of 15 is exactly 80%: at the boundary', () => {
    expect(CURRENT.assuranceBefore.distribution).toEqual({ L0: 3, L1: 12, L2: 0, L3: 0 });
    expect(headlineLevel('before')).toBe(CURRENT.assuranceBefore.reported);
    expect(heldLevelReading('before')).toMatchObject({ level: 'L1', count: 12, total: 15, measuredPct: 80, thresholdPct: 80, atBoundary: true });
  });
  it('and the exact comparison is exact: the after-state\u2019s 49 of 52 is not at the boundary', () => {
    expect(heldLevelReading('after')).toMatchObject({ level: 'L1', count: 49, total: 52, atBoundary: false });
  });
  it('one verdict fewer at L1 or above would lose the level (the boundary is real, not rhetorical)', () => {
    expect(meetsThreshold(12, 15, CURRENT.assurance.proportionThreshold)).toBe(true);
    expect(meetsThreshold(11, 15, CURRENT.assurance.proportionThreshold)).toBe(false);
  });
  it('the Dashboard before the upload prints the whole line, contiguously, and not after it', () => {
    const before = renderAt('/dashboard', <Dashboard />, '/dashboard');
    expect(before.getByTestId('assurance-boundary').textContent).toBe('12 of 15 (80%) \u00b7 threshold 80% \u00b7 reported L1 \u2014 at the boundary');
    before.unmount();
    useAssessment.setState({ evidenceUploaded: true });
    const after = renderAt('/dashboard', <Dashboard />, '/dashboard');
    expect(after.queryByTestId('assurance-boundary')).toBeNull();
  });
});

describe('JNCSF-139 is in the before/after story, not in a footnote', () => {
  const sentence = 'JNCSF-139 has no authored evidence requirement, but an artifact in the bundle shows it unmet, so it moved from Unknown to a Gap (observed).';
  it('the sentence is written from the generated record', () => {
    expect(outsideScopeSentence()).toBe(sentence);
  });
  it('Intake says it beside the 36, and still says the other 491 cannot be established by an upload', () => {
    useAssessment.setState({ evidenceUploaded: true });
    const { container, getByText } = renderAt('/intake', <Intake />, '/intake');
    fireEvent.click(getByText('Evidence bundle'));
    const t = container.textContent ?? '';
    expect(t).toContain(`1 control outside the authored scope also moved: ${sentence}`);
    // the banner reads as one passage: every sentence is separated from the next by a space
    expect(t).toContain(
      `L2 needs 80%. 1 control outside the authored scope also moved: ${sentence} The other 491 Unknown controls have no authored evidence requirement; an upload cannot establish that any of them is met.`,
    );
    expect(t).toContain('The other 491 Unknown controls have no authored evidence requirement; an upload cannot establish that any of them is met.');
  });
  it('the Dashboard interval subline says it after the upload and not before', () => {
    useAssessment.setState({ evidenceUploaded: true });
    const after = renderAt('/dashboard', <Dashboard />, '/dashboard');
    expect(after.container.textContent).toContain(`in the authored scope. ${sentence}`);
    after.unmount();
    useAssessment.setState({ evidenceUploaded: false });
    const before = renderAt('/dashboard', <Dashboard />, '/dashboard');
    expect(before.container.textContent).not.toContain('JNCSF-139');
    expect(before.container.textContent).toContain('Pre-upload state \u2014 testimony and documents only.');
  });
});

describe('no screen promises that an unauthored control stays Unknown', () => {
  it('the absolute is gone from every source file: an artifact collected for another control can show one unmet', () => {
    const offenders: string[] = [];
    for (const [p, text] of Object.entries(raw)) {
      if (p.startsWith('/src/__tests__/')) continue;
      for (const bad of ['stay Unknown regardless', 'stay Unknown whatever is provided', 'no evidence can ever resolve']) if (text.includes(bad)) offenders.push(`${p}: ${bad}`);
    }
    expect(offenders).toEqual([]);
  });
  it('the Request Plan and the Remediation card say what is true instead', () => {
    const plan = renderAt('/request-plan', <RequestPlan />, '/request-plan');
    expect(plan.container.textContent).toContain('the plan cannot ask for anything that would establish that any of them is met. They stay Unknown unless an artifact collected for another control happens to show one unmet.');
    plan.unmount();
    useAssessment.setState({ evidenceUploaded: true });
    const rem = renderAt('/remediation', <Remediation />, '/remediation');
    fireEvent.click(rem.getByText("What you didn't provide"));
    expect(rem.container.textContent).toContain('and stay Unknown unless an artifact collected for another control happens to show one unmet.');
  });
});

describe('the demotion checks are shown, all of them, and a check that could not run is not a pass', () => {
  const shown = () => {
    useAssessment.setState({ evidenceUploaded: true });
    return renderAt('/dashboard', <Dashboard />, '/dashboard');
  };
  it('all four checks, in the engine\u2019s order, each with its status', () => {
    const { getByTestId, container } = shown();
    const rows = [...container.querySelectorAll('[data-testid^="demotion-check-"]')];
    expect(rows.map((r) => r.getAttribute('data-testid'))).toEqual([
      'demotion-check-declined_module',
      'demotion-check-unresolved_profile_challenge',
      'demotion-check-unusable_evidence_proportion',
      'demotion-check-na_rate_above_baseline',
    ]);
    expect(rows.map((r) => r.getAttribute('data-status'))).toEqual(['passed', 'not_assessed', 'passed', 'not_assessed']);
    expect(getByTestId('demotion-summary').textContent).toBe('No demotion applied: reported L1, base L1. 2 passed \u00b7 0 triggered \u00b7 2 not assessed.');
  });
  it('an assessed check shows its measured value and its threshold, with the figures behind them', () => {
    const { getByTestId } = shown();
    const declined = getByTestId('demotion-check-declined_module');
    expect(declined.textContent).toContain('Declined module');
    expect(declined.textContent).toContain('Passed');
    expect(declined.textContent).toContain('Measured 7.1% \u00b7 threshold 20%');
    expect(declined.textContent).toContain('4/56 in-scope signals had only declined module runs covering them');
    const unusable = getByTestId('demotion-check-unusable_evidence_proportion');
    expect(unusable.textContent).toContain('Measured 0.2% \u00b7 threshold 20%');
    expect(unusable.textContent).toContain('1/557 claims unknown because evidence was unusable (1 stale, 0 future-dated)');
  });
  it('a check that could not run says so: not assessed, not measured, no threshold, and never the word Passed', () => {
    const { getByTestId } = shown();
    for (const cause of ['unresolved_profile_challenge', 'na_rate_above_baseline']) {
      const row = getByTestId(`demotion-check-${cause}`);
      expect(row.textContent, cause).toContain('Not assessed');
      expect(row.textContent, cause).toContain('Measured: not measured \u00b7 no threshold applied');
      expect(row.textContent, cause).not.toContain('Passed');
      expect(row.textContent, cause).not.toMatch(/\d%/);
    }
    expect(getByTestId('demotion-checks').textContent).toContain('neither passed nor failed, and not counted as a pass');
    // each says why in the engine's own words, and not the other's reason
    expect(getByTestId('demotion-check-unresolved_profile_challenge').textContent).toContain('not modelled');
    expect(getByTestId('demotion-check-unresolved_profile_challenge').textContent).not.toContain('baseline');
    expect(getByTestId('demotion-check-na_rate_above_baseline').textContent).toContain('no sector baseline supplied');
    expect(getByTestId('demotion-check-na_rate_above_baseline').textContent).not.toContain('not modelled');
  });
  it('the table is the engine\u2019s after-upload result: absent before the upload', () => {
    const { queryByTestId } = renderAt('/dashboard', <Dashboard />, '/dashboard');
    expect(queryByTestId('demotion-checks')).toBeNull();
  });
  it('the data keeps the invariants the engine states: an assessed check has numbers, one that did not run has none', () => {
    expect(CURRENT.assurance.checks).toHaveLength(4);
    for (const c of CURRENT.assurance.checks) {
      const ran = c.status !== 'not_assessed';
      expect(c.count !== null && c.of !== null && c.threshold !== null, c.cause).toBe(ran);
      expect(c.detail.length, c.cause).toBeGreaterThan(0);
    }
    expect(CURRENT.assurance.demotionsApplied).toBe(CURRENT.assurance.checks.filter((c) => c.status === 'triggered').length);
    expect(CURRENT.assurance.reported).toBe('L1');
  });
  it('the detail line is the engine\u2019s string, passed through unchanged', () => {
    const c: DemotionCheck = { cause: 'declined_module', status: 'triggered', count: 30, of: 56, threshold: [1, 5], detail: 'the engine said this', components: [] };
    expect(checkDetail(c)).toBe('the engine said this');
    for (const k of CURRENT.assurance.checks) expect(checkDetail(k)).toBe(k.detail);
  });
});
