import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Wrench, ArrowRight, Check, FileSearch, ShieldCheck } from 'lucide-react';
import { Card, Button, Pill, CodeBlock } from '../components/ui';
import ScoreInterval from '../components/ScoreInterval';
import { useAssessment } from '../store/useAssessment';
import { remediationPlan, evidenceRequests } from '../data/remediation';
import { requestPlan } from '../data/scenario';
import { TOTALS } from '../data/capabilities';
import { projectProvision } from '../lib/scoring';

const fmt1 = (n: number) => n.toFixed(1);
const pctRange = (lo: number, hi: number) => `${fmt1(lo * 100)} – ${fmt1(hi * 100)}%`;

/* ─── Tab A: Remediation plan ───────────────────────────────────────────────── */

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
                  {r.controlIds.length < r.controlsClosed && (
                    <span className="text-blue-500"> · {r.controlIds.length} shown</span>
                  )}
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
                  <Link key={cid} to={`/control/${cid}`} className="font-mono text-[11px] text-accent hover:underline">
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

/* ─── Tab B: What you didn't provide ────────────────────────────────────────── */

function RequestsTab() {
  const provided = useAssessment((s) => s.providedRequests);
  const provideRequest = useAssessment((s) => s.provideRequest);

  // Base = the post-upload engine verdict.
  const base = { applicable: TOTALS.applicable, green: TOTALS.after.green, yellow: TOTALS.after.yellow, unknown: TOTALS.after.unknown };

  const cumulative = useMemo(() => {
    const providedUnlock = evidenceRequests
      .filter((r) => provided.includes(r.id))
      .reduce((s, r) => s + r.controlsUnlocked, 0);
    return projectProvision(base.applicable, base.green, base.yellow, base.unknown, providedUnlock);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provided]);

  return (
    <div className="space-y-5">
      <Card
        title="Projected interval"
        subtitle="Providing an artifact makes its controls known — pass or fail. The band narrows either way; its position depends on what the evidence shows."
      >
        <div className="py-3">
          <ScoreInterval
            lower={cumulative.bestCase.lower * 100}
            upper={cumulative.worstCase.upper * 100}
            widthPts={(cumulative.worstCase.upper - cumulative.bestCase.lower) * 100}
            caption="Where the band could land"
            ghost={{ lower: cumulative.worstCase.lower * 100, upper: cumulative.worstCase.upper * 100, label: 'worst case — all resolved controls fail' }}
            subline={
              cumulative.resolved === 0
                ? 'Provide artifacts below to project the outcome.'
                : `${cumulative.resolved} controls become known. Band width falls to ${fmt1(cumulative.resultingWidthPts)} pts. Best case ${pctRange(cumulative.bestCase.lower, cumulative.bestCase.upper)} · worst case ${pctRange(cumulative.worstCase.lower, cumulative.worstCase.upper)}.`
            }
          />
        </div>
        <p className="mt-2 text-[11px] text-slate-400">
          The band cannot fall below <span className="tnum">{fmt1((24 / base.applicable) * 100)} pts</span> of
          width — the 24 structurally uncollectable controls stay Unknown regardless of what is provided.
        </p>
      </Card>

      <div className="space-y-3">
        {[...evidenceRequests].sort((a, b) => b.controlsUnlocked - a.controlsUnlocked).map((r) => {
          const done = provided.includes(r.id);
          const p = projectProvision(base.applicable, base.green, base.yellow, base.unknown, r.controlsUnlocked);
          return (
            <Card key={r.id}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-bold text-slate-900">{r.artifact}</h3>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[12px]">
                    <Pill tone="slate">{r.source}</Pill>
                    <Pill tone="blue">
                      <span className="tnum font-bold">{p.resolved}</span> controls become known
                    </Pill>
                    <motion.span
                      key={done ? 'done' : 'pending'}
                      initial={{ scale: 0.9 }}
                      animate={{ scale: 1 }}
                      className="tnum font-semibold text-emerald-600"
                    >
                      narrows band {fmt1(p.widthReductionPts)} pts
                    </motion.span>
                  </div>
                  <p className="mt-2 text-[12px] text-slate-600">
                    Interval becomes{' '}
                    <span className="tnum font-medium">{pctRange(p.bestCase.lower, p.bestCase.upper)}</span> (all pass)
                    or <span className="tnum font-medium">{pctRange(p.worstCase.lower, p.worstCase.upper)}</span> (all fail)
                    — either way you learn where you stand.
                  </p>
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

/* ─── Tab C: All actions (merged, default) ──────────────────────────────────── */

type MergedItem = {
  kind: 'evidence' | 'fix';
  id: string;
  title: string;
  effort: string;
  controls: number;
  techniques?: string[];
  acceptance: string;
  command?: string;
};

function AllActionsTab() {
  const [sort, setSort] = useState<'impact' | 'quick' | 'controls'>('impact');

  const items: MergedItem[] = useMemo(() => {
    const evidence: MergedItem[] = requestPlan
      .filter((r) => r.method === 'automated' || r.controlsUnlocked >= 4)
      .slice(0, 6)
      .map((r) => ({
        kind: 'evidence',
        id: `ev-${r.artifact}`,
        title: `Run the ${r.artifact.toLowerCase()}`,
        effort: r.effort,
        controls: r.controlsUnlocked,
        acceptance: `Done when the ${r.source} export is accepted and its ${r.controlsUnlocked} controls move out of Unknown.`,
        command: r.command,
      }));
    const fixes: MergedItem[] = remediationPlan.map((a) => ({
      kind: 'fix',
      id: a.id,
      title: a.action,
      effort: a.effort === 'low' ? '1 day' : a.effort === 'medium' ? '1 week' : '1 month',
      controls: a.controlsClosed,
      techniques: a.removesExposureTo,
      acceptance:
        a.id === 'rem-mfa'
          ? 'Done when the AD export shows 0 privileged accounts without MFA.'
          : `Done when re-collection shows the ${a.controlsClosed} linked controls satisfied.`,
    }));
    const all = [...evidence, ...fixes];
    const rank = (i: MergedItem) => {
      if (sort === 'controls') return -i.controls;
      if (sort === 'quick') return (i.effort.includes('min') ? 0 : i.effort.includes('day') ? 1 : 2) - i.controls / 100;
      // impact: fixes that remove technique exposure rank first, then by controls
      return -(i.controls + (i.techniques?.length ?? 0) * 5);
    };
    return all.sort((a, b) => rank(a) - rank(b));
  }, [sort]);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-xs">
        <span className="text-slate-400">sort</span>
        {(['impact', 'quick', 'controls'] as const).map((m) => (
          <button
            key={m}
            onClick={() => setSort(m)}
            className={`rounded-full border px-2.5 py-1 ${sort === m ? 'border-accent bg-accent/10 font-semibold text-accent' : 'border-slate-300 text-slate-600'}`}
          >
            {m === 'impact' ? 'risk-weighted' : m === 'quick' ? 'quick wins' : 'controls closed'}
          </button>
        ))}
      </div>
      {items.map((it, i) => (
        <Card key={it.id}>
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs font-bold text-slate-500">
              {i + 1}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                {it.kind === 'evidence' ? (
                  <Pill tone="blue"><FileSearch size={11} /> evidence</Pill>
                ) : (
                  <Pill tone="amber"><ShieldCheck size={11} /> fix</Pill>
                )}
                <h3 className="text-sm font-bold text-slate-900">{it.title}</h3>
              </div>
              <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[12px] text-slate-500">
                <span>{it.effort}</span>
                <span>·</span>
                <span>
                  {it.kind === 'evidence' ? 'establishes' : 'closes'} <span className="tnum font-semibold text-slate-800">{it.controls}</span> controls
                </span>
                {it.techniques?.map((t) => (
                  <Pill key={t} tone="red">{t}</Pill>
                ))}
              </div>
              <p className="mt-1.5 text-[11px] text-slate-400">{it.acceptance}</p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

export default function Remediation() {
  const [tab, setTab] = useState<'all' | 'plan' | 'requests'>('all');
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <Wrench size={18} className="text-accent" />
        <h2 className="text-base font-semibold text-slate-900">Remediation &amp; evidence requests</h2>
      </div>

      <div className="flex gap-1 rounded-lg bg-slate-100 p-1">
        {(
          [
            ['all', 'All actions'],
            ['plan', 'Remediation plan'],
            ['requests', "What you didn't provide"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex-1 rounded-md px-3 py-1.5 text-sm font-semibold transition ${tab === id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'all' ? <AllActionsTab /> : tab === 'plan' ? <RemediationTab /> : <RequestsTab />}

      <div className="flex justify-end">
        <Link to="/export" className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent hover:underline">
          Continue to OSCAL export <ArrowRight size={15} />
        </Link>
      </div>
    </div>
  );
}
