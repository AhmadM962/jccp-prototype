import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AlertTriangle, ArrowLeft } from 'lucide-react';
import { Card, Pill } from '../components/ui';
import { useAssessment } from '../store/useAssessment';
import { capabilities, TOTALS } from '../data/capabilities';
import { EXCLUSIONS, EXCLUSION_COUNTS, EXCLUSION_TRIGGERS, SECTOR_BASELINE } from '../data/exclusions';
import { sectorById } from '../data/sectors';

const fmt1 = (n: number) => n.toFixed(1);

export default function Exclusions() {
  const [params] = useSearchParams();
  const sectorLabel = useAssessment((s) => sectorById(s.profile.sector).label);
  const [capF, setCapF] = useState<string>(params.get('cap') ?? 'all');
  const [factF, setFactF] = useState<string>('all');
  const [onlyUnjustified, setOnlyUnjustified] = useState(false);

  const rows = useMemo(
    () =>
      EXCLUSIONS.filter((e) => {
        if (capF !== 'all' && e.capability !== capF) return false;
        if (factF !== 'all' && e.triggerFact !== factF) return false;
        if (onlyUnjustified && e.justification) return false;
        return true;
      }),
    [capF, factF, onlyUnjustified],
  );

  const naRate = (TOTALS.notApplicable / TOTALS.totalControls) * 100;
  const unjustified = EXCLUSIONS.filter((e) => !e.justification).length;
  const capName = (id: string) => capabilities.find((c) => c.id === id)?.shortName ?? id;
  const facts = Array.from(new Set(EXCLUSIONS.map((e) => e.triggerFact)));

  return (
    <div className="space-y-5">
      <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent hover:underline">
        <ArrowLeft size={15} /> Dashboard
      </Link>

      <Card title="Scope exclusion register" subtitle={`${TOTALS.notApplicable} of ${TOTALS.totalControls} JNCSF controls excluded from this assessment`}>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <div className="tnum text-2xl font-bold text-slate-900">{fmt1(naRate)}%</div>
            <div className="text-[11px] text-slate-500">Not-Applicable rate</div>
          </div>
          <div>
            <div className="tnum text-2xl font-bold text-slate-900">{fmt1(SECTOR_BASELINE.naRatePct)}%</div>
            <div className="text-[11px] text-slate-500">
              {sectorLabel} sector baseline{' '}
              {naRate > SECTOR_BASELINE.naRatePct && <span className="font-semibold text-amber-700">· above</span>}
            </div>
          </div>
          <div>
            <div className="tnum text-2xl font-bold text-amber-700">{unjustified}</div>
            <div className="text-[11px] text-slate-500">without recorded justification</div>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card title="Excluded by capability">
          <ul className="space-y-1.5 text-sm">
            {(Object.keys(EXCLUSION_COUNTS) as (keyof typeof EXCLUSION_COUNTS)[]).map((k) => (
              <li key={k} className="flex items-center justify-between">
                <button
                  onClick={() => setCapF(k)}
                  className={`hover:underline ${capF === k ? 'font-semibold text-accent' : 'text-slate-700'}`}
                >
                  {capName(k)}
                </button>
                <span className="tnum font-semibold text-slate-800">{EXCLUSION_COUNTS[k]}</span>
              </li>
            ))}
            <li className="flex items-center justify-between border-t border-slate-100 pt-1.5 text-slate-500">
              <span>National obligation (Capability 6)</span>
              <span className="tnum">—</span>
            </li>
          </ul>
        </Card>
        <Card title="Excluded by triggering fact">
          <ul className="space-y-1.5 text-sm">
            {EXCLUSION_TRIGGERS.map((t) => (
              <li key={t.fact} className="flex items-center justify-between">
                <span className="text-slate-700">{t.label}</span>
                <span className="tnum font-semibold text-slate-800">{t.count}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card
        title={`Exclusions — ${rows.length} shown of ${EXCLUSIONS.length} seeded`}
        right={
          <div className="flex flex-wrap items-center gap-2">
            <select value={capF} onChange={(e) => setCapF(e.target.value)} className="rounded-lg border border-slate-300 px-2 py-1.5 text-xs">
              <option value="all">Any capability</option>
              {capabilities.filter((c) => c.organisationallyAssessable).map((c) => (
                <option key={c.id} value={c.id}>{c.shortName}</option>
              ))}
            </select>
            <select value={factF} onChange={(e) => setFactF(e.target.value)} className="rounded-lg border border-slate-300 px-2 py-1.5 text-xs">
              <option value="all">Any triggering fact</option>
              {facts.map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
            <label className="inline-flex items-center gap-1.5 text-xs text-slate-600">
              <input type="checkbox" checked={onlyUnjustified} onChange={(e) => setOnlyUnjustified(e.target.checked)} className="h-3.5 w-3.5" />
              Unjustified only
            </label>
          </div>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-[11px] uppercase tracking-wide text-slate-400">
                <th className="py-2 pr-4">Control</th>
                <th className="py-2 pr-4">Description</th>
                <th className="py-2 pr-4">Excluded because</th>
                <th className="py-2 pr-4">Triggered by</th>
                <th className="py-2">Justification</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((e) => (
                <tr key={e.id} className={`border-b border-slate-100 align-top ${!e.justification ? 'bg-amber-50/50' : ''}`}>
                  <td className="py-2.5 pr-4 font-mono text-xs font-semibold text-slate-600">{e.id}</td>
                  <td className="py-2.5 pr-4 text-slate-700">{e.description}</td>
                  <td className="py-2.5 pr-4"><code className="font-mono text-[11px] text-slate-600">{e.triggerFact}</code></td>
                  <td className="py-2.5 pr-4 text-slate-600">{e.triggeredBy}</td>
                  <td className="py-2.5">
                    {e.justification ? (
                      <span className="text-slate-600">{e.justification}</span>
                    ) : (
                      <Pill tone="amber">
                        <AlertTriangle size={11} /> none recorded
                      </Pill>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-[11px] text-slate-400">
          Showing all {EXCLUSIONS.length} of {TOTALS.notApplicable} exclusions — the full register for this
          organisation, not a sample.
        </p>
      </Card>
    </div>
  );
}
