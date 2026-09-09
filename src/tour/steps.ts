// The guided-tour script. One ordered data structure — the tour engine reads this and
// nothing else. Language rule: no unexplained jargon; explain what a thing is before
// explaining what it does. Aim: a first-time policy/legal/executive reader understands the
// whole assessment journey in ~3 minutes.

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

export const TOUR_STEPS: TourStep[] = [
  // ─── Act 1 — Scoping ──────────────────────────────────────────────────────
  {
    id: 'where-we-are',
    act: 'Scoping',
    route: '/profile',
    target: 'page-title',
    fallbackTarget: 'profile-header',
    title: 'Where we are',
    body: 'This is the starting point of an assessment. Before we can measure compliance, we have to work out which of the framework’s 576 controls actually apply to this organisation. Not all of them apply to everyone.',
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
    body: 'These switches decide which controls are in scope. An organisation that writes no software of its own isn’t meaningfully assessed against secure-coding controls. Each switch adds or removes a group of controls.',
  },
  {
    id: 'the-number',
    act: 'Scoping',
    route: '/profile',
    target: 'profile-applicable',
    title: 'The number that matters',
    body: 'This is the denominator for everything that follows. 340 of 576 controls apply here. Watch it change as switches are flipped — scoping is visible, not hidden. Under-scoping is the easiest way to inflate a compliance score, which is why the system records and publishes every exclusion.',
  },
  {
    id: 'challenge',
    act: 'Scoping',
    route: '/profile',
    target: 'profile-cloud',
    title: 'The system challenges the answers',
    body: 'Declarations are treated as claims, not facts. Turning “uses cloud services” off would remove 23 controls from the assessment. The system pushes back and asks for a written justification before allowing it — and later, if collected evidence contradicts the declaration, it blocks the assessment entirely.',
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
    body: 'The system says what it needs before collection starts. This answers the question every organisation asks: “how would I know what I’m missing?” The list is calculated from the 340 applicable controls — not written by hand.',
  },
  {
    id: 'reading-a-row',
    act: 'The evidence plan',
    route: '/request-plan',
    target: 'plan-firstrow',
    fallbackTarget: 'plan-automated',
    title: 'Reading a row',
    body: 'Each row is one artefact the organisation must produce. “Controls” is how many controls this single file would establish. “Effort” is roughly how long it takes. “How to produce it” is the exact command to run. Rows are ordered by value, so the most useful evidence comes first.',
  },
  {
    id: 'auto-manual',
    act: 'The evidence plan',
    route: '/request-plan',
    target: 'plan-collectors',
    fallbackTarget: 'plan-automated',
    title: 'Automated vs manual',
    body: 'Most evidence is collected automatically. The organisation downloads a read-only script, runs it on its own systems, reviews the output, and uploads the result. The platform never connects to their network — which keeps this outside the licensing rules that govern cybersecurity services.',
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
    title: 'Why three separate interviews',
    body: 'Different people know different truths. Executives know what matters to the business. Operators know how systems are actually configured. Security staff know what is actually monitored. Asking one person all three questions produces a confident, wrong answer.',
  },
  {
    id: 'one-becomes-three',
    act: 'Gathering evidence',
    route: '/intake',
    target: 'intake-transcript',
    preAction: { type: 'clickSeq', targets: ['intake-role-operator', 'intake-play'] },
    title: 'One sentence becomes three findings',
    body: 'Watch what happens to a simple claim. “We run endpoint detection across the estate” sounds like one compliant control. After follow-up questions it becomes three separate findings: enforcing on servers, detect-only on workstations, and contractor machines with no agent at all.',
  },
  {
    id: 'testimony-ceiling',
    act: 'Gathering evidence',
    route: '/intake',
    target: 'intake-testimony',
    fallbackTarget: 'intake-claims',
    preAction: { type: 'click', target: 'intake-skip', wait: 500 },
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
    body: 'Notice that not everything worked. One module ran, one only reached 12 of 400 machines, one failed on permissions, one was declined. This is deliberate, and it is the most important idea in the system: a module that failed proves nothing. Its controls stay “Unknown” — they are never recorded as failures. A permissions error must never manufacture a confident bad result.',
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
    body: 'Compliance is reported as a range, never a single percentage. The lower figure assumes every unestablished control fails. The upper assumes they all pass. The truth is somewhere between. The width of this band is exactly how much the assessment did not establish — before the evidence arrived it was 37 points wide; now it is 10.6.',
  },
  {
    id: 'coverage',
    act: 'The result',
    route: '/dashboard',
    target: 'dash-coverage',
    title: 'Coverage',
    body: 'How much was actually examined. 304 of 340 controls now have evidence. The remainder splits into controls that could still be evidenced, and controls no supported method can ever reach — shown separately, because one is a to-do list and the other is a permanent limit.',
  },
  {
    id: 'assurance',
    act: 'The result',
    route: '/dashboard',
    target: 'dash-assurance',
    title: 'How the evidence was obtained',
    body: 'Not all assessments are equally trustworthy. “L1” means documents and interviews. “L2” means machine-collected evidence. This is what allows a regulator to compare two organisations’ submissions meaningfully — an 85% at L1 is a weaker statement than a 72% at L2.',
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
    route: '/gap-matrix?cap=del',
    target: 'gm-filters',
    title: 'Every control, one state',
    body: 'Each control is Compliant, Partial, a Gap, Not Applicable, or Unknown. “Unknown” is a first-class result, not a blank. It means the assessment did not establish this — and it says why.',
  },
  {
    id: 'open-control',
    act: 'Proof and action',
    route: '/gap-matrix?cap=del',
    target: 'gm-row-102',
    title: 'Open a control',
    body: 'Let’s see what a finding is actually built on.',
    advanceOn: 'click',
    clickInstruction: 'Click the highlighted control (JNCSF-102)',
  },
  {
    id: 'evidence-trail',
    act: 'Proof and action',
    route: '/control/JNCSF-102',
    target: 'cd-evidence',
    title: 'The evidence trail',
    body: 'This is what makes a finding defensible. Every claim links to the exact quote or the exact row of the exact file, with a cryptographic fingerprint. An auditor can re-check the original rather than trusting the tool.',
  },
  {
    id: 'attack',
    act: 'Proof and action',
    route: '/control/JNCSF-102',
    target: 'cd-attack',
    title: 'What an attacker gains',
    body: 'A compliance gap is translated into real-world risk. Because privileged accounts lack multi-factor authentication, this organisation is exposed to specific, named attack techniques. The mapping comes from the NCSC’s own published threat material.',
  },
  {
    id: 'go-remediation',
    act: 'Proof and action',
    route: '/control/JNCSF-102',
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
    title: 'Ranked by value',
    body: 'Actions ordered by how many controls each one closes. Fixing multi-factor authentication for 43 privileged accounts resolves 11 controls at once — and removes exposure to three named attack techniques.',
  },
  {
    id: 'closing',
    act: 'Done',
    title: 'That’s the full journey',
    body: 'What you have just seen: scoping that is visible and challenged · evidence that must be proven, not claimed · a result that states its own uncertainty · findings traceable to source · and a prioritised plan of action. Everything ran in your browser. No data was collected or transmitted.',
    final: true,
  },
];

export const TOUR_TOTAL = TOUR_STEPS.length;
