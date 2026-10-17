import { beforeEach, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Integrations from '../screens/15_Integrations';
import { useAssessment } from '../store/useAssessment';
import { CURRENT } from '../data/current';
import { RAW_KEYS } from '../lib/submission';

beforeEach(() => {
  localStorage.clear();
  useAssessment.getState().resetDemo();
});

it('both halves render from the active assessment, and what crosses carries no field the local payload marks raw', () => {
  const { getByTestId, container } = render(<MemoryRouter><Integrations /></MemoryRouter>);
  expect(getByTestId('half-inside').textContent).toContain('/evidence/bundle');
  expect(getByTestId('half-inside').textContent).toContain('/controls/{id}');
  expect(getByTestId('half-crossing').textContent).toContain('/assessment-results');
  expect(getByTestId('boundary').textContent).toContain('raw evidence ──✗── boundary');
  expect(getByTestId('boundary').textContent).toContain('signed statement ──✓──');
  const local = getByTestId('payload-local');
  const rawLines = Array.from(local.querySelectorAll('[data-raw="true"]'));
  expect(rawLines.length).toBeGreaterThan(0);
  const crossing = JSON.parse(getByTestId('payload-crossing').textContent!.replace(/raw$/gm, ''));
  const text = JSON.stringify(crossing);
  for (const k of RAW_KEYS) expect(text, k).not.toContain(`"${k}"`);
  // and no raw value travels either
  for (const l of rawLines) {
    const v = /: "(.+)"/.exec(l.textContent!.replace(/raw$/, ''))?.[1];
    if (v && v.length > 3) expect(text, v).not.toContain(v);
  }
  expect(crossing['assessment-results']['jccp:commitment']['inputs-sha256']).toBe(CURRENT.source.sha256);
  expect(crossing['assessment-results']['jccp:coverage-metadata']['assurance-level']).toBeTruthy();
  expect(container.querySelector('[data-tier="planned"]')).not.toBeNull();
});
