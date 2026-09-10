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
import ScoreInterval from '../components/ScoreInterval';
import { useAssessment } from '../store/useAssessment';
import { capabilities, TOTALS } from '../data/capabilities';
import { ASSURANCE_LEVELS } from '../lib/scoring';
import { coverageBreakdown, completenessStatement } from '../lib/coverage';
import { dashboardView } from '../lib/derive';
import { GAP_REASON_BREAKDOWN, GAP_REASON_LABEL } from '../data/controls';
import { EVIDENCE_FRESHNESS, ASSESSMENT_DATE } from '../data/evidence';
import { EXCLUSIONS, SECTOR_BASELINE } from '../data/exclusions';
import { sectorById } from '../data/sectors';
import { Term } from '../tour/Term';

const fmt1 = (n: number) => n.toFixed(1);

const TOP_RISKS = [
  { id: 'JNCSF-307', label: 'Vulnerability scanning not established', why: '22 servers overdue for patches · exposes T1190', to: '/control/JNCSF-307' },
  { id: 'JNCSF-102', label: 'Least privilege not enforced', why: '43 privileged accounts without MFA · exposes T1078', to: '/control/JNCSF-102' },
  { id: 'JNCSF-30', label: 'Audit records incomplete', why: '3 of 9 audit subcategories off · reduces detection', to: '/control/JNCSF-30' },
];

function ExecutiveDashboard() {
  const uploaded = useAssessment((s) => s.evidenceUploaded);
  const overrides = useAssessment((s) => s.overriddenControls);
  const operatesCI = useAssessment((s) => s.profile.operatesCriticalInfrastructure);
  const view = dashboardView(uploaded, overrides);
  const eff = view.effective;
  const cs = completenessStatement(uploaded);

  return (
    <div className="space-y-6">
      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <Card title="Compliance interval" subtitle="Executive summary — the band, not a number">
          <div className="py-3">
            <ScoreInterval
              lower={eff.lowerPct}
              upper={eff.upperPct}
              coveragePct={eff.coveragePct}
              widthPts={eff.widthPts}
              animateFrom={uploaded ? { lower: TOTALS.before.interval[0], upper: TOTALS.before.interval[1] } : undefined}
              subline={`Assurance ${uploaded ? 'L2 — Tool-evidenced' : 'L1 — Documented'}. ${cs.unevidenced} controls still unevidenced.`}
            />
          </div>
        </Card>
        <Card title="Trend" subtitle="last four collection cycles">
          <div className="flex items-end gap-3">
            {[
              { q: 'Q4-25', lo: 41, hi: 92 },
              { q: 'Q1-26', lo: 46, hi: 90 },
              { q: 'Q2-26', lo: 50.0, hi: 87.1 },
              { q: uploaded ? 'now' : 'Q3-26', lo: uploaded ? eff.lowerPct : 50, hi: uploaded ? eff.upperPct : 87.1 },
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
        </Card>
      </div>

      <Card title="Top 3 risks" subtitle="what to escalate">
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
      </Card>

      <div className="rounded-xl border-2 border-slate-300 bg-white p-5">
        <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
          <Info size={14} /> Completeness statement
        </div>
        <p className="text-sm leading-relaxed text-slate-700">
          This assessment covers <strong className="tnum">{cs.covered} of {cs.applicable}</strong> applicable
          controls. <strong className="tnum">{cs.unevidenced}</strong> are unevidenced. Compliance is reported
          as an interval because a point estimate would conceal what was not established.
        </p>
        {operatesCI && (
          <p className="mt-2 border-t border-slate-200 pt-2 text-sm leading-relaxed text-slate-700">
            This organisation operates critical infrastructure and is subject to the Critical Infrastructure
            Cyber Security Controls (405 controls, three implementation levels) in addition to the Jordan
            National Cybersecurity Framework. This assessment does not evaluate CICSC compliance, and a
            favourable JNCSF result does not represent complete assurance against the organisation's full
            regulatory obligation.
          </p>
        )}
      </div>

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
    { name: 'Testimony only', value: cov.testimonyOnly, fill: '#d97706' },
    { name: 'Unevidenced — collectable', value: cov.unevidenced, fill: '#7c3aed' },
    { name: 'Structurally uncollectable', value: cov.uncollectable, fill: '#64748b' },
  ];

  const currentAssurance = uploaded ? 'L2' : 'L1';

  const gapData = GAP_REASON_BREAKDOWN.map((g) => ({
    reason: g.reason,
    name: GAP_REASON_LABEL[g.reason],
    count: uploaded ? g.after : g.before,
    invariant: g.invariant,
  }));
  const gapTotal = gapData.reduce((s, g) => s + g.count, 0);

  const naRate = (TOTALS.notApplicable / TOTALS.totalControls) * 100;
  const unjustified = EXCLUSIONS.filter((e) => !e.justification).length;

  return (
    <div className="space-y-6">
      {!uploaded && (
        <div className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-800">
          <span>
            Pre-upload state — testimony only. Run the collector bundle on the{' '}
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
        <Card dataTour="dash-interval" title="Compliance Interval" subtitle="Never a single percentage — the band is the cost of missing evidence">
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
                  ? 'Interval narrowed after the Windows/AD collector bundle closed 90 evidence gaps.'
                  : 'Width is the cost of missing evidence. '
              }
            />
            {!uploaded && (
              <p className="mx-auto -mt-1 max-w-md text-center text-xs text-slate-400">
                <Link to="/remediation" className="underline hover:text-slate-600">
                  Provide 5 more artifacts
                </Link>{' '}
                to narrow this toward ~10 points.
              </p>
            )}
          </div>
        </Card>

        <Card dataTour="dash-coverage" title="Coverage" subtitle={`${cs.covered} of ${cs.applicable} applicable controls`}>
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
            <p className="mt-2 border-t border-slate-100 pt-2 text-[11px] text-slate-500">
              Oldest evidence: <span className="tnum font-semibold">{EVIDENCE_FRESHNESS.oldestDays} days</span>{' '}
              (<Link to={`/control/${EVIDENCE_FRESHNESS.oldestControl}`} className="text-accent hover:underline">{EVIDENCE_FRESHNESS.oldestControl}</Link>) ·{' '}
              {EVIDENCE_FRESHNESS.approachingStaleness} controls approaching staleness · assessed {ASSESSMENT_DATE}
            </p>
          )}
        </Card>

        <Card dataTour="dash-assurance" title="Assurance level" subtitle="How the evidence was established">
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
                  {active && <p className="mt-1 text-[11px] leading-snug text-slate-600">{l.definition}</p>}
                </li>
              );
            })}
          </ol>
          {uploaded && (
            <div className="mt-3 rounded-lg bg-slate-50 p-3 text-[11px] leading-snug text-slate-600">
              <span className="font-semibold text-slate-800">Why L2, not L3.</span> L3 requires analyst
              sign-off and every declared-estate module succeeding — the <code className="font-mono">logging</code>{' '}
              module failed.
              <div className="mt-1.5 text-slate-500">
                Demotion risks: 1 declined module · {Object.keys(overrides).length} analyst override
                {Object.keys(overrides).length === 1 ? '' : 's'} · N/A rate above sector baseline
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Per-capability rows */}
      <Card dataTour="dash-capabilities" title="By capability" subtitle="Each capability carries its own interval and coverage figure">
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
                    {stat.green}G · {stat.yellow}Y · {stat.red}R · {stat.unknown} unknown
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
      </Card>

      {/* Completeness + scope exclusions, side by side */}
      <div className="grid gap-5 lg:grid-cols-2">
        <div data-tour="dash-completeness" className="rounded-xl border-2 border-slate-300 bg-white p-5">
          <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
            <Info size={14} /> Completeness statement — cannot be dismissed
          </div>
          <p className="text-sm leading-relaxed text-slate-700">
            This assessment covers <strong className="tnum">{cs.covered} of {cs.applicable}</strong>{' '}
            <Term k="applicable controls">applicable controls</Term>.{' '}
            <strong className="tnum">{cs.unevidenced}</strong> are unevidenced.{' '}
            <strong className="tnum">{cs.uncollectable}</strong> are outside the tool's collection reach.{' '}
            <Term k="assurance level">Assurance level</Term>: <strong>{cs.assurance}</strong>. Compliance is
            reported as an interval because a point estimate would conceal what was not established.
          </p>
          {profile.operatesCriticalInfrastructure && (
            <p className="mt-2 border-t border-slate-200 pt-2 text-sm leading-relaxed text-slate-700">
              This organisation operates critical infrastructure and is subject to the Critical Infrastructure
              Cyber Security Controls (405 controls, three implementation levels) in addition to the Jordan
              National Cybersecurity Framework. This assessment does not evaluate CICSC compliance, and a
              favourable JNCSF result does not represent complete assurance against the organisation's full
              regulatory obligation.
            </p>
          )}
        </div>

        <div className="rounded-xl border-2 border-amber-300 bg-amber-50/60 p-5">
          <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-700">
            <AlertTriangle size={14} /> Scope exclusions — {TOTALS.notApplicable} of {TOTALS.totalControls} controls
          </div>
          <p className="text-sm leading-relaxed text-slate-700">
            <strong className="tnum">{TOTALS.notApplicable}</strong> controls ({fmt1(naRate)}%) are marked Not
            Applicable. Sector baseline for {sectorById(profile.sector).label}:{' '}
            <span className="tnum">{fmt1(SECTOR_BASELINE.naRatePct)}%</span> —{' '}
            {naRate > SECTOR_BASELINE.naRatePct ? (
              <span className="font-semibold text-amber-800">⚠ your rate is above baseline</span>
            ) : (
              <span>in line with baseline</span>
            )}
            .
          </p>
          <p className="mt-1.5 text-[12px] text-slate-600">
            <strong className="tnum">{unjustified}</strong> exclusions carry no recorded justification ·{' '}
            {challenge ? '1 scoping challenge recorded' : cloudContradiction ? '1 scoping challenge overridden' : 'no scoping challenges'}
          </p>
          <button
            onClick={() => navigate('/exclusions')}
            className="mt-2 text-xs font-semibold text-accent hover:underline"
          >
            Review all {TOTALS.notApplicable} exclusions →
          </button>
        </div>
      </div>

      {/* Gap-reason breakdown */}
      <Card
        title="Why controls are unevidenced"
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
                  <Cell key={g.reason} fill={g.invariant ? '#94a3b8' : '#7c3aed'} />
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
      </Card>

      {uploaded && (
        <div className="flex justify-end">
          <Link to="/gap-matrix?changed=1" className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent hover:underline">
            See the 90 promoted controls in the Gap Matrix <ArrowUpRight size={15} />
          </Link>
        </div>
      )}
    </div>
  );
}
