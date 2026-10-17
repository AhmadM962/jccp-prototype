import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, FileCode2 } from 'lucide-react';
import { Card, Pill } from './ui';
import { Provenance } from './Provenance';
import { COLLECTOR_SIGNALS, controlsFor, FAILURE_RULE } from '../lib/collector';
import script from '../../collectors/windows_ad/Collect-JccpEvidence.ps1?raw';

/** What the Windows/AD collector will do, signal by signal: the exact query, the shape of what comes back, what is kept
 *  in the reduced statement, and the query → signal → control chain. `planned`: the collector exists as a script to be
 *  read; it has not been run, and no bundle on this screen came from it. */
export default function CollectorTranscript() {
  const [showScript, setShowScript] = useState(false);
  return (
    <Provenance tier="planned">
      <Card
        dataTour="collector-transcript"
        title="Collector transcript"
        subtitle="What the Windows/AD collector runs — read-only, six queries, no credentials stored"
      >
        <ol data-testid="collector-signals" className="space-y-3">
          {COLLECTOR_SIGNALS.map((s) => {
            const controls = controlsFor(s.engineSignal);
            return (
              <li key={s.id} data-testid={`collector-${s.id}`} className="rounded-lg border border-slate-200 p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-[12px] font-bold text-slate-900">{s.id}</span>
                  <Pill tone={s.negativeCapable ? 'green' : 'slate'}>{s.negativeCapable ? 'negative-capable' : 'cannot prove a negative'}</Pill>
                </div>
                <pre data-testid="collector-query" className="mt-1.5 overflow-x-auto whitespace-pre-wrap break-all rounded bg-slate-900 px-2.5 py-1.5 font-mono text-[11px] text-slate-100">{s.query}</pre>
                <dl className="mt-1.5 space-y-0.5 text-[11px] text-slate-600">
                  <div><dt className="inline text-slate-400">raw record: </dt><dd className="inline font-mono">{`{ ${s.shape.join(', ')} }`}</dd></div>
                  <div><dt className="inline text-slate-400">reduced statement: </dt><dd className="inline font-mono">{'{ signal_id, negative_capable, query_text, record_count, records_sha256, result }'}</dd></div>
                  <div><dt className="inline text-slate-400">records_sha256: </dt><dd className="inline">SHA-256 of the canonical JSON of the raw records, computed at run time</dd></div>
                  <div>
                    <dt className="inline text-slate-400">query → signal → controls: </dt>
                    <dd className="inline">
                      <span data-testid="mapping-proposed" className="mr-1.5 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800">proposed mapping — not yet authored</span>
                      <code className="font-mono">{s.id}</code> → <code className="font-mono">{s.engineSignal}</code> →{' '}
                      {controls.length === 0 ? 'no control in this assessment names it' : controls.map((c) => (
                        <Link key={c} to={`/control/${c}`} className="mr-1.5 font-mono text-accent hover:underline">{c}</Link>
                      ))}
                    </dd>
                  </div>
                  <div className="text-slate-500">{s.why}</div>
                </dl>
              </li>
            );
          })}
        </ol>
        <p className="mt-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[12px] text-slate-700">{FAILURE_RULE}</p>
        <p className="mt-2 text-[11px] text-slate-500">
          Each mapping from a query to the engine&rsquo;s signal is a proposed mapping, not yet authored: authoring is the owner&rsquo;s. The collector has not been run against a live domain, and the
          bundle in this prototype did not come from it.
        </p>
        <button
          onClick={() => setShowScript((v) => !v)}
          aria-expanded={showScript}
          className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-accent hover:underline"
        >
          <FileCode2 size={13} /> {showScript ? 'Hide' : 'Show'} the script <code className="font-mono font-normal text-slate-500">collectors/windows_ad/Collect-JccpEvidence.ps1</code>
          <ChevronDown size={13} className={showScript ? '' : '-rotate-90'} />
        </button>
        {showScript && (
          <pre data-testid="collector-script" className="scroll-slim mt-2 max-h-96 overflow-auto rounded bg-slate-900 p-3 font-mono text-[11px] leading-snug text-slate-100">{script}</pre>
        )}
      </Card>
    </Provenance>
  );
}
