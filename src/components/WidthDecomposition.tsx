import { CURRENT, type Frac, type WidthParts } from '../data/current';
import { GAP_REASON_LABEL } from '../data/controls';
import { div, fmtPct, toPct } from '../lib/frac';
import { WIDTH_OWNER, assertWidthPartsSum, type ReasonRow, type WidthCause } from '../lib/views';
import FigureBoundary from './FigureBoundary';

// Why the range is wide, and whose limitation each part is. The width is split by cause so that a
// limitation of the tool is never reported as a failing of the organisation.

export const CAUSES: WidthCause[] = ['unauthored', 'unevidenced', 'uncollectable'];

/** Colours are fixed per cause everywhere they appear (this graphic, the coverage donut, the reason chart).
 *  Orange = ours (the tool's); violet = the organisation's; slate = structural. */
export const CAUSE_COLOUR: Record<WidthCause, string> = {
  unauthored: '#c2410c',
  unevidenced: '#7c3aed',
  uncollectable: '#64748b',
};

const DETAIL: Record<WidthCause, string> = {
  unauthored: 'no evidence requirement has been authored for these controls',
  unevidenced: 'a requirement exists and the evidence was not provided or could not be collected',
  uncollectable: 'no supported method can ever reach these controls',
};

export interface WidthDecompositionProps {
  parts: WidthParts;
  /** the band's width: the parts must sum exactly to it */
  width: Frac;
  /** controls behind each part */
  controls: Record<WidthCause, number>;
  /** the organisation's share itemised by reason; omitted in compact views */
  reasons?: ReasonRow[];
  /** the exact share the reasons add up to; defaults to the unevidenced part (differs when analyst overrides are applied) */
  reasonsTotal?: Frac;
  /** shown beside the reason table when it is not the whole story (e.g. analyst overrides are applied) */
  reasonsNote?: string;
}

function Body({ parts, width, controls, reasons, reasonsTotal, reasonsNote }: WidthDecompositionProps) {
  // the guard: a graphic whose parts do not sum to its width is a wrong graphic
  assertWidthPartsSum(parts, width, 'WidthDecomposition');
  const widthPts = toPct(width);
  const share = (c: WidthCause) => (widthPts === 0 ? 0 : toPct(div(parts[c], width)));
  const pts = (c: WidthCause) => fmtPct(parts[c], 2);
  const reasonTotal = reasons?.reduce((n, r) => n + r.count, 0) ?? 0;

  return (
    <div data-testid="width-decomposition" className="mt-4 border-t border-slate-100 pt-4 text-left">
      <h4 className="text-xs font-bold uppercase tracking-wide text-slate-500">Where the width comes from</h4>
      <div
        role="img"
        aria-label={`Width of ${fmtPct(width, 2)} points by cause: ${CAUSES.map((c) => `${pts(c)} ${c}, ${WIDTH_OWNER[c]}`).join('; ')}`}
        className="mt-2 flex h-7 w-full overflow-hidden rounded-md border border-slate-200 bg-slate-50"
      >
        {CAUSES.map((c) => (
          <div
            key={c}
            data-cause={c}
            data-share={share(c).toFixed(4)}
            style={{ width: `${share(c)}%`, backgroundColor: CAUSE_COLOUR[c] }}
            title={`${c}: ${pts(c)} points`}
          />
        ))}
      </div>
      <ul className="mt-2 space-y-1.5">
        {CAUSES.map((c) => (
          <li key={c} data-legend={c} className="flex items-start gap-2 text-[12px] leading-snug text-slate-700">
            <span aria-hidden className="mt-1 h-2.5 w-2.5 shrink-0 rounded-sm" style={{ backgroundColor: CAUSE_COLOUR[c] }} />
            <span>
              <span className="tnum font-bold text-slate-900">{pts(c)} points</span> — <code className="font-mono text-[11px]">{c}</code>:{' '}
              <strong>{WIDTH_OWNER[c]}</strong>
              <span className="text-slate-500">
                {' '}
                · <span className="tnum">{controls[c]}</span> controls · {DETAIL[c]}
                {c === 'unevidenced' && controls[c] > 0 ? ' (itemised below)' : ''}
              </span>
            </span>
          </li>
        ))}
      </ul>
      <p data-testid="width-sum-note" className="mt-2 text-[11px] text-slate-500">
        The three parts are asserted to sum exactly to the width, in exact fractions:{' '}
        <span className="tnum font-semibold text-slate-700">
          {pts('unauthored')} + {pts('unevidenced')} + {pts('uncollectable')} = {fmtPct(width, 2)} points
        </span>{' '}
        (each rounded to two decimals).
      </p>

      {reasons && (
        <div className="mt-3" data-testid="unevidenced-reasons">
          <h5 className="text-[11px] font-semibold text-slate-600">The organisation's share, by reason</h5>
          <table className="mt-1 w-full text-[12px]">
            <thead>
              <tr className="border-b border-slate-200 text-left text-[10px] uppercase tracking-wide text-slate-400">
                <th className="py-1 pr-3 font-medium">Reason</th>
                <th className="py-1 pr-3 text-right font-medium">Controls</th>
                <th className="py-1 text-right font-medium">Points</th>
              </tr>
            </thead>
            <tbody>
              {reasons.map((r) => (
                <tr key={r.reason} data-reason={r.reason} className="border-b border-slate-100">
                  <td className="py-1 pr-3 text-slate-700">{GAP_REASON_LABEL[r.reason]}</td>
                  <td className="tnum py-1 pr-3 text-right font-semibold text-slate-800">{r.count}</td>
                  <td className="tnum py-1 text-right text-slate-600">{r.pts.toFixed(2)}</td>
                </tr>
              ))}
              <tr className="font-semibold text-slate-900">
                <td className="py-1 pr-3">Total</td>
                <td className="tnum py-1 pr-3 text-right" data-testid="reasons-total">{reasonTotal}</td>
                <td className="tnum py-1 text-right">{fmtPct(reasonsTotal ?? parts.unevidenced, 2)}</td>
              </tr>
            </tbody>
          </table>
          <p className="mt-1 text-[10px] text-slate-400">
            Points are rounded to two decimals; the exact fractions sum exactly.{reasonsNote ? ` ${reasonsNote}` : ''}
          </p>
        </div>
      )}
    </div>
  );
}

export default function WidthDecomposition(props: WidthDecompositionProps) {
  return (
    <FigureBoundary resetKey={JSON.stringify([props.parts, props.width])}>
      <Body {...props} />
    </FigureBoundary>
  );
}

