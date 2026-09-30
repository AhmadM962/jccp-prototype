import { useState } from 'react';
import { ArrowRight, Shield, Crosshair, MinusCircle, BadgeCheck, GitBranch, ChevronDown } from 'lucide-react';
import { attackBridge, ATTACK_COVERAGE, DIFFUSE_COLLAPSE_THRESHOLD, type AttackEntry } from '../data/attack';

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
  const [expanded, setExpanded] = useState(false);

  if (!entry) {
    return (
      <div className="flex items-start gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
        <MinusCircle size={15} className="mt-0.5 shrink-0 text-slate-400" />
        <span>
          <span className="font-semibold text-slate-800">No ATT&amp;CK mapping.</span> This is a governance
          control with no direct adversary-technique correspondence. {ATTACK_COVERAGE.mappedControls} of 576
          controls ({ATTACK_COVERAGE.mappedPct}%) carry a mapping — the ones where a specific technique is
          enabled or blocked by the control.
        </span>
      </div>
    );
  }

  const shown = expanded ? entry.techniques : entry.techniques.slice(0, DIFFUSE_COLLAPSE_THRESHOLD);
  const collapsedCount = entry.techniques.length - shown.length;

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
          <div
            className={`mt-1 inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] font-medium ${
              entry.source === 'official'
                ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                : 'border-slate-300 bg-slate-100 text-slate-500'
            }`}
            title={entry.sourceLabel}
          >
            {entry.source === 'official' ? (
              <>
                <BadgeCheck size={10} /> Official — NCSC Threat Annex
              </>
            ) : (
              <>
                <GitBranch size={10} /> Derived — transitive via NIST, reviewed
              </>
            )}
          </div>
        </div>
        <ArrowRight size={16} className="mx-auto shrink-0 rotate-90 text-slate-300 sm:rotate-0" />
        <div className="flex flex-wrap gap-2">
          {shown.map((t) => (
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
          {collapsedCount > 0 && (
            <button
              onClick={() => setExpanded(true)}
              className="flex flex-col items-center justify-center gap-0.5 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-2 text-[11px] font-medium text-slate-500 hover:border-slate-400 hover:text-slate-700"
            >
              <ChevronDown size={13} />
              and {collapsedCount} lower-confidence technique{collapsedCount === 1 ? '' : 's'}
            </button>
          )}
        </div>
      </div>

      {entry.techniques.length > DIFFUSE_COLLAPSE_THRESHOLD && (
        <p className="mt-2 text-[11px] text-slate-400">
          Derived mapping with a long transitive tail — showing the {DIFFUSE_COLLAPSE_THRESHOLD}
          {' '}highest-confidence techniques. A finding naming all {entry.techniques.length} tells a reader
          nothing; {expanded ? 'expanded on request.' : 'the rest are collapsed by default.'}
        </p>
      )}

      <p className={`mt-3 text-sm ${enforced ? 'text-slate-500' : 'text-slate-700'}`}>
        {enforced ? (
          <>Because {controlId} is enforced, exposure to these techniques is mitigated by {entry.mitigation}.</>
        ) : (
          <>
            Because {controlId} is not enforced, you are exposed to{' '}
            {shown.map((t, i) => (
              <span key={t.id}>
                <span className="font-semibold">
                  {t.id} {t.name}
                </span>
                {i < shown.length - 1 ? ', ' : ''}
              </span>
            ))}
            {collapsedCount > 0 ? <> and {collapsedCount} lower-confidence technique{collapsedCount === 1 ? '' : 's'}</> : ''}
            .
          </>
        )}
      </p>
    </div>
  );
}
