import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Remediation from '../screens/07_Remediation';
import { useAssessment } from '../store/useAssessment';

// Corrupt the one number the Remediation hero and its subline share, to show the runtime guard in
// ScoreInterval stops it on the way to the screen instead of rendering a wrong figure.
let corrupt = false;
vi.mock('../lib/scoring', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../lib/scoring')>();
  return {
    ...actual,
    projectProvision: (...args: Parameters<typeof actual.projectProvision>) => {
      const r = actual.projectProvision(...args);
      return corrupt ? { ...r, resultingWidthPts: r.resultingWidthPts + 1 } : r;
    },
  };
});

beforeEach(() => {
  localStorage.clear();
  useAssessment.getState().resetDemo();
});

describe('Remediation reaches the screen only through the guard', () => {
  // The hero lives on the "What you didn't provide" tab, so open it — drawing the default tab would
  // pass whatever the numbers were.
  const draw = () => {
    const { getByText, container } = render(
      <MemoryRouter>
        <Remediation />
      </MemoryRouter>,
    );
    fireEvent.click(getByText("What you didn't provide"));
    expect(container.querySelector('span.text-3xl')).not.toBeNull();
  };
  it('renders when the width agrees with the band', () => {
    corrupt = false;
    expect(draw).not.toThrow();
  });
  it('throws, rather than showing a wrong width, when it does not', () => {
    corrupt = true;
    const quiet = console.error;
    console.error = () => {};
    try {
      expect(draw).toThrow(/Displayed interval inconsistent in ScoreInterval/);
    } finally {
      console.error = quiet;
      corrupt = false;
    }
  });
});
