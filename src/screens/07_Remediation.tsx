import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Wrench, ArrowRight, Check, FileSearch, ShieldCheck, Layers } from 'lucide-react';
import { Card, Button, Pill } from '../components/ui';
import { Provenance, StateProvenance } from '../components/Provenance';
import ScoreInterval from '../components/ScoreInterval';
import { useAssessment } from '../store/useAssessment';
import { CURRENT, type RankItem } from '../data/current';
import { controlText } from '../data/controls';
import { bandFloorPts, projectFromNumerator } from '../lib/scoring';
import { ACTION_TYPES, evidenceArtifacts, fmtPoints, rankGroups, rankingExclusions, resolvedBy, type ActionType } from '../lib/ranking';

const fmt1 = (n: number) => n.toFixed(1);
const pctRange = (lo: number, hi: number) => `${fmt1(lo * 100)} – ${fmt1(hi * 100)}%`;

const ACTION_LABEL: Record<ActionType, string> = {
  fix: 'fix',
  evidence_request: 'evidence request',
  corroboration_request: 'corroboration request',
};

/** One ranked action. Everything on it is the engine's: the action, its description, effort, magnitude and ATT&CK exposure. */
function ActionCard({ it }: { it: RankItem }) {
  const text = controlText(it.controlId);
  return (
    <div data-testid={`action-${it.controlId}-${it.actionType}`} data-rank={it.rank} className="rounded-lg border border-slate-200 bg-white p-3">
      <div className="flex flex-wrap items-center gap-2">
        {it.actionType === 'fix' ? (
          <Pill tone="amber"><ShieldCheck size={11} /> {ACTION_LABEL.fix}</Pill>
        ) : (
          <Pill tone="blue"><FileSearch size={11} /> {it.actionType === 'evidence_request' ? ACTION_LABEL.evidence_request : ACTION_LABEL.corroboration_request}</Pill>
        )}
        <Link to={`/control/${it.controlId}`} className="font-mono text-[12px] font-semibold text-accent hover:underline">{it.controlId}</Link>
        <span className="text-sm font-semibold text-slate-900">{it.description}</span>
      </div>
      {text && <p className="mt-0.5 truncate text-[11px] text-slate-500">{text}</p>}
      <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-slate-600">
        <span data-testid="magnitude" className="tnum">
          magnitude <strong className="text-slate-800">{fmtPoints(it.magnitudePoints)}</strong> points
          <span className="text-slate-400"> ({it.magnitude[0]}/{it.magnitude[1]}; unweighted {fmtPoints(it.unweightedMagnitudePoints)} = {it.unweightedMagnitude[0]}/{it.unweightedMagnitude[1]})</span>
        </span>
        <span>effort <span className="tnum">{it.effort ?? '—'}</span></span>
        {it.signalsRequested.length > 0 && (
          <span>asks for {it.signalsRequested.map((s) => <code key={s} className="ml-1 font-mono text-[11px]">{s}</code>)}</span>
        )}
      </div>
      <div data-testid="attack-exposure" className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500">
        <span className="text-slate-400">ATT&amp;CK exposure</span>
        <code className="font-mono">{it.attack.exposure}</code>
        {it.attack.techniqueIds.map((t) => <Pill key={t} tone="red">{t}</Pill>)}
        <span>{it.attack.broadCount} broad · {it.attack.diffuseCount} diffuse · <strong data-testid="suppressed">{it.attack.suppressedCount} suppressed</strong></span>
      </div>
    </div>
  );
}

/* ─── The ranking, in tie groups ────────────────────────────────────────────── */

function RankingTab({ types }: { types: readonly ActionType[] }) {
  const [filter, setFilter] = useState<ActionType | 'all'>('all');
  const groups = useMemo(
    () =>
      rankGroups(CURRENT.ranking.items.filter((i) => types.includes(i.actionType as ActionType) && (filter === 'all' || i.actionType === filter)))
        .filter((g) => g.items.length > 0),
    [types, filter],
  );
  const total = groups.reduce((n, g) => n + g.items.length, 0);
  return (
    <div className="space-y-4 pt-5">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="text-slate-400">action</span>
        {(['all', ...types] as const).map((m) => (
          <button
            key={m}
            onClick={() => setFilter(m)}
            className={`rounded-full border px-2.5 py-1 ${filter === m ? 'border-accent bg-accent/10 font-semibold text-accent' : 'border-slate-300 text-slate-600'}`}
          >
            {m === 'all' ? 'all' : ACTION_LABEL[m]}
          </button>
        ))}
        <span data-testid="ranking-count" className="tnum ml-auto text-slate-500">{total} actions in {groups.length} rank{groups.length === 1 ? '' : 's'}</span>
      </div>
      {groups.map((g) => (
        <section key={g.rank} data-testid={`rank-group-${g.rank}`} data-tie-size={g.tieGroupSize} data-shown={g.items.length}>
          <div className="mb-1.5 flex flex-wrap items-center gap-2">
            <span className="flex h-7 min-w-7 items-center justify-center rounded-lg bg-accent/10 px-1.5 text-sm font-bold text-accent">{g.rank}</span>
            {g.tieGroupSize > 1 ? (
              <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-slate-700">
                <Layers size={13} className="text-slate-400" /> {g.tieGroupSize} items share rank {g.rank}
              </span>
            ) : (
              <span className="text-[12px] text-slate-500">1 item at rank {g.rank}</span>
            )}
          </div>
          {g.tieGroupSize > 1 && <p className="mb-1.5 text-[11px] text-slate-500">{CURRENT.ranking.tieOrderNote}.</p>}
          <div className="space-y-2">
            {g.items.map((it) => <ActionCard key={it.controlId + it.actionType} it={it} />)}
          </div>
        </section>
      ))}
    </div>
  );
}

/** What the ranking could not act on, and why. A list that is empty says so; it is not omitted. */
function NotRanked() {
  return (
    <Card title="Not ranked" subtitle="Controls the engine excluded from the ranking, and why">
      <ul data-testid="ranking-exclusions" className="space-y-2.5 text-sm">
        {rankingExclusions().map((e) => (
          <li key={e.key} data-testid={`excluded-${e.key}`} data-count={e.controls.length} className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
            <code className="w-56 shrink-0 font-mono text-[12px] text-slate-600">{e.key}</code>
            <span className="tnum w-12 shrink-0 text-right font-semibold text-slate-800">{e.controls.length}</span>
            <span className="min-w-0 flex-1 text-[12px] text-slate-500">{e.controls.length === 0 ? 'none — ' : ''}{e.reason}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

/* ─── What you didn't provide: the artifacts the evidence requests ask for ──── */

function RequestsTab() {
  const provided = useAssessment((s) => s.providedRequests);
  const provideRequest = useAssessment((s) => s.provideRequest);
  const artifacts = evidenceArtifacts();

  // Base = the post-upload engine verdict. Only the Unknowns that have an authored evidence requirement
  // (and are collectable) can be resolved by providing artifacts; the rest stay Unknown unless an artifact collected for another control shows one unmet.
  const after = CURRENT.after;
  const u = after.views.unweighted;
  const base = {
    applicable: u.applicable,
    numerator: after.creditNumerator[0] / after.creditNumerator[1],
    unknown: after.unknown,
    unresolvable: after.unknownUnauthored + u.width.uncollectable[0],
  };

  // The controls resolved by what has been provided: computed as an intersection, so nothing is counted twice.
  const resolved = useMemo(() => resolvedBy(provided), [provided]);
  const cumulative = projectFromNumerator(base.applicable, base.numerator, base.unknown, base.unresolvable, resolved.length);

  const hero = {
    lower: cumulative.bestCase.lower * 100,
    upper: cumulative.bestCase.upper * 100,
    width: cumulative.resultingWidthPts,
  };

  return (
    <div className="space-y-5">
      <Card
        title="Projected interval"
        subtitle="Providing an artifact makes its controls known — pass or fail. The band narrows either way; its position depends on what the evidence shows."
      >
        <div className="py-3">
          <ScoreInterval
            lower={hero.lower}
            upper={hero.upper}
            widthPts={hero.width}
            caption={cumulative.resolved === 0 ? undefined : 'Best case — all resolved controls pass'}
            ghost={{ lower: cumulative.worstCase.lower * 100, upper: cumulative.worstCase.upper * 100, label: 'worst case — all resolved controls fail' }}
            subline={
              cumulative.resolved === 0
                ? 'Provide artifacts below to project the outcome.'
                : `${cumulative.resolved} controls become known. Band width falls to ${fmt1(hero.width)} pts. Best case ${pctRange(cumulative.bestCase.lower, cumulative.bestCase.upper)} · worst case ${pctRange(cumulative.worstCase.lower, cumulative.worstCase.upper)}.`
            }
          />
        </div>
        <p className="mt-2 text-[11px] text-slate-400">
          By the artifacts this plan asks for, the band cannot fall below <span className="tnum">{fmt1(bandFloorPts(base.applicable, base.unresolvable))} pts</span> of
          width — the {base.unresolvable} controls with no authored evidence requirement are not what it asks about, and stay Unknown unless an artifact
          collected for another control happens to show one unmet.
        </p>
      </Card>

      <div className="space-y-3">
        {artifacts.map((a) => {
          const done = provided.includes(a.signal);
          const unlocks = resolvedBy([a.signal]);
          const p = projectFromNumerator(base.applicable, base.numerator, base.unknown, base.unresolvable, unlocks.length);
          return (
            <Card key={a.signal}>
              <div data-testid={`artifact-${a.signal}`} data-unlocks={unlocks.length} className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <h3 className="font-mono text-sm font-bold text-slate-900">{a.signal}</h3>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[12px]">
                    <Pill tone="blue">
                      <span className="tnum font-bold">{p.resolved}</span> controls become known
                    </Pill>
                    <motion.span key={done ? 'done' : 'pending'} initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="tnum font-semibold text-emerald-600">
                      narrows band {fmt1(p.widthReductionPts)} pts
                    </motion.span>
                  </div>
                  <p className="mt-2 flex flex-wrap gap-1.5 text-[12px] text-slate-600">
                    asked for by
                    {a.controls.map((c) => (
                      <Link key={c} to={`/control/${c}`} className="font-mono text-[11px] text-accent hover:underline">{c}</Link>
                    ))}
                  </p>
                  <p className="mt-1 text-[12px] text-slate-600">
                    Interval becomes <span className="tnum font-medium">{pctRange(p.bestCase.lower, p.bestCase.upper)}</span> (all pass)
                    or <span className="tnum font-medium">{pctRange(p.worstCase.lower, p.worstCase.upper)}</span> (all fail)
                    — either way you learn where you stand.
                  </p>
                </div>
                <Button variant={done ? 'outline' : 'primary'} disabled={done} onClick={() => provideRequest(a.signal)}>
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
  const [tab, setTab] = useState<'all' | 'fixes' | 'requests'>('all');
  const uploaded = useAssessment((s) => s.evidenceUploaded);
  const fixTypes: readonly ActionType[] = ['fix', 'corroboration_request'];
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <Wrench size={18} className="text-accent" />
        <h2 className="text-base font-semibold text-slate-900">Remediation &amp; evidence requests</h2>
      </div>

      {!uploaded ? (
        <Provenance tier="illustrative" note="The engine ranks actions on the assessed state; before the upload there is nothing of its to show.">
          <Card>
            <p data-testid="ranking-needs-upload" className="text-sm text-slate-700">
              The engine&rsquo;s ranking is computed on the assessed state, after the evidence bundle is in. Run the collector bundle on the{' '}
              <Link to="/intake" className="font-semibold text-accent underline">Intake</Link> screen to see it.
            </p>
          </Card>
        </Provenance>
      ) : (
        <>
          <div className="flex gap-1 rounded-lg bg-slate-100 p-1">
            {(
              [
                ['all', 'All actions'],
                ['fixes', 'Fixes'],
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

          <StateProvenance uploaded={uploaded} from="ranking.items">
            {tab === 'all' ? <RankingTab types={ACTION_TYPES} /> : tab === 'fixes' ? <RankingTab types={fixTypes} /> : <RequestsTab />}
          </StateProvenance>
          {tab !== 'requests' && (
            <StateProvenance uploaded={uploaded} from="ranking.unauthoredExcluded">
              <NotRanked />
            </StateProvenance>
          )}
        </>
      )}

      <div className="flex justify-end">
        <Link to="/export" className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent hover:underline">
          Continue to OSCAL export <ArrowRight size={15} />
        </Link>
      </div>
    </div>
  );
}
