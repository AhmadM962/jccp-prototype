import { Link } from 'react-router-dom';
import { ChevronRight, Sparkles } from 'lucide-react';
import StateBadge from './StateBadge';
import { Pill } from './ui';
import { capabilityById } from '../data/capabilities';
import {
  EVIDENCE_CLASS_LABEL,
  GAP_REASON_LABEL,
  type Control,
  type ControlSnapshot,
} from '../data/controls';

const evTone = (c: string): 'slate' | 'blue' | 'green' | 'violet' =>
  c === 'artifact' ? 'green' : c === 'testimonial' ? 'blue' : c === 'analyst_signed' ? 'violet' : 'slate';

/** One control of the active assessment. State, evidence class, reason, basis, path and run are the engine's (read from the
 *  golden file); the control text is shown only where the prototype holds it, and the Gap Matrix says once that it does not hold the rest. The `data-` attributes carry the same values
 *  the row shows, so a test can hold the screen to the data. */
export default function ControlRow({
  control,
  snap,
  highlight = false,
  dataTour,
}: {
  control: Control;
  snap: ControlSnapshot;
  highlight?: boolean;
  dataTour?: string;
}) {
  return (
    <Link
      data-tour={dataTour}
      data-testid={`control-row-${control.id}`}
      data-state={snap.state}
      data-capability={control.capability}
      data-gap-reason={snap.gapReason ?? ''}
      data-gap-basis={snap.gapBasis ?? ''}
      data-partial-basis={snap.partialBasis ?? ''}
      data-path-label={snap.pathLabel ?? ''}
      data-run-id={snap.runId ?? ''}
      to={`/control/${control.id}`}
      className={`flex items-center gap-3 border-b border-slate-100 px-4 py-2.5 text-sm transition hover:bg-slate-50 ${highlight ? 'bg-blue-50/60' : ''}`}
    >
      <div className="w-24 shrink-0">
        <StateBadge state={snap.state} size="sm" />
      </div>
      <div className="tnum w-24 shrink-0 font-mono text-xs font-semibold text-slate-500">{control.id}</div>
      <div className="min-w-0 flex-1">
        {control.description && <p className="truncate text-slate-800">{control.description}</p>}
        {snap.pathLabel && <p className="truncate text-[11px] text-slate-500">satisfied: {snap.pathLabel}</p>}
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          <Pill tone="slate">{capabilityById(control.capability)?.shortName ?? control.capability}</Pill>
          <Pill tone={evTone(snap.evidenceClass)}>{EVIDENCE_CLASS_LABEL[snap.evidenceClass]}</Pill>
          {snap.state === 'unknown' && snap.gapReason && (
            <Pill tone={snap.gapReason === 'unauthored' ? 'orange' : 'violet'}>{GAP_REASON_LABEL[snap.gapReason]}</Pill>
          )}
          {snap.state === 'red' && snap.gapBasis && <Pill tone="slate">gap basis: {snap.gapBasis}</Pill>}
          {snap.state === 'red' && snap.runId && <Pill tone="slate">run: {snap.runId}</Pill>}
          {snap.state === 'yellow' && snap.partialBasis && <Pill tone="slate">partial basis: {snap.partialBasis}</Pill>}
          {highlight && (
            <Pill tone="blue">
              <Sparkles size={11} /> promoted
            </Pill>
          )}
        </div>
      </div>
      <ChevronRight size={16} className="shrink-0 text-slate-300" />
    </Link>
  );
}
