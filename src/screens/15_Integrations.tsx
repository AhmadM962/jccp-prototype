import { Lock, ShieldCheck, ArrowRight, Server, Globe2 } from 'lucide-react';
import { Card, Pill } from '../components/ui';
import { Provenance } from '../components/Provenance';
import { CURRENT } from '../data/current';
import { RAW_KEYS, bytesOf, crossingPayload, localAssessmentBytes, localControlResponse } from '../lib/submission';

const LOCAL_ENDPOINTS: { method: string; path: string; what: string; scopes: string }[] = [
  { method: 'POST', path: '/evidence/bundle', what: 'upload a collector bundle and its raw sibling file', scopes: 'evidence:write — owner, analyst, contributor (own slots)' },
  { method: 'GET', path: '/assessment/current', what: 'the whole assessment: every claim, in full', scopes: 'assessment:read — owner, analyst · assessment:summary — executive (interval only)' },
  { method: 'GET', path: '/controls/{id}', what: 'one control’s claim, with its grounds', scopes: 'control:read — owner, analyst' },
  { method: 'POST', path: '/override', what: 'record an analyst override (audit-logged, analyst-signed)', scopes: 'override:write — analyst; owner with step-up' },
];

/** The JSON of a payload, one line per row, with the lines that carry a raw field marked. */
function Json({ value, markRaw, testid }: { value: unknown; markRaw: boolean; testid: string }) {
  const lines = JSON.stringify(value, null, 2).split('\n');
  const rawRe = new RegExp(`"(${RAW_KEYS.join('|')})":`);
  return (
    <pre data-testid={testid} className="scroll-slim max-h-96 overflow-auto rounded bg-slate-900 p-3 font-mono text-[11px] leading-snug text-slate-100">
      {lines.map((l, i) => {
        const raw = markRaw && rawRe.test(l);
        return (
          <span key={i} data-raw={raw ? 'true' : undefined} className={`block ${raw ? 'bg-red-900/60 text-red-100' : ''}`}>
            {l}
            {raw && <span className="ml-2 rounded bg-red-700 px-1 text-[9px] font-bold uppercase text-white">raw</span>}
          </span>
        );
      })}
    </pre>
  );
}

export default function Integrations() {
  const local = localControlResponse();
  const crossing = crossingPayload();
  const crossingBytes = bytesOf(crossing);
  const localBytes = localAssessmentBytes();
  const rawCount = JSON.stringify(local.body).match(new RegExp(`"(${RAW_KEYS.join('|')})":`, 'g'))?.length ?? 0;

  return (
    <Provenance tier="planned" className="space-y-5">
      <div className="flex items-center gap-2">
        <Globe2 size={18} className="text-accent" />
        <h2 className="text-base font-semibold text-slate-900">Integrations</h2>
        <span className="text-[12px] text-slate-500">what the platform will expose, and what will cross the boundary. Nothing here is built; both payloads are filled from {CURRENT.source.file}.</span>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_auto_1fr]">
        {/* inside */}
        <div data-testid="half-inside" className="space-y-3">
          <Card title="Inside the organisation" subtitle="the appliance's local REST surface — raw evidence lives here and only here">
            <div className="mb-2 flex items-center gap-1.5 text-[11px] text-slate-500"><Lock size={12} /> token auth; scopes per role; on-premise, no internet</div>
            <ul className="space-y-2 text-sm">
              {LOCAL_ENDPOINTS.map((e) => (
                <li key={e.path} data-testid={`endpoint-${e.method}-${e.path}`} className="rounded-lg border border-slate-200 p-2.5">
                  <div className="flex items-center gap-2"><Pill tone={e.method === 'GET' ? 'blue' : 'amber'}>{e.method}</Pill><code className="font-mono text-[12px] font-semibold">{e.path}</code></div>
                  <div className="mt-0.5 text-[12px] text-slate-600">{e.what}</div>
                  <div className="text-[11px] text-slate-400">{e.scopes}</div>
                </li>
              ))}
            </ul>
          </Card>
          <Card title={`GET /controls/${local.body.control}`} subtitle={`200 · the full claim · ${rawCount} raw fields (marked)`}>
            <Json value={local} markRaw testid="payload-local" />
            <p data-testid="size-local" className="mt-2 text-[11px] text-slate-500">
              <code className="font-mono">GET /assessment/current</code> returns every one of the {CURRENT.claims.length} claims like this: <strong className="tnum">{localBytes.toLocaleString()}</strong> bytes.
            </p>
          </Card>
        </div>

        {/* boundary */}
        <div data-testid="boundary" className="flex flex-row items-center justify-center gap-2 lg:flex-col lg:py-10">
          <div className="hidden h-full w-px flex-1 bg-slate-300 lg:block" />
          <div className="space-y-3 text-center font-mono text-[11px]">
            <div className="rounded border border-red-200 bg-red-50 px-2 py-1.5 text-red-800">raw evidence ──✗── boundary</div>
            <div className="rounded border border-emerald-200 bg-emerald-50 px-2 py-1.5 text-emerald-800">signed statement ──✓──</div>
            <ArrowRight size={16} className="mx-auto text-slate-400" />
          </div>
          <div className="hidden h-full w-px flex-1 bg-slate-300 lg:block" />
        </div>

        {/* crossing */}
        <div data-testid="half-crossing" className="space-y-3">
          <Card title="Crossing to NCSC" subtitle="one endpoint, one payload: the signed OSCAL submission">
            <div className="rounded-lg border border-slate-200 p-2.5">
              <div className="flex items-center gap-2"><Pill tone="amber">POST</Pill><code className="font-mono text-[12px] font-semibold">/assessment-results</code> <span className="text-[11px] text-slate-400">at the address NCSC supplies</span></div>
              <div className="mt-0.5 text-[12px] text-slate-600">coverage metadata and the assurance level are inside the payload</div>
              <div className="text-[11px] text-slate-400"><ShieldCheck size={11} className="mr-1 inline" />signed outside the engine; outbound only, initiated by the organisation</div>
            </div>
          </Card>
          <Card title="POST /assessment-results" subtitle="verdicts, counts and hashes — no locator, no identifier, no verbatim text">
            <Json value={crossing} markRaw={false} testid="payload-crossing" />
            <p data-testid="size-crossing" className="mt-2 text-[11px] text-slate-500">
              <strong className="tnum">{crossingBytes.toLocaleString()}</strong> bytes, against <strong className="tnum">{localBytes.toLocaleString()}</strong> for the local assessment:{' '}
              <strong className="tnum">{Math.round((crossingBytes * 100) / localBytes)}%</strong> of the size, and none of the raw fields.
            </p>
          </Card>
        </div>
      </div>
      <p className="flex items-center gap-1.5 text-[11px] text-slate-400"><Server size={12} /> The platform never connects into the organisation&rsquo;s network; the organisation submits.</p>
    </Provenance>
  );
}
