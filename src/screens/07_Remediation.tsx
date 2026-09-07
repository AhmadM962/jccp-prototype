import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Wrench, ArrowRight, Check } from 'lucide-react';
import { Card, Button, Pill, CodeBlock } from '../components/ui';
import ScoreInterval from '../components/ScoreInterval';
import { useAssessment } from '../store/useAssessment';
import { remediationPlan, evidenceRequests } from '../data/remediation';
import { TOTALS } from '../data/capabilities';

function RemediationTab() {
  const ranked = [...remediationPlan].sort((a, b) => b.controlsClosed - a.controlsClosed);
  return (
    <div className="space-y-3">
      {ranked.map((r, i) => (
        <Card key={r.id}>
          <div className="flex items-start gap-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-sm font-bold text-accent">
              {i + 1}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-bold text-slate-900">{r.action}</h3>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-[12px]">
                <Pill tone="blue">
                  closes <span className="tnum font-bold">{r.controlsClosed}</span> controls
                </Pill>
                <Pill tone="slate">effort: {r.effort}</Pill>
                <span className="text-slate-500">{r.affectedAssets}</span>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] text-slate-400">removes exposure to</span>
                {r.removesExposureTo.map((t) => (
                  <Pill key={t} tone="red">{t}</Pill>
                ))}
              </div>
              <div className="mt-2 flex flex-wrap gap-1">
                {r.controlIds.map((cid) => (
                  <Link
                    key={cid}
                    to={`/control/${cid}`}
                    className="font-mono text-[11px] text-accent hover:underline"
                  >
                    {cid}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

function RequestsTab() {
  const provided = useAssessment((s) => s.providedRequests);
  const provideRequest = useAssessment((s) => s.provideRequest);
  const [mid] = useState((TOTALS.after.interval[0] + TOTALS.after.interval[1]) / 2);

  // start from the post-upload interval; each "provided" item shrinks the band
  const totalNarrowing = evidenceRequests
    .filter((r) => provided.includes(r.id))
    .reduce((s, r) => s + r.narrowingPts, 0);
  const width = Math.max(2, TOTALS.after.widthPts - totalNarrowing);
  const lower = mid - width / 2;
  const upper = mid + width / 2;

  return (
    <div className="space-y-5">
      <Card title="Projected interval" subtitle="Each artifact you provide narrows the band by the amount shown">
        <div className="py-2">
          <ScoreInterval lower={lower} upper={upper} widthPts={width} caption="Projected compliance interval" />
        </div>
      </Card>

      <div className="space-y-3">
        {[...evidenceRequests].sort((a, b) => b.narrowingPts - a.narrowingPts).map((r) => {
          const done = provided.includes(r.id);
          return (
            <Card key={r.id}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-bold text-slate-900">{r.artifact}</h3>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[12px]">
                    <Pill tone="slate">{r.source}</Pill>
                    <Pill tone="blue">
                      unlocks <span className="tnum font-bold">{r.controlsUnlocked}</span> controls
                    </Pill>
                    <motion.span
                      key={done ? 'done' : 'pending'}
                      initial={{ scale: 0.9 }}
                      animate={{ scale: 1 }}
                      className="tnum font-bold text-emerald-600"
                    >
                      −{r.narrowingPts.toFixed(1)} points
                    </motion.span>
                  </div>
                  <div className="mt-2 max-w-lg">
                    <CodeBlock code={r.command} />
                  </div>
                </div>
                <Button variant={done ? 'outline' : 'primary'} disabled={done} onClick={() => provideRequest(r.id)}>
                  {done ? (
                    <>
                      <Check size={14} /> Provided
                    </>
                  ) : (
                    'Simulate providing this'
                  )}
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

export default function Remediation() {
  const [tab, setTab] = useState<'plan' | 'requests'>('plan');
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <Wrench size={18} className="text-accent" />
        <h2 className="text-base font-semibold text-slate-900">Remediation & evidence requests</h2>
      </div>

      <div className="flex gap-1 rounded-lg bg-slate-100 p-1">
        {(
          [
            ['plan', 'Remediation plan'],
            ['requests', "What you didn't provide"],
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

      {tab === 'plan' ? <RemediationTab /> : <RequestsTab />}

      <div className="flex justify-end">
        <Link to="/export" className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent hover:underline">
          Continue to OSCAL export <ArrowRight size={15} />
        </Link>
      </div>
    </div>
  );
}
