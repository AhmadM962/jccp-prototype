import { beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Remediation from '../screens/07_Remediation';
import { useAssessment } from '../store/useAssessment';
import { CURRENT } from '../data/current';
import { evidenceArtifacts, fmtPoints, rankGroups, rankingExclusions, resolvedBy } from '../lib/ranking';

const raw = import.meta.glob('/src/**/*.{ts,tsx}', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;

const draw = () =>
  render(
    <MemoryRouter>
      <Remediation />
    </MemoryRouter>,
  );

beforeEach(() => {
  localStorage.clear();
  useAssessment.getState().resetDemo();
  useAssessment.setState({ evidenceUploaded: true });
});

describe('Remediation shows the engine\'s ranking, item for item', () => {
  const items = CURRENT.ranking.items;
  it('lists every ranked item once, with the engine\'s rank, action type, description, effort, magnitude and ATT&CK exposure', () => {
    const { container, getByTestId } = draw();
    expect(getByTestId('ranking-count').textContent).toBe(`${items.length} actions in ${rankGroups().length} ranks`);
    for (const it of items) {
      const card = container.querySelector(`[data-testid="action-${it.controlId}-${it.actionType}"]`);
      expect(card, `${it.controlId} ${it.actionType}`).not.toBeNull();
      expect(card!.getAttribute('data-rank')).toBe(String(it.rank));
      const t = card!.textContent ?? '';
      expect(t).toContain(it.description);
      expect(t).toContain(it.actionType === 'fix' ? 'fix' : it.actionType === 'evidence_request' ? 'evidence request' : 'corroboration request');
      expect(card!.querySelector('[data-testid="magnitude"]')!.textContent).toContain(`magnitude ${fmtPoints(it.magnitudePoints)} points`);
      expect(card!.querySelector('[data-testid="magnitude"]')!.textContent).toContain(`${it.magnitude[0]}/${it.magnitude[1]}`);
      expect(t).toContain(`effort ${it.effort ?? '—'}`);
      expect(t).toContain(it.attack.exposure);
      expect(card!.querySelector('[data-testid="suppressed"]')!.textContent).toBe(`${it.attack.suppressedCount} suppressed`);
    }
    expect(container.querySelectorAll('[data-testid^="action-"]').length).toBe(items.length);
  });
  it('the order on the screen is the engine\'s: ranks ascend, and a rank\'s items are those the engine gave it', () => {
    const { container } = draw();
    const ranks = Array.from(container.querySelectorAll('[data-testid^="action-"]')).map((e) => Number(e.getAttribute('data-rank')));
    expect(ranks).toEqual([...ranks].sort((a, b) => a - b));
    expect(ranks).toEqual(items.map((i) => i.rank));
  });
  it('the tie groups are shown: the group the engine reports at rank 1 has all its members on screen under one heading', () => {
    const { getByTestId } = draw();
    const size = items[0].tieGroupSize;
    expect(items[0].rank).toBe(1);
    expect(size).toBe(15);
    const g = getByTestId('rank-group-1');
    expect(g.getAttribute('data-tie-size')).toBe('15');
    expect(g.getAttribute('data-shown')).toBe('15');
    expect(g.textContent).toContain('15 items share rank 1');
    expect(g.textContent).toContain(CURRENT.ranking.tieOrderNote);
  });
  it('for every rank, the engine\'s tie-group size equals the number of items it gave that rank', () => {
    for (const g of rankGroups()) expect(g.items.length, `rank ${g.rank}`).toBe(g.tieGroupSize);
  });
  it('the action filter narrows the list to that action type', () => {
    const { container, getByText } = draw();
    fireEvent.click(getByText('evidence request', { selector: 'button' }));
    const n = items.filter((i) => i.actionType === 'evidence_request').length;
    expect(container.querySelectorAll('[data-testid^="action-"]').length).toBe(n);
  });
  it('before the upload there is no ranking to show, and the screen says why', () => {
    useAssessment.setState({ evidenceUploaded: false });
    const { container, getByTestId } = draw();
    expect(getByTestId('ranking-needs-upload')).toBeTruthy();
    expect(container.querySelectorAll('[data-testid^="action-"]').length).toBe(0);
  });
});

describe('what the ranking could not act on is shown with its reason', () => {
  it('the unauthored_excluded list is on screen with its count and why', () => {
    const { getByTestId } = draw();
    const row = getByTestId('excluded-unauthored_excluded');
    expect(row.getAttribute('data-count')).toBe(String(CURRENT.ranking.unauthoredExcluded.length));
    expect(CURRENT.ranking.unauthoredExcluded.length).toBe(491);
    expect(row.textContent).toContain('491');
    expect(row.textContent).toContain('no evidence requirement is authored for these controls, so the ranking has nothing it could ask for or fix');
  });
  it('the other two exclusion lists are shown too, and an empty one says so', () => {
    const { getByTestId } = draw();
    for (const e of rankingExclusions()) {
      const row = getByTestId(`excluded-${e.key}`);
      expect(row.getAttribute('data-count')).toBe(String(e.controls.length));
      expect(row.textContent).toContain(e.reason);
      if (e.controls.length === 0) expect(row.textContent).toContain('none — ');
    }
  });
});

describe('the artifacts and what they unlock are computed, not typed', () => {
  it('each artifact\'s count is the intersection computed from the engine\'s requests', () => {
    useAssessment.setState({ evidenceUploaded: true });
    const { container, getByText } = draw();
    fireEvent.click(getByText("What you didn't provide"));
    const arts = evidenceArtifacts();
    expect(arts.length).toBe(10);
    for (const a of arts) {
      const card = container.querySelector(`[data-testid="artifact-${a.signal}"]`)!;
      expect(card.getAttribute('data-unlocks')).toBe(String(resolvedBy([a.signal]).length));
      expect(card.textContent).toContain(`${resolvedBy([a.signal]).length} controls become known`);
    }
  });
  it('providing an artifact moves the projection by exactly the controls it resolves', () => {
    useAssessment.setState({ evidenceUploaded: true, providedRequests: [] });
    const first = evidenceArtifacts()[0];
    useAssessment.getState().provideRequest(first.signal);
    const { container, getByText } = draw();
    fireEvent.click(getByText("What you didn't provide"));
    expect(container.textContent).toContain(`${resolvedBy([first.signal]).length} controls become known. Band width falls to`);
  });
  it('no artifact name or count is typed into the screen or the library; the hand-entered lists are gone', () => {
    for (const f of ['/src/screens/07_Remediation.tsx', '/src/lib/ranking.ts', '/src/data/remediation.ts']) {
      expect(raw[f], f).not.toMatch(/controlsUnlocked|req-siem|req-linux|req-priv|req-backup|req-lms/);
    }
    expect(raw['/src/data/remediation.ts']).not.toMatch(/export const (remediationPlan|evidenceRequests)/);
  });
  it('a request that names no signal resolves nothing, and only evidence requests are artifacts (not fixes or corroboration)', () => {
    const base = CURRENT.ranking.items.find((i) => i.actionType === 'evidence_request')!;
    const mk = (controlId: string, actionType: string, signalsRequested: string[]) => ({ ...base, controlId, actionType, signalsRequested });
    const items = [mk('A', 'evidence_request', []), mk('B', 'corroboration_request', ['s9']), mk('C', 'fix', ['s8']), mk('D', 'evidence_request', ['s1'])];
    expect(evidenceArtifacts(items).map((a) => a.signal)).toEqual(['s1']);
    expect(resolvedBy(['s1', 's8', 's9'], items)).toEqual(['D']);
    expect(resolvedBy([], items)).toEqual([]);
  });
});
