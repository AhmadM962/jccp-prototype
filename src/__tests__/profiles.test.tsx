import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from '../App';
import SourceStamp from '../components/SourceStamp';
import { PROFILES, PROFILE_ORDER, activeProfileId, setActiveProfile } from '../data/profiles';
import type { ViewId } from '../data/profiles/types';
import { add, eq, sum, toPct } from '../lib/frac';
import { CURRENT } from '../data/current';

const raw = import.meta.glob('/src/data/profiles/*.ts', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;
const VIEWS: ViewId[] = ['unweighted', 'weighted_including_underived', 'weighted_derived_only', 'authored_scope'];
const all = PROFILE_ORDER.map((id) => PROFILES[id]);

describe('Task 1: the generator reads all three goldens', () => {
  it('there are three profiles, from three different golden files', () => {
    expect(PROFILE_ORDER).toEqual(['ministry', 'bank', 'utility']);
    expect(all.map((p) => p.source.file)).toEqual(['government_ministry.json', 'bank.json', 'utility_with_ot.json']);
    expect(all.map((p) => p.id)).toEqual(PROFILE_ORDER);
  });

  it('each carries the SHA-256 of its source: 64 hex characters, all different, and the same hash in the module header', () => {
    const hashes = all.map((p) => p.source.sha256);
    for (const h of hashes) expect(h).toMatch(/^[0-9a-f]{64}$/);
    expect(new Set(hashes).size).toBe(3);
    for (const p of all) {
      const text = raw[`/src/data/profiles/${p.id}.ts`];
      expect(text, p.id).toContain(`//   ${p.source.sha256}`);
      expect(text, p.id).toContain(`golden output ${p.source.file}`);
    }
  });

  it('the three profiles differ: applicable count, exclusions, interval', () => {
    expect(all.map((p) => p.totals.applicable)).toEqual([557, 576, 544]);
    expect(all.map((p) => p.totals.excluded)).toEqual([19, 0, 32]);
    expect(all.map((p) => p.totals.framework)).toEqual([576, 576, 576]);
    const bands = all.map((p) => JSON.stringify([p.after.views.unweighted.lower, p.after.views.unweighted.upper]));
    expect(new Set(bands).size).toBe(3);
    expect(new Set(all.map((p) => p.after.green)).size).toBeGreaterThan(1);
  });

  it('every applicable control has a claim: 557, 576 and 544 claims, ids unique and in control order', () => {
    for (const p of all) {
      expect(p.claims.length, p.id).toBe(p.totals.applicable);
      expect(new Set(p.claims.map((c) => c.id)).size, p.id).toBe(p.claims.length);
      const nums = p.claims.map((c) => Number(c.id.split('-')[1]));
      expect([...nums].sort((a, b) => a - b), p.id).toEqual(nums);
      expect(p.exclusions.length, p.id).toBe(p.totals.excluded);
      // an excluded control has no claim
      const have = new Set(p.claims.map((c) => c.id));
      for (const e of p.exclusions) expect(have.has(e.controlId), `${p.id} ${e.controlId}`).toBe(false);
      expect(p.claims.length + p.exclusions.length, p.id).toBe(p.totals.framework);
    }
  });

  it('the claims add up to the figures, exactly: states, credit, unauthored, the before-state', () => {
    for (const p of all) {
      const n = (s: string) => p.claims.filter((c) => c.state === s).length;
      expect([n('green'), n('yellow'), n('red'), n('unknown')], p.id).toEqual([p.after.green, p.after.yellow, p.after.red, p.after.unknown]);
      const credit = sum(p.claims.filter((c) => c.credit).map((c) => c.credit!));
      expect(eq(credit, p.after.creditNumerator), `${p.id} credit`).toBe(true);
      expect(p.claims.filter((c) => !c.authored).length, p.id).toBe(p.totals.applicable - p.after.views.authored_scope.applicable);
      const beforeKnown = p.claims.filter((c) => c.beforeVerdict);
      expect(beforeKnown.length, p.id).toBe(p.ruleR.beforeVerdicts);
      expect(beforeKnown.length, p.id).toBe(p.before.green + p.before.yellow + p.before.red);
      expect(p.before.green, p.id).toBe(0);
      // rule R: only testimony and documents exist before an upload
      for (const c of beforeKnown) expect(['testimony', 'document'], `${p.id} ${c.id}`).toContain(c.evidenceKind);
    }
  });

  it('the three width components sum exactly to the width, in both states and all four views, in every profile', () => {
    for (const p of all) {
      for (const when of ['before', 'after'] as const) {
        for (const v of VIEWS) {
          const f = p[when].views[v];
          const width = add(f.upper, [-f.lower[0], f.lower[1]]);
          expect(eq(add(add(f.width.unauthored, f.width.unevidenced), f.width.uncollectable), width), `${p.id} ${when} ${v}`).toBe(true);
          expect(toPct(f.lower), `${p.id} ${when} ${v}`).toBeLessThanOrEqual(toPct(f.upper));
        }
      }
    }
  });

  it('every Gap records its ground, and an absence-based Gap cites the module run that justifies it', () => {
    for (const p of all) {
      const gaps = p.claims.filter((c) => c.state === 'red');
      expect(gaps.length, p.id).toBe(p.after.red);
      for (const g of gaps) {
        expect(g.gapBasis, `${p.id} ${g.id}`).toBeDefined();
        expect(g.runId !== undefined, `${p.id} ${g.id}`).toBe(g.gapBasis === 'absence');
      }
    }
  });

  it('the CICSC boundary is the sector’s: the three goldens are three designated sectors, so all three apply it', () => {
    expect(all.map((p) => p.cicsc.sectorCode)).toEqual(['government_services', 'financial_and_banking', 'energy']);
    for (const p of all) {
      expect(p.cicsc.applies, p.id).toBe(true);
      expect(p.cicsc.basis, p.id).toBe('sector_designation');
    }
  });

  it('the engine’s own strings cross as data: the dual-standard label, check details, ranking descriptions', () => {
    for (const p of all) {
      expect(p.dual.label, p.id).toBe('coverage implied by mapping, not an assessment');
      for (const c of p.assurance.checks) expect(c.detail.length, `${p.id} ${c.cause}`).toBeGreaterThan(0);
      expect(p.ranking.items.length, p.id).toBeGreaterThan(0);
      for (const it of p.ranking.items) expect(it.description, `${p.id} ${it.controlId}`).toMatch(/\S/);
      expect(p.ranking.tieOrderNote, p.id).toMatch(/share a rank/);
    }
  });

  it('every profile’s assurance block reproduces its own level: L1, with its four checks listed', () => {
    for (const p of all) {
      expect(p.assurance.checks.map((c) => c.cause), p.id).toEqual(['declined_module', 'unresolved_profile_challenge', 'unusable_evidence_proportion', 'na_rate_above_baseline']);
      expect(p.assurance.reported, p.id).toBe('L1');
      expect(p.assurance.demotionsApplied, p.id).toBe(0);
    }
  });
});

describe('the screen shows the source hash', () => {
  it('the stamp carries the active profile’s file name and full SHA-256', () => {
    const { getByTestId } = render(<SourceStamp />);
    expect(getByTestId('source-file').textContent).toBe(PROFILES[activeProfileId()].source.file);
    expect(getByTestId('source-sha256').textContent).toBe(PROFILES[activeProfileId()].source.sha256);
    expect(getByTestId('source-sha256').textContent).toBe(CURRENT.source.sha256);
  });
  it('and it is on every screen, in the application shell', () => {
    const { getByTestId } = render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <App />
      </MemoryRouter>,
    );
    expect(getByTestId('source-sha256').textContent).toMatch(/^[0-9a-f]{64}$/);
  });
  it('and follows the active profile', () => {
    for (const id of PROFILE_ORDER) {
      setActiveProfile(id);
      const { getByTestId, unmount } = render(<SourceStamp />);
      expect(getByTestId('source-sha256').textContent, id).toBe(PROFILES[id].source.sha256);
      unmount();
    }
    setActiveProfile('ministry');
  });
});
