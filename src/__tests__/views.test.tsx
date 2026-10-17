import { beforeEach, describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Dashboard from '../screens/04_Dashboard';
import { useAssessment } from '../store/useAssessment';
import { CURRENT } from '../data/current';
import { controls } from '../data/controls';
import { fmtPct } from '../lib/frac';
import { AUTHORED_SCOPE_LABEL, VIEW_ORDER } from '../lib/views';
import { FRAMEWORK_WEIGHTED_TOTALS, RISK_WEIGHT_TABLE, RISK_WEIGHTED_TOTALS } from '../data/riskWeighting';

beforeEach(() => {
  localStorage.clear();
  useAssessment.getState().resetDemo();
});

const dashboard = (uploaded: boolean) => {
  useAssessment.setState({ evidenceUploaded: uploaded, role: 'owner' });
  return render(
    <MemoryRouter>
      <Dashboard />
    </MemoryRouter>,
  );
};
const cell = (c: HTMLElement, view: string, name: string) => c.querySelector(`[data-view="${view}"] [data-cell="${name}"]`)!.textContent;

describe('Task 4: the four views, all visible on first render', () => {
  it('there are exactly four, in order, with no tab or toggle to click', () => {
    const { container } = dashboard(true);
    const rows = Array.from(container.querySelectorAll('[data-view]')).map((r) => r.getAttribute('data-view'));
    expect(rows).toEqual([...VIEW_ORDER]);
    expect(VIEW_ORDER).toEqual(['unweighted', 'weighted_including_underived', 'weighted_derived_only', 'authored_scope']);
    const table = container.querySelector('[data-testid="four-views"]')!;
    expect(table.querySelectorAll('button').length).toBe(0);
  });

  it('renders each view with the engine\'s bounds', () => {
    const { container } = dashboard(true);
    const want: Record<string, [string, string, string, string]> = {
      // low, high, controls, coverage
      unweighted: ['4.87%', '95.54%', '557', '9.34%'],
      weighted_including_underived: ['5.14%', '95.57%', '557', '9.34%'],
      weighted_derived_only: ['5.38%', '94.60%', '390', '10.26%'],
      authored_scope: ['41.77%', '63.31%', '65', '78.46%'],
    };
    for (const [id, [low, high, n, cov]] of Object.entries(want)) {
      expect([cell(container, id, 'low'), cell(container, id, 'high'), cell(container, id, 'controls'), cell(container, id, 'coverage')], id).toEqual([low, high, n, cov]);
    }
  });

  it('shows the widths the bounds imply', () => {
    const { container } = dashboard(true);
    expect(cell(container, 'unweighted', 'width')).toBe('90.66');
    for (const id of VIEW_ORDER) {
      const v = CURRENT.after.views[id];
      const w = (parseFloat(fmtPct(v.upper, 6)) - parseFloat(fmtPct(v.lower, 6))).toFixed(2);
      expect(cell(container, id, 'width'), id).toBe(w);
    }
  });

  it('also renders all four before the upload (the weighted views are derived under the same model)', () => {
    const { container } = dashboard(false);
    for (const id of VIEW_ORDER) {
      const v = CURRENT.before.views[id];
      expect(cell(container, id, 'low'), id).toBe(`${fmtPct(v.lower, 2)}%`);
      expect(cell(container, id, 'high'), id).toBe(`${fmtPct(v.upper, 2)}%`);
    }
  });
});

describe('Task 4: authored_scope never appears without its label', () => {
  it.each([false, true])('the label is inside the authored_scope row, verbatim (uploaded=%s)', (uploaded) => {
    const { container } = dashboard(uploaded);
    const row = container.querySelector('[data-view="authored_scope"]')!;
    expect(row.querySelector('[data-testid="authored-scope-label"]')!.textContent).toBe(AUTHORED_SCOPE_LABEL);
    expect(AUTHORED_SCOPE_LABEL).toBe('Covers only applicable controls with at least one authored evidence path.');
  });
  it('and only in that row: the other views do not carry it', () => {
    const { container } = dashboard(true);
    for (const id of VIEW_ORDER.filter((v) => v !== 'authored_scope')) {
      expect(container.querySelector(`[data-view="${id}"]`)!.textContent).not.toContain(AUTHORED_SCOPE_LABEL);
    }
    expect((container.textContent ?? '').split(AUTHORED_SCOPE_LABEL).length - 1).toBe(1);
  });
  it('its numbers appear nowhere else on the page: every occurrence is inside the labelled row', () => {
    for (const uploaded of [false, true]) {
      const { container, unmount } = dashboard(uploaded);
      const s = (uploaded ? CURRENT.after : CURRENT.before).views.authored_scope;
      const numbers = [`${fmtPct(s.lower, 2)}%`, `${fmtPct(s.upper, 2)}%`];
      const row = container.querySelector('[data-view="authored_scope"]')!;
      for (const n of numbers) {
        const total = (container.textContent ?? '').split(n).length - 1;
        const inside = (row.textContent ?? '').split(n).length - 1;
        expect(inside, `${n} in row`).toBeGreaterThanOrEqual(1);
        expect(total, `${n} on page`).toBe(inside);
      }
      unmount();
    }
  });
  it('is marked as a partial view', () => {
    const { container } = dashboard(true);
    expect(container.querySelector('[data-view="authored_scope"]')!.textContent).toContain('partial view');
  });
});

describe('Task 4: the weights explain a view that exists, and the totals agree with their table', () => {
  it('the table counts the 557 applicable controls and sums to the engine\'s totals: 331.4 and 498.4', () => {
    const { container, getByTestId } = dashboard(true);
    expect(getByTestId('weights-total').textContent).toBe('557');
    const rows = Array.from(container.querySelectorAll('[data-basis]')).map((r) => {
      const tds = r.querySelectorAll('td');
      return { n: Number(tds[1].textContent), w: parseFloat(tds[2].textContent!) };
    });
    expect(rows.length).toBe(5);
    expect(rows.reduce((a, r) => a + r.n, 0)).toBe(557);
    const underived = rows[4];
    const derived = rows.slice(0, 4).reduce((a, r) => a + r.n * r.w, 0);
    expect(derived).toBeCloseTo(331.4, 10);
    expect(derived + underived.n * underived.w).toBeCloseTo(498.4, 10);
    expect(getByTestId('weight-derived').textContent).toBe('331.4');
    expect(getByTestId('weight-including').textContent).toBe('498.4');
    expect(RISK_WEIGHTED_TOTALS.gap).toBe(underived.n); // 167: the table and the sentence agree
  });
  it('the weights are the engine\'s: Low 1.0, Moderate 0.7, High 0.5, no baseline 0.5, underived 1.0', () => {
    expect(RISK_WEIGHT_TABLE.map((r) => r.weight)).toEqual([1.0, 0.7, 0.5, 0.5, 1.0]);
    expect(RISK_WEIGHT_TABLE.map((r) => r.controls)).toEqual([246, 67, 12, 65, 167]);
  });
  it('says what the other population is: all 576 controls give 341.4 / 514.4 with 173 underived', () => {
    expect(FRAMEWORK_WEIGHTED_TOTALS).toMatchObject({ controls: 576, excluded: 19, underived: 173 });
    expect(FRAMEWORK_WEIGHTED_TOTALS.derivedOnly).toBeCloseTo(341.4, 10);
    expect(FRAMEWORK_WEIGHTED_TOTALS.includingUnderived).toBeCloseTo(514.4, 10);
    const { getByTestId } = dashboard(true);
    expect(getByTestId('weights-framework-note').textContent).toContain('341.4');
    expect(getByTestId('weights-framework-note').textContent).toContain('514.4');
    expect(getByTestId('weights-framework-note').textContent).toContain('173');
  });
  it('the old decorative card is gone: no weighted/unweighted toggle, no stale 14.9 or 30% of the framework', () => {
    const { container } = dashboard(true);
    expect(container.textContent).not.toContain('Unweighted (default)');
    expect(container.textContent).not.toContain('14.9');
    expect(container.textContent).not.toContain('of framework');
    expect(Array.from(container.querySelectorAll('button')).some((b) => /Weighted|Unweighted/.test(b.textContent ?? ''))).toBe(false);
  });
});

describe('Task 4: analyst overrides', () => {
  it('apply to the unweighted row only, and the page says so', () => {
    const c = controls().find((x) => x.authored && x.after.state === 'unknown')!;
    useAssessment.getState().overrideControl(c.id, { state: 'green', previousState: 'unknown', justification: 'r', analystId: 't', timestamp: 't' });
    const { container } = dashboard(true);
    expect(cell(container, 'unweighted', 'low')).not.toBe('4.87%');
    expect(cell(container, 'weighted_including_underived', 'low')).toBe('5.14%');
    expect(cell(container, 'authored_scope', 'low')).toBe('41.77%');
    expect(container.textContent).toContain('Analyst overrides are applied to the unweighted view only');
  });
});
