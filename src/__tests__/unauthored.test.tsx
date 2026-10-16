import { beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, render } from '@testing-library/react';
import type { ReactElement } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import ControlDetail from '../screens/06_ControlDetail';
import GapMatrix from '../screens/05_GapMatrix';
import ControlRow from '../components/ControlRow';
import { useAssessment } from '../store/useAssessment';
import { GAP_REASON_LABEL, controlById, controls, snapshotFor } from '../data/controls';
import { capabilities } from '../data/capabilities';

const UNAUTH = controls.filter((c) => !c.authored);
const LABEL = 'Not yet authored — no evidence requirement defined';

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
    const failed = controls.find((c) => c.after.gapReason === 'module_failed')!;
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

describe('the sample contains unauthored controls', () => {
  it('at least three, in at least three different capabilities', () => {
    expect(UNAUTH.length).toBeGreaterThanOrEqual(3);
    expect(new Set(UNAUTH.map((c) => c.capability)).size).toBeGreaterThanOrEqual(3);
  });
  it('they are Unknown for the same reason before and after the upload, and the upload never changes them', () => {
    for (const c of UNAUTH) {
      for (const uploaded of [false, true]) {
        const s = snapshotFor(c, uploaded);
        expect(s.state, c.id).toBe('unknown');
        expect(s.gapReason, c.id).toBe('unauthored');
        expect(s.evidenceClass, c.id).toBe('none');
        expect(s.providedSignals, c.id).toEqual([]);
      }
      expect(c.changed, c.id).toBe(false);
      expect(c.requiredSignals, c.id).toEqual([]);
    }
  });
  it('and the reason shows on Control Detail before and after the upload', () => {
    for (const uploaded of [false, true]) {
      useAssessment.setState({ evidenceUploaded: uploaded });
      for (const c of UNAUTH) {
        const r = detail(c.id);
        expect(r.container.textContent, `${c.id} uploaded=${uploaded}`).toContain(LABEL);
        r.unmount();
      }
    }
  });
});

describe('Control Detail for an unauthored control', () => {
  const un = UNAUTH.find((c) => c.capability === 'ops')!;
  it('shows neither the evidence ladder nor an evidence trail, before or after the upload', () => {
    for (const uploaded of [false, true]) {
      useAssessment.setState({ evidenceUploaded: uploaded });
      const { queryByText, queryByTestId, unmount } = detail(un.id);
      expect(queryByText('Evidence sufficiency')).toBeNull();
      expect(queryByText('Evidence trail')).toBeNull();
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
  it('whereas an authored control that is also Unknown does show both (so the absence above means something)', () => {
    const authoredUnknown = controls.find((c) => c.authored && c.before.state === 'unknown')!;
    const { queryByText, queryByTestId } = detail(authoredUnknown.id);
    expect(queryByText('Evidence sufficiency')).not.toBeNull();
    expect(queryByText('Evidence trail')).not.toBeNull();
    expect(queryByTestId('unauthored-statement')).toBeNull();
  });
});

describe('the Gap Matrix filter', () => {
  it('selects exactly the unauthored controls', () => {
    const { container, getAllByRole } = renderAt('/gap-matrix?gap=unauthored', <GapMatrix />, '/gap-matrix');
    // open every capability section (only one is open by default)
    for (const cap of capabilities.filter((c) => c.organisationallyAssessable)) {
      const header = Array.from(container.querySelectorAll('button')).find((b) => b.textContent?.includes(cap.name));
      const alreadyOpen = container.querySelector(`a[href^="/control/"]`) && header?.querySelector('svg.-rotate-90') == null;
      if (header && !alreadyOpen) fireEvent.click(header);
    }
    const shown = Array.from(container.querySelectorAll('a[href^="/control/"]')).map((a) => a.getAttribute('href')!.replace('/control/', ''));
    expect(shown.sort()).toEqual(UNAUTH.map((c) => c.id).sort());
    expect(getAllByRole('combobox').length).toBeGreaterThan(0);
  });
  it('offers it as an option, listed first', () => {
    const { container } = renderAt('/gap-matrix', <GapMatrix />, '/gap-matrix');
    const gap = Array.from(container.querySelectorAll('select')).find((s) => s.textContent?.includes('Any gap reason'))!;
    const options = Array.from(gap.querySelectorAll('option')).map((o) => o.textContent);
    expect(options[1]).toBe(LABEL); // [0] is "Any gap reason"
  });
  it('an unauthored seed is a real control that exists', () => {
    expect(controlById(UNAUTH[0].id)).toBeDefined();
  });
});
