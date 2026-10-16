import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Remediation from '../screens/07_Remediation';
import { WITHHELD_MESSAGE } from '../components/FigureBoundary';
import { useAssessment } from '../store/useAssessment';

// Corrupt the one number the Remediation hero and its subline share, to show the runtime guard in
// ScoreInterval stops it on the way to the screen: the figure is withheld, not rendered wrong, and
// the page is not blanked.
let corrupt = false;
vi.mock('../lib/scoring', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../lib/scoring')>();
  return {
    ...actual,
    projectFromNumerator: (...args: Parameters<typeof actual.projectFromNumerator>) => {
      const r = actual.projectFromNumerator(...args);
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
    const r = render(
      <MemoryRouter>
        <Remediation />
      </MemoryRouter>,
    );
    fireEvent.click(r.getByText("What you didn't provide"));
    return r;
  };
  it('shows the band when the width agrees with it', () => {
    corrupt = false;
    const { container, queryByTestId } = draw();
    expect(queryByTestId('figure-withheld')).toBeNull();
    expect(container.querySelectorAll('span.text-3xl').length).toBe(2);
  });
  it('withholds the figure, logs the guard, and keeps the rest of the page when it does not', () => {
    corrupt = true;
    const logged: string[] = [];
    const quiet = console.error;
    console.error = (...a: unknown[]) => logged.push(a.map(String).join(' '));
    try {
      const { container, getByTestId, getByText } = draw();
      expect(getByTestId('figure-withheld').textContent).toBe(WITHHELD_MESSAGE);
      expect(container.querySelector('span.text-3xl')).toBeNull(); // no headline number
      expect(container.textContent).not.toMatch(/Band width falls to/); // and no subline built on it
      expect(getByText('Projected interval')).toBeTruthy(); // the card around it is still there
      expect(container.textContent).toContain('the band cannot fall below'); // as are its neighbours
      expect(logged.some((l) => l.includes('figure withheld by guard "ScoreInterval"'))).toBe(true);
    } finally {
      console.error = quiet;
      corrupt = false;
    }
  });
});
