import { beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, render } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import type { ReactElement } from 'react';
import GapMatrix from '../screens/05_GapMatrix';
import ControlDetail from '../screens/06_ControlDetail';
import { useAssessment } from '../store/useAssessment';
import { CURRENT } from '../data/current';
import { PROFILES, PROFILE_ORDER, setActiveProfile } from '../data/profiles';
import { controlById, controls, GAP_REASON_LABEL } from '../data/controls';

function renderAt(path: string, el: ReactElement, pattern: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path={pattern} element={el} />
      </Routes>
    </MemoryRouter>,
  );
}

/** Open every capability section, so every row is in the page. */
function openAll(container: HTMLElement) {
  for (const b of Array.from(container.querySelectorAll('button'))) {
    if (b.textContent?.includes('applicable') && b.querySelector('svg.-rotate-90')) fireEvent.click(b);
  }
}

beforeEach(() => {
  localStorage.clear();
  useAssessment.getState().resetDemo();
  setActiveProfile('ministry');
});

describe('Task 2: the Gap Matrix lists every applicable control of the golden file', () => {
  it('the row count equals the golden’s applicable count, and every id appears exactly once', () => {
    useAssessment.setState({ evidenceUploaded: true });
    const { container, getByTestId } = renderAt('/gap-matrix', <GapMatrix />, '/gap-matrix');
    openAll(container);
    const rows = Array.from(container.querySelectorAll('[data-testid^="control-row-"]'));
    expect(rows.length).toBe(CURRENT.totals.applicable);
    expect(rows.length).toBe(557);
    const ids = rows.map((r) => r.getAttribute('data-testid')!.replace('control-row-', ''));
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.sort()).toEqual(CURRENT.claims.map((c) => c.id).sort());
    expect(getByTestId('matrix-count').textContent).toBe('557 of 557');
  });

  it('every state, gap reason, gap basis, partial basis, path label and run on screen is in the data (after the upload)', () => {
    useAssessment.setState({ evidenceUploaded: true });
    const { container } = renderAt('/gap-matrix', <GapMatrix />, '/gap-matrix');
    openAll(container);
    const rows = Array.from(container.querySelectorAll('[data-testid^="control-row-"]'));
    expect(rows.length).toBe(557);
    for (const r of rows) {
      const id = r.getAttribute('data-testid')!.replace('control-row-', '');
      const c = CURRENT.claims.find((x) => x.id === id)!;
      expect(r.getAttribute('data-state'), id).toBe(c.state);
      expect(r.getAttribute('data-gap-reason'), id).toBe(c.gapReason ?? '');
      expect(r.getAttribute('data-gap-basis'), id).toBe(c.gapBasis ?? '');
      expect(r.getAttribute('data-partial-basis'), id).toBe(c.partialBasis ?? '');
      expect(r.getAttribute('data-path-label'), id).toBe(c.pathLabel ?? '');
      expect(r.getAttribute('data-run-id'), id).toBe(c.runId ?? '');
      // and what the row SAYS is the same as what it carries
      const text = r.textContent ?? '';
      if (c.state === 'unknown' && c.gapReason) expect(text, id).toContain(GAP_REASON_LABEL[c.gapReason]);
      if (c.state === 'red' && c.gapBasis) expect(text, id).toContain(`gap basis: ${c.gapBasis}`);
      if (c.state === 'yellow' && c.partialBasis) expect(text, id).toContain(`partial basis: ${c.partialBasis}`);
      if (c.pathLabel) expect(text, id).toContain(c.pathLabel);
    }
  });

  it('before the upload the rows show rule R’s projection: only the verdicts that rest on testimony or documents', () => {
    const { container } = renderAt('/gap-matrix', <GapMatrix />, '/gap-matrix');
    openAll(container);
    const rows = Array.from(container.querySelectorAll('[data-testid^="control-row-"]'));
    const known = rows.filter((r) => r.getAttribute('data-state') !== 'unknown');
    expect(known.length).toBe(CURRENT.ruleR.beforeVerdicts);
    for (const r of rows.filter((x) => x.getAttribute('data-state') === 'unknown')) {
      const id = r.getAttribute('data-testid')!.replace('control-row-', '');
      expect(r.getAttribute('data-gap-reason'), id).toBe(controlById(id)!.authored ? 'not_provided' : 'unauthored');
    }
  });

  it('an absence-based Gap displays the module run that justifies it, on the row and on the control’s page', () => {
    useAssessment.setState({ evidenceUploaded: true });
    const absence = CURRENT.claims.filter((c) => c.gapBasis === 'absence');
    expect(absence.length).toBeGreaterThan(0);
    const { container } = renderAt('/gap-matrix', <GapMatrix />, '/gap-matrix');
    openAll(container);
    for (const c of absence) {
      expect(c.runId, c.id).toBeTruthy();
      const row = container.querySelector(`[data-testid="control-row-${c.id}"]`)!;
      expect(row.textContent, c.id).toContain(`run: ${c.runId}`);
      const page = renderAt(`/control/${c.id}`, <ControlDetail />, '/control/:id');
      expect(page.getByTestId('measured-run').textContent, c.id).toContain(c.runId!);
      page.unmount();
    }
    // and a Gap on another basis does not claim a run
    for (const c of CURRENT.claims.filter((x) => x.state === 'red' && x.gapBasis !== 'absence')) {
      const row = container.querySelector(`[data-testid="control-row-${c.id}"]`)!;
      expect(row.textContent, c.id).not.toContain('run:');
    }
  });

  it('the filters work over 557 rows: state, gap basis, partial basis and search', () => {
    useAssessment.setState({ evidenceUploaded: true });
    const { container, getByTestId, getByPlaceholderText, getByLabelText } = renderAt('/gap-matrix', <GapMatrix />, '/gap-matrix');
    fireEvent.change(getByLabelText('Gap basis'), { target: { value: 'absence' } });
    expect(getByTestId('matrix-count').textContent).toBe(`${CURRENT.claims.filter((c) => c.gapBasis === 'absence').length} of 557`);
    fireEvent.change(getByLabelText('Gap basis'), { target: { value: 'all' } });
    fireEvent.change(getByLabelText('Partial basis'), { target: { value: 'share' } });
    expect(getByTestId('matrix-count').textContent).toBe(`${CURRENT.claims.filter((c) => c.partialBasis === 'share').length} of 557`);
    fireEvent.change(getByLabelText('Partial basis'), { target: { value: 'all' } });
    fireEvent.change(getByPlaceholderText('Search id, text, path, run…'), { target: { value: 'directory-enumeration' } });
    expect(getByTestId('matrix-count').textContent).toBe(`${CURRENT.claims.filter((c) => c.runId === 'directory-enumeration').length} of 557`);
    expect(container.textContent).not.toContain('sample');
  });

  it('there is no sample: nothing on the screen is labelled one, and there is no sample note', () => {
    const { container, queryByTestId } = renderAt('/gap-matrix', <GapMatrix />, '/gap-matrix');
    expect(queryByTestId('sample-note')).toBeNull();
    expect(container.textContent).not.toMatch(/in this sample|worked-example sample/);
  });
});

describe('Task 2: the control data is the active profile’s, whichever it is', () => {
  it('controls() follows the active profile and carries every claim', () => {
    for (const id of PROFILE_ORDER) {
      setActiveProfile(id);
      expect(controls().length, id).toBe(PROFILES[id].totals.applicable);
      expect(controls().map((c) => c.claim), id).toEqual([...PROFILES[id].claims]);
    }
  });
  it('vocabulary the old prototype had no word for is carried: future_dated (bank)', () => {
    setActiveProfile('bank');
    const fd = controls().filter((c) => c.after.gapReason === 'future_dated');
    expect(fd.length).toBe(2);
    expect(GAP_REASON_LABEL.future_dated).toBe('Future-dated');
  });
});

describe('Task 2: a page that mixes tiers says which is which, on the element', () => {
  it('the measured panel is measured, and no invented evidence sits beside it to contradict it', () => {
    useAssessment.setState({ evidenceUploaded: true });
    const { container } = renderAt('/control/JNCSF-102', <ControlDetail />, '/control/:id');
    const tierOf = (testid: string) => container.querySelector(`[data-testid="${testid}"]`)!.closest('[data-tier]')!.getAttribute('data-tier');
    expect(tierOf('measured-panel')).toBe('measured');
    expect(tierOf('measured-state')).toBe('measured');
    expect(container.querySelector('[data-testid="measured-state"]')!.textContent).toContain('Compliant');
    expect(controlById('JNCSF-102')!.after.state).toBe('green');
    // Round 4: the worked-example evidence, ATT&CK chain, population and signals that used to sit here are gone
    expect(container.textContent).not.toMatch(/worked example|Worked-example|Evidence trail/i);
    expect(container.querySelector('[data-testid="evidence-trail"]')).toBeNull();
  });
  it('a control the engine ranks shows the engine’s ATT&CK exposure as measured, with what it suppressed', () => {
    useAssessment.setState({ evidenceUploaded: true });
    const it = CURRENT.ranking.items[0];
    const { getByTestId } = renderAt(`/control/${it.controlId}`, <ControlDetail />, '/control/:id');
    const el = getByTestId('engine-attack');
    expect(el.closest('[data-tier]')!.getAttribute('data-tier')).toBe('measured');
    expect(el.textContent).toContain(it.attack.exposure);
    expect(el.textContent).toContain(`${it.attack.suppressedCount} suppressed`);
  });
  it('no control page carries worked-example material, whichever control it is', () => {
    useAssessment.setState({ evidenceUploaded: true });
    for (const id of ['JNCSF-102', 'JNCSF-100', 'JNCSF-435', 'JNCSF-7', 'JNCSF-394']) {
      const { container, unmount } = renderAt(`/control/${id}`, <ControlDetail />, '/control/:id');
      expect(container.textContent, id).not.toMatch(/worked example|Worked-example|Evidence trail|Population data|ATT&CK exposure \(worked/i);
      unmount();
    }
  });
});
