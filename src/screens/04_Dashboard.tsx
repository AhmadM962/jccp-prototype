import { Link, useNavigate } from 'react-router-dom';
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  LabelList,
} from 'recharts';
import { AlertTriangle, Info, ArrowUpRight, ShieldAlert, TrendingUp } from 'lucide-react';
import { Card, Pill } from '../components/ui';
import { Provenance, StateProvenance } from '../components/Provenance';
import ScoreInterval from '../components/ScoreInterval';
import WidthDecomposition from '../components/WidthDecomposition';
import FourViews from '../components/FourViews';
import { useAssessment } from '../store/useAssessment';
import { capabilities, TOTALS } from '../data/capabilities';
import { CURRENT } from '../data/current';
import { ASSURANCE_LEVELS, bandFloorPts } from '../lib/scoring';
import { stateFor, unevidencedRows } from '../lib/views';
import { coverageBreakdown, completenessStatement, unknownResolvedByUpload, movedOutOfUnknown, outsideScopeSentence, changedControlCount } from '../lib/coverage';
import { assuranceMeasurement, heldLevelReading, levelDefinition } from '../lib/assurance';
import DemotionChecks from '../components/DemotionChecks';
import { dashboardView } from '../lib/derive';
import { gapReasonBreakdown, GAP_REASON_LABEL, EVIDENCE_BASIS_BREAKDOWN, EVIDENCE_SIGNAL_TOTAL, NO_CONCLUSIVE_PATH_STATS } from '../data/controls';
import { EVIDENCE_FRESHNESS } from '../data/evidence';
import { sectorById, regulatorDisplay } from '../data/sectors';
import { Term } from '../tour/Term';

const fmt1 = (n: number) => n.toFixed(1);

/** The width decomposition under the interval: whose limitation each part of the width is. */
function WidthBreakdown({ uploaded, eff, overridesActive }: { uploaded: boolean; eff: ReturnType<typeof dashboardView>['effective']; overridesActive: number }) {
  const s = stateFor(uploaded);
  return (
    <WidthDecomposition
      parts={eff.widthExact.parts}
      width={eff.widthExact.total}
      controls={eff.widthControls}
      reasons={unevidencedRows(s)}
      reasonsTotal={s.views.unweighted.width.unevidenced}
      reasonsNote={overridesActive > 0 ? 'Analyst overrides are not itemised by reason: this table is the engine verdict.' : undefined}
    />
  );
}

/** What the aggregate does with Partial controls: the engine credits each one individually. */
function PartialCreditNote({ uploaded }: { uploaded: boolean }) {
  const s = stateFor(uploaded);
  const credit = s.partialCredit[0] / s.partialCredit[1];
  return (
    <StateProvenance uploaded={uploaded} from="after.partialCredit" className="mt-3 pt-3">
      <p data-testid="partial-credit-note" className="text-center text-[11px] text-slate-500">
        The {s.yellow} Partial controls here earn {credit.toFixed(2)} in total, credited one by one by the engine
        rather than at a flat weight. A control's page shows how its own share is credited.
      </p>
    </StateProvenance>
  );
}

const TOP_RISKS = [
  { id: 'JNCSF-307', label: 'Vulnerability scanning not established', why: '22 servers overdue for patches · exposes T1190', to: '/control/JNCSF-307' },
  { id: 'JNCSF-102', label: 'Least privilege not enforced', why: '43 privileged accounts without MFA · exposes T1078', to: '/control/JNCSF-102' },
  { id: 'JNCSF-30', label: 'Audit records incomplete', why: '3 of 9 audit subcategories off · reduces detection', to: '/control/JNCSF-30' },
];

function ExecutiveDashboard() {
  const uploaded = useAssessment((s) => s.evidenceUploaded);
  const overrides = useAssessment((s) => s.overriddenControls);
  const view = dashboardView(uploaded, overrides);
  const eff = view.effective;
  const cs = completenessStatement(uploaded);

  return (
    <div className="space-y-6">
      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <StateProvenance uploaded={uploaded} overridesActive={view.overridesActive} from="after.views.unweighted"><Card title="Compliance interval" subtitle="Executive summary — the band, not a number">
          <div className="py-3">
            <ScoreInterval
              lower={eff.lowerPct}
              upper={eff.upperPct}
              coveragePct={eff.coveragePct}
              widthPts={eff.widthPts}
              animateFrom={uploaded ? { lower: TOTALS.before.interval[0], upper: TOTALS.before.interval[1] } : undefined}
              subline={`Assurance ${cs.assurance}. ${cs.unauthored} controls have no evidence requirement authored; ${cs.unevidenced} are not yet evidenced.`}
            />
          </div>
          <WidthBreakdown uploaded={uploaded} eff={eff} overridesActive={view.overridesActive} />
          <PartialCreditNote uploaded={uploaded} />
        </Card></StateProvenance>
        <Provenance tier="illustrative"><Card title="Trend" subtitle="last four collection cycles">
          <div className="flex items-end gap-3">
            {[
              { q: 'Q4-25', lo: 41, hi: 92 },
              { q: 'Q1-26', lo: 46, hi: 90 },
              { q: 'Q2-26', lo: TOTALS.before.interval[0], hi: TOTALS.before.interval[1] },
              { q: uploaded ? 'now' : 'Q3-26', lo: uploaded ? eff.lowerPct : TOTALS.before.interval[0], hi: uploaded ? eff.upperPct : TOTALS.before.interval[1] },
            ].map((p) => (
              <div key={p.q} className="flex flex-1 flex-col items-center gap-1">
                <div className="relative h-24 w-3 rounded bg-slate-100">
                  <div className="absolute w-full rounded bg-accent/40" style={{ bottom: `${p.lo}%`, height: `${p.hi - p.lo}%` }} />
                </div>
                <span className="text-[10px] text-slate-400">{p.q}</span>
              </div>
            ))}
          </div>
          <p className="mt-2 inline-flex items-center gap-1 text-[11px] text-emerald-700">
            <TrendingUp size={12} /> band narrowing as coverage improves
          </p>
        </Card></Provenance>
      </div>

      <Provenance tier="illustrative"><Card title="Top 3 risks" subtitle="what to escalate">
        <ol className="space-y-2">
          {TOP_RISKS.map((r, i) => (
            <li key={r.id}>
              <Link to={r.to} className="flex items-start gap-3 rounded-lg border border-slate-200 p-3 hover:border-accent">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-100 text-xs font-bold text-red-700">{i + 1}</span>
                <span>
                  <span className="text-sm font-semibold text-slate-800">{r.label}</span>
                  <span className="block text-[12px] text-slate-500">{r.why}</span>
                </span>
              </Link>
            </li>
          ))}
        </ol>
      </Card></Provenance>

      <StateProvenance uploaded={uploaded} from="after.views.unweighted"><div className="rounded-xl border-2 border-slate-300 bg-white p-5">
        <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
          <Info size={14} /> Completeness statement
        </div>
        <p className="text-sm leading-relaxed text-slate-700">
          This assessment covers <strong className="tnum">{cs.covered} of {cs.applicable}</strong> applicable
          controls. <strong className="tnum">{cs.unknown}</strong> are not established:{' '}
          <strong className="tnum">{cs.unauthored}</strong> because no evidence requirement has been authored (a
          limitation of the tool) and <strong className="tnum">{cs.unevidenced}</strong> because evidence was not
          provided. Compliance is reported as an interval because a point estimate would conceal what was not established.
        </p>
        {CURRENT.cicsc.applies && (
          <p data-testid="cicsc-notice" className="mt-2 border-t border-slate-200 pt-2 text-sm leading-relaxed text-slate-700">
            This organisation operates critical infrastructure and is subject to the Critical Infrastructure
            Cyber Security Controls (405 controls, three implementation levels) in addition to the Jordan
            National Cybersecurity Framework. This assessment does not evaluate CICSC compliance, and a
            favourable JNCSF result does not represent complete assurance against the organisation's full
            regulatory obligation.
          </p>
        )}
      </div></StateProvenance>

      <p className="text-[11px] text-slate-400">
        Executive view — evidence excerpts, personal data and per-control detail are not shown. Switch role
        (top right) for the full assessment.
      </p>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const uploaded = useAssessment((s) => s.evidenceUploaded);
  const overrides = useAssessment((s) => s.overriddenControls);
  const profile = useAssessment((s) => s.profile);
  const challenge = useAssessment((s) => s.profileChallenge);
  const role = useAssessment((s) => s.role);

  if (role === 'executive') return <ExecutiveDashboard />;

  const t = uploaded ? TOTALS.after : TOTALS.before;
  const cov = coverageBreakdown(uploaded);
  const cs = completenessStatement(uploaded);
  const view = dashboardView(uploaded, overrides);
  const eff = view.effective;

  const cloudContradiction = uploaded && profile.usesCloud === 'no';

  const donut = [
    { name: 'Artifact-evidenced', value: cov.evidenced, fill: '#059669' },
    { name: 'Partial', value: cov.testimonyOnly, fill: '#d97706' },
    { name: 'Not evidenced — the organisation\'s', value: cov.unevidenced, fill: '#7c3aed' },
    { name: 'Not yet authored — the tool\'s', value: cov.unauthored, fill: '#c2410c' },
    { name: 'Structurally uncollectable', value: cov.uncollectable, fill: '#64748b' },
  ];

  const currentAssurance = (uploaded ? TOTALS.after : TOTALS.before).assurance;
  const assurance = assuranceMeasurement();
  const before = heldLevelReading('before');

  const gapData = gapReasonBreakdown().map((g) => ({
    reason: g.reason,
    name: GAP_REASON_LABEL[g.reason],
    count: uploaded ? g.after : g.before,
    invariant: g.invariant,
  }));
  const gapTotal = gapData.reduce((s, g) => s + g.count, 0);

  const naRate = (TOTALS.notApplicable / TOTALS.totalControls) * 100;
  const unjustified = CURRENT.exclusions.filter((e) => !e.justification).length;
  const naCheck = CURRENT.assurance.checks.find((c) => c.cause === 'na_rate_above_baseline');

  return (
    <div className="space-y-6">
      {!uploaded && (
        <div className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-800">
          <span>
            Pre-upload state — testimony and documents only. These figures are <strong>rule R&rsquo;s projection</strong> of the engine&rsquo;s data
            (the verdicts that rest on testimony or documents), not an engine run. Run the collector bundle on the{' '}
            <Link to="/intake" className="font-semibold underline">
              Intake
            </Link>{' '}
            screen to see the interval collapse.
          </span>
        </div>
      )}

      {cloudContradiction && !challenge && (
        <div className="rounded-lg border-2 border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">
          <div className="flex items-center gap-2 font-bold">
            <ShieldAlert size={16} /> Scoping contradiction — blocked pending review
          </div>
          <p className="mt-1">
            Your profile declares no cloud services, but the evidence bundle contains cloud agent entries
            in the software inventory. This scoping decision is blocked pending review on the{' '}
            <Link to="/profile" className="font-semibold underline">
              Profile
            </Link>{' '}
            screen.
          </p>
        </div>
      )}

      {view.overridesActive > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-blue-300 bg-blue-50 px-4 py-2.5 text-sm text-blue-900">
          <span>
            <strong>{view.overridesActive}</strong> analyst override
            {view.overridesActive === 1 ? '' : 's'} applied. Engine verdict:{' '}
            <span className="tnum">
              {fmt1(view.engine.lowerPct)}–{fmt1(view.engine.upperPct)}%
            </span>
            . With overrides:{' '}
            <span className="tnum font-semibold">
              {fmt1(eff.lowerPct)}–{fmt1(eff.upperPct)}%
            </span>
            .
          </span>
          <Link to="/gap-matrix?overrides=1" className="font-semibold underline">
            Review overrides
          </Link>
        </div>
      )}

      {/* Top row: three cards */}
      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr_1fr]">
        <StateProvenance uploaded={uploaded} overridesActive={view.overridesActive} from="after.views.unweighted"><Card dataTour="dash-interval" title="Compliance Interval" subtitle="Never a single percentage — the band is the cost of missing evidence">
          <p className="text-center text-[11px] text-slate-400">
            The <Term k="compliance interval">compliance interval</Term>: true compliance lies somewhere in
            this band. Its width is what the assessment could not establish.
          </p>
          <div className="py-3">
            <ScoreInterval
              lower={eff.lowerPct}
              upper={eff.upperPct}
              coveragePct={eff.coveragePct}
              widthPts={eff.widthPts}
              animateFrom={uploaded ? { lower: TOTALS.before.interval[0], upper: TOTALS.before.interval[1] } : undefined}
              subline={
                uploaded
                  ? `Interval narrowed after the Windows/AD collector bundle resolved ${unknownResolvedByUpload().resolved} of the ${unknownResolvedByUpload().from} Unknown controls in the authored scope. ${outsideScopeSentence()}`
                  : 'Width is the cost of missing evidence. '
              }
            />
            {!uploaded && (
              <p className="mx-auto -mt-1 max-w-md text-center text-xs text-slate-400">
                <Link to="/remediation" className="underline hover:text-slate-600">
                  See what evidence would narrow this
                </Link>{' '}
                — by the evidence the plan asks for, at best to {fmt1(bandFloorPts(cs.applicable, cs.unauthored + cs.uncollectable))} points: the other{' '}
                {cs.unauthored} controls have no evidence requirement authored.
              </p>
            )}
          </div>
          <WidthBreakdown uploaded={uploaded} eff={eff} overridesActive={view.overridesActive} />
          <PartialCreditNote uploaded={uploaded} />
        </Card></StateProvenance>

        <StateProvenance uploaded={uploaded} from="after.views.unweighted"><Card dataTour="dash-coverage" title="Coverage" subtitle={`${cs.covered} of ${cs.applicable} applicable controls`}>
          <div className="h-[190px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={donut} dataKey="value" nameKey="name" innerRadius={45} outerRadius={75} paddingAngle={2} isAnimationActive>
                  {donut.map((d) => (
                    <Cell key={d.name} fill={d.fill} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <ul className="mt-1 space-y-1">
            {donut.map((d) => (
              <li key={d.name} className="flex items-center justify-between text-[11px] text-slate-600">
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-sm" style={{ backgroundColor: d.fill }} />
                  {d.name}
                </span>
                <span className="tnum font-semibold text-slate-800">{d.value}</span>
              </li>
            ))}
          </ul>
          <p className="mt-1.5 text-[10px] text-slate-400">
            <Term k="coverage">Coverage</Term> is the share of applicable controls with evidence.
          </p>
          {uploaded && (
            <Provenance tier="illustrative" note="Worked-example dates: the assessment file carries no evidence dates." className="mt-2 border-t border-slate-100 pt-2">
              <p data-testid="evidence-freshness" className="text-[11px] text-slate-500">
                Oldest evidence: <span className="tnum font-semibold">{EVIDENCE_FRESHNESS.oldestDays} days</span>{' '}
                (<Link to={`/control/${EVIDENCE_FRESHNESS.oldestControl}`} className="text-accent hover:underline">{EVIDENCE_FRESHNESS.oldestControl}</Link>) ·{' '}
                {EVIDENCE_FRESHNESS.approachingStaleness} controls approaching staleness
              </p>
            </Provenance>
          )}
        </Card></StateProvenance>

        <StateProvenance uploaded={uploaded} from="assurance"><Card dataTour="dash-assurance" title="Assurance level" subtitle="How the evidence was established">
          <ol className="space-y-2">
            {ASSURANCE_LEVELS.map((l) => {
              const active = l.id === currentAssurance;
              return (
                <li key={l.id} className={`rounded-lg border px-3 py-2 ${active ? 'border-accent bg-accent/5' : 'border-slate-200'}`}>
                  <div className="flex items-center gap-2">
                    <span className={`rounded px-1.5 py-0.5 text-[11px] font-bold ${active ? 'bg-accent text-white' : 'bg-slate-100 text-slate-500'}`}>
                      {l.id}
                    </span>
                    <span className={`text-xs font-semibold ${active ? 'text-slate-900' : 'text-slate-500'}`}>{l.name}</span>
                  </div>
                  {active && <p data-testid="level-definition" className="mt-1 text-[11px] leading-snug text-slate-600">{levelDefinition(l.id)}</p>}
                </li>
              );
            })}
          </ol>
          {!uploaded && (
            <div data-testid="assurance-boundary" className="mt-3 rounded-lg bg-slate-50 p-3 text-[11px] leading-snug text-slate-700">
              <span className="tnum">
                {before.count} of {before.total} ({before.measuredPct}%) · threshold {before.thresholdPct}% · reported {before.level}
                {before.atBoundary ? ' — at the boundary' : ''}
              </span>
            </div>
          )}
          {uploaded && assurance.next && (
            <div data-testid="assurance-measurement" className="mt-3 rounded-lg bg-slate-50 p-3 text-[11px] leading-snug text-slate-600">
              <span className="font-semibold text-slate-800">The collection succeeded; the level did not rise.</span>{' '}
              {movedOutOfUnknown().total} controls moved out of Unknown ({movedOutOfUnknown().inside} in the authored scope,{' '}
              {movedOutOfUnknown().outside} outside it), and the assessment still did not raise its own confidence: the share of verdicts that are {assurance.qualifies} is below the threshold {assurance.next} requires.
              <div className="mt-1.5 text-slate-700" data-testid="assurance-numbers">
                Measured <strong className="tnum">{assurance.count} of {assurance.total} ({assurance.measuredPct}%)</strong> · threshold{' '}
                <strong className="tnum">{assurance.thresholdPct}%</strong> · reported <strong>{assurance.level}</strong>
              </div>
            </div>
          )}
          {uploaded && <DemotionChecks />}
        </Card></StateProvenance>
      </div>

      {/* Per-capability rows */}
      <StateProvenance uploaded={uploaded} from="after.capabilities"><Card dataTour="dash-capabilities" title="By capability" subtitle="Each capability carries its own interval and coverage figure">
        <div className="divide-y divide-slate-100">
          {capabilities.map((c) => {
            if (!c.organisationallyAssessable) {
              return (
                <div key={c.id} className="flex items-center justify-between py-3.5 opacity-70">
                  <div>
                    <div className="text-sm font-semibold text-slate-500">{c.name}</div>
                    <div className="text-[11px] text-slate-400">Not organisationally assessable — national obligation</div>
                  </div>
                  <Pill tone="slate">0 numbered controls</Pill>
                </div>
              );
            }
            const stat = uploaded ? c.after! : c.before!;
            return (
              <Link
                key={c.id}
                to={`/gap-matrix?cap=${c.id}`}
                className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-2 py-3.5 transition hover:bg-slate-50 sm:grid-cols-[200px_1fr_110px]"
              >
                <div>
                  <div className="text-sm font-semibold text-slate-800">{c.shortName}</div>
                  <div className="tnum text-[11px] text-slate-400">
                    {stat.green}G · {stat.yellow}Y · {stat.red}R · {stat.unknown} unknown · {stat.authored} of {stat.applicable} authored
                  </div>
                </div>
                <div className="order-3 col-span-2 sm:order-none sm:col-span-1">
                  <ScoreInterval variant="row" lower={stat.interval[0]} upper={stat.interval[1]} widthPts={stat.interval[1] - stat.interval[0]} />
                </div>
                <div className="text-right">
                  <div className="tnum text-sm font-bold text-slate-900">{stat.coveragePct.toFixed(1)}%</div>
                  <div className="text-[10px] uppercase tracking-wide text-slate-400">coverage</div>
                </div>
              </Link>
            );
          })}
        </div>
      </Card></StateProvenance>

      {/* The four published views of the one assessment; the weights that explain two of them sit inside */}
      <StateProvenance uploaded={uploaded} overridesActive={view.overridesActive} from="after.views">
        <FourViews uploaded={uploaded} effective={eff} overridesActive={view.overridesActive} />
      </StateProvenance>

      {/* Completeness + scope exclusions, side by side */}
      <div className="grid gap-5 lg:grid-cols-2">
        <StateProvenance uploaded={uploaded} from="after.views.unweighted"><div data-tour="dash-completeness" className="rounded-xl border-2 border-slate-300 bg-white p-5">
          <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
            <Info size={14} /> Completeness statement — cannot be dismissed
          </div>
          <p className="text-sm leading-relaxed text-slate-700">
            This assessment covers <strong className="tnum">{cs.covered} of {cs.applicable}</strong>{' '}
            <Term k="applicable controls">applicable controls</Term>.{' '}
            <strong className="tnum">{cs.unknown}</strong> are not established:{' '}
            <strong className="tnum">{cs.unauthored}</strong> because no evidence requirement has been authored (a
            limitation of the tool), <strong className="tnum">{cs.unevidenced}</strong> because evidence was not
            provided, and <strong className="tnum">{cs.uncollectable}</strong> because they are outside the tool's
            collection reach.{' '}
            <Term k="assurance level">Assurance level</Term>: <strong>{cs.assurance}</strong>. Compliance is
            reported as an interval because a point estimate would conceal what was not established.
          </p>
          {CURRENT.cicsc.applies && (
            <p data-testid="cicsc-notice" className="mt-2 border-t border-slate-200 pt-2 text-sm leading-relaxed text-slate-700">
              This organisation operates critical infrastructure and is subject to the Critical Infrastructure
              Cyber Security Controls (405 controls, three implementation levels) in addition to the Jordan
              National Cybersecurity Framework. This assessment does not evaluate CICSC compliance, and a
              favourable JNCSF result does not represent complete assurance against the organisation's full
              regulatory obligation.
            </p>
          )}
        </div></StateProvenance>

        <Provenance tier="measured" from="exclusions"><div className="rounded-xl border-2 border-amber-300 bg-amber-50/60 p-5">
          <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-700">
            <AlertTriangle size={14} /> Scope exclusions — {CURRENT.totals.excluded} of {CURRENT.totals.framework} controls
          </div>
          <p className="text-sm leading-relaxed text-slate-700">
            <strong className="tnum">{CURRENT.totals.excluded}</strong> controls ({fmt1(naRate)}%) are marked Not
            Applicable. {naCheck ? `The engine was not given a sector baseline to compare that rate with (its check: ${naCheck.status.replace('_', ' ')}).` : ''}
          </p>
          <p className="mt-1.5 text-[12px] text-slate-600">
            <strong className="tnum">{unjustified}</strong> exclusions carry no recorded justification ·{' '}
            {challenge ? '1 scoping challenge recorded' : cloudContradiction ? '1 scoping challenge overridden' : 'no scoping challenges'}
          </p>
          <button
            onClick={() => navigate('/exclusions')}
            className="mt-2 text-xs font-semibold text-accent hover:underline"
          >
            Review all {CURRENT.totals.excluded} exclusions →
          </button>
        </div></Provenance>
      </div>

      {/* Gap-reason breakdown */}
      <StateProvenance uploaded={uploaded} from="after.unevidencedByReason"><Card
        title="Why controls are Unknown"
        subtitle={
          uploaded
            ? `Breakdown of the ${gapTotal} Unknowns after the evidence bundle`
            : `Breakdown of the ${gapTotal} Unknowns before the evidence bundle`
        }
      >
        <div className="h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={gapData} layout="vertical" margin={{ left: 40, right: 40 }}>
              <XAxis type="number" hide />
              <YAxis type="category" dataKey="name" width={150} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="count" radius={[0, 4, 4, 0]} isAnimationActive>
                {gapData.map((g) => (
                  <Cell key={g.reason} fill={g.invariant ? '#94a3b8' : g.reason === 'unauthored' ? '#c2410c' : '#7c3aed'} />
                ))}
                <LabelList dataKey="count" position="right" className="tnum" />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-2 flex items-start gap-2 rounded-lg bg-slate-50 px-3 py-2 text-[11px] text-slate-600">
          <AlertTriangle size={13} className="mt-0.5 shrink-0 text-slate-400" />
          <span>
            <strong>not_requested = 0</strong> is a <em>design invariant</em>. The tool always asks for every
            artifact it needs; a non-zero value here would indicate a defect in the request planner.
          </span>
        </div>
        <Provenance tier="illustrative" note="Framework-wide figures from the engine's reports, not from this assessment file." className="mt-2">
        <div className="flex items-start gap-2 rounded-lg bg-slate-50 px-3 py-2 text-[11px] text-slate-600">
          <Info size={13} className="mt-0.5 shrink-0 text-slate-400" />
          <span>
            Every evidence signal records why it is or isn't negative-capable, framework-wide: of{' '}
            <strong className="tnum">{EVIDENCE_SIGNAL_TOTAL}</strong> signals,{' '}
            <strong className="tnum">{EVIDENCE_BASIS_BREAKDOWN.find((b) => b.basis === 'uncertainty')?.count}</strong>{' '}
            is false through uncertainty rather than rule or judgement — the recoverable case. Also,{' '}
            <strong className="tnum">{NO_CONCLUSIVE_PATH_STATS.noPath}</strong> of{' '}
            <strong className="tnum">{NO_CONCLUSIVE_PATH_STATS.authoredTotal}</strong> authored controls have no
            conclusive path at all — each such control's detail page states the limit.
          </span>
        </div>
        </Provenance>
      </Card></StateProvenance>

      {uploaded && (
        <div className="flex justify-end">
          <Link to="/gap-matrix?changed=1" className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent hover:underline">
            See the {changedControlCount().changed} of the {changedControlCount().applicable} controls that the upload changed in the Gap Matrix <ArrowUpRight size={15} />
          </Link>
        </div>
      )}
    </div>
  );
}
