import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Card } from '../components/ui';
import { Provenance } from '../components/Provenance';
import { capabilities } from '../data/capabilities';
import { CURRENT } from '../data/current';
import { controlText } from '../data/controls';

const pct1 = (n: number, d: number) => ((n * 100) / d).toFixed(1);

/** The scope-exclusion register: every row is the engine's (the control, the flag that excluded it, the value declared and
 *  the engine's own justification), read from the assessment file. Control text is shown only where the prototype holds it. */
export default function Exclusions() {
  const [params] = useSearchParams();
  const [capF, setCapF] = useState<string>(params.get('cap') ?? 'all');
  const [flagF, setFlagF] = useState<string>('all');

  const all = CURRENT.exclusions;
  const rows = useMemo(
    () => all.filter((e) => (capF === 'all' || e.capability === capF) && (flagF === 'all' || e.triggeringFlag === flagF)),
    [all, capF, flagF],
  );
  const capName = (id: string) => capabilities.find((c) => c.id === id)?.shortName ?? id;
  const flags = Array.from(new Set(all.map((e) => e.triggeringFlag)));
  const byCap = (Object.keys(CURRENT.after.capabilities) as (keyof typeof CURRENT.after.capabilities)[]).map((id) => ({ id, n: all.filter((e) => e.capability === id).length }));
  const naCheck = CURRENT.assurance.checks.find((c) => c.cause === 'na_rate_above_baseline');

  return (
    <div className="space-y-5">
      <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent hover:underline">
        <ArrowLeft size={15} /> Dashboard
      </Link>

      <Provenance tier="measured" from="exclusions">
        <Card title="Scope exclusion register" subtitle={`${CURRENT.totals.excluded} of ${CURRENT.totals.framework} JNCSF controls excluded from this assessment`}>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <div data-testid="na-rate" className="tnum text-2xl font-bold text-slate-900">{pct1(CURRENT.totals.excluded, CURRENT.totals.framework)}%</div>
              <div className="text-[11px] text-slate-500">Not-Applicable rate ({CURRENT.totals.excluded} of {CURRENT.totals.framework})</div>
            </div>
            <div>
              <div data-testid="na-baseline" className="text-sm font-semibold text-slate-800">Not compared with a baseline</div>
              <div className="text-[11px] text-slate-500">
                {naCheck ? `The engine's check: ${naCheck.status.replace('_', ' ')} — ${naCheck.detail}` : 'No sector baseline was supplied.'}
              </div>
            </div>
            <div>
              <div data-testid="unjustified" className="tnum text-2xl font-bold text-slate-900">{all.filter((e) => !e.justification).length}</div>
              <div className="text-[11px] text-slate-500">without a recorded justification</div>
            </div>
          </div>
        </Card>
      </Provenance>

      <div className="grid gap-4 sm:grid-cols-2">
        <Provenance tier="measured" from="exclusions">
          <Card title="Excluded by capability">
            <ul className="space-y-1.5 text-sm">
              {byCap.map((k) => (
                <li key={k.id} className="flex items-center justify-between">
                  <button onClick={() => setCapF(k.id)} className={`hover:underline ${capF === k.id ? 'font-semibold text-accent' : 'text-slate-700'}`}>
                    {capName(k.id)}
                  </button>
                  <span className="tnum font-semibold text-slate-800">{k.n}</span>
                </li>
              ))}
              <li className="flex items-center justify-between border-t border-slate-100 pt-1.5 text-slate-500">
                <span>National obligation (Capability 6)</span>
                <span className="tnum">—</span>
              </li>
            </ul>
          </Card>
        </Provenance>
        <Provenance tier="measured" from="exclusions">
          <Card title="Excluded by triggering flag">
            <ul className="space-y-1.5 text-sm">
              {flags.map((f) => (
                <li key={f} className="flex items-center justify-between">
                  <button onClick={() => setFlagF(f)} className={`hover:underline ${flagF === f ? 'font-semibold text-accent' : 'text-slate-700'}`}>
                    <code className="font-mono text-[12px]">{f}</code>
                    <span className="text-slate-400"> = {all.find((e) => e.triggeringFlag === f)!.triggeringValue}</span>
                  </button>
                  <span className="tnum font-semibold text-slate-800">{all.filter((e) => e.triggeringFlag === f).length}</span>
                </li>
              ))}
              {flags.length === 0 && <li className="text-slate-400">No control is excluded: every flag that could remove a control was declared yes.</li>}
            </ul>
          </Card>
        </Provenance>
      </div>

      <Provenance tier="measured" from="exclusions">
        <Card
          title={`Exclusions — ${rows.length} shown of ${all.length}`}
          right={
            <div className="flex flex-wrap items-center gap-2">
              <select value={capF} onChange={(e) => setCapF(e.target.value)} className="rounded-lg border border-slate-300 px-2 py-1.5 text-xs" aria-label="Capability">
                <option value="all">Any capability</option>
                {capabilities.filter((c) => c.organisationallyAssessable).map((c) => (
                  <option key={c.id} value={c.id}>{c.shortName}</option>
                ))}
              </select>
              <select value={flagF} onChange={(e) => setFlagF(e.target.value)} className="rounded-lg border border-slate-300 px-2 py-1.5 text-xs" aria-label="Triggering flag">
                <option value="all">Any triggering flag</option>
                {flags.map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>
          }
        >
          {all.length === 0 ? (
            <p data-testid="no-exclusions" className="text-sm text-slate-500">This assessment excludes no control: all {CURRENT.totals.framework} are applicable.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-[11px] uppercase tracking-wide text-slate-400">
                    <th className="py-2 pr-4">Control</th>
                    <th className="py-2 pr-4">Capability</th>
                    <th className="py-2 pr-4">Excluded because</th>
                    <th className="py-2 pr-4">Reason</th>
                    <th className="py-2">Justification (the engine&rsquo;s)</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((e) => (
                    <tr key={e.controlId} data-testid={`exclusion-${e.controlId}`} className="border-b border-slate-100 align-top">
                      <td className="py-2.5 pr-4 font-mono text-xs font-semibold text-slate-600">
                        {e.controlId}
                        {controlText(e.controlId) && <span className="mt-0.5 block font-sans text-[11px] font-normal text-slate-500">{controlText(e.controlId)}</span>}
                      </td>
                      <td className="py-2.5 pr-4 text-slate-700">{capName(e.capability)}</td>
                      <td className="py-2.5 pr-4"><code className="font-mono text-[11px] text-slate-600">{e.triggeringFlag} = {e.triggeringValue}</code></td>
                      <td className="py-2.5 pr-4"><code className="font-mono text-[11px] text-slate-600">{e.reason}</code></td>
                      <td className="py-2.5 text-slate-600">{e.justification}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <p className="mt-3 text-[11px] text-slate-400">
            Showing all {all.length} of {CURRENT.totals.excluded} exclusions in the assessment file: the full register for this assessment.
          </p>
        </Card>
      </Provenance>
    </div>
  );
}
