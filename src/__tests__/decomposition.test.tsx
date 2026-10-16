import { beforeEach, describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Dashboard from '../screens/04_Dashboard';
import WidthDecomposition, { CAUSE_COLOUR } from '../components/WidthDecomposition';
import { WITHHELD_MESSAGE } from '../components/FigureBoundary';
import { useAssessment } from '../store/useAssessment';
import { CURRENT } from '../data/current';
import { controls } from '../data/controls';
import { div, fmtPct, toPct } from '../lib/frac';
import { widthOf } from '../lib/views';

beforeEach(() => {
  localStorage.clear();
  useAssessment.getState().resetDemo();
});

const dashboard = (uploaded: boolean, role: 'owner' | 'executive' = 'owner') => {
  useAssessment.setState({ evidenceUploaded: uploaded, role });
  return render(
    <MemoryRouter>
      <Dashboard />
    </MemoryRouter>,
  );
};
const seg = (c: HTMLElement, cause: string) => c.querySelector<HTMLElement>(`[data-cause="${cause}"]`)!;
const widthPct = (el: HTMLElement) => parseFloat(el.style.width);

describe('Task 3: the width decomposition under the interval', () => {
  it.each([
    ['after', true],
    ['before', false],
  ] as const)('%s the upload: the three segments are rendered in proportion to the parts', (when, uploaded) => {
    const { container } = dashboard(uploaded);
    const s = CURRENT[when].views.unweighted;
    const total = widthOf(s);
    for (const cause of ['unauthored', 'unevidenced', 'uncollectable'] as const) {
      const el = seg(container, cause);
      expect(el, cause).not.toBeNull();
      expect(widthPct(el), `${when} ${cause}`).toBeCloseTo(toPct(div(s.width[cause], total)), 6);
    }
    // the segments fill the bar: they sum to 100%
    const sumPct = ['unauthored', 'unevidenced', 'uncollectable'].reduce((n, c) => n + widthPct(seg(container, c)), 0);
    expect(sumPct).toBeCloseTo(100, 6);
  });

  it('the assessed state: 97.2% of the bar is the tool\'s, 2.8% the organisation\'s, none structural', () => {
    const { container } = dashboard(true);
    expect(widthPct(seg(container, 'unauthored'))).toBeCloseTo((491 / 505) * 100, 6);
    expect(widthPct(seg(container, 'unevidenced'))).toBeCloseTo((14 / 505) * 100, 6);
    expect(widthPct(seg(container, 'uncollectable'))).toBe(0);
  });

  it('states that the parts are asserted to sum exactly to the width, with the sum shown', () => {
    const after = dashboard(true);
    expect(after.getByTestId('width-sum-note').textContent).toContain('asserted to sum exactly to the width');
    expect(after.getByTestId('width-sum-note').textContent).toContain('88.15 + 2.51 + 0.00 = 90.66 points');
    after.unmount();
    const before = dashboard(false);
    expect(before.getByTestId('width-sum-note').textContent).toContain('88.33 + 8.98 + 0.00 = 97.31 points');
  });

  it('labels whose limitation each cause is, attached to the right one', () => {
    const { container } = dashboard(true);
    const text = (c: string) => container.querySelector(`[data-legend="${c}"]`)!.textContent ?? '';
    expect(text('unauthored')).toContain("the tool's limitation");
    expect(text('unauthored')).not.toContain("organisation's");
    expect(text('unevidenced')).toContain("the organisation's");
    expect(text('unevidenced')).not.toContain("tool's");
    expect(text('unevidenced')).toContain('itemised below');
    expect(text('uncollectable')).toContain('structural');
    expect(text('uncollectable')).not.toContain("tool's");
    expect(text('uncollectable')).not.toContain("organisation's");
    // each legend entry quotes its own points
    expect(text('unauthored')).toContain('88.15 points');
    expect(text('unevidenced')).toContain('2.51 points');
    expect(text('uncollectable')).toContain('0.00 points');
  });

  it('colours the segments by cause: ours is orange, the organisation\'s is violet, structural is slate', () => {
    const { container } = dashboard(true);
    // jsdom normalises colours to rgb()
    const rgb = (hex: string) => {
      const n = parseInt(hex.slice(1), 16);
      return `rgb(${n >> 16}, ${(n >> 8) & 255}, ${n & 255})`;
    };
    for (const c of ['unauthored', 'unevidenced', 'uncollectable'] as const) {
      expect(seg(container, c).style.backgroundColor, c).toBe(rgb(CAUSE_COLOUR[c]));
    }
    expect(new Set(Object.values(CAUSE_COLOUR)).size).toBe(3);
  });

  it('itemises the organisation\'s share by reason, with counts and points, summing to the total', () => {
    const { container, getByTestId } = dashboard(true);
    const row = (r: string) => container.querySelector(`[data-reason="${r}"]`)!.textContent ?? '';
    expect(row('not_provided')).toContain('5');
    expect(row('not_provided')).toContain('0.90');
    expect(row('declined')).toContain('0.54');
    expect(row('insufficient_permission')).toContain('0.54');
    expect(row('module_failed')).toContain('0.36');
    expect(row('stale')).toContain('0.18');
    expect(getByTestId('reasons-total').textContent).toBe('14');
    expect(getByTestId('unevidenced-reasons').textContent).toContain('2.51');
    const counts = Array.from(container.querySelectorAll('[data-reason]')).map((r) => Number(r.querySelectorAll('td')[1].textContent));
    expect(counts.reduce((a, b) => a + b, 0)).toBe(14);
  });

  it('before the upload the only reason is not_provided: 50 controls', () => {
    const { container, getByTestId } = dashboard(false);
    expect(container.querySelectorAll('[data-reason]').length).toBe(1);
    expect(container.querySelector('[data-reason="not_provided"]')!.textContent).toContain('50');
    expect(getByTestId('reasons-total').textContent).toBe('50');
  });

  it('sits under the interval, not elsewhere', () => {
    const { container, getByTestId } = dashboard(true);
    const interval = container.querySelector('[data-tour="dash-interval"]')!;
    const decomposition = getByTestId('width-decomposition');
    expect(interval.contains(decomposition)).toBe(true);
    const band = interval.querySelector('span.text-3xl')!; // the headline numbers of the interval
    expect(band.compareDocumentPosition(decomposition) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('is on the executive dashboard too', () => {
    const { getByTestId } = dashboard(true, 'executive');
    expect(getByTestId('width-decomposition')).toBeTruthy();
  });

  it('follows the headline under an analyst override: the tool\'s share narrows and the parts still sum', () => {
    const unauth = controls.find((c) => !c.authored)!;
    useAssessment.getState().overrideControl(unauth.id, {
      state: 'green',
      previousState: 'unknown',
      justification: 'reviewed',
      analystId: 't',
      timestamp: 't',
    });
    const { getByTestId, container } = dashboard(true);
    expect(container.querySelector('[data-legend="unauthored"]')!.textContent).toContain('490');
    expect(getByTestId('width-sum-note').textContent).toMatch(/= 90\.48 points/); // 504 of 557
    expect(getByTestId('unevidenced-reasons').textContent).toContain('Analyst overrides are not itemised by reason');
  });
});

describe('Task 3: a graphic whose parts do not sum to its width is withheld, not drawn', () => {
  const U = CURRENT.after.views.unweighted;
  it('draws when they sum', () => {
    const { queryByTestId, getByTestId } = render(
      <WidthDecomposition parts={U.width} width={widthOf(U)} controls={{ unauthored: 491, unevidenced: 14, uncollectable: 0 }} />,
    );
    expect(queryByTestId('figure-withheld')).toBeNull();
    expect(getByTestId('width-decomposition')).toBeTruthy();
  });
  it('withholds with the figure message and logs the guard when one part is off by a control', () => {
    const logged: string[] = [];
    const quiet = console.error;
    console.error = (...a: unknown[]) => logged.push(a.map(String).join(' '));
    try {
      const bad = { ...U.width, unevidenced: [15, 557] as const };
      const { getByTestId, queryByTestId } = render(
        <WidthDecomposition parts={bad} width={widthOf(U)} controls={{ unauthored: 491, unevidenced: 15, uncollectable: 0 }} />,
      );
      expect(getByTestId('figure-withheld').textContent).toBe(WITHHELD_MESSAGE);
      expect(getByTestId('figure-withheld').getAttribute('data-where')).toBe('WidthDecomposition');
      expect(queryByTestId('width-decomposition')).toBeNull();
      expect(logged.some((l) => l.includes('figure withheld by guard "WidthDecomposition"'))).toBe(true);
    } finally {
      console.error = quiet;
    }
  });
});

describe('Task 3: the numbers it shows are the published ones', () => {
  it('88.15 / 2.51 / 0.00 / 90.66', () => {
    const U = CURRENT.after.views.unweighted;
    expect([fmtPct(U.width.unauthored), fmtPct(U.width.unevidenced), fmtPct(U.width.uncollectable), fmtPct(widthOf(U))]).toEqual(['88.15', '2.51', '0.00', '90.66']);
  });
});
