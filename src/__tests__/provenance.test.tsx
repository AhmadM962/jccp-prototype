import { beforeEach, describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import type { ReactElement } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { Provenance, StateProvenance, TierLegend } from '../components/Provenance';
import { PROFILES, PROFILE_ORDER, setActiveProfile, type ProfileData } from '../data/profiles';
import TopBar from '../components/layout/TopBar';
import { useAssessment } from '../store/useAssessment';
import { CURRENT } from '../data/current';
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
  setActiveProfile('ministry');
});

/** Does a dotted path ("after.views.unweighted", "ranking.items") exist in the assessment data? */
const resolves = (profile: ProfileData, path: string): boolean => {
  let at: unknown = profile;
  for (const part of path.split('.')) {
    if (at === null || typeof at !== 'object' || !(part in (at as object))) return false;
    at = (at as Record<string, unknown>)[part];
  }
  return at !== undefined;
};

/** Sources that are the assessed state: before the upload they are a projection, never measured. */
const STATE_SOURCES = /^(after|assurance|claims|ranking|dual|coverage|ruleR)(\.|$)/;

describe('Provenance component', () => {
  it('shows a chip for every tier, measured included, and a measured one says where it is read from', () => {
    const { container } = render(
      <>
        <Provenance tier="measured" from="after.views.unweighted">m</Provenance>
        <Provenance tier="illustrative">i</Provenance>
        <Provenance tier="planned">p</Provenance>
      </>,
    );
    expect(container.querySelector('[data-tier-chip="measured"]')).toHaveTextContent('measured');
    expect(container.querySelector('[data-tier-chip="illustrative"]')).toHaveTextContent('illustrative');
    expect(container.querySelector('[data-tier-chip="planned"]')).toHaveTextContent('planned');
    expect(container.querySelector('[data-tier="measured"]')?.getAttribute('data-source')).toBe('after.views.unweighted');
    expect(container.querySelector('[data-tier="illustrative"]')?.hasAttribute('data-source')).toBe(false);
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

describe('StateProvenance: the engine\u2019s assessed state is measured; everything else about the state is a projection', () => {
  const tier = (props: { uploaded: boolean; overridesActive?: number }) => {
    const { container } = render(
      <StateProvenance from="after.views.unweighted" {...props}>
        x
      </StateProvenance>,
    );
    const el = container.querySelector('[data-tier]')!;
    return [el.getAttribute('data-tier'), el.getAttribute('data-source'), container.textContent] as const;
  };
  it('after the upload with no override: measured, with its source', () => {
    expect(tier({ uploaded: true })).toEqual(['measured', 'after.views.unweighted', 'measuredx']);
  });
  it('before the upload: illustrative, and it says it is rule R\u2019s projection, not an engine run', () => {
    const [t, src, text] = tier({ uploaded: false });
    expect(t).toBe('illustrative');
    expect(src).toBeNull();
    expect(text).toContain('a projection (rule R), not an engine run');
  });
  it('with an analyst override: illustrative, and it says the file does not contain the override', () => {
    const [t, , text] = tier({ uploaded: true, overridesActive: 1 });
    expect(t).toBe('illustrative');
    expect(text).toContain('analyst overrides, which the assessment file does not contain');
  });
});

describe('every screen states its provenance', () => {
  it.each(SCREENS)('%s renders at least one tier chip', (_name, path, el) => {
    const { container } = renderAt(path, el);
    expect(container.querySelectorAll('[data-tier-chip]').length).toBeGreaterThanOrEqual(1);
  });

  it('covers all 14 screens', () => {
    expect(SCREENS.length).toBe(14);
  });
});

describe('measured is used, and only where the figure traces to the assessment file', () => {
  const uploadedStates = [false, true];

  it.each(SCREENS)('%s: every measured region names a source that exists in all three profiles', (_name, path, el) => {
    for (const uploaded of uploadedStates) {
      useAssessment.setState({ evidenceUploaded: uploaded });
      const { container, unmount } = renderAt(path, el);
      for (const m of Array.from(container.querySelectorAll('[data-tier="measured"]'))) {
        const from = m.getAttribute('data-source');
        expect(from, `${path} uploaded=${uploaded}: a measured region with no source`).toBeTruthy();
        for (const id of PROFILE_ORDER) expect(resolves(PROFILES[id], from!), `${path} ${id}: "${from}" is not in the data`).toBe(true);
        // and the chip sits on the same element, so the reader sees it
        expect(m.querySelector('[data-tier-chip="measured"]'), `${path} ${from}`).toBeTruthy();
      }
      unmount();
    }
  });

  it('before the upload nothing that is the assessed state is measured', () => {
    for (const [, path, el] of SCREENS) {
      const { container, unmount } = renderAt(path, el);
      for (const m of Array.from(container.querySelectorAll('[data-tier="measured"]'))) {
        expect(m.getAttribute('data-source'), `${path}: ${m.getAttribute('data-source')} is measured before the upload`).not.toMatch(STATE_SOURCES);
      }
      unmount();
    }
  });

  it('after the upload the Dashboard, the Gap Matrix and the Control Detail have measured regions', () => {
    useAssessment.setState({ evidenceUploaded: true });
    for (const [name, path, el] of SCREENS.filter(([n]) => ['04_Dashboard', '05_GapMatrix', '06_ControlDetail'].includes(n))) {
      const { container, unmount } = renderAt(path, el);
      expect(container.querySelectorAll('[data-tier="measured"]').length, name).toBeGreaterThanOrEqual(1);
      unmount();
    }
  });

  it('the scope exclusions are measured before and after: scope does not depend on the upload', () => {
    for (const uploaded of uploadedStates) {
      useAssessment.setState({ evidenceUploaded: uploaded });
      const { container, unmount } = renderAt('/exclusions', <Exclusions />);
      expect(container.querySelectorAll('[data-tier="measured"][data-source="exclusions"]').length).toBeGreaterThanOrEqual(1);
      unmount();
    }
  });

  it('what was invented stays illustrative or planned, and what was invented and contradicted the engine is gone', () => {
    useAssessment.setState({ evidenceUploaded: true });
    const dash = renderAt('/dashboard', <Dashboard />);
    // the freshness line is now the engine's own count of unusable evidence, not worked-example dates
    const fresh = dash.getByTestId('evidence-freshness').closest('[data-tier]')!;
    expect(fresh.getAttribute('data-tier')).toBe('measured');
    expect(fresh.getAttribute('data-source')).toBe('assurance.checks');
    expect(dash.container.textContent).not.toContain('Oldest evidence');
    expect(fresh.textContent).toContain(CURRENT.assurance.checks.find((c) => c.cause === 'unusable_evidence_proportion')!.detail);
    dash.unmount();
    useAssessment.setState({ role: 'executive' });
    const exec = renderAt('/dashboard', <Dashboard />);
    const tierOf = (text: string) =>
      Array.from(exec.container.querySelectorAll('*')).find((e) => e.children.length === 0 && e.textContent === text)?.closest('[data-tier]')?.getAttribute('data-tier');
    expect(exec.container.textContent).not.toContain('Top 3 risks');
    expect(exec.container.textContent).not.toContain('last four collection cycles');
    expect(tierOf('Prioritisation')).toBe('measured');
    expect(tierOf('This assessment')).toBe('measured');
    exec.unmount();
    useAssessment.setState({ role: 'owner' });
    const chat = renderAt('/chat', <Chat />);
    expect(chat.container.querySelector('[data-tier="measured"]')).toBeNull();
    chat.unmount();
    const intake = renderAt('/intake', <Intake />);
    for (const b of intake.getAllByText('Generate scoped link')) expect(b.closest('[data-tier]')!.getAttribute('data-tier')).toBe('planned');
    expect(intake.getByTestId('respondent-compliance-officer').closest('[data-tier]')!.getAttribute('data-tier')).toBe('measured');
    intake.unmount();
    useAssessment.setState({ evidenceUploaded: false });
    const before = renderAt('/intake', <Intake />);
    expect(before.container.querySelector('[data-tier="measured"]')).toBeNull();
  });

  it('rule R\u2019s provenance is visible: the before-upload Dashboard says what its figures are', () => {
    const { container } = renderAt('/dashboard', <Dashboard />);
    expect(container.textContent).toContain('rule R\u2019s projection of the engine\u2019s data');
    expect(container.textContent).toContain('not an engine run');
  });

  it('and nothing in the source marks a region measured without a source: the type refuses it', () => {
    // `tier="measured"` without `from` does not type-check (ProvenanceProps); this holds the text as well
    const raw = import.meta.glob('/src/screens/*.tsx', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;
    for (const [p, text] of Object.entries(raw)) {
      for (const m of text.matchAll(/<Provenance[^>]*tier="measured"[^>]*>/g)) expect(m[0], p).toContain('from=');
    }
  });
});
