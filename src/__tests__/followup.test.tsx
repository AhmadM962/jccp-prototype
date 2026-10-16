import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import type { ReactElement } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import ControlDetail from '../screens/06_ControlDetail';
import Dashboard from '../screens/04_Dashboard';
import ScoreInterval from '../components/ScoreInterval';
import { useAssessment } from '../store/useAssessment';
import { controlById, controls, type ShareBasis } from '../data/controls';
import { assertDisplayedInterval, yellowWeightForShare } from '../lib/scoring';

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

describe('share basis is a fact in the data', () => {
  const withShare = controls.filter((c) => c.deploymentSharePct !== undefined);

  it('exactly the controls that carry a share carry a basis, in both snapshots', () => {
    expect(withShare.map((c) => c.id)).toEqual(['JNCSF-102', 'JNCSF-394', 'JNCSF-459']);
    for (const c of controls) {
      const has = c.deploymentSharePct !== undefined;
      for (const when of ['before', 'after'] as const) {
        expect(c[when].deploymentShareBasis !== undefined, `${c.id} ${when}`).toBe(has);
      }
    }
  });
  it('a share beside testimony or no evidence is never recorded as measured', () => {
    for (const c of withShare) {
      for (const when of ['before', 'after'] as const) {
        const snap = c[when];
        if (snap.evidenceClass === 'none' || snap.evidenceClass === 'testimonial') {
          expect(snap.deploymentShareBasis, `${c.id} ${when}`).toBe('claimed');
        }
      }
    }
  });
  it('seeded values are what the evidence-class proxy gave: claimed before, measured after', () => {
    for (const c of withShare) {
      expect(c.before.deploymentShareBasis).toBe('claimed');
      expect(c.after.deploymentShareBasis).toBe('measured');
    }
  });
});

describe('the cap reads the basis, not the evidence class', () => {
  const ctl = controlById('JNCSF-459')!;
  const saved = { before: ctl.before.deploymentShareBasis, after: ctl.after.deploymentShareBasis };
  afterEach(() => {
    ctl.before.deploymentShareBasis = saved.before;
    ctl.after.deploymentShareBasis = saved.after;
  });

  const credit = (basis: ShareBasis) => yellowWeightForShare(0.78, basis);
  it('the function applies the rule to the basis it is given', () => {
    expect(credit('claimed')).toBe(0.5);
    expect(credit('measured')).toBe(0.85);
  });
  it('artifact evidence with a claimed share is capped (the hole in the old proxy)', () => {
    ctl.after.deploymentShareBasis = 'claimed';
    useAssessment.setState({ evidenceUploaded: true });
    expect(ctl.after.evidenceClass).toBe('artifact');
    const { container } = renderAt('/control/JNCSF-459', <ControlDetail />, '/control/:id');
    expect(container.textContent).toContain(
      'Deployment share 78% (claimed) — partial credit 0.5 (second quartile; capped because the share is claimed, not measured) for this control.',
    );
  });
  it('testimonial evidence with a measured share is not capped', () => {
    ctl.before.deploymentShareBasis = 'measured';
    expect(ctl.before.evidenceClass).toBe('testimonial');
    const { container } = renderAt('/control/JNCSF-459', <ControlDetail />, '/control/:id');
    expect(container.textContent).toContain('Deployment share 78% (measured) — partial credit 0.85 (top quartile)');
  });
  it('the basis is shown beside the share, before and after the upload', () => {
    let r = renderAt('/control/JNCSF-102', <ControlDetail />, '/control/:id');
    expect(r.container.textContent).toContain('Deployment share 80% (claimed)');
    r.unmount();
    useAssessment.setState({ evidenceUploaded: true });
    r = renderAt('/control/JNCSF-102', <ControlDetail />, '/control/:id');
    expect(r.container.textContent).toContain('Deployment share 80% (measured)');
  });
  it('an analyst override does not turn a claimed share into a measured one', () => {
    useAssessment.getState().overrideControl('JNCSF-102', {
      state: 'green',
      previousState: 'yellow',
      justification: 'test',
      analystId: 'a',
      timestamp: '2026-09-08T10:00:00+03:00',
    });
    const { container } = renderAt('/control/JNCSF-102', <ControlDetail />, '/control/:id');
    expect(container.textContent).toContain('Deployment share 80% (claimed) — would earn partial credit 0.5 (second quartile; capped');
  });
});

describe('4.2 the gap-reason chart is tagged illustrative', () => {
  it('its card sits inside an illustrative region', () => {
    const { getByText } = renderAt('/dashboard', <Dashboard />, '/dashboard');
    expect(getByText('Why controls are unevidenced').closest('[data-tier]')?.getAttribute('data-tier')).toBe('illustrative');
  });
});

describe('runtime guard on the displayed interval', () => {
  it('assertDisplayedInterval accepts a consistent interval', () => {
    expect(() => assertDisplayedInterval(40, 52.5, 12.5, 't')).not.toThrow();
    expect(() => assertDisplayedInterval(40, 40, 0, 't')).not.toThrow();
    expect(() => assertDisplayedInterval(40, 52.5, undefined, 't')).not.toThrow();
  });
  it('throws when lower > upper', () => {
    expect(() => assertDisplayedInterval(76.6, 75.7, undefined, 't')).toThrow(/Impossible interval in t/);
  });
  it('throws when the width is not upper - lower', () => {
    expect(() => assertDisplayedInterval(40, 52.5, 9.2, 't')).toThrow(/Displayed interval inconsistent in t/);
    expect(() => assertDisplayedInterval(40, 52.5, -5.6, 't')).toThrow(/Displayed interval inconsistent/);
  });
  it('ScoreInterval, which every drawn band passes through, refuses to draw an impossible one', () => {
    const quiet = console.error;
    console.error = () => {};
    try {
      expect(() => render(<ScoreInterval lower={78.9} upper={73.3} />)).toThrow(/Impossible interval/);
      expect(() => render(<ScoreInterval lower={40} upper={52.5} widthPts={9.2} />)).toThrow(/Displayed interval inconsistent/);
      expect(() => render(<ScoreInterval lower={40} upper={52.5} ghost={{ lower: 60, upper: 50 }} />)).toThrow(/ghost/);
      expect(() => render(<ScoreInterval lower={40} upper={52.5} widthPts={12.5} />)).not.toThrow();
    } finally {
      console.error = quiet;
    }
  });
});
