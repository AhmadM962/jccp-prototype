import { beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, render } from '@testing-library/react';
import type { ReactElement } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import Dashboard from '../screens/04_Dashboard';
import GapMatrix from '../screens/05_GapMatrix';
import Intake from '../screens/03_Intake';
import { useAssessment } from '../store/useAssessment';
import { TOTALS } from '../data/capabilities';
import { GAP_REASON_BREAKDOWN, controls } from '../data/controls';

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

describe('4.1 90 vs 148 vs 25 — each figure computed from its own source and named precisely', () => {
  const resolved = TOTALS.before.unknown - TOTALS.after.unknown;
  const changed = controls.filter((c) => c.changed).length;

  it('the three sources are what the brief says they are', () => {
    expect(resolved).toBe(148);
    expect(changed).toBe(25);
    expect(controls.length).toBe(48);
  });
  it('the literal 90 is gone from the dashboard copy', () => {
    expect(dashboardSrc).not.toContain('closed 90 evidence gaps');
    expect(dashboardSrc).not.toContain('the 90 promoted controls');
    expect(intakeSrc).not.toContain('148 evidence gaps closed');
  });
  it('the dashboard names 148 of 207 Unknown controls and 25 of 48 seeded controls', () => {
    useAssessment.setState({ evidenceUploaded: true });
    const { container } = renderAt('/dashboard', <Dashboard />, '/dashboard');
    expect(container.textContent).toContain(
      `resolved ${resolved} of ${TOTALS.before.unknown} Unknown controls.`,
    );
    expect(container.textContent).toContain(`See the ${changed} of ${controls.length} seeded controls changed by the upload in the Gap Matrix`);
  });
  it('Intake names the same 148 and its before/after Unknown counts', () => {
    useAssessment.setState({ evidenceUploaded: true });
    const { container, getByText } = renderAt('/intake', <Intake />, '/intake');
    fireEvent.click(getByText('Evidence bundle'));
    expect(container.textContent).toContain(
      `${resolved} Unknown controls resolved (${TOTALS.before.unknown} → ${TOTALS.after.unknown})`,
    );
  });
  it('the Gap Matrix filter the link opens shows exactly the 25 changed seeds', () => {
    useAssessment.setState({ evidenceUploaded: true });
    const { container } = renderAt('/gap-matrix?changed=1', <GapMatrix />, '/gap-matrix');
    const shown = Array.from((container.textContent ?? '').matchAll(/(\d+) of \d+ seeded shown/g)).reduce(
      (n, m) => n + Number(m[1]),
      0,
    );
    expect(shown).toBe(changed);
  });
});

describe('4.2 the gap-reason chart accounts for every Unknown', () => {
  it('has a module_failed row', () => {
    expect(GAP_REASON_BREAKDOWN.map((r) => r.reason)).toContain('module_failed');
  });
  it('rows reconcile to TOTALS before and after', () => {
    expect(GAP_REASON_BREAKDOWN.reduce((s, r) => s + r.before, 0)).toBe(TOTALS.before.unknown);
    expect(GAP_REASON_BREAKDOWN.reduce((s, r) => s + r.after, 0)).toBe(TOTALS.after.unknown);
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
