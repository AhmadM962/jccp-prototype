import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from '../App';
import { WITHHELD_MESSAGE, WITHHELD_SCREEN_MESSAGE } from '../components/FigureBoundary';
import { useAssessment } from '../store/useAssessment';

// A guard that fires while a screen's numbers are being derived — above any single figure — must
// not blank the app either: the sidebar and top bar stay, the screen shows the honest message.
let broken = false;
vi.mock('../lib/derive', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../lib/derive')>();
  const { IntervalConsistencyError } = await import('../lib/scoring');
  return {
    ...actual,
    dashboardView: (...args: Parameters<typeof actual.dashboardView>) => {
      if (broken) throw new IntervalConsistencyError('dashboardView', 'forced for the test');
      return actual.dashboardView(...args);
    },
  };
});

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem('jccp-tour-seen', '1');
  useAssessment.getState().resetDemo();
});

describe('the app keeps its chrome when a derivation guard fires', () => {
  const at = (path: string) =>
    render(
      <MemoryRouter initialEntries={[path]}>
        <App />
      </MemoryRouter>,
    );
  it('renders the Dashboard normally when nothing is wrong', () => {
    broken = false;
    const { queryByTestId, container } = at('/dashboard');
    expect(queryByTestId('screen-withheld')).toBeNull();
    expect(queryByTestId('figure-withheld')).toBeNull();
    expect(container.textContent).toContain('Compliance Dashboard');
  });
  it('shows the message instead of a blank page, with navigation intact, and logs the guard', () => {
    broken = true;
    const logged: string[] = [];
    const quiet = console.error;
    console.error = (...a: unknown[]) => logged.push(a.map(String).join(' '));
    try {
      const { getByTestId, container } = at('/dashboard');
      expect(getByTestId('screen-withheld').textContent).toBe(WITHHELD_SCREEN_MESSAGE);
      expect(getByTestId('screen-withheld').textContent).not.toBe(WITHHELD_MESSAGE); // not the figure wording
      expect(getByTestId('screen-withheld').getAttribute('data-where')).toBe('dashboardView');
      expect(container.textContent).toContain('Demonstration prototype'); // banner / chrome still rendered
      expect(container.querySelector('nav')).not.toBeNull(); // sidebar
      expect(logged.some((l) => l.includes('figure withheld by guard "dashboardView"'))).toBe(true);
    } finally {
      console.error = quiet;
      broken = false;
    }
  });
});
