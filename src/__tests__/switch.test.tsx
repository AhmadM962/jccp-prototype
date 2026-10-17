import { beforeEach, describe, expect, it } from 'vitest';
import { act, fireEvent, render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ts from 'typescript';
import App from '../App';
import { useAssessment } from '../store/useAssessment';
import { activeProfileId, PROFILES, PROFILE_ORDER, type ProfileId } from '../data/profiles';
import { CURRENT } from '../data/current';
import { orgProfileFor } from '../data/orgProfiles';
import { computeApplicable } from '../data/scenario';
import { sectorById } from '../data/sectors';
import { toPct } from '../lib/frac';
import { evidenceArtifacts } from '../lib/ranking';
import { capabilities, TOTALS } from '../data/capabilities';
import { RISK_WEIGHT_TABLE, RISK_WEIGHTED_TOTALS, FRAMEWORK_WEIGHTED_TOTALS } from '../data/riskWeighting';
import { planSummary, planSignals } from '../lib/plan';
import { TOUR_STEPS } from '../tour/steps';
import { toNumber } from '../lib/frac';

const raw = import.meta.glob('/src/**/*.{ts,tsx}', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;

const at = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );
const pick = (id: ProfileId) => act(() => useAssessment.getState().selectProfile(id));

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem('jccp-tour-seen', '1');
  useAssessment.getState().resetDemo();
});

describe('choosing an assessment on the Profile screen changes the whole app', () => {
  it('starts on the ministry, and the radio group lists all three with their own figures', () => {
    const { getByTestId } = at('/profile');
    expect(activeProfileId()).toBe('ministry');
    for (const id of PROFILE_ORDER) {
      const b = getByTestId(`select-profile-${id}`);
      const p = PROFILES[id];
      expect(b.textContent).toContain(`${p.totals.applicable} of ${p.totals.framework} applicable · ${p.totals.excluded} excluded`);
      expect(b.textContent).toContain(p.source.file);
      expect(b.getAttribute('aria-checked')).toBe(String(id === 'ministry'));
    }
  });

  it.each(['bank', 'utility'] as const)('selecting %s moves the source stamp, the applicable count, the register and the interval', (id) => {
    const { getByTestId, container } = at('/profile');
    const ministry = PROFILES.ministry;
    expect(getByTestId('source-file').textContent).toBe(ministry.source.file);
    fireEvent.click(getByTestId(`select-profile-${id}`));
    const p = PROFILES[id];
    expect(activeProfileId()).toBe(id);
    expect(getByTestId('source-file').textContent).toBe(p.source.file);
    expect(getByTestId('source-sha256').textContent).toBe(p.source.sha256);
    expect(getByTestId('source-sha256').textContent).not.toBe(ministry.source.sha256);
    // live scoping reads the toggles the engine's exclusions imply, and agrees with the engine's applicable count
    expect(container.querySelector('[data-tour="profile-applicable"]')!.textContent).toContain(`${p.totals.applicable}`);
    expect(container.textContent).toContain(`of 576 total · ${p.totals.excluded} excluded`);
    expect(getByTestId(`select-profile-${id}`).getAttribute('aria-checked')).toBe('true');
    expect(getByTestId('select-profile-ministry').getAttribute('aria-checked')).toBe('false');
  });

  it('the interval, the applicable count and the exclusions differ between the three, on their own screens', () => {
    const seen = new Map<string, ProfileId>();
    for (const id of PROFILE_ORDER) {
      pick(id);
      useAssessment.setState({ evidenceUploaded: true });
      const p = PROFILES[id];

      const dash = at('/dashboard');
      const lower = toPct(p.after.views.unweighted.lower).toFixed(1);
      const upper = toPct(p.after.views.unweighted.upper).toFixed(1);
      const nums = Array.from(dash.container.querySelectorAll('span.text-3xl')).map((e) => e.textContent);
      expect(nums.slice(0, 2), id).toEqual([`${lower}%`, `${upper}%`]);
      seen.set(`${lower}-${upper}`, id);
      dash.unmount();

      const gm = at('/gap-matrix');
      expect(gm.getByTestId('matrix-count').textContent, id).toBe(`${p.totals.applicable} of ${p.totals.applicable}`);
      gm.unmount();

      const ex = at('/exclusions');
      expect(ex.container.querySelectorAll('[data-testid^="exclusion-"]').length, id).toBe(p.exclusions.length);
      if (p.exclusions.length === 0) expect(ex.getByTestId('no-exclusions').textContent).toContain(`all ${p.totals.framework} are applicable`);
      ex.unmount();
    }
    expect(seen.size).toBe(3); // three different intervals
    expect(PROFILE_ORDER.map((id) => PROFILES[id].totals.applicable)).toEqual([557, 576, 544]);
    expect(PROFILE_ORDER.map((id) => PROFILES[id].totals.excluded)).toEqual([19, 0, 32]);
  });

  it('what the user held against one assessment is dropped when another is chosen', () => {
    useAssessment.setState({
      providedRequests: [evidenceArtifacts()[0].signal],
      overriddenControls: { 'JNCSF-1': { state: 'green', previousState: 'unknown', justification: 'x', analystId: 't', timestamp: 't' } },
      profileChallenge: { decision: 'confirmed', justification: 'x', decidedBy: 't', decidedAt: 't' },
    });
    pick('bank');
    const s = useAssessment.getState();
    expect(s.providedRequests).toEqual([]);
    expect(s.overriddenControls).toEqual({});
    expect(s.profileChallenge).toBeNull();
    expect(s.profileId).toBe('bank');
  });

  it('the choice survives a reload: the stored assessment is put back as the active one', async () => {
    pick('utility');
    expect(JSON.parse(localStorage.getItem('jccp-assessment-v4')!).state.profileId).toBe('utility');
    act(() => {
      // simulate a fresh page: the data layer is back at its default, the store is rehydrated from storage
      useAssessment.getState().resetDemo();
      useAssessment.setState({ profileId: 'utility' });
    });
    await useAssessment.persist.rehydrate();
    expect(activeProfileId()).toBe('utility');
  });

  it('Reset demo returns to the ministry', () => {
    pick('bank');
    useAssessment.getState().resetDemo();
    expect(activeProfileId()).toBe('ministry');
    expect(useAssessment.getState().profileId).toBe('ministry');
  });
});

describe('the organisation profile each assessment corresponds to is derived from it', () => {
  it.each(PROFILE_ORDER)('%s: the profile\'s declared variables give exactly the engine\'s applicable count, and its sector is the engine\'s', (id) => {
    const org = orgProfileFor(id);
    const p = PROFILES[id];
    expect(computeApplicable(org)).toBe(p.totals.applicable);
    expect(sectorById(org.sector).arabicLabel).toBe(p.cicsc.sectorNameArabic);
    expect(org.operatesCriticalInfrastructure).toBe(p.cicsc.applies);
  });
  it('the utility declared three variables "no" and the bank none, as its exclusions say', () => {
    const u = orgProfileFor('utility');
    expect([u.inHouseDevelopment, u.outsourcedDevelopment, u.wirelessNetwork, u.mobileDevices, u.remoteAccess]).toEqual(['no', 'no', 'no', 'unrecorded', 'unrecorded']);
    const b = orgProfileFor('bank');
    expect([b.inHouseDevelopment, b.outsourcedDevelopment, b.wirelessNetwork, b.mobileDevices, b.remoteAccess]).toEqual(['unrecorded', 'unrecorded', 'unrecorded', 'unrecorded', 'unrecorded']);
  });
});

describe('the CICSC notice follows the assessment\'s own boundary, not a switch', () => {
  // The brief expected the notice for "the profile whose golden declares it". All three goldens do (basis: sector_designation).
  it('all three assessments declare it, and each shows the notice on the dashboard in both states', () => {
    for (const id of PROFILE_ORDER) {
      expect(PROFILES[id].cicsc.applies, id).toBe(true);
      pick(id);
      for (const role of ['owner', 'executive'] as const) {
        for (const uploaded of [false, true]) {
          useAssessment.setState({ evidenceUploaded: uploaded, role });
          const d = at('/dashboard');
          expect(d.container.querySelector('[data-testid="cicsc-notice"]'), `${id} ${role} ${uploaded}`).not.toBeNull();
          d.unmount();
        }
      }
    }
  });
  it('an assessment whose boundary says it does not apply shows no notice, on the dashboard or the profile', () => {
    const original = PROFILES.bank;
    try {
      (PROFILES as Record<ProfileId, typeof original>).bank = { ...original, cicsc: { ...original.cicsc, applies: false, criticalInfrastructure: 'no' } };
      pick('bank');
      expect(CURRENT.cicsc.applies).toBe(false);
      for (const role of ['owner', 'executive'] as const) {
        for (const uploaded of [false, true]) {
          useAssessment.setState({ evidenceUploaded: uploaded, role });
          const d = at('/dashboard');
          expect(d.container.textContent, `${role} ${uploaded}`).toContain('Compliance Dashboard');
          expect(d.container.querySelector('[data-testid="cicsc-notice"]'), `${role} ${uploaded}`).toBeNull();
          d.unmount();
        }
      }
      useAssessment.setState({ role: 'owner' });
      const p = at('/profile');
      expect(p.queryByTestId('cicsc-profile-note')).toBeNull();
      expect(p.getByTestId('cicsc-derived').textContent).toBe('does not apply');
    } finally {
      (PROFILES as Record<ProfileId, typeof original>).bank = original;
    }
  });
  it('the profile screen shows it as derived from the sector, with the engine\'s basis, and offers no switch', () => {
    const { getByTestId, container } = at('/profile');
    expect(getByTestId('cicsc-derived').textContent).toBe('applies');
    expect(container.textContent).toContain(`Derived from the sector, not declared: ${CURRENT.cicsc.sectorName} is a designated sector (basis: sector_designation)`);
    expect(container.querySelector('button[aria-pressed]')).toBeNull();
  });
});

describe('the two-stage scoping challenge still works on each assessment', () => {
  it.each(PROFILE_ORDER)('%s: declaring no cloud asks for a justification; after the upload the contradiction is blocked', (id) => {
    pick(id);
    const s1 = at('/profile');
    act(() => useAssessment.getState().setProfile({ usesCloud: 'no' }));
    expect(s1.container.textContent).toContain('Confirm this scoping decision');
    s1.unmount();
    useAssessment.setState({ evidenceUploaded: true });
    const s2 = at('/profile');
    expect(s2.container.textContent).toContain('Contradiction — scoping decision blocked');
  });
});

describe('every route renders for every assessment, before and after the upload, and shows that assessment', () => {
  const ROUTES = ['/profile', '/request-plan', '/intake', '/dashboard', '/gap-matrix', '/remediation', '/export', '/chat', '/exclusions', '/admin', '/tasks', '/rollup', '/authoring'];
  for (const id of PROFILE_ORDER) {
    it(`${id}`, () => {
      pick(id);
      const p = PROFILES[id];
      const failures: string[] = [];
      for (const uploaded of [false, true]) {
        useAssessment.setState({ evidenceUploaded: uploaded });
        for (const route of [...ROUTES, `/control/${p.claims[0].id}`]) {
          const r = at(route);
          if (r.queryByTestId('screen-withheld') || r.queryByTestId('figure-withheld')) failures.push(`${route} uploaded=${uploaded}: a guard fired`);
          if (r.getByTestId('source-file').textContent !== p.source.file) failures.push(`${route}: shows ${r.getByTestId('source-file').textContent}`);
          if ((r.container.textContent ?? '').trim().length < 200) failures.push(`${route}: blank`);
          r.unmount();
        }
      }
      expect(failures).toEqual([]);
    });
  }
});

describe('no module holds an assessment\'s figures in a constant fixed at import', () => {
  // A top-level `const X = ... CURRENT ...` is evaluated once, for whichever assessment was active at import, and then
  // stays that assessment's whatever is chosen later. Such a value must be a function, a lazyByProfile(...), or be read
  // inside a component.
  const offenders = (): string[] => {
    const out: string[] = [];
    for (const [path, text] of Object.entries(raw)) {
      if (path.startsWith('/src/__tests__/') || path.startsWith('/src/test/') || path.startsWith('/src/data/profiles/') || path === '/src/data/current.ts') continue;
      const sf = ts.createSourceFile(path, text, ts.ScriptTarget.Latest, true, path.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
      for (const st of sf.statements) {
        if (!ts.isVariableStatement(st)) continue;
        for (const d of st.declarationList.declarations) {
          const init = d.initializer;
          if (!init) continue;
          const lazy = ts.isCallExpression(init) && init.expression.getText(sf) === 'lazyByProfile';
          const fn = ts.isArrowFunction(init) || ts.isFunctionExpression(init);
          if (lazy || fn) continue;
          if (/\bCURRENT\b|\bactiveProfile\b|\bPROFILES\b/.test(init.getText(sf))) out.push(`${path}: ${d.name.getText(sf)}`);
        }
      }
    }
    return out;
  };
  it('finds none outside the data layer', () => {
    expect(offenders()).toEqual([]);
  });
});

describe('the values built once per assessment follow the active one, in both directions', () => {
  it('TOTALS, the capability table, the weights, the plan and the tour text are each the active assessment\'s', () => {
    for (const id of [...PROFILE_ORDER, 'ministry', 'utility', 'bank'] as ProfileId[]) {
      pick(id);
      const p = PROFILES[id];
      expect(TOTALS.applicable, id).toBe(p.totals.applicable);
      expect(TOTALS.notApplicable, id).toBe(p.totals.excluded);
      expect(TOTALS.after.unknown, id).toBe(p.after.unknown);
      expect(TOTALS.before.unknown, id).toBe(p.before.unknown);
      expect(capabilities.find((c) => c.id === 'ops')!.after!.applicable, id).toBe(p.after.capabilities.ops.applicable);
      expect(capabilities.reduce((n, c) => n + (c.after?.applicable ?? 0), 0), id).toBe(p.totals.applicable);
      expect(RISK_WEIGHT_TABLE.reduce((n, r) => n + r.controls, 0), id).toBe(p.totals.applicable);
      expect(RISK_WEIGHTED_TOTALS.derivedOnly, id).toBe(toNumber(p.after.views.weighted_derived_only.totalWeight));
      expect(FRAMEWORK_WEIGHTED_TOTALS.excluded, id).toBe(p.totals.excluded);
      expect(planSummary().applicable, id).toBe(p.totals.applicable);
      expect(planSummary().unauthored, id).toBe(p.after.unknownUnauthored);
      expect(planSignals().length, id).toBe(p.coverage.required.length);
      expect(TOUR_STEPS.find((s) => s.target === 'profile-applicable')!.body, id).toContain(`${p.totals.applicable} of ${p.totals.framework} controls apply here`);
    }
    expect(new Set(PROFILE_ORDER.map((id) => { pick(id); return TOTALS.applicable; })).size).toBe(3);
  });
  it('a screen\'s own state is dropped with the assessment it was about (the tree is re-keyed)', () => {
    useAssessment.setState({ evidenceUploaded: true });
    const r = at('/remediation');
    fireEvent.click(r.getByText('Fixes'));
    expect(r.container.querySelector('[data-testid="ranking-count"]')!.textContent).toContain(`${PROFILES.ministry.ranking.items.filter((i) => i.actionType !== 'evidence_request').length} actions`);
    pick('bank');
    const filtered = PROFILES.bank.ranking.items.length;
    expect(r.container.querySelector('[data-testid="ranking-count"]')!.textContent).toContain(`${filtered} actions`); // back on "All actions", not still on "Fixes"
  });
});
