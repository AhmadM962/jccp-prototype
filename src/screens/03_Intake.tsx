import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Play,
  SkipForward,
  Check,
  AlertTriangle,
  XCircle,
  Ban,
  UploadCloud,
  ArrowRight,
  ShieldQuestion,
} from 'lucide-react';
import { Card, Button, Pill } from '../components/ui';
import { useAssessment } from '../store/useAssessment';
import { interviews, type InterviewRole } from '../data/interviews';
import { bundleStages, moduleLedger, BUNDLE_MANIFEST, type ModuleStatus } from '../data/scenario';

/* ─── Tab A: Interviews ─────────────────────────────────────────────────────── */

function InterviewPanel({ role, onComplete }: { role: InterviewRole; onComplete: () => void }) {
  const [shown, setShown] = useState(0); // number of turns revealed
  const [playing, setPlaying] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!playing) return;
    if (shown >= role.turns.length) {
      setPlaying(false);
      onComplete();
      return;
    }
    const t = setTimeout(() => setShown((n) => n + 1), 650);
    return () => clearTimeout(t);
  }, [playing, shown, role.turns.length, onComplete]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [shown]);

  const skip = () => {
    setShown(role.turns.length);
    setPlaying(false);
    onComplete();
  };

  const claimsVisible = Math.round((shown / role.turns.length) * role.claims.length);
  const showFallacy = role.coverageFallacy && shown >= 2;

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
      <Card
        title={role.title}
        subtitle={role.persona}
        right={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setPlaying(true)} disabled={playing || shown >= role.turns.length}>
              <Play size={13} /> Play
            </Button>
            <Button variant="ghost" onClick={skip} disabled={shown >= role.turns.length}>
              <SkipForward size={13} /> Skip
            </Button>
          </div>
        }
      >
        <div ref={scrollRef} className="scroll-slim max-h-[420px] space-y-3 overflow-y-auto pr-1">
          {role.turns.slice(0, shown).map((turn, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${turn.who === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm ${
                  turn.who === 'user'
                    ? 'bg-accent text-white'
                    : 'bg-slate-100 text-slate-800'
                }`}
              >
                <div className="mb-0.5 text-[10px] font-semibold uppercase tracking-wide opacity-60">
                  {turn.who === 'user' ? 'Interviewee' : 'JCCP agent'}
                </div>
                {turn.text}
              </div>
            </motion.div>
          ))}
          {playing && shown < role.turns.length && (
            <div className="text-xs text-slate-400">typing…</div>
          )}
          {shown === 0 && <div className="text-sm text-slate-400">Press Play to run the scripted interview.</div>}
        </div>

        <AnimatePresence>
          {showFallacy && role.coverageFallacy && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-4 overflow-hidden rounded-lg border border-amber-200 bg-amber-50 p-3"
            >
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
                <AlertTriangle size={13} /> Coverage fallacy defeated
              </div>
              <p className="mt-1 text-[12px] text-amber-800 line-through decoration-red-400">
                {role.coverageFallacy.naive}
              </p>
              <ul className="mt-1 space-y-0.5">
                {role.coverageFallacy.refined.map((r) => (
                  <li key={r} className="flex items-start gap-1.5 text-[12px] text-amber-900">
                    <Check size={12} className="mt-0.5 shrink-0" /> {r}
                  </li>
                ))}
              </ul>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>

      <div>
        <Card title="Extracted claims" subtitle="Testimony is capped at Yellow — never Green">
          <div className="space-y-2.5">
            {role.claims.slice(0, claimsVisible).map((claim, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                className="rounded-lg border border-slate-200 p-3"
              >
                <p className="text-[13px] text-slate-800">{claim.text}</p>
                {claim.note && <p className="mt-1 text-[11px] text-slate-500">{claim.note}</p>}
                <div className="mt-2 flex items-center justify-between">
                  <Pill tone="amber">Testimony only — capped at Yellow</Pill>
                  <span className="tnum text-[11px] text-slate-400">
                    conf {claim.confidence.toFixed(2)}
                  </span>
                </div>
              </motion.div>
            ))}
            {claimsVisible === 0 && (
              <p className="text-sm text-slate-400">Claims appear here as the interview progresses.</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

/* ─── Tab B: Evidence bundle ────────────────────────────────────────────────── */

const statusMeta: Record<ModuleStatus, { icon: typeof Check; tone: 'green' | 'amber' | 'red' | 'slate'; label: string }> = {
  success: { icon: Check, tone: 'green', label: 'success' },
  partial: { icon: AlertTriangle, tone: 'amber', label: 'partial' },
  failed: { icon: XCircle, tone: 'red', label: 'failed' },
  declined: { icon: Ban, tone: 'slate', label: 'declined' },
};

function BundlePanel() {
  const navigate = useNavigate();
  const uploadEvidence = useAssessment((s) => s.uploadEvidence);
  const uploaded = useAssessment((s) => s.evidenceUploaded);
  const [stage, setStage] = useState(-1); // -1 idle, 0..n running, n done
  const [done, setDone] = useState(uploaded);

  const run = () => {
    setStage(0);
  };

  useEffect(() => {
    if (stage < 0) return;
    if (stage >= bundleStages.length) {
      setDone(true);
      uploadEvidence();
      return;
    }
    const t = setTimeout(() => setStage((s) => s + 1), 700);
    return () => clearTimeout(t);
  }, [stage, uploadEvidence]);

  return (
    <div className="space-y-5">
      <Card>
        <div className="flex flex-col items-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center">
          <UploadCloud size={32} className="text-slate-400" />
          <p className="mt-3 text-sm font-semibold text-slate-700">Collector evidence bundle</p>
          <p className="mt-1 max-w-md text-xs text-slate-500">
            A signed archive produced on-premise by the JCCP collector. The drop zone is simulated for this
            demo — no real file is parsed.
          </p>
          <div className="mt-4">
            <Button onClick={run} disabled={stage >= 0 && !done}>
              {done ? 'Bundle processed' : 'Simulate collector bundle upload'}
            </Button>
          </div>
        </div>
      </Card>

      {stage >= 0 && (
        <Card title="Ingestion" subtitle={`${BUNDLE_MANIFEST.collector} · signature ${BUNDLE_MANIFEST.signatureAlg}`}>
          <ol className="space-y-1.5">
            {bundleStages.map((s, i) => {
              const state = i < stage ? 'done' : i === stage ? 'running' : 'pending';
              const Icon =
                s.result === 'ok' ? Check : s.result === 'warn' ? AlertTriangle : XCircle;
              const colour =
                state === 'pending'
                  ? 'text-slate-300'
                  : s.result === 'ok'
                  ? 'text-emerald-600'
                  : s.result === 'warn'
                  ? 'text-amber-600'
                  : 'text-red-600';
              return (
                <li key={i} className="flex items-start gap-2.5 text-sm">
                  <Icon size={15} className={`mt-0.5 shrink-0 ${colour}`} />
                  <div className={state === 'pending' ? 'text-slate-300' : 'text-slate-700'}>
                    <span className="font-medium">{s.label}</span>
                    {state !== 'pending' && <span className="text-slate-500"> — {s.detail}</span>}
                    {state === 'running' && <span className="ml-1 text-slate-400">…</span>}
                  </div>
                </li>
              );
            })}
          </ol>
        </Card>
      )}

      {done && (
        <>
          <Card title="Module execution ledger" subtitle="Which collector modules ran, and with what result">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-[11px] uppercase tracking-wide text-slate-400">
                    <th className="py-2 pr-4">Module</th>
                    <th className="py-2 pr-4">Status</th>
                    <th className="py-2 pr-4">Detail</th>
                    <th className="py-2">Negative-capable</th>
                  </tr>
                </thead>
                <tbody>
                  {moduleLedger.map((m) => {
                    const meta = statusMeta[m.status];
                    const Icon = meta.icon;
                    return (
                      <tr key={m.module} className="border-b border-slate-100">
                        <td className="py-2.5 pr-4 font-mono text-xs font-semibold text-slate-700">{m.module}</td>
                        <td className="py-2.5 pr-4">
                          <Pill tone={meta.tone}>
                            <Icon size={11} /> {meta.label}
                          </Pill>
                        </td>
                        <td className="py-2.5 pr-4 text-slate-600">{m.detail}</td>
                        <td className="py-2.5">
                          {m.negativeCapable ? (
                            <span className="text-emerald-700">yes</span>
                          ) : (
                            <span className="text-slate-400">no</span>
                          )}
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
                Only modules with status <code className="font-mono">success</code> may produce a negative
                finding. The <code className="font-mono">logging</code> module failed, so its controls remain{' '}
                <strong>Unknown</strong>, not Gap. A permission error must never manufacture a confident
                failure.
              </span>
            </div>
          </Card>

          <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-4">
            <div>
              <div className="text-sm font-bold text-emerald-900">90 evidence gaps closed</div>
              <div className="text-xs text-emerald-700">
                Interval collapses 50.0–87.1% → 70.6–81.2% · coverage 62.9% → 89.4% · assurance L1 → L2
              </div>
            </div>
            <Button onClick={() => navigate('/dashboard')}>
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
  const completeInterview = useAssessment((s) => s.completeInterview);
  const done = useAssessment((s) => s.interviewsCompleted);
  const role = interviews.find((r) => r.id === activeRole);

  return (
    <div className="space-y-5">
      <div className="flex gap-1 rounded-lg bg-slate-100 p-1">
        {(
          [
            ['interviews', 'Interviews'],
            ['bundle', 'Evidence bundle'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex-1 rounded-md px-3 py-1.5 text-sm font-semibold transition ${
              tab === id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'interviews' &&
        (role ? (
          <div className="space-y-4">
            <button
              onClick={() => setActiveRole(null)}
              className="text-sm font-semibold text-accent hover:underline"
            >
              ← All roles
            </button>
            <InterviewPanel role={role} onComplete={() => completeInterview(role.id)} />
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-3">
            {interviews.map((r) => (
              <button
                key={r.id}
                onClick={() => setActiveRole(r.id)}
                className="rounded-xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-accent hover:shadow"
              >
                <div className="text-sm font-bold text-slate-900">{r.title}</div>
                <div className="mt-0.5 text-xs text-slate-500">{r.persona}</div>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">{r.turns.length} turns · {r.claims.length} claims</span>
                  {done.includes(r.id) ? (
                    <Pill tone="green">
                      <Check size={11} /> done
                    </Pill>
                  ) : (
                    <Pill tone="slate">not started</Pill>
                  )}
                </div>
              </button>
            ))}
          </div>
        ))}

      {tab === 'bundle' && <BundlePanel />}
    </div>
  );
}
