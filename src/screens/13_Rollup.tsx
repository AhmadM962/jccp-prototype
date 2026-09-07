import { Check, X, Landmark } from 'lucide-react';
import { Card, Pill } from '../components/ui';
import { nationalRollup as r } from '../data/remediation';

const bandTotal = (b: (typeof r.distribution)[number]) => b.L1 + b.L2 + b.L3;

export default function Rollup() {
  const maxRow = Math.max(...r.distribution.map(bandTotal));
  return (
    <div className="space-y-5">
      <Card>
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10 text-accent">
            <Landmark size={22} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">National rollup — {r.sector} sector</h2>
            <p className="mt-1 text-sm text-slate-500">
              Anonymised regulator view. Distribution is over <strong>interval lower-bound bands</strong>, not
              point estimates, and is segmented by assurance level — an L1 entity "at 75%" and an L2 entity
              "at 75%" are not the same claim.
            </p>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <div className="tnum text-2xl font-bold text-slate-900">{r.submitted} / {r.entitiesInScope}</div>
          <div className="text-[11px] text-slate-500">entities submitted</div>
        </Card>
        <Card>
          <div className="tnum text-2xl font-bold text-amber-700">{r.overdue}</div>
          <div className="text-[11px] text-slate-500">overdue — no package received</div>
        </Card>
        <Card>
          <div className="tnum text-2xl font-bold text-slate-900">{r.entitiesInScope - r.submitted - r.overdue}</div>
          <div className="text-[11px] text-slate-500">not yet due</div>
        </Card>
      </div>

      <Card title="Compliance distribution" subtitle="interval lower-bound band × assurance level">
        <div className="space-y-2">
          {r.distribution.map((b) => (
            <div key={b.band} className="flex items-center gap-3">
              <span className="tnum w-28 shrink-0 text-xs text-slate-600">{b.band}</span>
              <div className="flex h-5 flex-1 overflow-hidden rounded bg-slate-100">
                {(['L1', 'L2', 'L3'] as const).map((lvl) => {
                  const v = b[lvl];
                  if (!v) return null;
                  const fill = lvl === 'L3' ? '#047857' : lvl === 'L2' ? '#1d4ed8' : '#94a3b8';
                  return (
                    <div key={lvl} className="h-full" style={{ width: `${(v / maxRow) * 100}%`, backgroundColor: fill }} title={`${lvl}: ${v}`} />
                  );
                })}
              </div>
              <span className="tnum w-6 text-right text-xs font-semibold text-slate-700">{bandTotal(b)}</span>
            </div>
          ))}
          <div className="flex items-center gap-3 opacity-60">
            <span className="tnum w-28 shrink-0 text-xs text-slate-500">(1 cell)</span>
            <div className="flex-1 rounded border border-dashed border-slate-300 px-2 py-0.5 text-[11px] text-slate-500">
              suppressed — fewer than {r.kAnonymityFloor} entities
            </div>
          </div>
        </div>
        <div className="mt-3 flex gap-4 text-[11px] text-slate-500">
          <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-slate-400" /> L1 Documented</span>
          <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-accent" /> L2 Tool-evidenced</span>
          <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-emerald-700" /> L3 Analyst-signed</span>
        </div>
        <p className="mt-2 text-[11px] text-slate-400">
          Cells with fewer than {r.kAnonymityFloor} entities are suppressed so a single organisation cannot be
          re-identified from the aggregate.
        </p>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Most frequently failed controls" subtitle="across submitted entities">
          <ul className="space-y-1.5">
            {r.mostFailedControls.map((c) => (
              <li key={c.id} className="flex items-center justify-between text-[12px]">
                <span className="text-slate-700"><span className="font-mono font-semibold">{c.id}</span> · {c.description}</span>
                <Pill tone="red">{c.failingEntities}/12</Pill>
              </li>
            ))}
          </ul>
        </Card>

        <Card title="Submission import log" subtitle="signed packages arriving at NCSC">
          <table className="w-full text-[12px]">
            <thead>
              <tr className="border-b border-slate-200 text-left text-[10px] uppercase tracking-wide text-slate-400">
                <th className="py-1.5 pr-3">Entity</th>
                <th className="py-1.5 pr-3">Received</th>
                <th className="py-1.5 pr-3">Signature</th>
                <th className="py-1.5">Assurance</th>
              </tr>
            </thead>
            <tbody>
              {r.imports.map((i) => (
                <tr key={i.entity} className="border-b border-slate-100 align-top">
                  <td className="py-2 pr-3 text-slate-700">{i.entity}</td>
                  <td className="py-2 pr-3 tnum text-slate-500">{i.received}</td>
                  <td className="py-2 pr-3">
                    {i.signature === 'verified' ? (
                      <span className="inline-flex items-center gap-1 text-emerald-700"><Check size={12} /> verified</span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-red-700"><X size={12} /> rejected</span>
                    )}
                    {i.note && <div className="text-[11px] text-red-600">{i.note}</div>}
                  </td>
                  <td className="py-2">{i.assurance}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    </div>
  );
}
