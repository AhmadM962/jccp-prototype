import { useEffect, useMemo, useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, AlertTriangle, XCircle, Ban, UploadCloud, ArrowRight, ShieldQuestion, Link2, Upload, KeyRound } from 'lucide-react';
import { Card, Button, Pill } from '../components/ui';
import { Provenance, StateProvenance } from '../components/Provenance';
import StateBadge from '../components/StateBadge';
import { useAssessment } from '../store/useAssessment';
import { scopedLinkFor, type ScopedLink } from '../data/collaboration';
import { movedOutOfUnknown, outsideScopeSentence, unknownResolvedByUpload } from '../lib/coverage';
import { assuranceMeasurement } from '../lib/assurance';
import { CURRENT } from '../data/current';
import { viewPercents } from '../lib/views';
import { planSignals, collectionLedger, REASON_WORDS, type FamilyRow } from '../lib/plan';
import CollectorTranscript from '../components/CollectorTranscript';
import { capitalise, respondentRoles, roleSlug, stanceWords, testimonyWeighed, type Testimony } from '../lib/narrative';

/* ─── Tab A: Testimony ──────────────────────────────────────────────────────── */

/** The answers one respondent role gave that the engine weighed, and what it did with each. The assessment file holds the
 *  engine's record of an answer (where it sits, what it claimed, the outcome); the transcript itself is not in it. */
function TestimonyPanel({ role, items, uploaded }: { role: string; items: Testimony[]; uploaded: boolean }) {
  return (
    <StateProvenance uploaded={uploaded} from="claims">
      <Card
        title={capitalise(role)}
        subtitle={`${items.length} answer${items.length === 1 ? '' : 's'} the engine weighed against the evidence`}
      >
        <div data-tour="intake-transcript" className="space-y-3">
          {items.map((t, i) => (
            <motion.div
              key={t.sourceRef + t.controlId}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              data-testid={`testimony-${t.controlId}`}
              data-tour={i === 0 ? 'intake-testimony' : undefined}
              className="rounded-lg border border-slate-200 p-3"
            >
              <div className="flex flex-wrap items-center gap-2">
                <RouterLink to={`/control/${t.controlId}`} className="font-mono text-[12px] font-semibold text-accent hover:underline">{t.controlId}</RouterLink>
                <StateBadge state={t.state} size="sm" />
                <Pill tone="amber">testimony {stanceWords(t.stance)}</Pill>
                <span className="font-mono text-[11px] text-slate-400">{t.signalKey}</span>
              </div>
              <p data-testid="testimony-outcome" className="mt-2 text-[13px] text-slate-800">{capitalise(t.contradictedBy)}.</p>
              <p className="mt-1 font-mono text-[11px] text-slate-400">
                {t.basis} · {t.locator}
              </p>
            </motion.div>
          ))}
        </div>
        <p className="mt-3 text-[11px] text-slate-500">
          The transcript is not in the assessment file. The engine records where each answer sits (the locator) and what it did with it; testimony alone never makes a
          control Compliant, and an answer that supports a control is kept even when the evidence goes against it.
        </p>
      </Card>
    </StateProvenance>
  );
}

/** What the engine did with the answers it weighed, by the ground it recorded. */
function WhatTheEngineDid({ all, uploaded }: { all: Testimony[]; uploaded: boolean }) {
  const byBasis = [...new Set(all.map((t) => t.basis))].map((b) => ({ basis: b, items: all.filter((t) => t.basis === b) }));
  return (
    <StateProvenance uploaded={uploaded} from="claims">
      <Card title="What the engine did with the answers" subtitle="by the ground it recorded">
        <div className="overflow-x-auto">
          <table data-testid="testimony-bases" className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-[11px] uppercase tracking-wide text-slate-400">
                <th className="py-2 pr-4">Ground</th>
                <th className="py-2 pr-4 text-right">Answers</th>
                <th className="py-2">Controls</th>
              </tr>
            </thead>
            <tbody>
              {byBasis.map((b) => (
                <tr key={b.basis} className="border-b border-slate-100">
                  <td className="py-2.5 pr-4 font-mono text-xs font-semibold text-slate-700">{b.basis}</td>
                  <td className="py-2.5 pr-4 text-right tnum">{b.items.length}</td>
                  <td className="py-2.5">
                    <div className="flex flex-wrap items-center gap-2">
                      {b.items.map((t) => (
                        <span key={t.controlId + t.sourceRef} className="inline-flex items-center gap-1">
                          <RouterLink to={`/control/${t.controlId}`} className="font-mono text-[11px] text-accent hover:underline">{t.controlId}</RouterLink>
                          <StateBadge state={t.state} size="sm" showLabel={false} />
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
              {byBasis.length === 0 && (
                <tr>
                  <td colSpan={3} className="py-2.5 text-[12px] text-slate-500">The engine recorded no answer it had to weigh against the evidence in this assessment.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </StateProvenance>
  );
}

/* ─── Tab B: Evidence bundle ────────────────────────────────────────────────── */

const ledgerStatus = (r: FamilyRow): { tone: 'green' | 'amber' | 'red' | 'slate'; label: string } => {
  if (r.provided === r.required) return { tone: 'green', label: 'complete' };
  if (r.byReason.module_failed) return { tone: 'red', label: 'failed' };
  if (r.provided === 0 && r.byReason.declined === r.required) return { tone: 'slate', label: 'declined' };
  return { tone: 'amber', label: 'partial' };
};

function BundlePanel() {
  const navigate = useNavigate();
  const uploadEvidence = useAssessment((s) => s.uploadEvidence);
  const uploaded = useAssessment((s) => s.evidenceUploaded);
  const uploadedSlots = useAssessment((s) => s.uploadedSlots);
  const uploadSlot = useAssessment((s) => s.uploadSlot);
  const uploadSlotsBulk = useAssessment((s) => s.uploadSlotsBulk);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(uploaded);
  const [lastFeedback, setLastFeedback] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  const slots = useMemo(() => planSignals(), []);
  const providedByBundle = slots.filter((s) => s.status === 'provided');

  const run = () => {
    uploadSlotsBulk(providedByBundle.map((s) => s.signal));
    setRunning(true);
  };

  useEffect(() => {
    if (!running) return;
    const t = setTimeout(() => {
      setDone(true);
      uploadEvidence();
    }, 600);
    return () => clearTimeout(t);
  }, [running, uploadEvidence]);

  const filled = slots.filter((s) => uploadedSlots[s.signal]).length;
  const pending = slots.filter((s) => !uploadedSlots[s.signal]);
  const shown = showAll ? pending : pending.slice(0, 12);
  const fmt1 = (n: number) => n.toFixed(1);
  const viewsBefore = viewPercents(CURRENT.before.views.unweighted);
  const viewsAfter = viewPercents(CURRENT.after.views.unweighted);
  const assurance = assuranceMeasurement();
  const ledger = collectionLedger();
  const failed = ledger.filter((r) => r.byReason.module_failed);

  return (
    <div className="space-y-5">
      <StateProvenance uploaded={uploaded} from="coverage">
        <Card
          title="Evidence intake"
          subtitle={`${filled} of ${slots.length} signals provided`}
          right={
            <Provenance tier="planned" as="span" className="inline-block">
              <Button dataTour="bundle-upload" onClick={run} disabled={running && !done}>
                <UploadCloud size={13} /> {done ? 'Bundle processed' : `Simulate collector bundle upload (provides ${providedByBundle.length})`}
              </Button>
            </Provenance>
          }
        >
          {lastFeedback && <div className="mb-3 rounded-lg bg-emerald-50 px-3 py-2 text-[12px] text-emerald-800">{lastFeedback}</div>}
          <div data-testid="intake-slots" className="grid gap-2 sm:grid-cols-2">
            {shown.map((s) => (
              <div key={s.signal} data-testid={`slot-${s.signal}`} className="rounded-lg border border-slate-200 px-3 py-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="truncate font-mono text-[12px] font-medium text-slate-800">{s.signal}</div>
                    <div className="text-[11px] text-slate-400">
                      named by {s.controls.length} control{s.controls.length === 1 ? '' : 's'}
                      {done && s.status !== 'provided' && <> · <span className="text-orange-700">{REASON_WORDS[s.status] ?? s.status}</span></>}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      uploadSlot(s.signal);
                      setLastFeedback(`${s.signal} accepted: ${s.controls.length} control${s.controls.length === 1 ? '' : 's'} name it in their evidence requirement.`);
                    }}
                    className="inline-flex shrink-0 items-center gap-1 rounded-md border border-slate-300 px-2 py-1 text-[11px] font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    <Upload size={10} /> Upload
                  </button>
                </div>
              </div>
            ))}
          </div>
          {pending.length > 12 && (
            <button onClick={() => setShowAll((v) => !v)} className="mt-2 text-xs font-semibold text-accent hover:underline">
              {showAll ? 'Show fewer' : `Show all ${pending.length} signals not yet provided`}
            </button>
          )}
          {pending.length === 0 && <p className="text-[12px] text-slate-500">Every signal the plan asks for has been provided.</p>}
          <div className="mt-3 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-2 text-[11px] text-slate-500">
            Other evidence — drop anything not listed above. Simulated; no file is parsed.
          </div>
        </Card>
      </StateProvenance>

      <CollectorTranscript />

      {done && (
        <>
          <StateProvenance uploaded={uploaded} from="coverage">
            <Card dataTour="module-ledger" title="Collection ledger" subtitle="how the collection went, by signal family">
              <div className="overflow-x-auto">
                <table data-testid="collection-ledger" className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-left text-[11px] uppercase tracking-wide text-slate-400">
                      <th className="py-2 pr-4">Family</th>
                      <th className="py-2 pr-4">Status</th>
                      <th className="py-2 pr-4 text-right">Provided</th>
                      <th className="py-2">Not provided</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ledger.map((r) => {
                      const st = ledgerStatus(r);
                      return (
                        <tr key={r.family} data-testid={`ledger-${r.family}`} data-status={st.label} className="border-b border-slate-100">
                          <td className="py-2.5 pr-4 font-mono text-xs font-semibold text-slate-700">{r.family}</td>
                          <td className="py-2.5 pr-4">
                            <Pill tone={st.tone}>{st.label}</Pill>
                          </td>
                          <td className="py-2.5 pr-4 text-right tnum text-slate-700">{r.provided} of {r.required}</td>
                          <td className="py-2.5 text-slate-600">
                            {Object.entries(r.byReason).length === 0
                              ? <span className="text-slate-400">—</span>
                              : Object.entries(r.byReason).map(([k, n]) => `${n} ${REASON_WORDS[k as keyof typeof REASON_WORDS] ?? k}`).join(' · ')}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="mt-3 flex items-start gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-[12px] text-slate-700">
                <ShieldQuestion size={15} className="mt-0.5 shrink-0 text-slate-400" />
                <span>
                  Only a module that ran successfully may produce a negative finding.
                  {failed.length > 0
                    ? <> Collection failed for {failed.map((f) => <code key={f.family} className="font-mono">{f.family}</code>).reduce<React.ReactNode[]>((a, c, i) => (i ? [...a, ', ', c] : [c]), [])}, so the controls that depend on it remain <strong>Unknown</strong>, not Gap.</>
                    : ' No collection failed in this assessment.'}{' '}
                  A permission error must never manufacture a confident failure.
                </span>
              </div>
            </Card>
          </StateProvenance>

          <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-4">
            <div>
              <div className="text-sm font-bold text-emerald-900">
                {unknownResolvedByUpload().resolved} of the {unknownResolvedByUpload().from} Unknown controls in the authored scope resolved ({unknownResolvedByUpload().from} → {unknownResolvedByUpload().to})
              </div>
              <div className="text-xs text-emerald-700">
                Interval {fmt1(viewsBefore.lowerPct)}–{fmt1(viewsBefore.upperPct)}% → {fmt1(viewsAfter.lowerPct)}–{fmt1(viewsAfter.upperPct)}% · coverage {fmt1(viewsBefore.coveragePct)}% → {fmt1(viewsAfter.coveragePct)}%. Assurance stays at {assurance.level}: {assurance.count} of {assurance.total} verdicts ({assurance.measuredPct}%) are {assurance.qualifies}, and {assurance.next} needs {assurance.thresholdPct}%.{' '}
                {movedOutOfUnknown().outside} control{movedOutOfUnknown().outside === 1 ? '' : 's'} outside the authored scope also moved: {outsideScopeSentence()}{' '}
                The other {CURRENT.after.unknownUnauthored} Unknown controls have no authored evidence requirement; an upload cannot establish that any of them is met.
              </div>
            </div>
            <Button dataTour="bundle-reveal" onClick={() => navigate('/dashboard')}>
              Reveal on dashboard <ArrowRight size={15} />
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

/* ─── Screen ────────────────────────────────────────────────────────────────── */

export default function Intake() {
  const [tab, setTab] = useState<'interviews' | 'bundle'>('interviews');
  const [activeRole, setActiveRole] = useState<string | null>(null);
  const uploaded = useAssessment((s) => s.evidenceUploaded);
  const profile = useAssessment((s) => s.profile);
  const all = useMemo(() => testimonyWeighed(uploaded), [uploaded]);
  const role = respondentRoles(uploaded).find((r) => roleSlug(r) === activeRole);
  const contradiction = uploaded && profile.usesCloud === 'no';

  return (
    <div className="space-y-5">
      {contradiction && (
        <div className="rounded-lg border-2 border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">
          <div className="flex items-center gap-2 font-bold">
            <AlertTriangle size={16} /> Declaration contradiction — blocked pending review
          </div>
          <p className="mt-1">
            The collected bundle contains cloud agent entries, but the profile declares no cloud services.
            Cloud use is not a JNCSF scoping condition, but a contradicted declaration is blocked pending
            review on the <RouterLink to="/profile" className="font-semibold underline">Profile</RouterLink> screen.
          </p>
        </div>
      )}
      <div data-tour="intake-tabs" className="flex gap-1 rounded-lg bg-slate-100 p-1">
        {(
          [
            ['interviews', 'Interviews'],
            ['bundle', 'Evidence bundle'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            data-tour={id === 'bundle' ? 'intake-tab-bundle' : 'intake-tab-interviews'}
            onClick={() => setTab(id)}
            className={`flex-1 rounded-md px-3 py-1.5 text-sm font-semibold transition ${tab === id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'interviews' &&
        (role ? (
          <div className="space-y-4">
            <button onClick={() => setActiveRole(null)} className="text-sm font-semibold text-accent hover:underline">
              ← All respondents
            </button>
            <TestimonyPanel role={role} uploaded={uploaded} items={all.filter((t) => t.respondentRole === role)} />
          </div>
        ) : (
          <RespondentList all={all} uploaded={uploaded} onOpen={setActiveRole} />
        ))}

      {tab === 'bundle' && <BundlePanel />}
    </div>
  );
}

/* ─── Respondents + scoped links ────────────────────────────────────────────── */

function RespondentList({ all, uploaded, onOpen }: { all: Testimony[]; uploaded: boolean; onOpen: (slug: string) => void }) {
  const [links, setLinks] = useState<Record<string, ScopedLink>>({});
  const [sent, setSent] = useState<string[]>([]);
  const roles = respondentRoles(uploaded);

  return (
    <div className="space-y-5">
      <StateProvenance uploaded={uploaded} from="claims">
        <div data-tour="intake-roles" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {roles.map((r) => {
            const n = all.filter((t) => t.respondentRole === r).length;
            const slug = roleSlug(r);
            const link = links[slug];
            return (
              <div key={r} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <button data-tour={`intake-role-${slug}`} data-testid={`respondent-${slug}`} onClick={() => onOpen(slug)} className="text-left">
                  <div className="text-sm font-bold text-slate-900 hover:text-accent">{capitalise(r)}</div>
                  <div className="mt-0.5 text-xs text-slate-500">{n} answer{n === 1 ? '' : 's'} weighed</div>
                </button>
                <Provenance tier="planned">
                  <div className="mt-3 border-t border-slate-100 pt-3">
                    {link ? (
                      <div className="text-[11px]">
                        <code className="block truncate rounded bg-slate-100 px-2 py-1 font-mono text-slate-600">https://jccp.ministry.local/respond/{link.token}</code>
                        <div className="mt-1 text-slate-500">expires in {link.expiresInDays} days · {link.scopeLabel}</div>
                        <div className="mt-1 flex gap-2">
                          <button onClick={() => navigator.clipboard?.writeText(`https://jccp.ministry.local/respond/${link.token}`)} className="font-semibold text-accent hover:underline">Copy</button>
                          <button onClick={() => setSent((s) => (s.includes(slug) ? s : [...s, slug]))} className="font-semibold text-accent hover:underline">
                            {sent.includes(slug) ? 'Sent ✓' : 'Mark as sent'}
                          </button>
                        </div>
                        <div className="mt-1 text-[10px] text-slate-400">Internal network only — this link does not traverse the internet</div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setLinks((l) => ({ ...l, [slug]: scopedLinkFor(slug, `${capitalise(r)} questions only`) }))}
                        className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-accent hover:underline"
                      >
                        <Link2 size={11} /> Generate scoped link
                      </button>
                    )}
                  </div>
                </Provenance>
              </div>
            );
          })}
          {roles.length === 0 && <p className="text-sm text-slate-500">The engine recorded no testimony it had to weigh in this assessment.</p>}
        </div>
      </StateProvenance>

      <WhatTheEngineDid all={all} uploaded={uploaded} />

      {all.some((t) => t.basis === 'admission') && (
        <div data-testid="testimony-conflict" className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-[12px] text-amber-900">
          <KeyRound size={12} className="mr-1 inline" />
          <strong>Two answers disagree:</strong>{' '}
          {all
            .filter((t) => t.basis === 'admission')
            .map((t) => (
              <span key={t.controlId}>
                <RouterLink to={`/control/${t.controlId}`} className="font-mono font-semibold underline">{t.controlId}</RouterLink>: {t.contradictedBy}.{' '}
              </span>
            ))}
          <Ban size={11} className="mr-1 inline text-amber-700" />
          Testimony that admits non-enforcement prevails over testimony that supports it; the supporting answer is retained, not outvoted.
        </div>
      )}
    </div>
  );
}
