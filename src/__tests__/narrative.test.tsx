import { beforeEach, describe, expect, it } from 'vitest';
import { act, fireEvent, render } from '@testing-library/react';
import type { ReactElement } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import Chat from '../screens/09_Chat';
import Dashboard from '../screens/04_Dashboard';
import GapMatrix from '../screens/05_GapMatrix';
import ControlDetail from '../screens/06_ControlDetail';
import Intake from '../screens/03_Intake';
import Profile from '../screens/01_Profile';
import RequestPlan from '../screens/02_RequestPlan';
import Remediation from '../screens/07_Remediation';
import Tasks from '../screens/12_Tasks';
import { TOUR_STEPS } from '../tour/steps';
import { useAssessment } from '../store/useAssessment';
import { PROFILES, PROFILE_ORDER, type ProfileId } from '../data/profiles';
import { CURRENT } from '../data/current';
import { controlById, controls } from '../data/controls';
import { capitalise, exampleGap, GAP_BASES, gapsByBasis, realGaps, respondentRoles, roleSlug, testimonyWeighed, topTie } from '../lib/narrative';
import { planSignals, planSummary, requestedSignals, collectionLedger } from '../lib/plan';
import { orgProfileFor } from '../data/orgProfiles';

const raw = import.meta.glob('/src/**/*.{ts,tsx}', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;

function renderAt(path: string, el: ReactElement, pattern = path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path={pattern} element={el} />
      </Routes>
    </MemoryRouter>,
  );
}
const pick = (id: ProfileId) => act(() => useAssessment.getState().selectProfile(id));
const idsIn = (text: string) => [...new Set(text.match(/JNCSF-\d+/g) ?? [])];
/** ids that are not controls being talked about: the refusal about a control that does not exist, and the catalogue's range */
const NOT_A_SUBJECT = new Set(['JNCSF-9999', 'JNCSF-1', 'JNCSF-576']);

beforeEach(() => {
  localStorage.clear();
  useAssessment.getState().resetDemo();
});

describe('the six Gaps are the narrative: one of every basis the engine can record', () => {
  it.each(PROFILE_ORDER)('%s: six Gaps, three on absence, two on observation, one on an admission', (id) => {
    pick(id);
    expect(realGaps().map((g) => g.id)).toEqual(['JNCSF-99', 'JNCSF-100', 'JNCSF-101', 'JNCSF-109', 'JNCSF-124', 'JNCSF-139']);
    expect(GAP_BASES.map((b) => gapsByBasis(b).length)).toEqual([3, 2, 1]);
    for (const g of gapsByBasis('absence')) expect(g.runId, g.id).toBeTruthy();
  });
});

describe('the example Gap for each basis is one whose control text the prototype holds, when any is', () => {
  it.each(PROFILE_ORDER)('%s', (id) => {
    pick(id);
    for (const b of GAP_BASES) {
      const gs = gapsByBasis(b);
      if (gs.some((g) => controlById(g.id)?.description)) expect(controlById(exampleGap(b)!.id)!.description, b).toBeTruthy();
    }
    expect(exampleGap('absence')!.id).toBe('JNCSF-100');
    expect(exampleGap('observed')!.id).toBe('JNCSF-139');
  });
});

describe('a story names a control only through the data: no control id is typed into narrative source', () => {
  const FILES = [
    '/src/tour/steps.ts',
    '/src/screens/09_Chat.tsx',
    '/src/screens/04_Dashboard.tsx',
    '/src/screens/03_Intake.tsx',
    '/src/screens/02_RequestPlan.tsx',
    '/src/screens/12_Tasks.tsx',
    '/src/lib/narrative.ts',
    '/src/lib/plan.ts',
  ];
  it('finds no literal JNCSF id in the narrative modules (the refusal about a control that does not exist excepted)', () => {
    const found: string[] = [];
    for (const f of FILES) for (const id of idsIn(raw[f] ?? '')) if (!NOT_A_SUBJECT.has(id)) found.push(`${f}: ${id}`);
    expect(found).toEqual([]);
  });
  it('and the invented story is gone from every source file: the EDR/MFA/privileged-account numbers, the collector counts', () => {
    const bad = /CrowdStrike|\bEDR\b|43 privileged|43 of 512|22 servers|12 of 400|1,842|3 of 9 audit|ad-privileged-groups|Top 3 risks/;
    const offenders = Object.entries(raw)
      .filter(([p]) => !p.startsWith('/src/__tests__/') && !p.startsWith('/src/data/profiles/'))
      .filter(([, t]) => bad.test(t))
      .map(([p]) => p);
    expect(offenders).toEqual([]);
  });
});

describe('every control id the tour, the Chat and the executive summary name is a Gap the engine established', () => {
  it.each(PROFILE_ORDER)('%s: tour text', (id) => {
    pick(id);
    const gaps = new Set(realGaps().map((g) => g.id));
    const text = TOUR_STEPS.map((s) => `${s.title} ${s.body} ${s.clickInstruction ?? ''} ${s.route ?? ''}`).join(' ');
    const named = idsIn(text);
    expect(named.length).toBeGreaterThan(0);
    for (const n of named) expect(gaps.has(n), `${id}: the tour names ${n}`).toBe(true);
  });

  it.each(PROFILE_ORDER)('%s: every Chat question and answer, before and after the upload', (id) => {
    pick(id);
    const gaps = new Set(realGaps().map((g) => g.id));
    for (const uploaded of [false, true]) {
      useAssessment.setState({ evidenceUploaded: uploaded });
      const c = renderAt('/chat', <Chat />);
      const buttons = Array.from(c.container.querySelectorAll('button')).filter((b) => b.className.includes('rounded-full'));
      for (const b of buttons) fireEvent.click(b);
      for (const n of idsIn(c.container.textContent ?? '')) {
        if (NOT_A_SUBJECT.has(n)) continue;
        expect(gaps.has(n), `${id} uploaded=${uploaded}: Chat names ${n}`).toBe(true);
      }
      c.unmount();
    }
  });

  it.each(PROFILE_ORDER)('%s: the executive summary and the Gap Matrix\'s tour row', (id) => {
    pick(id);
    useAssessment.setState({ evidenceUploaded: true, role: 'executive' });
    const d = renderAt('/dashboard', <Dashboard />);
    const gaps = new Set(realGaps().map((g) => g.id));
    for (const n of idsIn(d.getByTestId('prioritisation').textContent ?? '')) expect(gaps.has(n), `${id}: ${n}`).toBe(true);
  });
});

describe('the Chat answers what a control requires from the catalogue text it holds, citing the mappings it holds', () => {
  it('asks about a Gap whose text is held, and the answer is that text, with its ISO and NIST references', () => {
    const gap = exampleGap('absence')!;
    const c = controlById(gap.id)!;
    const chat = renderAt('/chat', <Chat />);
    fireEvent.click(chat.getByText(`What does ${gap.id} require?`, { selector: 'button' }));
    const text = chat.container.textContent ?? '';
    expect(text).toContain(c.description!.charAt(0).toLowerCase() + c.description!.slice(1));
    for (const ref of c.iso) expect(text).toContain(`ISO 27002 · ${ref}`);
    for (const ref of c.nist) expect(text).toContain(`NIST 800-53 · ${ref}`);
  });
});

describe('the Top-3 risks card is replaced by the fact that the top rank is a tie', () => {
  it.each(PROFILE_ORDER)('%s: the card says how many share the highest rank, and that the engine does not break the tie', (id) => {
    pick(id);
    useAssessment.setState({ evidenceUploaded: true, role: 'executive' });
    const tie = topTie()!;
    expect(tie.size).toBe(PROFILES[id].ranking.items.filter((i) => i.rank === 1).length);
    expect(tie.size).toBe({ ministry: 15, bank: 12, utility: 13 }[id]);
    const { getByTestId, container } = renderAt('/dashboard', <Dashboard />);
    const el = getByTestId('prioritisation');
    expect(el.getAttribute('data-tie-size')).toBe(String(tie.size));
    expect(el.textContent).toContain(`${tie.size} actions share the highest rank, all of equal magnitude. The engine does not break a tie it cannot justify.`);
    expect(el.textContent).toContain(capitalise(CURRENT.ranking.tieOrderNote));
    expect(container.textContent).not.toContain('Top 3 risks');
    expect(el.closest('[data-tier]')!.getAttribute('data-tier')).toBe('measured');
    expect(el.textContent).toContain(`${tie.fixes.length} ${tie.fixes.length === 1 ? 'is a fix' : 'are fixes'} for a Gap`);
    expect(el.textContent).toContain(`${tie.requests.length} ${tie.requests.length === 1 ? 'is a request' : 'are requests'} for evidence`);
    for (const f of tie.fixes) expect(el.textContent).toContain(f.controlId);
  });
  it('before the upload there is nothing to rank, and it says so', () => {
    useAssessment.setState({ role: 'executive' });
    const { getByTestId } = renderAt('/dashboard', <Dashboard />);
    expect(getByTestId('prioritisation').textContent).toBe('A ranking is derived from an assessment, so before one exists there is nothing to rank.');
  });
  it('the tour\'s "Ranked" step quotes the real tie group and the engine\'s own note', () => {
    const step = TOUR_STEPS.find((s) => s.id === 'ranked')!;
    const tie = topTie()!;
    expect(step.body).toContain(`${tie.size} actions share the highest rank`);
    expect(step.body).toContain(tie.note);
    expect(step.body).toContain(`${tie.fixes.length} fixes for Gaps and ${tie.requests.length} requests for evidence`);
  });
});

describe('the tour tells one Gap of every basis', () => {
  it.each(PROFILE_ORDER)('%s: the three-grounds step names an example of each basis and the real count of each', (id) => {
    pick(id);
    const step = TOUR_STEPS.find((s) => s.id === 'three-grounds')!;
    for (const b of GAP_BASES) expect(step.body, b).toContain(exampleGap(b)!.id);
    expect(step.body).toContain(`there are ${realGaps().length} Gaps: ${gapsByBasis('absence').length} on absence, ${gapsByBasis('observed').length} on observation, ${gapsByBasis('testimonial_admission').length} on an admission`);
    expect(new Set(idsIn(step.body)).size).toBe(3);
    expect(TOUR_STEPS.findIndex((s) => s.id === 'three-grounds')).toBe(TOUR_STEPS.findIndex((s) => s.id === 'every-control') + 1);
  });
});

describe('the tour points at things that exist', () => {
  it('the tour\'s Gap Matrix row is the absence Gap, in its capability, and its page carries the measured panel and the engine\'s exposure', () => {
    const gap = exampleGap('absence')!;
    const open = TOUR_STEPS.find((s) => s.id === 'open-control')!;
    expect(open.route).toBe(`/gap-matrix?cap=${gap.claim.capability}`);
    expect(open.clickInstruction).toContain(gap.id);
    const gm = renderAt(`/gap-matrix`, <GapMatrix />);
    const row = gm.container.querySelector('[data-tour="gm-row-tour"]');
    expect(row?.getAttribute('data-testid')).toBe(`control-row-${gap.id}`);
    gm.unmount();
    useAssessment.setState({ evidenceUploaded: true });
    const cd = renderAt(`/control/${gap.id}`, <ControlDetail />, '/control/:id');
    expect(cd.container.querySelector('[data-tour="cd-measured"]')).not.toBeNull();
    expect(cd.container.querySelector('[data-tour="cd-attack"]')).not.toBeNull();
    expect(TOUR_STEPS.find((s) => s.id === 'evidence-trail')!.body).toContain(gap.runId!);
  });
  it('the testimony step opens a respondent card that exists before the upload, and names the admission Gap', () => {
    const step = TOUR_STEPS.find((s) => s.id === 'testimony-weighed')!;
    const adm = exampleGap('testimonial_admission')!;
    expect(step.body).toContain(adm.id);
    expect(step.body).toContain(adm.claim.contradicted![0].contradictedBy);
    const target = (step.preAction as { target: string }).target;
    const { container } = renderAt('/intake', <Intake />);
    expect(container.querySelector(`[data-tour="${target}"]`)).not.toBeNull();
  });
  it('the Remediation tie group carries the tour target', () => {
    useAssessment.setState({ evidenceUploaded: true });
    const { container } = renderAt('/remediation', <Remediation />);
    expect(container.querySelector('[data-tour="rem-first"]')?.getAttribute('data-testid')).toBe('rank-group-1');
  });
});

describe('testimony: the respondents and what the engine did with their answers', () => {
  it('before the upload only the testimony behind a verdict that exists then has been weighed; after it, all', () => {
    const before = testimonyWeighed(false);
    const after = testimonyWeighed(true);
    expect(after.length).toBe(4);
    expect(before.map((t) => t.controlId)).toEqual(['JNCSF-109']);
    for (const t of before) expect(CURRENT.claims.find((c) => c.id === t.controlId)!.beforeVerdict).toBe(true);
    expect(respondentRoles(false)).toEqual(['compliance officer']);
    expect(respondentRoles(true).length).toBe(4);
  });
  it('before the upload the Intake shows the one respondent whose answer has been weighed, not the four', () => {
    const { container } = renderAt('/intake', <Intake />);
    expect(container.querySelectorAll('[data-testid^="respondent-"]').length).toBe(1);
    expect(container.querySelector('[data-testid="respondent-compliance-officer"]')).not.toBeNull();
    expect(container.querySelector('[data-testid="respondent-network-engineer"]')).toBeNull();
    // and what the engine did with the answers is only what it had done by then: one ground, one answer
    const rows = container.querySelectorAll('[data-testid="testimony-bases"] tbody tr');
    expect(rows.length).toBe(1);
    expect(rows[0].textContent).toContain('admission');
    expect(rows[0].textContent).toContain('JNCSF-109');
    expect(rows[0].textContent).not.toContain('JNCSF-99');
  });
  it('the Intake respondent view shows each answer with the engine\'s own outcome string, and the state of its control', () => {
    useAssessment.setState({ evidenceUploaded: true });
    const { container, getByTestId } = renderAt('/intake', <Intake />);
    for (const t of testimonyWeighed()) expect(container.querySelector(`[data-testid="respondent-${roleSlug(t.respondentRole)}"]`), t.respondentRole).not.toBeNull();
    fireEvent.click(getByTestId('respondent-systems-administrator'));
    const t = testimonyWeighed().find((x) => x.respondentRole === 'systems administrator')!;
    expect(getByTestId(`testimony-${t.controlId}`).textContent).toContain(capitalise(t.contradictedBy));
    expect(getByTestId(`testimony-${t.controlId}`).textContent).toContain(t.locator);
    expect(getByTestId('testimony-outcome').closest('[data-tier]')!.getAttribute('data-tier')).toBe('measured');
  });
  it('the disagreement banner is the engine\'s admission string, for the admission Gap', () => {
    useAssessment.setState({ evidenceUploaded: true });
    const { getByTestId } = renderAt('/intake', <Intake />);
    const adm = exampleGap('testimonial_admission')!;
    expect(getByTestId('testimony-conflict').textContent).toContain(adm.id);
    expect(getByTestId('testimony-conflict').textContent).toContain(adm.claim.contradicted![0].contradictedBy);
  });
  it('the one answer that is not about a Gap is shown with its measured state (Compliant), not hidden or dressed', () => {
    useAssessment.setState({ evidenceUploaded: true });
    const { getByTestId } = renderAt('/intake', <Intake />);
    fireEvent.click(getByTestId('respondent-service-desk-lead'));
    expect(getByTestId('testimony-JNCSF-95').textContent).toContain('Compliant');
  });
});

describe('the evidence plan is derived from the engine\'s coverage record', () => {
  it.each(PROFILE_ORDER)('%s: the required signals are exactly the provided and the not-provided, with nothing in both', (id) => {
    pick(id);
    const cov = PROFILES[id].coverage;
    const provided = new Set(cov.provided.map((p) => p[1]));
    const gapped = new Set(cov.gaps.map((g) => g.signalKey));
    expect([...provided].filter((s) => gapped.has(s))).toEqual([]);
    expect([...new Set([...provided, ...gapped])].sort()).toEqual([...cov.required].sort());
    const sigs = planSignals();
    expect(sigs.length).toBe(cov.required.length);
    expect(sigs.filter((s) => s.status === 'provided').length).toBe(provided.size);
    for (const s of sigs) expect(s.controls.length, s.signal).toBeGreaterThan(0);
  });

  it.each(PROFILE_ORDER)('%s: the signals are ordered by how many controls name them (the order the tour describes), and the ledger counts every one', (id) => {
    pick(id);
    const sigs = planSignals();
    for (let i = 1; i < sigs.length; i++) {
      const a = sigs[i - 1];
      const b = sigs[i];
      expect(a.controls.length > b.controls.length || (a.controls.length === b.controls.length && a.signal.localeCompare(b.signal) <= 0), `${a.signal} before ${b.signal}`).toBe(true);
    }
    const ledger = collectionLedger();
    expect(ledger.reduce((n, r) => n + r.required, 0)).toBe(sigs.length);
    for (const r of ledger) {
      const mine = sigs.filter((s) => s.family === r.family);
      expect(r.required, r.family).toBe(mine.length);
      expect(r.provided, r.family).toBe(mine.filter((s) => s.status === 'provided').length);
      for (const reason of new Set(mine.map((s) => s.status))) if (reason !== 'provided') expect(r.byReason[reason], `${r.family} ${reason}`).toBe(mine.filter((s) => s.status === reason).length);
    }
    expect(ledger.some((r) => Object.values(r.byReason).some((n) => (n ?? 0) > 1))).toBe(true); // the case the count must not collapse
  });

  it.each(PROFILE_ORDER)('%s: the artifacts Remediation asks for are in the plan, each with the controls that ask for it', (id) => {
    pick(id);
    const inPlan = new Map(planSignals().map((s) => [s.signal, s]));
    for (const it of PROFILES[id].ranking.items.filter((i) => i.actionType === 'evidence_request')) {
      for (const sig of it.signalsRequested) {
        expect(inPlan.has(sig), `${id}: ${sig}`).toBe(true);
        expect(inPlan.get(sig)!.controls, `${id}: ${sig}`).toContain(it.controlId);
        expect(inPlan.get(sig)!.status, `${id}: ${sig} is asked for, so it was not provided`).not.toBe('provided');
      }
    }
    expect([...requestedSignals()].every((s) => inPlan.has(s))).toBe(true);
  });

  it.each(PROFILE_ORDER)('%s: the summary is arithmetic on the data, and the controls it names are the authored scope', (id) => {
    pick(id);
    const sum = planSummary();
    const p = PROFILES[id];
    expect(sum.signals).toBe(p.coverage.required.length);
    expect(sum.documentary + sum.fromSystems).toBe(sum.signals);
    expect(sum.documentary).toBe(p.coverage.required.filter((s) => s.startsWith('document.')).length);
    expect(sum.authoredScope).toBe(p.after.views.authored_scope.applicable);
    expect(sum.unauthored).toBe(p.after.unknownUnauthored);
    expect(sum.provided + sum.notProvided).toBe(sum.signals);
    expect(sum.maxCoveragePct).toBe(+(((p.totals.applicable - p.after.unknownUnauthored) * 100) / p.totals.applicable).toFixed(1));
    expect(sum.controls).toBe(sum.authoredScope); // the plan names exactly the controls that have an authored evidence requirement
  });

  it('the Request Plan screen says what the data says, lists the signals, and shows no invented artifact', () => {
    const sum = planSummary();
    const { container, getByTestId } = renderAt('/request-plan', <RequestPlan />);
    expect(getByTestId('plan-headline').textContent).toBe(
      `To assess the ${sum.authoredScope} controls that have an authored evidence requirement, we need ${sum.signals} signals: ${sum.documentary} documents and ${sum.fromSystems} states read from systems.`,
    );
    expect(container.textContent).toContain('the plan cannot ask for anything that would establish that any of them is met. They stay Unknown unless an artifact collected for another control happens to show one unmet.');
    expect(container.textContent).toContain(`coverage can reach at most ${sum.maxCoveragePct}%`);
    for (const invented of ['All accounts + state', 'Linux hardening baseline', 'EDR agent inventory', 'Privileged group membership', 'Get-ADUser']) expect(container.textContent).not.toContain(invented);
    const first = planSignals().filter((s) => !s.documentary)[0];
    expect(getByTestId(`signal-${first.signal}`).getAttribute('data-controls')).toBe(String(first.controls.length));
    // before the upload, no status column; after, the engine's status for each signal
    expect(container.querySelector('[data-status="provided"]')).not.toBeNull(); // data attribute is present either way
    expect(container.textContent).not.toContain('After the upload');
  });

  it('after the upload each row carries the engine\'s reason, in the engine\'s words', () => {
    useAssessment.setState({ evidenceUploaded: true });
    const { container } = renderAt('/request-plan', <RequestPlan />);
    expect(container.textContent).toContain('After the upload');
    fireEvent.click(Array.from(container.querySelectorAll('button')).find((b) => /Show all/.test(b.textContent ?? '') && /^\s*Show all \d+/.test(b.textContent ?? ''))!);
    const notProvided = planSignals().filter((s) => s.status !== 'provided' && !s.documentary)[0];
    if (notProvided) expect(container.querySelector(`[data-testid="signal-${notProvided.signal}"]`)?.getAttribute('data-status')).toBe(notProvided.status);
  });

  it('the Contributor\'s tasks are the signals Remediation asks for, with the controls that ask, and no due dates or notes', () => {
    const { container, getByTestId } = renderAt('/tasks', <Tasks />);
    const asked = [...requestedSignals()];
    for (const s of asked) expect(container.querySelector(`[data-testid="task-${s}"]`), s).not.toBeNull();
    expect(container.querySelectorAll('[data-testid^="task-"]:not([data-testid="task-counts"])').length).toBe(asked.length);
    expect(container.textContent).not.toMatch(/due 2026|Retention column missing/);
    expect(getByTestId('task-counts').textContent).toContain(`${asked.length} to do`);
    fireEvent.click(container.querySelectorAll('button')[0]);
    expect(getByTestId('task-counts').textContent).toContain(`1 awaiting review`);
    expect(getByTestId('task-counts').textContent).toContain(`${asked.length - 1} to do`);
  });

  it('simulating the bundle provides exactly the signals the engine records as provided, and the ledger says why the rest were not', () => {
    const { container, getByText, getByTestId } = renderAt('/intake', <Intake />);
    fireEvent.click(getByText('Evidence bundle'));
    const sigs = planSignals();
    const provided = sigs.filter((s) => s.status === 'provided');
    expect(container.textContent).toContain(`0 of ${sigs.length} signals provided`);
    expect(container.textContent).toContain(`provides ${provided.length}`);
    fireEvent.click(getByText(/Simulate collector bundle upload/));
    return new Promise<void>((resolve) => {
      const check = () => {
        if (!container.querySelector('[data-testid="collection-ledger"]')) return setTimeout(check, 100);
        expect(Object.keys(useAssessment.getState().uploadedSlots).length).toBe(provided.length);
        expect(container.textContent).toContain(`${provided.length} of ${sigs.length} signals provided`);
        for (const r of collectionLedger()) {
          const row = getByTestId(`ledger-${r.family}`);
          const status = row.getAttribute('data-status');
          const expected = r.provided === r.required ? 'complete' : r.byReason.module_failed ? 'failed' : r.provided === 0 && r.byReason.declined === r.required ? 'declined' : 'partial';
          expect(status, r.family).toBe(expected);
        }
        expect(container.textContent).toContain('Collection failed for');
        resolve();
      };
      check();
    });
  }, 15000);
});

describe('the Gap Matrix says once that the catalogue lives in the engine, and every row still carries what the engine knows', () => {
  it('one note at the top, none on any row, and the id, capability, state and reason on each', () => {
    useAssessment.setState({ evidenceUploaded: true });
    const { container, getAllByTestId } = renderAt('/gap-matrix?cap=ops', <GapMatrix />, '/gap-matrix');
    const note = container.querySelectorAll('[data-testid="matrix-catalogue-note"]');
    expect(note.length).toBe(1);
    expect(note[0].textContent).toContain('The control catalogue lives in the assessment engine, and this prototype does not need it to show you a verdict or the reasoning behind one.');
    expect(note[0].textContent).toContain(`${controls().filter((c) => c.description).length} of ${controls().length}`);
    expect(container.textContent).not.toContain('Control text is not held in this prototype');
    const rows = container.querySelectorAll('[data-testid^="control-row-"]');
    expect(rows.length).toBeGreaterThan(100);
    for (const r of Array.from(rows)) {
      expect(r.getAttribute('data-capability')).toBeTruthy();
      expect(r.textContent).toContain('Operations');
      expect(r.getAttribute('data-state')).toBeTruthy();
      expect(r.textContent).toContain(r.getAttribute('data-testid')!.replace('control-row-', ''));
    }
    expect(getAllByTestId('matrix-catalogue-note')).toHaveLength(1);
  });
});

describe('an applicability variable the data does not record is shown as what it is', () => {
  it.each(PROFILE_ORDER)('%s: each variable no exclusion names says "in scope — not recorded as declined", and none is a declared Yes', (id) => {
    pick(id);
    const org = orgProfileFor(id);
    const unrecorded = [org.inHouseDevelopment, org.outsourcedDevelopment, org.mobileDevices, org.wirelessNetwork, org.remoteAccess].filter((v) => v === 'unrecorded').length;
    const declinedNo = new Set(PROFILES[id].exclusions.map((e) => e.triggeringFlag)).size;
    expect(unrecorded + declinedNo).toBe(5);
    const { getAllByTestId, queryAllByTestId, container } = renderAt('/profile', <Profile />);
    const pills = queryAllByTestId('unrecorded');
    expect(pills.length).toBe(unrecorded);
    for (const p of pills) expect(p.textContent).toBe('in scope — not recorded as declined');
    // a toggle with the note has no active Yes button: the data carries no declaration of yes
    const toggles = Array.from(container.querySelectorAll('[data-tour="profile-toggles"] > div')).slice(0, 5);
    for (const t of toggles) {
      if (!t.querySelector('[data-testid="unrecorded"]')) continue;
      const yes = Array.from(t.querySelectorAll('button')).find((b) => b.textContent === 'Yes')!;
      expect(yes.className).not.toContain('bg-accent');
    }
    expect(getAllByTestId(`select-profile-${id}`).length).toBe(1);
  });
  it('choosing Yes records a declaration, and the note goes', () => {
    const { container, queryAllByTestId } = renderAt('/profile', <Profile />);
    const before = queryAllByTestId('unrecorded').length;
    const toggle = Array.from(container.querySelectorAll('[data-tour="profile-toggles"] > div')).find((t) => t.querySelector('[data-testid="unrecorded"]'))!;
    fireEvent.click(Array.from(toggle.querySelectorAll('button')).find((b) => b.textContent === 'Yes')!);
    expect(queryAllByTestId('unrecorded').length).toBe(before - 1);
  });
});
