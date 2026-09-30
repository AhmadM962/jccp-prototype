import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Send, Lock, Ban, FileText } from 'lucide-react';
import { Card, Pill } from '../components/ui';

interface Citation {
  label: string;
  to?: string;
  /** retrieved passage revealed on click */
  passage?: string;
}
interface QA {
  q: string;
  a: string;
  refusal?: boolean;
  grounded?: boolean;
  citations: Citation[];
}

const CANNED: QA[] = [
  {
    q: 'What does JNCSF-102 require?',
    a: 'JNCSF-102 requires that access rights are managed consistent with the principle of least privilege — users and services hold only the permissions their role needs, privileged access is separated and regularly re-certified, and use of privileged utility programs is restricted and logged.',
    citations: [
      { label: 'JNCSF-102', to: '/control/JNCSF-102', passage: 'Manage access rights to be consistent with the principle of least privilege.' },
      { label: 'ISO 27002 · 9.2.3', passage: '9.2.3 Management of privileged access rights — allocation and use of privileged access rights shall be restricted and controlled.' },
      { label: 'NIST 800-53 · AC-6', passage: 'AC-6 Least Privilege — employ the principle of least privilege, allowing only authorized accesses for users which are necessary to accomplish assigned tasks.' },
    ],
  },
  {
    q: 'Why is JNCSF-102 a gap for us?',
    grounded: true,
    a: 'The Active Directory privileged-group export shows 43 of 512 privileged accounts with no MFA enforcement, and 102 of 512 endpoints have no reconciled EDR agent (71 contractor-managed). Machine evidence, not testimony, so the control is a Gap. This exposes you to T1078 Valid Accounts, T1548 Abuse Elevation Control Mechanism and T1021 Remote Services.',
    citations: [
      { label: 'JNCSF-102', to: '/control/JNCSF-102' },
      { label: 'raw/ad-privileged-groups.csv row 412', passage: 'SUMMARY: 512 privileged group members · 469 MFA-enforced · 43 without MFA · 6 stale (>90d no logon)' },
      { label: 'T1078', passage: 'Valid Accounts — adversaries obtain and abuse credentials of existing accounts.' },
      { label: 'T1548', passage: 'Abuse Elevation Control Mechanism — adversaries circumvent mechanisms designed to control elevated privileges.' },
      { label: 'T1021', passage: 'Remote Services — adversaries use valid accounts to log into remote services.' },
    ],
  },
  {
    q: "What's blocking L3 assurance?",
    grounded: true,
    a: 'Two things. The logging module failed at collection (wineventlog_access_denied), so its controls stay Unknown rather than being established — L3 requires every declared-estate module to succeed. And L3 requires an accredited assessor to review and sign the evidence set; no analyst sign-off has been recorded.',
    citations: [
      { label: 'Module ledger · logging', to: '/intake', passage: 'module=logging status=FAILED reason=wineventlog_access_denied' },
      { label: 'Assurance ladder', to: '/dashboard', passage: 'L3 — Analyst-signed: an accredited assessor has reviewed and signed the evidence set.' },
    ],
  },
  {
    q: 'Which gaps would an attacker exploit first?',
    grounded: true,
    a: 'JNCSF-307 (vulnerability scanning) is a Gap and maps to T1190 Exploit Public-Facing Application — the scan export shows 22 servers with overdue patches and 14 internet-facing services. That is the shortest path from outside. JNCSF-435 (MFA) is next: T1110 Brute Force against the 43 unprotected privileged accounts.',
    citations: [
      { label: 'JNCSF-307', to: '/control/JNCSF-307' },
      { label: 'T1190', passage: 'Exploit Public-Facing Application — adversaries exploit a weakness in an Internet-facing host or system.' },
      { label: 'JNCSF-435', to: '/control/JNCSF-435' },
    ],
  },
  {
    q: 'Which controls cover the 48-hour breach rule?',
    a: 'The 48-hour breach-notification obligation is supported by JNCSF-30 (audit records), JNCSF-252 (incident handling) and JNCSF-257 (user reporting within a defined period). The obligation itself derives from PDPL Art. 2023.',
    citations: [
      { label: 'JNCSF-30', to: '/control/JNCSF-30' },
      { label: 'JNCSF-252', to: '/control/JNCSF-252' },
      { label: 'JNCSF-257', to: '/control/JNCSF-257' },
      { label: 'PDPL Art. 2023', passage: 'Personal Data Protection Law — controllers must notify the Unit of a personal-data breach within 48 hours of becoming aware of it.' },
    ],
  },
  {
    q: 'What is our compliance score?',
    a: 'Your interval is 70.8–81.4% at 89.4% coverage — read from the assessment, not computed by me. The scoring engine is deterministic; I only retrieve. Open the dashboard for the breakdown.',
    citations: [{ label: 'Dashboard · Compliance interval', to: '/dashboard' }],
  },
  {
    q: 'Are we compliant enough to pass an NCSC audit?',
    refusal: true,
    a: "I can't predict a regulator's determination. I can show you what the assessment establishes and what it doesn't — the interval, the coverage, the unevidenced controls and the scope exclusions.",
    citations: [
      { label: 'Completeness statement', to: '/dashboard' },
      { label: 'Scope exclusions', to: '/exclusions' },
    ],
  },
  {
    q: 'Tell me about JNCSF-9999',
    refusal: true,
    a: 'No such control exists in the pinned catalogue (JNCSF-1 to JNCSF-576).',
    citations: [{ label: 'Pinned catalogue: JNCSF-1 … JNCSF-576' }],
  },
];

function Chip({ c }: { c: Citation }) {
  const [open, setOpen] = useState(false);
  const inner = <Pill tone="blue">{c.label}</Pill>;
  return (
    <span className="inline-block">
      {c.to ? (
        <Link to={c.to}>{inner}</Link>
      ) : c.passage ? (
        <button onClick={() => setOpen((v) => !v)}>{inner}</button>
      ) : (
        <Pill tone="slate">{c.label}</Pill>
      )}
      {open && c.passage && (
        <span className="mt-1 block rounded border border-slate-200 bg-white p-2 text-[11px] italic text-slate-600">
          <FileText size={10} className="mr-1 inline" />
          {c.passage}
        </span>
      )}
    </span>
  );
}

export default function Chat() {
  const [thread, setThread] = useState<{ role: 'user' | 'bot'; qa?: QA; text?: string }[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const ask = (qa: QA) => {
    setThread((t) => [...t, { role: 'user', text: qa.q }, { role: 'bot', qa }]);
    setTimeout(() => scrollRef.current?.scrollTo({ top: 9e9, behavior: 'smooth' }), 50);
  };
  const asked = new Set(thread.filter((m) => m.role === 'user').map((m) => m.text));

  return (
    <div className="flex h-[calc(100vh-140px)] flex-col">
      <Card className="flex min-h-0 flex-1 flex-col" title="Compliance chat" subtitle="Grounded Q&A over the pinned catalogue and this assessment — every answer carries citations">
        <div ref={scrollRef} className="scroll-slim min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
          {thread.length === 0 && <p className="text-sm text-slate-400">Pick a question below to start.</p>}
          {thread.map((m, i) =>
            m.role === 'user' ? (
              <div key={i} className="flex justify-end">
                <div className="max-w-[80%] rounded-2xl bg-accent px-3.5 py-2 text-sm text-white">{m.text}</div>
              </div>
            ) : (
              <div key={i} className="flex justify-start">
                <div className="max-w-[85%] rounded-2xl bg-slate-100 px-3.5 py-2.5 text-sm text-slate-800">
                  {m.qa?.refusal && (
                    <div className="mb-1 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-red-600">
                      <Ban size={12} /> Won't answer — outside what the assessment establishes
                    </div>
                  )}
                  {m.qa?.grounded && (
                    <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-emerald-700">
                      Grounded in your evidence
                    </div>
                  )}
                  <p>{m.qa?.a}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {m.qa?.citations.map((c) => <Chip key={c.label} c={c} />)}
                  </div>
                </div>
              </div>
            ),
          )}
        </div>

        <div className="mt-3 border-t border-slate-100 pt-3">
          <div className="mb-2 flex flex-wrap gap-2">
            {CANNED.map((qa) => (
              <button
                key={qa.q}
                onClick={() => ask(qa)}
                disabled={asked.has(qa.q)}
                className="rounded-full border border-slate-300 px-3 py-1.5 text-[12px] text-slate-600 transition hover:border-accent hover:text-accent disabled:opacity-40"
              >
                {qa.q}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-400">
            <Send size={14} />
            Free-text input is disabled in this demo — use the grounded prompts above.
          </div>
        </div>
      </Card>

      <div className="mt-3 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 rounded-lg bg-slate-800 px-3 py-2 text-center text-[11px] font-semibold text-slate-200">
        <span className="inline-flex items-center gap-1.5"><Lock size={12} /> On-premise · read-only</span>
        <span className="text-slate-500">cannot change control states</span>
        <span className="text-slate-500">cannot compute scores</span>
        <span className="text-slate-500">cannot access the internet</span>
        <span className="text-slate-500">cannot see other organisations' data</span>
      </div>
    </div>
  );
}
