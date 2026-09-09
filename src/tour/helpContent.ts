// Per-screen "What am I looking at?" text for the corner ? button. Three or four short
// sentences: what the screen is for, what the main numbers mean, what to do next.

export interface ScreenHelp {
  title: string;
  lines: string[];
}

// keyed by pathname prefix; longest match wins
export const SCREEN_HELP: Record<string, ScreenHelp> = {
  '/profile': {
    title: 'Organisation Profile',
    lines: [
      'This is where an assessment begins. You describe the organisation so the system can work out which of the framework’s 576 controls apply to it.',
      'The big number on the right is the count of applicable controls — the denominator for every result that follows.',
      'When you’re done, use “Continue to request plan”.',
    ],
  },
  '/request-plan': {
    title: 'Evidence Request Plan',
    lines: [
      'A list of the evidence the organisation needs to gather, calculated from the applicable controls — not written by hand.',
      'Each row is one file. “Controls” is how many controls that file would establish; rows are ordered so the most useful evidence is first.',
      'Most rows are collected by a read-only script the organisation runs itself; the rest are manual console exports.',
    ],
  },
  '/intake': {
    title: 'Intake',
    lines: [
      'Where evidence is gathered. “Interviews” capture what people say; “Evidence bundle” carries what machines can prove.',
      'Testimony from an interview can only reach “Partial”. Reaching “Compliant” needs machine-collected evidence.',
      'Use the “Evidence bundle” tab and “Simulate collector bundle upload” to see the assessment update.',
    ],
  },
  '/dashboard': {
    title: 'Compliance Dashboard',
    lines: [
      'The result. Compliance is shown as a range, never a single percentage — the band’s width is how much the assessment did not establish.',
      '“Coverage” is how much was examined. “Assurance level” is how trustworthy the evidence is (L1 documents, L2 machine-collected).',
      'The bordered “completeness statement” states the assessment’s own limits and cannot be hidden.',
    ],
  },
  '/gap-matrix': {
    title: 'Gap Matrix',
    lines: [
      'Every control, one at a time. Each is Compliant, Partial, a Gap, Not Applicable, or Unknown.',
      '“Unknown” means the assessment did not establish this — it is a real result, and each one says why.',
      'Click any control to see the evidence behind its state.',
    ],
  },
  '/control': {
    title: 'Control Detail',
    lines: [
      'One control, and everything the assessment knows about it.',
      'The “evidence trail” links every finding to the exact quote or file row, with a fingerprint an auditor can re-check.',
      'The “ATT&CK exposure” panel translates a gap into the specific attack techniques it leaves the organisation open to.',
    ],
  },
  '/remediation': {
    title: 'Remediation & Requests',
    lines: [
      'What to do next, ordered by value — how many controls each action closes.',
      '“What you didn’t provide” shows what each missing piece of evidence would tell you, as a range of outcomes.',
      'These are recommendations; nothing here changes the assessment.',
    ],
  },
  '/export': {
    title: 'OSCAL Export',
    lines: [
      'The package a regulator receives. It carries the compliance range and the assurance level inside it — not a bare number.',
      'It is cryptographically signed so a submission cannot be altered undetected.',
      'The “Catalog” model is a machine-readable copy of the whole framework, so every organisation is scored against the same version.',
    ],
  },
  '/exclusions': {
    title: 'Scope Exclusions',
    lines: [
      'The register of every control that was excluded from this assessment, and why.',
      'Excluding a control that should apply is the easiest way to inflate a score, so each exclusion is recorded and, where it lacks a justification, flagged.',
      'The rate is compared to a sector baseline.',
    ],
  },
  '/admin': {
    title: 'Roles & Access',
    lines: [
      'Who can see and do what. Use the “Viewing as” switch at the top right to try each role.',
      'Each access boundary implements a specific framework control — shown in the “Implements” column.',
      'The appliance administrator can run the box but cannot read a single assessment result.',
    ],
  },
  '/rollup': {
    title: 'National Rollup',
    lines: [
      'The regulator’s view across many organisations in a sector.',
      'Distribution is shown by the lower bound of each organisation’s compliance range, split by assurance level — so like is compared with like.',
      'Cells covering fewer than five organisations are suppressed so no single one can be identified.',
    ],
  },
  '/tasks': {
    title: 'My Tasks',
    lines: [
      'The view for a contributor who has been asked to provide one or two pieces of evidence.',
      'You see only your own submissions and their status — never the assessment result.',
      'Use “Submit” to mark a task done.',
    ],
  },
  '/chat': {
    title: 'Compliance Chat',
    lines: [
      'Ask questions about the framework and this assessment. Every answer carries a citation you can open.',
      'It retrieves and explains; it cannot change any control state or compute a score.',
      'Pick a question from the buttons to start.',
    ],
  },
};

export function helpFor(pathname: string): ScreenHelp {
  const keys = Object.keys(SCREEN_HELP).sort((a, b) => b.length - a.length);
  const match = keys.find((k) => pathname === k || pathname.startsWith(k + '/') || pathname.startsWith(k));
  return match ? SCREEN_HELP[match] : SCREEN_HELP['/profile'];
}
