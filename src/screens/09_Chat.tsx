import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Send, Lock, Ban } from 'lucide-react';
import { Card, Pill } from '../components/ui';

interface Citation {
  label: string;
  to?: string;
}
interface QA {
  q: string;
  a: string;
  refusal?: boolean;
  citations: Citation[];
}

const CANNED: QA[] = [
  {
    q: 'What does JNCSF-102 require?',
    a: 'JNCSF-102 requires that access rights are managed consistent with the principle of least privilege — users and services hold only the permissions their role needs, privileged access is separated and regularly re-certified, and use of privileged utility programs is restricted and logged.',
    citations: [
      { label: 'JNCSF-102', to: '/control/JNCSF-102' },
      { label: 'ISO 27002 · 9.2.3 Management of privileged access rights' },
      { label: 'ISO 27002 · 9.4.4 Use of privileged utility programs' },
      { label: 'NIST 800-53 · AC-6 Least Privilege' },
    ],
  },
  {
    q: 'Which controls cover the 48-hour breach rule?',
    a: 'The 48-hour breach-notification obligation is supported by the audit-generation, incident-handling and incident-reporting controls: JNCSF-30 (audit records), JNCSF-252 (incident handling capability) and JNCSF-257 (user reporting within a defined period). The obligation itself derives from PDPL Art. 2023.',
    citations: [
      { label: 'JNCSF-30', to: '/control/JNCSF-30' },
      { label: 'JNCSF-252', to: '/control/JNCSF-252' },
      { label: 'JNCSF-257', to: '/control/JNCSF-257' },
      { label: 'PDPL Art. 2023' },
    ],
  },
  {
    q: 'What evidence do I need for JNCSF-30?',
    a: 'For JNCSF-30 the engine needs: the audit policy configuration (auditpol /get /category:*), the SIEM log-source inventory showing which sources are forwarded, and the retention settings proving records are kept for the policy period.',
    citations: [
      { label: 'JNCSF-30', to: '/control/JNCSF-30' },
      { label: 'Request plan · Audit policy configuration', to: '/request-plan' },
      { label: 'Request plan · SIEM log source inventory', to: '/request-plan' },
    ],
  },
  {
    q: 'What is our compliance score?',
    refusal: true,
    a: "I'm read-only and don't compute scores. The scoring engine is deterministic — see the dashboard. I can explain what a control requires.",
    citations: [{ label: 'Dashboard · Compliance interval', to: '/dashboard' }],
  },
  {
    q: 'Tell me about JNCSF-9999',
    refusal: true,
    a: 'No such control exists in the pinned catalogue (JNCSF-1 to JNCSF-576).',
    citations: [{ label: 'Pinned catalogue: JNCSF-1 … JNCSF-576' }],
  },
];

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
      <Card className="flex min-h-0 flex-1 flex-col" title="Compliance chat" subtitle="Grounded Q&A over the pinned catalogue — every answer carries citations">
        <div ref={scrollRef} className="scroll-slim min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
          {thread.length === 0 && (
            <p className="text-sm text-slate-400">Pick a question below to start.</p>
          )}
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
                      <Ban size={12} /> Refused — grounding discipline
                    </div>
                  )}
                  <p>{m.qa?.a}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {m.qa?.citations.map((c) =>
                      c.to ? (
                        <Link key={c.label} to={c.to}>
                          <Pill tone="blue">{c.label}</Pill>
                        </Link>
                      ) : (
                        <Pill key={c.label} tone="slate">
                          {c.label}
                        </Pill>
                      ),
                    )}
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

      <div className="mt-3 flex items-center justify-center gap-1.5 rounded-lg bg-slate-800 px-3 py-2 text-[11px] font-semibold text-slate-200">
        <Lock size={12} /> On-premise · read-only · cannot modify the assessment
      </div>
    </div>
  );
}
