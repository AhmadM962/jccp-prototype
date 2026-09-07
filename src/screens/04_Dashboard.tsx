import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
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
import { AlertTriangle, Info, ArrowUpRight } from 'lucide-react';
import { Card, Pill } from '../components/ui';
import ScoreInterval from '../components/ScoreInterval';
import { useAssessment } from '../store/useAssessment';
import { capabilities, TOTALS } from '../data/capabilities';
import { ASSURANCE_LEVELS } from '../lib/scoring';
import { coverageBreakdown, completenessStatement } from '../lib/coverage';
import { GAP_REASON_BREAKDOWN, GAP_REASON_LABEL } from '../data/controls';

export default function Dashboard() {
  const uploaded = useAssessment((s) => s.evidenceUploaded);
  const t = uploaded ? TOTALS.after : TOTALS.before;
  const cov = coverageBreakdown(uploaded);
  const cs = completenessStatement(uploaded);

  const donut = [
    { name: 'Artifact-evidenced', value: cov.evidenced, fill: '#059669' },
    { name: 'Testimony only', value: cov.testimonyOnly, fill: '#d97706' },
    { name: 'Unevidenced', value: cov.unevidenced, fill: '#7c3aed' },
    { name: 'Structurally uncollectable', value: cov.uncollectable, fill: '#64748b' },
  ];

  const currentAssurance = uploaded ? 'L2' : 'L1';

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

      {/* Top row: three cards */}
      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr_1fr]">
        <Card title="Compliance Interval" subtitle="Never a single percentage — the band is the cost of missing evidence">
          <div className="py-3">
            <ScoreInterval
              lower={t.interval[0]}
              upper={t.interval[1]}
              coveragePct={t.coveragePct}
              widthPts={t.widthPts}
              subline={
                uploaded
                  ? 'Interval narrowed after the Windows/AD collector bundle closed 90 evidence gaps.'
                  : 'Width is the cost of missing evidence. Provide 5 more artifacts to narrow this to ~10 points.'
              }
            />
          </div>
        </Card>

        <Card title="Coverage" subtitle={`${cs.covered} of ${cs.applicable} applicable controls`}>
          <div className="h-[190px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={donut}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={45}
                  outerRadius={75}
                  paddingAngle={2}
                  isAnimationActive
                >
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
        </Card>

        <Card title="Assurance level" subtitle="How the evidence was established">
          <ol className="space-y-2">
            {ASSURANCE_LEVELS.map((l) => {
              const active = l.id === currentAssurance;
              return (
                <li
                  key={l.id}
                  className={`rounded-lg border px-3 py-2 ${
                    active ? 'border-accent bg-accent/5' : 'border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded px-1.5 py-0.5 text-[11px] font-bold ${
                        active ? 'bg-accent text-white' : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {l.id}
                    </span>
                    <span className={`text-xs font-semibold ${active ? 'text-slate-900' : 'text-slate-500'}`}>
                      {l.name}
                    </span>
                  </div>
                  {active && <p className="mt-1 text-[11px] leading-snug text-slate-600">{l.definition}</p>}
                </li>
              );
            })}
          </ol>
        </Card>
      </div>

      {/* Per-capability rows */}
      <Card title="By capability" subtitle="Each capability carries its own interval and coverage figure">
        <div className="divide-y divide-slate-100">
          {capabilities.map((c) => {
            if (!c.organisationallyAssessable) {
              return (
                <div key={c.id} className="flex items-center justify-between py-3.5 opacity-70">
                  <div>
                    <div className="text-sm font-semibold text-slate-500">{c.name}</div>
                    <div className="text-[11px] text-slate-400">
                      Not organisationally assessable — national obligation
                    </div>
                  </div>
                  <Pill tone="slate">0 numbered controls</Pill>
                </div>
              );
            }
            const stat = uploaded ? c.after! : c.before!;
            return (
              <div key={c.id} className="grid grid-cols-[220px_1fr_120px] items-center gap-4 py-3.5">
                <div>
                  <div className="text-sm font-semibold text-slate-800">{c.shortName}</div>
                  <div className="tnum text-[11px] text-slate-400">
                    {stat.green}G · {stat.yellow}Y · {stat.red}R · {stat.unknown} unknown
                  </div>
                </div>
                <ScoreInterval
                  variant="row"
                  lower={stat.interval[0]}
                  upper={stat.interval[1]}
                  widthPts={stat.interval[1] - stat.interval[0]}
                />
                <div className="text-right">
                  <div className="tnum text-sm font-bold text-slate-900">{stat.coveragePct.toFixed(1)}%</div>
                  <div className="text-[10px] uppercase tracking-wide text-slate-400">coverage</div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Mandatory completeness statement — non-dismissible */}
      <div className="rounded-xl border-2 border-slate-300 bg-white p-5">
        <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
          <Info size={14} /> Completeness statement — cannot be dismissed
        </div>
        <p className="text-sm leading-relaxed text-slate-700">
          This assessment covers <strong className="tnum">{cs.covered} of {cs.applicable}</strong> applicable
          controls. <strong className="tnum">{cs.unevidenced}</strong> are unevidenced.{' '}
          <strong className="tnum">{cs.uncollectable}</strong> are outside the tool's collection reach.
          Assurance level: <strong>{cs.assurance}</strong>. Compliance is reported as an interval because a
          point estimate would conceal what was not established.
        </p>
      </div>

      {/* Gap-reason breakdown */}
      <Card
        title="Why controls are unevidenced"
        subtitle="Breakdown of the 126 Unknowns before the evidence bundle"
      >
        <div className="h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={GAP_REASON_BREAKDOWN.map((g) => ({
                name: GAP_REASON_LABEL[g.reason],
                count: g.count,
                invariant: g.invariant,
              }))}
              layout="vertical"
              margin={{ left: 40, right: 40 }}
            >
              <XAxis type="number" hide />
              <YAxis type="category" dataKey="name" width={150} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                {GAP_REASON_BREAKDOWN.map((g) => (
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
            <strong>not_requested = 0</strong> is a <em>design invariant</em>. The tool always asks for
            every artifact it needs; a non-zero value here would indicate a defect in the request planner.
          </span>
        </div>
      </Card>

      {uploaded && (
        <div className="flex justify-end">
          <Link
            to="/gap-matrix"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent hover:underline"
          >
            See the 90 promoted controls in the Gap Matrix <ArrowUpRight size={15} />
          </Link>
        </div>
      )}
    </div>
  );
}
