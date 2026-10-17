import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import type { ReactElement } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import ControlDetail from '../screens/06_ControlDetail';
import Dashboard from '../screens/04_Dashboard';
import ScoreInterval from '../components/ScoreInterval';
import { useAssessment } from '../store/useAssessment';
import { type ShareBasis } from '../data/controls';
import { PROFILES, PROFILE_ORDER, type ProfileId } from '../data/profiles';
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

describe('share basis is a fact in the data (the engine\u2019s, for every profile)', () => {
  const withShare = (p: (typeof PROFILES)[ProfileId]) => p.claims.filter((c) => c.share && c.share.interval);

  it('every share carries its basis, and a share-based Partial always has a share', () => {
    for (const id of PROFILE_ORDER) {
      for (const c of withShare(PROFILES[id])) expect(['claimed', 'established'], `${id} ${c.id}`).toContain(c.share!.interval!.basis);
      for (const c of PROFILES[id].claims.filter((x) => x.partialBasis === 'share')) expect(c.share?.interval, `${id} ${c.id}`).toBeTruthy();
    }
  });
  it('a share beside testimony is claimed, never established', () => {
    for (const id of PROFILE_ORDER) {
      for (const c of PROFILES[id].claims.filter((x) => x.evidenceKind === 'testimony' && x.share?.interval)) {
        expect(c.share!.interval!.basis, `${id} ${c.id}`).toBe('claimed');
      }
    }
  });
  it('a claimed share earns at most the second quartile, however high the claim (the cap)', () => {
    for (const id of PROFILE_ORDER) {
      for (const c of PROFILES[id].claims.filter((x) => x.state === 'yellow' && x.share?.interval?.basis === 'claimed')) {
        expect(c.credit![0] / c.credit![1], `${id} ${c.id}`).toBeLessThanOrEqual(0.5);
      }
    }
  });
  it('the basis is shown beside the share on the control\u2019s page', () => {
    useAssessment.setState({ evidenceUploaded: true });
    let r = renderAt('/control/JNCSF-117', <ControlDetail />, '/control/:id');
    expect(r.getByTestId('measured-share').textContent).toContain('(established)');
    r.unmount();
    r = renderAt('/control/JNCSF-24', <ControlDetail />, '/control/:id');
    expect(r.getByTestId('measured-share').textContent).toContain('(claimed)');
  });
  it('an analyst override does not turn a claimed share into an established one', () => {
    useAssessment.setState({ evidenceUploaded: true });
    useAssessment.getState().overrideControl('JNCSF-24', {
      state: 'green',
      previousState: 'yellow',
      justification: 'test',
      analystId: 'a',
      timestamp: '2026-09-08T10:00:00+03:00',
    });
    const { getByTestId } = renderAt('/control/JNCSF-24', <ControlDetail />, '/control/:id');
    expect(getByTestId('measured-share').textContent).toContain('(claimed)');
  });
});

describe('the cap applies the rule to the basis it is given', () => {
  const credit = (basis: ShareBasis) => yellowWeightForShare(0.78, basis);
  it('the function applies the rule to the basis it is given', () => {
    expect(credit('claimed')).toBe(0.5);
    expect(credit('measured')).toBe(0.85);
  });
});

describe('4.2 the gap-reason chart is tagged illustrative', () => {
  it('its card sits inside an illustrative region', () => {
    const { getByText } = renderAt('/dashboard', <Dashboard />, '/dashboard');
    expect(getByText('Why controls are Unknown').closest('[data-tier]')?.getAttribute('data-tier')).toBe('illustrative');
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
