import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Send, Lock, Ban, FileText } from 'lucide-react';
import { Card, Pill } from '../components/ui';
import { Provenance } from '../components/Provenance';
import { useAssessment } from '../store/useAssessment';
import { dashboardView } from '../lib/derive';
import { assuranceMeasurement, assuranceReason, atOrAbove, levelDefinition, settledVerdicts } from '../lib/assurance';
import { controlById, controlText, EVIDENCE_CLASS_LABEL } from '../data/controls';
import { GAP_BASES, exampleGap, gapsByBasis, realGaps, topTie } from '../lib/narrative';

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

/** The interval the Dashboard shows, formatted for quoting. Same function, same inputs. */
function liveFigures(uploaded: boolean, overrides: Parameters<typeof dashboardView>[1]) {
  const e = dashboardView(uploaded, overrides).effective;
  return { lower: e.lowerPct.toFixed(1), upper: e.upperPct.toFixed(1), coverage: e.coveragePct.toFixed(1) };
}

function buildCanned(fig: ReturnType<typeof liveFigures>, uploaded: boolean): QA[] {
  const gaps = realGaps();
  const abs = exampleGap('absence');
  const obs = exampleGap('observed');
  const adm = exampleGap('testimonial_admission');
  const tie = topTie();
  const ids = (g: { id: string }[]) => g.map((x) => x.id).join(', ');
  const link = (id: string): Citation => ({ label: id, to: `/control/${id}` });
  const qas: QA[] = [];

  // What a control requires: the catalogue text the prototype holds, with the mappings it holds.
  const held = [abs, obs, adm].filter((g) => g && controlText(g.id))[0];
  if (held) {
    const c = controlById(held.id)!;
    qas.push({
      q: `What does ${held.id} require?`,
      a: `${held.id} requires that you: ${c.description!.charAt(0).toLowerCase()}${c.description!.slice(1)}.`,
      citations: [
        { ...link(held.id), passage: c.description },
        ...c.iso.map((ref, i) => ({ label: `ISO 27002 · ${ref}`, passage: c.isoNames[i] })),
        ...c.nist.map((ref, i) => ({ label: `NIST 800-53 · ${ref}`, passage: c.nistNames[i] })),
      ],
    });
  }

  if (uploaded) {
    qas.push({
      q: 'Which controls are Gaps?',
      grounded: true,
      a: `${gaps.length} controls are Gaps: ${ids(gaps)}. A Gap always records the ground it rests on: ${GAP_BASES.map((b) => `${gapsByBasis(b).length} on ${b.replace('_', ' ')} (${ids(gapsByBasis(b))})`).join('; ')}.`,
      citations: gaps.map((g) => link(g.id)),
    });
    if (abs) {
      qas.push({
        q: `Why is ${abs.id} a Gap?`,
        grounded: true,
        a: `${abs.id} rests on absence. The engine never infers a Gap from absence unless a signal that can show the negative came from a module that ran successfully; here that is the run "${abs.runId}", which succeeded and found nothing showing the control is met. The evidence class is ${EVIDENCE_CLASS_LABEL[abs.claim.evidenceClass].toLowerCase()}.`,
        citations: [link(abs.id), { label: `run: ${abs.runId}` }],
      });
    }
    if (obs) {
      const e = obs.claim.enforcement;
      qas.push({
        q: `Why is ${obs.id} a Gap?`,
        grounded: true,
        a: `${obs.id} rests on observation: an artifact shows the control unmet${e ? `, with the enforcement mode recorded as "${e.mode}"${e.basis ? ` (${e.basis})` : ''}` : ''}.${obs.claim.authored ? '' : ' It has no authored evidence path; it was established from an artifact the engine observed anyway.'}`,
        citations: [link(obs.id)],
      });
    }
    if (adm) {
      const t = adm.claim.contradicted?.[0];
      qas.push({
        q: 'Which Gap rests on an admission?',
        grounded: true,
        a: `${adm.id}. It is a Gap on the organisation\u2019s own statement of non-enforcement.${t ? ` The engine retained testimony that supported the control (a ${t.respondentRole}, ${t.sourceRef}) and records: ${t.contradictedBy}.` : ''} Testimony alone can never make a control Compliant, but a respondent\u2019s admission can make it a Gap.`,
        citations: [link(adm.id), ...(t ? [{ label: t.locator }] : [])],
      });
    }
    qas.push({
      q: 'Which Gaps would an attacker exploit first?',
      grounded: true,
      a: `The engine does not say, and the prototype will not guess. Exposure to ATT&CK techniques is an annotation, never a rank: a governance control would show none and be deprioritised for it. What the engine recorded for the ${gaps.length} Gaps: ${gaps.map((g) => (g.fix ? `${g.id} \u2014 ${g.fix.attack.exposure}${g.fix.attack.techniqueIds.length ? ` (${g.fix.attack.techniqueIds.join(', ')})` : ''}, ${g.fix.attack.suppressedCount} suppressed` : `${g.id} \u2014 no ranked fix`)).join('; ')}.`,
      citations: gaps.map((g) => link(g.id)),
    });
    if (tie) {
      qas.push({
        q: 'Which action comes first?',
        grounded: true,
        a: `${tie.size} actions share the highest rank, all of equal magnitude. The engine does not break a tie it cannot justify: ${tie.note}. ${tie.fixes.length} are fixes for Gaps (${ids(tie.fixes.map((f) => ({ id: f.controlId })))}) and ${tie.requests.length} are requests for evidence.`,
        citations: [{ label: 'Remediation', to: '/remediation' }],
      });
    }
  }

  qas.push(
    {
      q: "What's blocking L3 assurance?",
      grounded: true,
      a: `The level is not set by the best evidence collected: it is the highest level at which a disclosed share of the verdicts, ${assuranceMeasurement().thresholdPct}%, rest on evidence of at least that strength. After the evidence bundle the assessment is reported at ${assuranceMeasurement().level}: ${assuranceReason()} L3 would need ${assuranceMeasurement().thresholdPct}% of the verdicts analyst-signed; here that is ${atOrAbove('L3')} of ${settledVerdicts()}.`,
      citations: [{ label: 'Assurance ladder', to: '/dashboard', passage: `L3 \u2014 Analyst-signed: ${levelDefinition('L3')}` }],
    },
    {
      q: 'What is our compliance score?',
      a: `Your interval is ${fig.lower}\u2013${fig.upper}% at ${fig.coverage}% coverage \u2014 read from the assessment, not computed by me. The scoring engine is deterministic; I only retrieve. Open the dashboard for the breakdown.`,
      citations: [{ label: 'Dashboard \u00b7 Compliance interval', to: '/dashboard' }],
    },
    {
      q: 'Are we compliant enough to pass an NCSC audit?',
      refusal: true,
      a: "I can't predict a regulator's determination. I can show you what the assessment establishes and what it doesn't \u2014 the interval, the coverage, the unevidenced controls and the scope exclusions.",
      citations: [
        { label: 'Completeness statement', to: '/dashboard' },
        { label: 'Scope exclusions', to: '/exclusions' },
      ],
    },
    {
      q: 'Tell me about JNCSF-9999',
      refusal: true,
      a: 'No such control exists in the pinned catalogue (JNCSF-1 to JNCSF-576).',
      citations: [{ label: 'Pinned catalogue: JNCSF-1 \u2026 JNCSF-576' }],
    },
  );
  return qas;
}

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
  const uploaded = useAssessment((s) => s.evidenceUploaded);
  const overrides = useAssessment((s) => s.overriddenControls);
  // Answers are resolved at render time from the current state, so they move with it.
  const CANNED = buildCanned(liveFigures(uploaded, overrides), uploaded);
  const [thread, setThread] = useState<{ role: 'user' | 'bot'; q?: string; text?: string }[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const ask = (qa: QA) => {
    setThread((t) => [...t, { role: 'user', text: qa.q }, { role: 'bot', q: qa.q }]);
    setTimeout(() => scrollRef.current?.scrollTo({ top: 9e9, behavior: 'smooth' }), 50);
  };
  const asked = new Set(thread.filter((m) => m.role === 'user').map((m) => m.text));

  return (
    <Provenance tier="planned" className="flex h-[calc(100vh-140px)] flex-col">
      <Card className="flex min-h-0 flex-1 flex-col" title="Compliance chat" subtitle="Grounded Q&A over the pinned catalogue and this assessment — every answer carries citations">
        <div ref={scrollRef} className="scroll-slim min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
          {thread.length === 0 && <p className="text-sm text-slate-400">Pick a question below to start.</p>}
          {thread.map((m, i) => {
            const qa = m.role === 'bot' ? CANNED.find((c) => c.q === m.q) : undefined;
            return m.role === 'user' ? (
              <div key={i} className="flex justify-end">
                <div className="max-w-[80%] rounded-2xl bg-accent px-3.5 py-2 text-sm text-white">{m.text}</div>
              </div>
            ) : qa ? (
              <div key={i} className="flex justify-start">
                <div className={`max-w-[85%] rounded-2xl bg-slate-100 px-3.5 py-2.5 text-sm text-slate-800`}>
                  {qa.refusal && (
                    <div className="mb-1 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-red-600">
                      <Ban size={12} /> Won't answer — outside what the assessment establishes
                    </div>
                  )}
                  {qa.grounded && (
                    <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-emerald-700">
                      Grounded in your evidence
                    </div>
                  )}
                  <p>{qa.a}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {qa.citations.map((c) => <Chip key={c.label} c={c} />)}
                  </div>
                </div>
              </div>
            ) : null;
          })}
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
    </Provenance>
  );
}
