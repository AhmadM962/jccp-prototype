// Scripted interview content — use verbatim (brief §7.4).

export type Turn = { who: 'agent' | 'user'; text: string };

export interface ExtractedClaim {
  text: string;
  confidence: number;
  /** every testimonial claim is capped at Yellow — never Green */
  cappedAtYellow: true;
  relatedControls: string[];
  note?: string;
}

export interface InterviewRole {
  id: 'exec' | 'operator' | 'defender';
  title: string;
  persona: string;
  turns: Turn[];
  claims: ExtractedClaim[];
  /** shown for the operator when the CrowdStrike line lands (Coverage Fallacy) */
  coverageFallacy?: {
    naive: string;
    refined: string[];
  };
}

export const interviews: InterviewRole[] = [
  {
    id: 'operator',
    title: 'Infrastructure / Operator',
    persona: 'Estate operations lead',
    turns: [
      { who: 'agent', text: "Let's start with endpoint protection. Do you have endpoint detection deployed across the estate?" },
      { who: 'user', text: 'Yes, we run CrowdStrike across the estate.' },
      { who: 'agent', text: 'Is it configured to block, or is it detect-only?' },
      { who: 'user', text: "It blocks on servers. On workstations it's detect-only for now." },
      { who: 'agent', text: 'What share of workstations have the agent installed?' },
      { who: 'user', text: 'Around 80%.' },
      { who: 'agent', text: 'Are there populations excluded from deployment?' },
      { who: 'user', text: "Contractor machines don't have the agent." },
    ],
    coverageFallacy: {
      naive: 'Naive extraction: 1 compliant control',
      refined: [
        'Servers enforcing — block mode',
        'Workstations detect-only, ~80% installed',
        'Contractor machines — no agent',
        'Named exception retained for the assessment',
      ],
    },
    claims: [
      { text: 'EDR enforcing (block mode) on all servers', confidence: 0.82, cappedAtYellow: true, relatedControls: ['JNCSF-87', 'JNCSF-394'], note: 'Servers: enforcing' },
      { text: 'EDR on workstations is monitor-only, ~80% agent coverage', confidence: 0.71, cappedAtYellow: true, relatedControls: ['JNCSF-394'], note: 'Workstations: detect-only, 80%' },
      { text: 'Contractor-managed machines have no EDR agent (named exception)', confidence: 0.9, cappedAtYellow: true, relatedControls: ['JNCSF-394', 'JNCSF-102'], note: 'Exception population retained' },
    ],
  },
  {
    id: 'exec',
    title: 'Executive / Compliance',
    persona: 'Director of governance',
    turns: [
      { who: 'agent', text: 'Which systems would cause the most disruption if unavailable for a day?' },
      { who: 'user', text: 'The citizen services portal and the internal HR system.' },
      { who: 'agent', text: 'Do you hold data classified as sensitive under PDPL — health, biometric, financial, religious or political?' },
      { who: 'user', text: 'Yes, HR holds health records for medical leave.' },
      { who: 'agent', text: 'Noted. That brings the 48-hour breach-notification obligation into scope.' },
    ],
    claims: [
      { text: 'Crown-jewel systems: citizen services portal, internal HR system', confidence: 0.86, cappedAtYellow: true, relatedControls: ['JNCSF-225', 'JNCSF-252'] },
      { text: 'PDPL-sensitive health data held in HR (medical leave records)', confidence: 0.93, cappedAtYellow: true, relatedControls: ['JNCSF-25', 'JNCSF-382'], note: '48-hour breach-notification obligation now in scope' },
    ],
  },
  {
    id: 'defender',
    title: 'Defender / SOC',
    persona: 'SOC team lead',
    turns: [
      { who: 'agent', text: 'Which log sources are forwarded to your SIEM?' },
      { who: 'user', text: 'Domain controllers, firewalls, and the EDR console.' },
      { who: 'agent', text: 'Are all three alert-capable, or are some collected but not monitored?' },
      { who: 'user', text: "Firewall logs are collected but nobody has built alerts on them." },
    ],
    claims: [
      { text: 'SIEM ingests DC, firewall and EDR logs', confidence: 0.8, cappedAtYellow: true, relatedControls: ['JNCSF-167', 'JNCSF-173'] },
      { text: 'Firewall logs collected but not alerting — no use cases built', confidence: 0.88, cappedAtYellow: true, relatedControls: ['JNCSF-173', 'JNCSF-30'], note: 'Demotes related detection controls to Yellow' },
    ],
  },
];

export const interviewById = (id: string) => interviews.find((i) => i.id === id);
