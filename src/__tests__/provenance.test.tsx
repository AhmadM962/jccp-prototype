import { beforeEach, describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import type { ReactElement } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { Provenance, TierLegend } from '../components/Provenance';
import TopBar from '../components/layout/TopBar';
import { useAssessment } from '../store/useAssessment';
import Profile from '../screens/01_Profile';
import RequestPlan from '../screens/02_RequestPlan';
import Intake from '../screens/03_Intake';
import Dashboard from '../screens/04_Dashboard';
import GapMatrix from '../screens/05_GapMatrix';
import ControlDetail from '../screens/06_ControlDetail';
import Remediation from '../screens/07_Remediation';
import ExportScreen from '../screens/08_Export';
import Chat from '../screens/09_Chat';
import Exclusions from '../screens/10_Exclusions';
import Admin from '../screens/11_Admin';
import Tasks from '../screens/12_Tasks';
import Rollup from '../screens/13_Rollup';
import Authoring from '../screens/14_Authoring';

const SCREENS: [string, string, ReactElement][] = [
  ['01_Profile', '/profile', <Profile />],
  ['02_RequestPlan', '/request-plan', <RequestPlan />],
  ['03_Intake', '/intake', <Intake />],
  ['04_Dashboard', '/dashboard', <Dashboard />],
  ['05_GapMatrix', '/gap-matrix', <GapMatrix />],
  ['06_ControlDetail', '/control/JNCSF-102', <ControlDetail />],
  ['07_Remediation', '/remediation', <Remediation />],
  ['08_Export', '/export', <ExportScreen />],
  ['09_Chat', '/chat', <Chat />],
  ['10_Exclusions', '/exclusions', <Exclusions />],
  ['11_Admin', '/admin', <Admin />],
  ['12_Tasks', '/tasks', <Tasks />],
  ['13_Rollup', '/rollup', <Rollup />],
  ['14_Authoring', '/authoring', <Authoring />],
];

function renderAt(path: string, el: ReactElement) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path={path.startsWith('/control/') ? '/control/:id' : path} element={el} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  localStorage.clear();
  useAssessment.getState().resetDemo();
});

describe('Provenance component', () => {
  it('hides the chip for measured, shows it for illustrative and planned', () => {
    const { container } = render(
      <>
        <Provenance tier="measured">m</Provenance>
        <Provenance tier="illustrative">i</Provenance>
        <Provenance tier="planned">p</Provenance>
      </>,
    );
    expect(container.querySelector('[data-tier-chip="measured"]')).toBeNull();
    expect(container.querySelector('[data-tier-chip="illustrative"]')).toHaveTextContent('illustrative');
    expect(container.querySelector('[data-tier-chip="planned"]')).toHaveTextContent('planned');
  });

  it('renders planned content at 85% opacity and nothing else', () => {
    const { container } = render(
      <>
        <Provenance tier="planned">p</Provenance>
        <Provenance tier="illustrative">i</Provenance>
      </>,
    );
    expect(container.querySelector('[data-tier="planned"]')?.className).toContain('opacity-[0.85]');
    expect(container.querySelector('[data-tier="illustrative"]')?.className).not.toContain('opacity');
  });

  it('shows a note when given one', () => {
    const { getByText } = render(
      <Provenance tier="illustrative" note="a note">
        x
      </Provenance>,
    );
    expect(getByText('a note')).toBeInTheDocument();
  });

  it('TierLegend names all three tiers, and the top bar contains it', () => {
    const { getByTestId } = render(<TierLegend />);
    const legend = getByTestId('tier-legend');
    for (const t of ['measured', 'illustrative', 'planned']) expect(legend.textContent).toContain(t);
    const bar = render(
      <MemoryRouter>
        <TopBar />
      </MemoryRouter>,
    );
    expect(bar.getAllByTestId('tier-legend').length).toBeGreaterThan(0);
  });
});

describe('every screen states its provenance', () => {
  it.each(SCREENS)('%s renders at least one tier chip and no measured region', (_name, path, el) => {
    const { container } = renderAt(path, el);
    expect(container.querySelectorAll('[data-tier-chip]').length).toBeGreaterThanOrEqual(1);
    // nothing in this repository is produced by a real assessment engine yet
    expect(container.querySelectorAll('[data-tier="measured"]').length).toBe(0);
    expect(container.querySelectorAll('[data-tier-chip="measured"]').length).toBe(0);
  });

  it('covers all 14 screens', () => {
    expect(SCREENS.length).toBe(14);
  });
});
