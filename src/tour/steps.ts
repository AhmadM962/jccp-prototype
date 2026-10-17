// The guided-tour script. One ordered data structure — the tour engine reads this and
// nothing else. Language rule: no unexplained jargon; explain what a thing is before
// explaining what it does. Aim: a first-time policy/legal/executive reader understands the
// whole assessment journey in ~3 minutes.

import { CURRENT } from '../data/current';
import { TOTAL_CONTROLS } from '../data/figures';
import { toPct } from '../lib/frac';
import { assuranceMeasurement, assuranceReason } from '../lib/assurance';
import { unknownResolvedByUpload } from '../lib/coverage';
import { lazyByProfile } from '../lib/lazyByProfile';
import { exampleGap, gapsByBasis, roleSlug, testimonyWeighed, topTie } from '../lib/narrative';
import { planSummary, collectionLedger, REASON_WORDS } from '../lib/plan';

// Figures quoted in the narration come from the same numbers the screens use.
const fmt1 = (n: number) => n.toFixed(1);
export type TourAction =
  | { type: 'click'; target: string; wait?: number }
  | { type: 'clickSeq'; targets: string[]; wait?: number }
  | { type: 'wait'; ms: number };

export interface TourStep {
  id: string;
  act: string;
  /** navigate here first if the app isn't already on this path (may include ?query) */
  route?: string;
  /** data-tour id of the element to spotlight; omitted = centred card, no spotlight */
  target?: string;
  /** tried if `target` is missing */
  fallbackTarget?: string;
  title: string;
  body: string;
  /** run before the spotlight is placed (e.g. switch a tab, play the interview) */
  preAction?: TourAction;
  /** the step only advances when the visitor really clicks the target element */
  advanceOn?: 'click';
  /** overrides the default click instruction */
  clickInstruction?: string;
  /** how long to wait for the target to appear, ms (default 3500) */
  waitMs?: number;
  /** extra px around the spotlight cutout */
  pad?: number;
  /** the closing card */
  final?: boolean;
}

export const TOUR_STEPS: TourStep[] = lazyByProfile(() => {
  const BEFORE = CURRENT.before.views.unweighted;
  const AFTER = CURRENT.after.views.unweighted;
  const WIDTH_BEFORE = toPct([BEFORE.unknown, BEFORE.applicable]);
  const WIDTH_AFTER = toPct([AFTER.unknown, AFTER.applicable]);
  const UNAUTHORED_PTS = toPct(AFTER.width.unauthored);
  // The stories are told about the Gaps the engine established, one of each basis; no control is named that is not one.
  const absence = exampleGap('absence');
  const observed = exampleGap('observed');
  const admission = exampleGap('testimonial_admission');
  const nGaps = gapsByBasis('absence').length + gapsByBasis('observed').length + gapsByBasis('testimonial_admission').length;
  const tie = topTie();
  const sum = planSummary();
  // The tour reaches testimony before the upload, when only the verdicts that rest on testimony or documents exist.
  const weighed = testimonyWeighed(false).find((t) => t.basis === 'admission');
  const notProvided = collectionLedger().flatMap((r) => Object.entries(r.byReason));
  const reasons = new Map<string, number>();
  for (const [k, n] of notProvided) reasons.set(k, (reasons.get(k) ?? 0) + (n ?? 0));
  const reasonSummary = [...reasons.entries()].map(([k, n]) => `${n} ${REASON_WORDS[k as keyof typeof REASON_WORDS] ?? k}`).join(', ');
  const exposure = absence?.fix?.attack;
  return [
  // ─── Act 1 — Scoping ──────────────────────────────────────────────────────
  {
    id: 'where-we-are',
    act: 'Scoping',
    route: '/profile',
    target: 'page-title',
    fallbackTarget: 'profile-header',
    title: 'Where we are',
    body: `This is the starting point of an assessment. Before we can measure compliance, we have to work out which of the framework’s ${TOTAL_CONTROLS} controls actually apply to this organisation. Not all of them apply to everyone.`,
  },
  {
    id: 'who-we-assess',
    act: 'Scoping',
    route: '/profile',
    target: 'profile-identity',
    title: 'Who we are assessing',
    body: 'Tell the system what kind of organisation this is. Sector determines which regulator oversees this entity and which additional rules apply. Size tells the system how large the estate should be, so it can later tell a full survey apart from a small sample.',
  },
  {
    id: 'what-technology',
    act: 'Scoping',
    route: '/profile',
    target: 'profile-toggles',
    title: 'What technology they run',
    body: 'These are the five variables that actually gate anything in this framework — measured, not guessed: in-house development, outsourced development, mobile devices, wireless networks, remote access. An organisation that writes no software of its own isn’t meaningfully assessed against secure-coding controls. Each switch adds or removes a small, named group of controls; nothing else in the framework is conditional.',
  },
  {
    id: 'the-number',
    act: 'Scoping',
    route: '/profile',
    target: 'profile-applicable',
    title: 'The number that matters',
    body: `This is the denominator for everything that follows. ${CURRENT.totals.applicable} of ${CURRENT.totals.framework} controls apply here — the framework is 93% universal, so only the five variables below can move this number. Watch it change as switches are flipped — scoping is visible, not hidden. Under-scoping is the easiest way to inflate a compliance score, which is why the system records and publishes every exclusion.`,
  },
  {
    id: 'challenge',
    act: 'Scoping',
    route: '/profile',
    target: 'profile-cloud',
    title: 'The system challenges the answers',
    body: 'Declarations are treated as claims, not facts — even ones that don’t change the scope. “Uses cloud services” doesn’t gate any controls here; cloud is governed by a separate policy. But turning it off is still a claim worth checking. The system pushes back and asks for a written justification before allowing it — and later, if collected evidence contradicts the declaration, it blocks the assessment entirely.',
  },
  {
    id: 'move-on-1',
    act: 'Scoping',
    route: '/profile',
    target: 'profile-continue',
    title: 'Move on',
    body: 'Scoping is done. Next: what evidence do we need?',
    advanceOn: 'click',
    clickInstruction: 'Click “Continue to request plan” to move on',
  },

  // ─── Act 2 — Knowing what’s needed ────────────────────────────────────
  {
    id: 'plan-first',
    act: 'The evidence plan',
    route: '/request-plan',
    target: 'plan-header',
    title: 'The plan comes first',
    body: `The system says what it needs before collection starts. This answers the question every organisation asks: “how would I know what I’m missing?” The list is calculated from the ${CURRENT.totals.applicable} applicable controls — not written by hand.`,
  },
  {
    id: 'reading-a-row',
    act: 'The evidence plan',
    route: '/request-plan',
    target: 'plan-firstrow',
    fallbackTarget: 'plan-automated',
    title: 'Reading a row',
    body: 'Each row is one signal the evidence requirements name: a document the organisation supplies, or a state read from one of its systems. “Controls” is how many controls name it, and “Needed by” lists them. Rows are ordered by that count, so the evidence that serves the most controls comes first.',
  },
  {
    id: 'auto-manual',
    act: 'The evidence plan',
    route: '/request-plan',
    target: 'plan-collectors',
    fallbackTarget: 'plan-automated',
    title: 'Documents and systems',
    body: `${sum.documentary} of the ${sum.signals} signals are documents the organisation supplies; ${sum.fromSystems} are states read from its systems. For the system states, the organisation downloads a read-only script, runs it on its own systems, reviews the output, and uploads the result. The platform never connects to their network — which keeps this outside the licensing rules that govern cybersecurity services.`,
  },
  {
    id: 'move-on-2',
    act: 'The evidence plan',
    route: '/request-plan',
    target: 'nav-/intake',
    title: 'Move on',
    body: 'Now we go and gather the evidence.',
    advanceOn: 'click',
    clickInstruction: 'Click “Intake” in the sidebar',
  },

  // ─── Act 3 — Gathering ────────────────────────────────────────────────────
  {
    id: 'two-ways',
    act: 'Gathering evidence',
    route: '/intake',
    target: 'intake-tabs',
    title: 'Two ways in',
    body: 'Evidence arrives from two directions. “Interviews” capture what people know. “Evidence bundle” carries what machines can prove. Both are needed; only one of them can establish compliance.',
  },
  {
    id: 'three-interviews',
    act: 'Gathering evidence',
    route: '/intake',
    target: 'intake-roles',
    title: 'Who answered',
    body: 'The engine records who answered, by role, and what it did with each answer. A person’s account of how a system is configured is a claim, not a fact, so the engine keeps every answer, says what it did with it, and weighs it against the evidence.',
  },
  {
    id: 'testimony-weighed',
    act: 'Gathering evidence',
    route: '/intake',
    target: 'intake-transcript',
    preAction: weighed ? { type: 'click', target: `intake-role-${roleSlug(weighed.respondentRole)}`, wait: 500 } : undefined,
    title: 'Testimony is weighed, not counted',
    body: admission && weighed
      ? `${admission.id} is a Gap on the organisation’s own statement. A ${weighed.respondentRole}’s answer supported the control, and the engine records: ${weighed.contradictedBy}. The answer that supported it is kept on the record, not deleted; it just does not decide the outcome.`
      : 'Each answer the engine weighed is kept on the record with what it did with it. An answer that supports a control does not decide the outcome when the evidence goes the other way.',
  },
  {
    id: 'testimony-ceiling',
    act: 'Gathering evidence',
    route: '/intake',
    target: 'intake-testimony',
    fallbackTarget: 'intake-claims',
    title: 'Testimony has a ceiling',
    body: 'Nothing here can be marked compliant yet. A claim supported only by someone’s word is capped at “Partial”, however confidently it was said. Reaching “Compliant” requires machine-collected proof. This single rule is what separates this from a questionnaire.',
  },
  {
    id: 'upload',
    act: 'Gathering evidence',
    route: '/intake',
    target: 'bundle-upload',
    preAction: { type: 'click', target: 'intake-tab-bundle', wait: 400 },
    title: 'Upload the evidence',
    body: 'Now we add what the machines can prove. Click to simulate the organisation running the collector and uploading the result.',
    advanceOn: 'click',
    clickInstruction: 'Click “Simulate collector bundle upload”',
  },
  {
    id: 'module-ledger',
    act: 'Gathering evidence',
    route: '/intake',
    target: 'module-ledger',
    waitMs: 14000,
    title: 'Read the module ledger',
    body: `Notice that not everything was collected: ${sum.notProvided} of the ${sum.signals} signals were not provided (${reasonSummary || 'none'}). The ledger says so for each family of signals. This is deliberate, and it is the most important idea in the system: a module that failed proves nothing. Its controls stay “Unknown” — they are never recorded as failures. A permissions error must never manufacture a confident bad result.`,
  },
  {
    id: 'see-the-effect',
    act: 'Gathering evidence',
    route: '/intake',
    target: 'bundle-reveal',
    title: 'See the effect',
    body: 'The evidence is in. Let’s look at what it changed.',
    advanceOn: 'click',
    clickInstruction: 'Click “Reveal on dashboard”',
  },

  // ─── Act 4 — The result ───────────────────────────────────────────────────
  {
    id: 'never-one-number',
    act: 'The result',
    route: '/dashboard',
    target: 'dash-interval',
    title: 'Never one number',
    body: `Compliance is reported as a range, never a single percentage. The lower figure assumes every unestablished control fails. The upper assumes they all pass. The truth is somewhere between. The width of this band is exactly how much the assessment did not establish — before the evidence arrived it was ${fmt1(WIDTH_BEFORE)} points wide; now it is ${fmt1(WIDTH_AFTER)}. Most of what remains is the tool's own limitation: ${fmt1(UNAUTHORED_PTS)} of those points are controls it has no evidence requirement for yet.`,
  },
  {
    id: 'coverage',
    act: 'The result',
    route: '/dashboard',
    target: 'dash-coverage',
    title: 'Coverage',
    body: `How much was actually examined. ${AFTER.known} of ${AFTER.applicable} controls now have a verdict. The rest are Unknown, and the dashboard says whose limitation each part is: controls the tool has no evidence requirement for yet are the tool's; controls where evidence was not provided are the organisation's.`,
  },
  {
    id: 'assurance',
    act: 'The result',
    route: '/dashboard',
    target: 'dash-assurance',
    title: 'How the evidence was obtained',
    body: `Not all assessments are equally trustworthy, and the level is not raised by collecting evidence alone. It is the highest level at which a disclosed share of the verdicts rest on evidence of at least that strength. The collection succeeded and ${unknownResolvedByUpload().resolved} controls moved out of Unknown, yet the level stays at ${assuranceMeasurement().level}: ${assuranceReason()} This is what allows a regulator to compare two organisations’ submissions meaningfully.`,
  },
  {
    id: 'disclosure',
    act: 'The result',
    route: '/dashboard',
    target: 'dash-completeness',
    title: 'The disclosure that cannot be turned off',
    body: 'Every assessment states its own limits. How many controls were covered, how many were not established, how many are beyond the tool’s reach, and how many were excluded from scope. This box cannot be dismissed or hidden.',
  },
  {
    id: 'where-gaps',
    act: 'The result',
    route: '/dashboard',
    target: 'dash-capabilities',
    title: 'Where the gaps are',
    body: 'Two different problems, shown separately. A low score means known weakness. A wide band means we don’t yet know. They call for different responses — fix one, investigate the other.',
  },

  // ─── Act 5 — Proof and action ─────────────────────────────────────────────
  {
    id: 'go-gap-matrix',
    act: 'Proof and action',
    route: '/dashboard',
    target: 'nav-/gap-matrix',
    title: 'Go to the gap matrix',
    body: 'Let’s look at the individual controls.',
    advanceOn: 'click',
    clickInstruction: 'Click “Gap Matrix” in the sidebar',
  },
  {
    id: 'every-control',
    act: 'Proof and action',
    route: `/gap-matrix?cap=${absence?.claim.capability ?? 'del'}`,
    target: 'gm-filters',
    title: 'Every control, one state',
    body: 'Each control is Compliant, Partial, a Gap, Not Applicable, or Unknown. “Unknown” is a first-class result, not a blank. It means the assessment did not establish this — and it says why.',
  },
  {
    id: 'three-grounds',
    act: 'Proof and action',
    route: `/gap-matrix?cap=${absence?.claim.capability ?? 'del'}`,
    target: 'gm-filters',
    title: 'Three grounds for a Gap',
    body: `A Gap always says what it rests on, and the engine can record three grounds. Absence: a module that ran successfully could have shown the control met and did not${absence ? ` (${absence.id}, run “${absence.runId}”)` : ''}. Observation: an artifact shows it unmet${observed ? ` (${observed.id})` : ''}. An admission: the organisation’s own statement of non-enforcement${admission ? ` (${admission.id})` : ''}. In this assessment there are ${nGaps} Gaps: ${gapsByBasis('absence').length} on absence, ${gapsByBasis('observed').length} on observation, ${gapsByBasis('testimonial_admission').length} on an admission. The “Any gap basis” filter lists each kind. A Gap is never inferred from anything else.`,
  },
  {
    id: 'open-control',
    act: 'Proof and action',
    route: `/gap-matrix?cap=${absence?.claim.capability ?? 'del'}`,
    target: 'gm-row-tour',
    fallbackTarget: 'gm-filters',
    title: 'Open a control',
    body: 'Let’s see what a finding is actually built on.',
    advanceOn: 'click',
    clickInstruction: absence ? `Click the highlighted control (${absence.id})` : 'Open a control',
  },
  {
    id: 'evidence-trail',
    act: 'Proof and action',
    route: absence ? `/control/${absence.id}` : '/gap-matrix',
    target: 'cd-measured',
    title: 'What the finding is built on',
    body: absence
      ? `${absence.id} is a Gap on absence. The engine never infers a Gap from absence unless a module that ran successfully could have shown the opposite: here the run “${absence.runId}” succeeded and found nothing showing the control is met. Every value in this panel is read from the assessment file named at the top of the page, whose SHA-256 an auditor can check, so the original can be re-checked rather than the tool trusted.`
      : 'Every value in this panel is read from the assessment file named at the top of the page, whose SHA-256 an auditor can check.',
  },
  {
    id: 'attack',
    act: 'Proof and action',
    route: absence ? `/control/${absence.id}` : '/gap-matrix',
    target: 'cd-attack',
    fallbackTarget: 'cd-measured',
    title: 'What an attacker gains',
    body: exposure
      ? `A compliance gap can be translated into attack techniques, but only where the mapping is strong enough to show. For ${absence?.id} the engine recorded exposure “${exposure.exposure}”: ${exposure.techniqueIds.length} technique${exposure.techniqueIds.length === 1 ? '' : 's'} shown, ${exposure.suppressedCount} withheld by the engine, not counted as exposure. Only 35% of controls carry any mapping at all. Exposure is an annotation you read; it never ranks anything.`
      : 'A compliance gap can be translated into attack techniques, but only where the mapping is strong enough to show. Only 35% of controls carry any mapping at all. Exposure is an annotation you read; it never ranks anything.',
  },
  {
    id: 'go-remediation',
    act: 'Proof and action',
    route: absence ? `/control/${absence.id}` : '/gap-matrix',
    target: 'nav-/remediation',
    title: 'What to do about it',
    body: 'Finally: the plan of action.',
    advanceOn: 'click',
    clickInstruction: 'Click “Remediation & Requests” in the sidebar',
  },
  {
    id: 'ranked',
    act: 'Proof and action',
    route: '/remediation',
    target: 'rem-first',
    title: 'Ranked, and honest about ties',
    body: tie
      ? `${tie.size} actions share the highest rank, all of equal magnitude: ${tie.fixes.length} fixes for Gaps and ${tie.requests.length} requests for evidence. The engine’s own note: “${tie.note}”. It does not break a tie it cannot justify.`
      : 'The engine ranked no action for this assessment.',
  },
  {
    id: 'closing',
    act: 'Done',
    title: 'That’s the full journey',
    body: 'What you have just seen: scoping that is visible and challenged · evidence that must be proven, not claimed · a result that states its own uncertainty · findings traceable to source · and a ranking that admits its ties. Everything ran in your browser. Nothing is transmitted, and your progress is kept in this browser only.',
    final: true,
  },
];
}, 'array');

export const TOUR_TOTAL = TOUR_STEPS.length;
