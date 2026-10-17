import { beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, render } from '@testing-library/react';
import type { ReactElement } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import ControlDetail from '../screens/06_ControlDetail';
import GapMatrix from '../screens/05_GapMatrix';
import ControlRow from '../components/ControlRow';
import { useAssessment } from '../store/useAssessment';
import { GAP_REASON_LABEL, controlById, controls, snapshotFor } from '../data/controls';
import { CURRENT } from '../data/current';

const UNAUTH = controls().filter((c) => !c.authored);
const LABEL = 'Not yet authored — no evidence requirement defined';
const observed = new Set(CURRENT.ruleR.verdictsOutsideAuthoredScope.map((v) => v.id));

function renderAt(path: string, el: ReactElement, pattern: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path={pattern} element={el} />
      </Routes>
    </MemoryRouter>,
  );
}
const detail = (id: string) => renderAt(`/control/${id}`, <ControlDetail />, '/control/:id');

beforeEach(() => {
  localStorage.clear();
  useAssessment.getState().resetDemo();
});

describe('unauthored is in the vocabulary', () => {
  it('is the first gap reason, with the agreed label', () => {
    expect(Object.keys(GAP_REASON_LABEL)[0]).toBe('unauthored');
    expect(GAP_REASON_LABEL.unauthored).toBe(LABEL);
  });
  it('has a tone distinct from the collection failures (ours, not the organisation\'s)', () => {
    const un = UNAUTH[0];
    const failed = controls().find((c) => c.after.gapReason === 'module_failed')!;
    const row = (c: typeof un, snap = c.after) =>
      render(
        <MemoryRouter>
          <ControlRow control={c} snap={snap} />
        </MemoryRouter>,
      );
    const a = row(un).getByText(LABEL);
    const b = row(failed).getByText(GAP_REASON_LABEL.module_failed);
    expect(a.className).toMatch(/orange/);
    expect(b.className).toMatch(/violet/);
    expect(a.className).not.toBe(b.className);
  });
});

describe('the assessment contains unauthored controls (all of them, not a sample)', () => {
  it('492 applicable controls have no authored requirement, in every capability that has any', () => {
    expect(UNAUTH.length).toBe(492);
    expect(new Set(UNAUTH.map((c) => c.capability)).size).toBeGreaterThanOrEqual(3);
  });
  it('before the upload every one is Unknown, unauthored; after it all but the observed ones still are, and the upload never changes those', () => {
    for (const c of UNAUTH) {
      const before = snapshotFor(c, false);
      expect([before.state, before.gapReason, before.evidenceClass], c.id).toEqual(['unknown', 'unauthored', 'none']);
      const after = snapshotFor(c, true);
      if (observed.has(c.id)) {
        expect(after.state, c.id).toBe('red');
        expect(after.gapBasis, c.id).toBe('observed');
        expect(c.changed, c.id).toBe(true);
      } else {
        expect([after.state, after.gapReason, after.evidenceClass], c.id).toEqual(['unknown', 'unauthored', 'none']);
        expect(c.changed, c.id).toBe(false);
      }
    }
  });
  it('and the reason shows on Control Detail before and after the upload (one control in every 40, and the observed one)', () => {
    const pick = [...UNAUTH.filter((_, i) => i % 40 === 0), ...UNAUTH.filter((c) => observed.has(c.id))];
    for (const uploaded of [false, true]) {
      useAssessment.setState({ evidenceUploaded: uploaded });
      for (const c of pick) {
        const r = detail(c.id);
        if (uploaded && observed.has(c.id)) expect(r.container.textContent, c.id).toContain('observed');
        else expect(r.container.textContent, `${c.id} uploaded=${uploaded}`).toContain(LABEL);
        r.unmount();
      }
    }
  });
});

describe('Control Detail for an unauthored control', () => {
  const un = UNAUTH.find((c) => c.capability === 'ops')!;
  it('shows no evidence ladder, no worked-example trail and no "How to evidence this", before or after the upload', () => {
    for (const uploaded of [false, true]) {
      useAssessment.setState({ evidenceUploaded: uploaded });
      const { queryByText, queryByTestId, unmount } = detail(un.id);
      expect(queryByText('Evidence sufficiency')).toBeNull();
      expect(queryByText('Evidence trail (worked example)')).toBeNull();
      expect(queryByText('How to evidence this')).toBeNull();
      expect(queryByTestId('unauthored-statement')).not.toBeNull();
      unmount();
    }
  });
  it('says that no requirement has been authored and that this is the tool\'s limitation', () => {
    const { getByTestId } = detail(un.id);
    const t = getByTestId('unauthored-statement').textContent ?? '';
    expect(t).toContain('No evidence requirement has been authored for this control.');
    expect(t).toContain('a limitation of the tool, not a finding about the organisation');
  });
  it('whereas an authored control that is also Unknown does show the ladder (so the absence above means something)', () => {
    const authoredUnknown = controls().find((c) => c.authored && c.before.state === 'unknown')!;
    const { queryByText, queryByTestId } = detail(authoredUnknown.id);
    expect(queryByText('Evidence sufficiency')).not.toBeNull();
    expect(queryByTestId('unauthored-statement')).toBeNull();
  });
  it('the observed control keeps the statement, but no longer says nothing says it is unmet', () => {
    useAssessment.setState({ evidenceUploaded: true });
    const id = [...observed][0];
    const { getByTestId } = detail(id);
    const t = getByTestId('unauthored-statement').textContent ?? '';
    expect(t).toContain('Uploading evidence cannot establish that this control is met.');
    expect(t).not.toContain('nothing says it is not');
    expect(getByTestId('measured-gap-basis').textContent).toContain('observed');
  });
});

describe('the Gap Matrix filter', () => {
  it('selects exactly the unauthored controls, and every row it shows carries that reason', () => {
    const { container, getByTestId } = renderAt('/gap-matrix?gap=unauthored&cap=found', <GapMatrix />, '/gap-matrix');
    const inFound = UNAUTH.filter((c) => c.capability === 'found').length;
    const rows = Array.from(container.querySelectorAll('[data-testid^="control-row-"]'));
    expect(rows.length).toBe(inFound);
    for (const r of rows) expect(r.getAttribute('data-gap-reason')).toBe('unauthored');
    expect(getByTestId('matrix-count').textContent).toBe(`${UNAUTH.length} of ${controls().length}`);
  });
  it('offers it as an option, listed first', () => {
    const { container } = renderAt('/gap-matrix', <GapMatrix />, '/gap-matrix');
    const gap = Array.from(container.querySelectorAll('select')).find((s) => s.textContent?.includes('Any gap reason'))!;
    const options = Array.from(gap.querySelectorAll('option')).map((o) => o.textContent);
    expect(options[1]).toBe(LABEL); // [0] is "Any gap reason"
  });
  it('an unauthored control is a real control that exists', () => {
    expect(controlById(UNAUTH[0].id)).toBeDefined();
  });
});
