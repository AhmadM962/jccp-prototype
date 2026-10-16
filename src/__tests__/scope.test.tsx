import { beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, render } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import type { ReactElement } from 'react';
import Exclusions from '../screens/10_Exclusions';
import Dashboard from '../screens/04_Dashboard';
import ExportScreen from '../screens/08_Export';
import { useAssessment } from '../store/useAssessment';
import { CURRENT } from '../data/current';
import { PROFILES, PROFILE_ORDER, setActiveProfile } from '../data/profiles';
import { controls, snapshotFor } from '../data/controls';

function renderAt(path: string, el: ReactElement) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path={path} element={el} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  localStorage.clear();
  useAssessment.getState().resetDemo();
  setActiveProfile('ministry');
});

describe('Task 3: the scope exclusions are the engine’s, not a hand-entered register', () => {
  it('the register lists exactly the golden’s excluded controls, with the engine’s justification', () => {
    const { container, getByTestId } = renderAt('/exclusions', <Exclusions />);
    const rows = Array.from(container.querySelectorAll('[data-testid^="exclusion-"]'));
    expect(rows.map((r) => r.getAttribute('data-testid')!.replace('exclusion-', '')).sort()).toEqual(CURRENT.exclusions.map((e) => e.controlId).sort());
    expect(rows.length).toBe(19);
    for (const e of CURRENT.exclusions) {
      const t = container.querySelector(`[data-testid="exclusion-${e.controlId}"]`)!.textContent ?? '';
      expect(t, e.controlId).toContain(e.justification);
      expect(t, e.controlId).toContain(`${e.triggeringFlag} = ${e.triggeringValue}`);
    }
    // the hand-entered register named 12 controls the engine does not exclude (e.g. JNCSF-59) and missed 12 it does (e.g. JNCSF-50)
    expect(container.querySelector('[data-testid="exclusion-JNCSF-59"]')).toBeNull();
    expect(container.querySelector('[data-testid="exclusion-JNCSF-50"]')).not.toBeNull();
    expect(getByTestId('unjustified').textContent).toBe('0');
    expect(getByTestId('na-rate').textContent).toBe('3.3%');
  });

  it('it says the engine was given no sector baseline, in the engine’s words, and invents none', () => {
    const { getByTestId, container } = renderAt('/exclusions', <Exclusions />);
    expect(getByTestId('na-baseline').textContent).toContain('Not compared with a baseline');
    expect(getByTestId('na-baseline').parentElement!.textContent).toContain('no sector baseline supplied');
    expect(container.textContent).not.toMatch(/sector baseline\s*\d/);
    expect(container.textContent).not.toContain('in line with baseline');
  });

  it('the Dashboard card agrees with the register, and makes no baseline claim', () => {
    const { container } = renderAt('/dashboard', <Dashboard />);
    expect(container.textContent).toContain('Scope exclusions — 19 of 576 controls');
    expect(container.textContent).toContain('The engine was not given a sector baseline to compare that rate with');
    expect(container.textContent).not.toContain('in line with baseline');
    expect(container.textContent).not.toContain('your rate is above baseline');
  });

  it('the register follows the profile: the bank excludes nothing and says so; the utility excludes 32 for three flags', () => {
    setActiveProfile('bank');
    const bank = renderAt('/exclusions', <Exclusions />);
    expect(bank.getByTestId('no-exclusions').textContent).toContain('excludes no control');
    expect(bank.container.querySelectorAll('[data-testid^="exclusion-"]').length).toBe(0);
    bank.unmount();
    setActiveProfile('utility');
    const u = renderAt('/exclusions', <Exclusions />);
    expect(u.container.querySelectorAll('[data-testid^="exclusion-"]').length).toBe(32);
    expect(new Set(PROFILES.utility.exclusions.map((e) => e.triggeringFlag)).size).toBe(3);
  });

  it('filtering by flag narrows the register to that flag', () => {
    setActiveProfile('utility');
    const { container, getByLabelText } = renderAt('/exclusions', <Exclusions />);
    fireEvent.change(getByLabelText('Triggering flag'), { target: { value: 'wireless_network' } });
    expect(container.querySelectorAll('[data-testid^="exclusion-"]').length).toBe(PROFILES.utility.exclusions.filter((e) => e.triggeringFlag === 'wireless_network').length);
  });
});

describe('Task 3: the OSCAL preview is built from the real claims, and the boundary from the golden', () => {
  const preview = (model: string, uploaded: boolean) => {
    useAssessment.setState({ evidenceUploaded: uploaded });
    const { container, getAllByText, unmount } = renderAt('/export', <ExportScreen />);
    const names = ['Catalog', 'Profile', 'System Security Plan', 'Assessment Results', 'POA&M'];
    fireEvent.click(getAllByText('Preview JSON')[names.indexOf(model)]);
    const doc = JSON.parse(container.querySelector('pre code')!.textContent!);
    unmount();
    return doc;
  };

  it('each finding is a real claim: its state, evidence class and basis are the engine’s', () => {
    const doc = preview('Assessment Results', true)['assessment-results'];
    const findings = doc.results[0].findings as Record<string, string>[];
    expect(findings.length).toBeGreaterThanOrEqual(3);
    const word = { green: 'satisfied', yellow: 'partially-satisfied', red: 'not-satisfied', unknown: 'not-evaluated' } as const;
    for (const f of findings) {
      const c = controls().find((x) => x.id === f['target-id'])!;
      const s = snapshotFor(c, true);
      expect(f.state, c.id).toBe(word[s.state as keyof typeof word]);
      expect(f['evidence-class'], c.id).toBe(s.evidenceClass);
      if (s.gapBasis) expect(f['gap-basis'], c.id).toBe(s.gapBasis);
      if (s.runId) expect(f['module-run'], c.id).toBe(s.runId);
    }
    // the invented story is gone: JNCSF-102 is Compliant in the golden, and is not reported as not-satisfied
    expect(findings.find((f) => f['target-id'] === 'JNCSF-102' && f.state === 'not-satisfied')).toBeUndefined();
  });

  it('the scope boundary carries the golden’s sector and CICSC flag, not a toggle from the profile form', () => {
    const doc = preview('Assessment Results', true)['assessment-results']['jccp:scope-boundary'];
    expect(doc['sector']).toBe(CURRENT.cicsc.sectorName);
    expect(doc['cicsc-applies']).toBe(CURRENT.cicsc.applies);
    expect(doc['operates-critical-infrastructure']).toBe(CURRENT.cicsc.criticalInfrastructure === 'yes');
    expect(doc['cicsc-assessed']).toBe(false);
  });

  it('the POA&M items are the engine’s top ranked actions, after the upload; there are none before it', () => {
    const after = preview('POA&M', true)['plan-of-action-and-milestones']['poam-items'] as { title: string; rank: number }[];
    expect(after.map((i) => i.title)).toEqual(CURRENT.ranking.items.slice(0, 2).map((i) => i.description));
    expect(after.map((i) => i.rank)).toEqual(CURRENT.ranking.items.slice(0, 2).map((i) => i.rank));
    expect(preview('POA&M', false)['plan-of-action-and-milestones']['poam-items']).toEqual([]);
  });

  it('the applicable count in the preview is the assessment’s', () => {
    expect(preview('Profile', true)['profile']['jccp:coverage-metadata']['controls-applicable']).toBe(CURRENT.totals.applicable);
    for (const id of PROFILE_ORDER) expect(PROFILES[id].totals.applicable).toBeGreaterThan(0);
  });
});
