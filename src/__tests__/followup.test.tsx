import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import type { ReactElement } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import ControlDetail from '../screens/06_ControlDetail';
import Dashboard from '../screens/04_Dashboard';
import ScoreInterval from '../components/ScoreInterval';
import { useAssessment } from '../store/useAssessment';
import { controlById, controls, type ShareBasis } from '../data/controls';
import FigureBoundary, { WITHHELD_MESSAGE } from '../components/FigureBoundary';
import { IntervalConsistencyError, assertDisplayedInterval, yellowWeightForShare } from '../lib/scoring';

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
  // These seeds no longer reproduce the old evidence-class proxy, and should not: the proxy called
  // every artifact-backed share measured. JNCSF-394's record says only "Coverage ~80%" — a tilde and
  // no denominator, the shape of a claim — whereas 102 (410/512) and 459 (484/620) are counts.
  it('before the upload every share is claimed (testimony)', () => {
    for (const c of withShare) expect(c.before.deploymentShareBasis, c.id).toBe('claimed');
  });
  it('after the upload 102 and 459 are measured counts; 394 stays claimed', () => {
    const after = Object.fromEntries(withShare.map((c) => [c.id, c.after.deploymentShareBasis]));
    expect(after).toEqual({ 'JNCSF-102': 'measured', 'JNCSF-394': 'claimed', 'JNCSF-459': 'measured' });
  });
  it('so one control still shows a capped share after the upload (394, which has artifact evidence)', () => {
    useAssessment.setState({ evidenceUploaded: true });
    expect(controlById('JNCSF-394')!.after.evidenceClass).toBe('artifact');
    const { container } = renderAt('/control/JNCSF-394', <ControlDetail />, '/control/:id');
    expect(container.textContent).toContain(
      'Deployment share 80% (claimed) — would earn partial credit 0.5 (second quartile; capped because the share is claimed, not measured) if Partial; this control is currently Compliant, so none applies.',
    );
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
  it('ScoreInterval, which every drawn band passes through, withholds an impossible one and says so', () => {
    const logged: string[] = [];
    const quiet = console.error;
    console.error = (...a: unknown[]) => logged.push(a.map(String).join(' '));
    try {
      for (const [bad, where] of [
        [<ScoreInterval key="a" lower={78.9} upper={73.3} />, 'ScoreInterval'],
        [<ScoreInterval key="b" lower={40} upper={52.5} widthPts={9.2} />, 'ScoreInterval'],
        [<ScoreInterval key="c" lower={40} upper={52.5} ghost={{ lower: 60, upper: 50 }} />, 'ScoreInterval ghost'],
      ] as const) {
        logged.length = 0;
        const { container, getByTestId, unmount } = render(bad);
        expect(getByTestId('figure-withheld').textContent).toBe(WITHHELD_MESSAGE);
        expect(getByTestId('figure-withheld').getAttribute('data-where')).toBe(where);
        expect(container.querySelector('span.text-3xl')).toBeNull(); // no number is shown
        expect(logged.some((l) => l.includes(`[consistency] figure withheld by guard "${where}"`))).toBe(true);
        unmount();
      }
      const ok = render(<ScoreInterval lower={40} upper={52.5} widthPts={12.5} />);
      expect(ok.queryByTestId('figure-withheld')).toBeNull();
      expect(ok.container.querySelectorAll('span.text-3xl').length).toBe(2);
    } finally {
      console.error = quiet;
    }
  });
  it('the message is the agreed wording', () => {
    expect(WITHHELD_MESSAGE).toBe(
      'This figure could not be displayed because it failed an internal consistency check. The assessment data is unchanged; the number was withheld rather than shown unverified.',
    );
  });
});

describe('FigureBoundary', () => {
  const Boom = ({ err }: { err: Error }): never => {
    throw err;
  };
  const silenced = (fn: () => void): void => {
    const quiet = console.error;
    console.error = () => {};
    try {
      fn();
    } finally {
      console.error = quiet;
    }
  };
  it('does not hide an ordinary bug: it rethrows anything that is not a consistency failure', () => {
    silenced(() => {
      expect(() =>
        render(
          <FigureBoundary>
            <Boom err={new Error('an ordinary bug')} />
          </FigureBoundary>,
        ),
      ).toThrow('an ordinary bug');
    });
  });
  it('keeps its siblings rendering', () => {
    silenced(() => {
      const { getByText, getByTestId } = render(
        <div>
          <span>the rest of the page</span>
          <FigureBoundary>
            <Boom err={new IntervalConsistencyError('x', 'forced')} />
          </FigureBoundary>
        </div>,
      );
      expect(getByText('the rest of the page')).toBeTruthy();
      expect(getByTestId('figure-withheld')).toBeTruthy();
    });
  });
  it('tries again when the data behind the figure changes (resetKey)', () => {
    silenced(() => {
      const bad = <Boom err={new IntervalConsistencyError('x', 'forced')} />;
      const { rerender, queryByTestId, getByText } = render(<FigureBoundary resetKey="1">{bad}</FigureBoundary>);
      expect(queryByTestId('figure-withheld')).not.toBeNull();
      rerender(<FigureBoundary resetKey="2"><span>recovered</span></FigureBoundary>);
      expect(getByText('recovered')).toBeTruthy();
      expect(queryByTestId('figure-withheld')).toBeNull();
    });
  });
});
