import { beforeEach, describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import * as ts from 'typescript';
import App from '../App';
import Authoring from '../screens/14_Authoring';
import { useAssessment, type Role } from '../store/useAssessment';
import { navForRole } from '../components/layout/nav';
import { CURRENT } from '../data/current';
import { controls, EVIDENCE_BASIS_BREAKDOWN, EVIDENCE_SIGNAL_TOTAL, NO_CONCLUSIVE_PATH_STATS } from '../data/controls';
import { EXCLUDED_COUNT, TOTAL_CONTROLS, APPLICABLE_CONTROLS } from '../data/figures';
import {
  AUTHORED_BY_CAPABILITY,
  AUTHORED_CONTROLS,
  AUTHORING,
  CAPABILITY_AUTHORING,
  REACH,
  SIGNALS_TOTAL,
  UNAUTHORED_CONTROLS,
} from '../data/authoring';
import { capabilities } from '../data/capabilities';

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem('jccp-tour-seen', '1');
  useAssessment.getState().resetDemo();
});

const screen = () =>
  render(
    <MemoryRouter>
      <Authoring />
    </MemoryRouter>,
  );
const appAt = (role: Role) => {
  useAssessment.setState({ role });
  return render(
    <MemoryRouter initialEntries={['/authoring']}>
      <App />
    </MemoryRouter>,
  );
};

describe('Task 5: the authoring figures (taken from the engine\'s reports, then cross-checked against each other)', () => {
  it('authored 66 of 576: 59 with a conclusive path, 7 indicative only; 510 unauthored', () => {
    expect(AUTHORED_CONTROLS).toBe(66);
    expect(TOTAL_CONTROLS).toBe(576);
    expect(AUTHORING.authoredConclusive).toBe(59);
    expect(AUTHORING.authoredIndicativeOnly).toBe(7);
    expect(AUTHORING.authoredConclusive + AUTHORING.authoredIndicativeOnly).toBe(AUTHORED_CONTROLS);
    expect(UNAUTHORED_CONTROLS).toBe(510);
  });
  it('signals 115 (70 machine-collected, 45 documentary), 38 negative-capable; 125 paths; queue 205', () => {
    expect(SIGNALS_TOTAL).toBe(115);
    expect([AUTHORING.signals.machineCollected, AUTHORING.signals.documentary]).toEqual([70, 45]);
    expect(AUTHORING.signals.negativeCapable).toBe(38);
    expect(AUTHORING.paths).toBe(125);
    expect(AUTHORING.queue).toBe(205);
  });
  it('reach: NIST 403, ISO 341, either 568 of 576 (98.6%), neither 8', () => {
    expect([REACH.nist, REACH.iso, REACH.either, REACH.neither]).toEqual([403, 341, 568, 8]);
    expect(REACH.either + REACH.neither).toBe(TOTAL_CONTROLS);
    expect(REACH.either_pct.toFixed(1)).toBe('98.6');
    // the partition counts every control exactly once
    const p = AUTHORING.reachPartition;
    expect(p.both + p.nistOnly + p.isoOnly + p.neither).toBe(TOTAL_CONTROLS);
  });
  it('documentary floor for the remainder: 325 to 359 new signals', () => {
    expect([AUTHORING.documentaryFloor.low, AUTHORING.documentaryFloor.high]).toEqual([325, 359]);
  });
  it('Delivery 44 of 44 is complete; Operations is 299 controls (52% of the framework) with 9 authored', () => {
    const by = Object.fromEntries(CAPABILITY_AUTHORING.map((c) => [c.id, c]));
    expect([by.del.authored, by.del.controls, by.del.complete]).toEqual([44, 44, true]);
    expect([by.ops.controls, by.ops.authored, by.ops.frameworkPct.toFixed(0)]).toEqual([299, 9, '52']);
    expect(CAPABILITY_AUTHORING.filter((c) => c.complete).map((c) => c.id)).toEqual(['del']);
  });
  it('the capability rows reconcile: controls 576, authored 66, unauthored 510', () => {
    expect(CAPABILITY_AUTHORING.reduce((n, c) => n + c.controls, 0)).toBe(TOTAL_CONTROLS);
    expect(CAPABILITY_AUTHORING.reduce((n, c) => n + c.authored, 0)).toBe(AUTHORED_CONTROLS);
    expect(CAPABILITY_AUTHORING.reduce((n, c) => n + c.unauthored, 0)).toBe(UNAUTHORED_CONTROLS);
    for (const c of CAPABILITY_AUTHORING) expect(c.controls, c.id).toBe(capabilities.find((x) => x.id === c.id)!.totalControls);
  });
  it('ties to the assessment: 510 unauthored across the framework is 492 that apply, of which 491 are Unknown and one has a verdict', () => {
    const scope = CURRENT.after.views.authored_scope.applicable;
    const unauthoredExcluded = EXCLUDED_COUNT - (AUTHORED_CONTROLS - scope); // one authored control is excluded
    expect(unauthoredExcluded).toBe(18);
    expect(UNAUTHORED_CONTROLS - unauthoredExcluded).toBe(APPLICABLE_CONTROLS - scope);
    expect(APPLICABLE_CONTROLS - scope).toBe(492);
    expect(492 - CURRENT.after.unknownUnauthored).toBe(1);
  });
  it('the ministry\'s authored counts per capability never exceed the framework\'s', () => {
    for (const id of Object.keys(AUTHORED_BY_CAPABILITY) as (keyof typeof AUTHORED_BY_CAPABILITY)[]) {
      expect(CURRENT.after.capabilities[id].authored, id).toBeLessThanOrEqual(AUTHORED_BY_CAPABILITY[id]);
    }
  });
  it('the sample never shows more authored controls in a capability than the framework has', () => {
    for (const id of Object.keys(AUTHORED_BY_CAPABILITY) as (keyof typeof AUTHORED_BY_CAPABILITY)[]) {
      const authored = controls.filter((c) => c.capability === id && c.authored).length;
      expect(authored, id).toBeLessThanOrEqual(CURRENT.after.capabilities[id].authored);
    }
  });
});

describe('Task 5: other places that state the same figures agree with this module', () => {
  it('the evidence-basis breakdown: 38 negative-capable + 45 + 31 + 1 = 115 (corrected from 68 / 31 / 15 / 1)', () => {
    const n = (b: string) => EVIDENCE_BASIS_BREAKDOWN.find((r) => r.basis === b)!.count;
    expect([n('negative_capable'), n('by_rule'), n('judgement'), n('uncertainty')]).toEqual([38, 45, 31, 1]);
    expect(EVIDENCE_BASIS_BREAKDOWN.reduce((a, r) => a + r.count, 0)).toBe(EVIDENCE_SIGNAL_TOTAL);
    expect(n('negative_capable')).toBe(AUTHORING.signals.negativeCapable);
  });
  it('the Dashboard\'s "7 of 66 authored controls have no conclusive path" uses the same counts', () => {
    expect(NO_CONCLUSIVE_PATH_STATS.authoredTotal).toBe(AUTHORED_CONTROLS);
    expect(NO_CONCLUSIVE_PATH_STATS.noPath).toBe(AUTHORING.authoredIndicativeOnly);
  });
});

describe('Task 5: the screen', () => {
  it('shows every figure', () => {
    const { container, getByTestId } = screen();
    expect(getByTestId('delivery-figure').textContent).toBe('44 of 44');
    expect(getByTestId('stat-authored').textContent).toContain('66');
    expect(getByTestId('stat-authored').textContent).toContain('of 576');
    expect(getByTestId('stat-authored').textContent).toContain('59');
    expect(getByTestId('stat-authored').textContent).toContain('7');
    expect(getByTestId('stat-unauthored').textContent).toContain('510');
    expect(getByTestId('stat-unauthored').textContent).toContain('492'); // apply to this organisation
    expect(getByTestId('stat-unauthored').textContent).toContain('491');
    expect(getByTestId('stat-signals').textContent).toContain('115');
    expect(getByTestId('stat-signals').textContent).toContain('70');
    expect(getByTestId('stat-signals').textContent).toContain('45');
    expect(getByTestId('stat-negative').textContent).toContain('38');
    expect(getByTestId('stat-paths').textContent).toContain('125');
    expect(getByTestId('stat-queue').textContent).toContain('205');
    expect(container.querySelector('[data-reach="nist"]')!.textContent).toBe('403');
    expect(container.querySelector('[data-reach="iso"]')!.textContent).toBe('341');
    expect(container.querySelector('[data-reach="either"]')!.textContent).toContain('568');
    expect(container.querySelector('[data-reach="either-pct"]')!.textContent).toBe('98.6%');
    expect(container.querySelector('[data-reach="neither"]')!.textContent).toBe('8');
    expect(getByTestId('floor').textContent).toContain('325–359');
    expect(container.querySelector('[data-capability="ops"]')!.textContent).toContain('299');
    expect(container.querySelector('[data-capability="ops"]')!.textContent).toContain('52%');
    expect(getByTestId('cap-total-controls').textContent).toBe('576');
    expect(getByTestId('cap-total-authored').textContent).toBe('66');
    expect(getByTestId('cap-total-unauthored').textContent).toBe('510');
  });

  it.each([
    [false, 'before'],
    [true, 'after'],
  ] as const)('the Delivery sentence quotes the Unknown counts of the state being viewed (%s upload)', (uploaded, when) => {
    useAssessment.setState({ evidenceUploaded: uploaded });
    const d = CURRENT[when].capabilities.del;
    const { getByTestId } = screen();
    const lead = getByTestId('authoring-lead').textContent ?? '';
    expect(lead).toContain(`has ${d.unknown} Unknown controls, and ${d.unknownUnauthored} of them are Unknown for want of a requirement`);
    expect(d.unknownUnauthored).toBe(0); // complete means none is the tool's
  });

  it('leads with Delivery 44 of 44, before any of the scale figures', () => {
    const { getByTestId } = screen();
    const lead = getByTestId('authoring-lead');
    expect(lead.textContent).toContain('44 of 44');
    expect(lead.textContent).toContain('complete');
    for (const id of ['stat-authored', 'stat-unauthored', 'stat-signals', 'floor']) {
      expect(lead.compareDocumentPosition(getByTestId(id)) & Node.DOCUMENT_POSITION_FOLLOWING, id).toBeTruthy();
    }
  });

  it('marks complete only the capability that is, in the table', () => {
    const { container } = screen();
    const flags = Array.from(container.querySelectorAll('[data-capability]')).map((r) => [r.getAttribute('data-capability'), r.getAttribute('data-complete')]);
    expect(flags).toEqual([['arch', 'false'], ['dev', 'false'], ['del', 'true'], ['ops', 'false'], ['found', 'false']]);
    expect(container.querySelectorAll('[data-capability][data-complete="true"]').length).toBe(1);
  });

  it('is tagged illustrative throughout', () => {
    const { container } = screen();
    const tiers = new Set(Array.from(container.querySelectorAll('[data-tier]')).map((e) => e.getAttribute('data-tier')));
    expect(Array.from(tiers)).toEqual(['illustrative']);
  });
});

describe('Task 5: who can open it', () => {
  it.each<[Role, boolean]>([
    ['owner', true],
    ['analyst', true],
    ['executive', false],
    ['regulator', false],
    ['contributor', false],
  ])('%s: sidebar entry and route allowed = %s', (role, allowed) => {
    expect(navForRole(role).some((n) => n.to === '/authoring'), `${role} nav`).toBe(allowed);
    const { queryByTestId, container } = appAt(role);
    expect(queryByTestId('authoring-lead') !== null, `${role} route`).toBe(allowed);
    if (allowed) expect(container.textContent).toContain('Authoring Coverage');
  });
});

describe('Task 5: the figures come from one module, not from literals in the screen', () => {
  const raw = import.meta.glob('/src/screens/14_Authoring.tsx', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;
  const src = Object.values(raw)[0];
  const FIGURES = ['576', '66', '59', '510', '115', '125', '403', '341', '568', '325', '359', '205', '299', '44', '38', '70', '45', '176', '227', '165', '98.6', '52'];

  it('contains none of the figures as a numeric literal, string literal or text', () => {
    const sf = ts.createSourceFile('14_Authoring.tsx', src, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    const found: string[] = [];
    const visit = (n: ts.Node) => {
      const text =
        ts.isNumericLiteral(n) ? n.text
        : ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n) || ts.isTemplateHead(n) || ts.isTemplateMiddle(n) || ts.isTemplateTail(n) ? n.text
        : ts.isJsxText(n) ? n.text
        : '';
      for (const m of text.matchAll(/\d+(?:\.\d+)?/g)) if (FIGURES.includes(m[0])) found.push(`${m[0]} in "${text.trim().slice(0, 40)}"`);
      ts.forEachChild(n, visit);
    };
    visit(sf);
    expect(found).toEqual([]);
  });
  it('imports them from the authoring module', () => {
    expect(src).toContain("from '../data/authoring'");
  });
});
