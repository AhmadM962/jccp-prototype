import { ArrowRight, Shield, Crosshair, MinusCircle } from 'lucide-react';
import { attackBridge, type AttackEntry } from '../data/attack';

const MAPPED_COUNT = Object.keys(attackBridge).length;

// Control → Mitigation → Techniques, rendered as connected cards (brief §7.7 §5).
export default function AttackExposure({
  controlId,
  entry,
  enforced,
}: {
  controlId: string;
  entry?: AttackEntry;
  enforced: boolean;
}) {
  if (!entry) {
    return (
      <div className="flex items-start gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
        <MinusCircle size={15} className="mt-0.5 shrink-0 text-slate-400" />
        <span>
          <span className="font-semibold text-slate-800">No ATT&amp;CK mapping.</span> This is a governance
          control with no direct adversary-technique correspondence. {MAPPED_COUNT} of the 48 seeded controls
          carry mappings — the ones where a specific technique is enabled or blocked by the control.
        </span>
      </div>
    );
  }
  return (
    <div>
      <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
        <div className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-center">
          <div className="text-[10px] uppercase tracking-wide text-slate-400">Control</div>
          <div className="font-mono text-sm font-semibold text-slate-800">{controlId}</div>
        </div>
        <ArrowRight size={16} className="mx-auto shrink-0 rotate-90 text-slate-300 sm:rotate-0" />
        <div className="rounded-lg border border-blue-300 bg-blue-50 px-3 py-2 text-center">
          <div className="flex items-center justify-center gap-1 text-[10px] uppercase tracking-wide text-blue-500">
            <Shield size={11} /> Mitigation
          </div>
          <div className="text-sm font-semibold text-blue-800">{entry.mitigation}</div>
          <div className="text-[11px] text-blue-600">{entry.mitigationName}</div>
        </div>
        <ArrowRight size={16} className="mx-auto shrink-0 rotate-90 text-slate-300 sm:rotate-0" />
        <div className="flex flex-wrap gap-2">
          {entry.techniques.map((t) => (
            <div
              key={t.id}
              className={`rounded-lg border px-3 py-2 ${
                enforced ? 'border-slate-200 bg-slate-50 opacity-60' : 'border-red-300 bg-red-50'
              }`}
            >
              <div className="flex items-center gap-1 text-[10px] uppercase tracking-wide text-red-400">
                <Crosshair size={11} /> Technique
              </div>
              <div className={`font-mono text-sm font-semibold ${enforced ? 'text-slate-700' : 'text-red-800'}`}>
                {t.id}
              </div>
              <div className={`text-[11px] ${enforced ? 'text-slate-500' : 'text-red-600'}`}>{t.name}</div>
            </div>
          ))}
        </div>
      </div>

      <p className={`mt-3 text-sm ${enforced ? 'text-slate-500' : 'text-slate-700'}`}>
        {enforced ? (
          <>Because {controlId} is enforced, exposure to these techniques is mitigated by {entry.mitigation}.</>
        ) : (
          <>
            Because {controlId} is not enforced, you are exposed to{' '}
            {entry.techniques.map((t, i) => (
              <span key={t.id}>
                <span className="font-semibold">
                  {t.id} {t.name}
                </span>
                {i < entry.techniques.length - 1 ? ', ' : ''}
              </span>
            ))}
            .
          </>
        )}
      </p>
    </div>
  );
}
