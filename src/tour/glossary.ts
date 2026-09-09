// Shared plain-language glossary. Each term is defined once; <Term> renders a dotted
// underline + a hover/focus tooltip anywhere the word appears.

export interface GlossaryEntry {
  term: string;
  short: string;
}

export const GLOSSARY: Record<string, GlossaryEntry> = {
  'applicable controls': {
    term: 'Applicable controls',
    short: 'The controls that apply to this organisation, out of 576 in the framework.',
  },
  coverage: {
    term: 'Coverage',
    short: 'The share of applicable controls the assessment actually established.',
  },
  'compliance interval': {
    term: 'Compliance interval',
    short: 'The range within which true compliance must lie; the width is what remains unknown.',
  },
  'assurance level': {
    term: 'Assurance level',
    short: 'How the evidence was obtained: declared, documented, machine-collected, or analyst-signed.',
  },
  unknown: {
    term: 'Unknown',
    short: 'Not established either way — different from non-compliant.',
  },
  'not applicable': {
    term: 'Not applicable',
    short: 'Excluded because it doesn’t apply to this architecture; requires justification.',
  },
  'evidence class': {
    term: 'Evidence class',
    short: 'What kind of proof supports a claim; determines the highest state it can reach.',
  },
  'module ledger': {
    term: 'Module ledger',
    short: 'The record of which collection routines ran, failed, or were declined.',
  },
  jncsf: {
    term: 'JNCSF',
    short: 'The Jordan National Cybersecurity Framework: 576 controls across six capabilities.',
  },
  oscal: {
    term: 'OSCAL',
    short: 'An international machine-readable format for exchanging compliance results.',
  },
};

export const glossaryKey = (s: string) => s.trim().toLowerCase();
