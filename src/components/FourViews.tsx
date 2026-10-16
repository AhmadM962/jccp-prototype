import { Card, Pill } from './ui';
import ScoreInterval from './ScoreInterval';
import { CURRENT } from '../data/current';
import {
  FRAMEWORK_WEIGHTED_TOTALS,
  RISK_WEIGHT_TABLE,
  RISK_WEIGHT_TABLE_TOTAL,
  RISK_WEIGHTED_TOTALS,
  RISK_WEIGHTING_EXPLAINER,
  UNDERIVED_SHARE_PCT,
} from '../data/riskWeighting';
import type { DashboardFigures } from '../lib/derive';
import { stateFor, viewPercents, AUTHORED_SCOPE_LABEL, VIEW_LABEL, VIEW_ORDER, type ViewPercents } from '../lib/views';

// The four published views of one assessment. Each hides something different, so none is shown alone,
// and the one that flatters (authored scope) announces what it leaves out beside its own numbers.

const BLURB: Record<(typeof VIEW_ORDER)[number], string> = {
  unweighted: 'Every applicable control counts equally.',
  weighted_including_underived: 'Each control counts by its NIST baseline weight; controls with no derived weight count in full.',
  weighted_derived_only: 'Only the controls that have a derived weight, counted by that weight.',
  authored_scope: 'Only what the tool has an evidence requirement for.',
};

const p2 = (n: number) => `${n.toFixed(2)}%`;

/** The label authored_scope always carries. Rendered by the row itself, so it cannot be left out. */
function AuthoredScopeLabel() {
  return (
    <span data-testid="authored-scope-label" className="mt-1 inline-flex items-start gap-1 rounded-md border border-orange-300 bg-orange-50 px-1.5 py-0.5 text-[10px] font-medium leading-snug text-orange-900">
      {AUTHORED_SCOPE_LABEL}
    </span>
  );
}

export default function FourViews({
  uploaded,
  effective,
  overridesActive,
}: {
  uploaded: boolean;
  /** the headline figures, which follow analyst overrides; the unweighted row shows these */
  effective: DashboardFigures;
  overridesActive: number;
}) {
  const state = stateFor(uploaded);
  const rows = VIEW_ORDER.map((id) => {
    const v = state.views[id];
    const pct: ViewPercents =
      id === 'unweighted'
        ? {
            ...viewPercents(v),
            lowerPct: effective.lowerPct,
            upperPct: effective.upperPct,
            widthPts: effective.widthPts,
            coveragePct: effective.coveragePct,
            unknown: effective.buckets.unknown,
            known: effective.buckets.applicable - effective.buckets.unknown,
          }
        : viewPercents(v);
    return { id, pct };
  });
  const A = CURRENT.weightBasisCounts;
  const sumOf = (o: Record<string, number>) => Object.values(o).reduce((a, b) => a + b, 0);

  return (
    <Card
      dataTour="dash-views"
      title="Four views of the same assessment"
      subtitle="Scored four ways. Each one hides something different, so none is shown alone."
    >
      <div className="overflow-x-auto">
        <table data-testid="four-views" className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-[11px] uppercase tracking-wide text-slate-400">
              <th className="py-2 pr-4 font-medium">View</th>
              <th className="w-[26%] py-2 pr-4 font-medium">Band</th>
              <th className="py-2 pr-3 text-right font-medium">Low</th>
              <th className="py-2 pr-3 text-right font-medium">High</th>
              <th className="py-2 pr-3 text-right font-medium">Width (pts)</th>
              <th className="py-2 pr-3 text-right font-medium">Controls</th>
              <th className="py-2 text-right font-medium">Coverage</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ id, pct }) => (
              <tr key={id} data-view={id} className={`border-b border-slate-100 align-top ${id === 'authored_scope' ? 'bg-orange-50/40' : ''}`}>
                <td className="py-3 pr-4">
                  <div className="font-semibold text-slate-800">
                    {VIEW_LABEL[id]} {id === 'authored_scope' && <Pill tone="orange">partial view</Pill>}
                  </div>
                  <div className="text-[11px] leading-snug text-slate-500">{BLURB[id]}</div>
                  {id === 'authored_scope' && <AuthoredScopeLabel />}
                </td>
                <td className="py-3 pr-4">
                  <ScoreInterval variant="row" lower={pct.lowerPct} upper={pct.upperPct} widthPts={pct.upperPct - pct.lowerPct} />
                </td>
                <td className="tnum py-3 pr-3 text-right font-semibold text-slate-900" data-cell="low">{p2(pct.lowerPct)}</td>
                <td className="tnum py-3 pr-3 text-right font-semibold text-slate-900" data-cell="high">{p2(pct.upperPct)}</td>
                <td className="tnum py-3 pr-3 text-right text-slate-700" data-cell="width">{pct.widthPts.toFixed(2)}</td>
                <td className="tnum py-3 pr-3 text-right text-slate-700" data-cell="controls">{pct.applicable}</td>
                <td className="tnum py-3 text-right text-slate-700" data-cell="coverage">{p2(pct.coveragePct)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {overridesActive > 0 && (
        <p className="mt-2 text-[11px] text-slate-500">
          Analyst overrides are applied to the unweighted view only. The other three show the engine verdict, because
          they need per-control weights and scope that an override does not carry.
        </p>
      )}

      <div className="mt-5 border-t border-slate-100 pt-4" data-testid="weights">
        <h4 className="text-xs font-bold uppercase tracking-wide text-slate-500">How the two weighted views weight the controls</h4>
        <p className="mt-1 text-[12px] leading-relaxed text-slate-600">
          Counted over the {sumOf(A.applicable)} applicable controls: the population the totals below are computed over.
        </p>
        <div className="mt-2 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-[11px] uppercase tracking-wide text-slate-400">
                <th className="py-2 pr-4 font-medium">Basis</th>
                <th className="py-2 pr-4 text-right font-medium">Controls</th>
                <th className="py-2 text-right font-medium">Weight</th>
              </tr>
            </thead>
            <tbody>
              {RISK_WEIGHT_TABLE.map((r) => (
                <tr key={r.basis} data-basis={r.basis} className={`border-b border-slate-100 ${r.underived ? 'bg-amber-50/50' : ''}`}>
                  <td className="py-2 pr-4 text-slate-700">
                    {r.basis}
                    {r.underived && <span className="ml-1.5 text-[10px] text-amber-700">({UNDERIVED_SHARE_PCT}% of applicable controls)</span>}
                  </td>
                  <td className="tnum py-2 pr-4 text-right font-semibold text-slate-800">{r.controls}</td>
                  <td className="tnum py-2 text-right text-slate-600">{r.weight.toFixed(1)}{r.underived ? ' (conservative default)' : ''}</td>
                </tr>
              ))}
              <tr className="font-semibold text-slate-900">
                <td className="py-2 pr-4">All applicable controls</td>
                <td className="tnum py-2 pr-4 text-right" data-testid="weights-total">{RISK_WEIGHT_TABLE_TOTAL}</td>
                <td />
              </tr>
            </tbody>
          </table>
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-slate-200 p-3">
            <div className="text-[11px] uppercase tracking-wide text-slate-400">Total weight, derived only</div>
            <div className="tnum text-xl font-bold text-slate-900" data-testid="weight-derived">{RISK_WEIGHTED_TOTALS.derivedOnly}</div>
          </div>
          <div className="rounded-lg border border-amber-200 bg-amber-50/40 p-3">
            <div className="text-[11px] uppercase tracking-wide text-amber-700">Total weight, including underived</div>
            <div className="tnum text-xl font-bold text-slate-900" data-testid="weight-including">{RISK_WEIGHTED_TOTALS.includingUnderived}</div>
          </div>
        </div>
        <p className="mt-2 text-[11px] leading-relaxed text-slate-500">
          Both totals are shown together, never one derived from the other. The{' '}
          <span className="tnum font-semibold text-slate-700">{RISK_WEIGHTED_TOTALS.gap}</span> between them is the
          weight of the {A.applicable.underived} underived controls, which count in full: real uncertainty about
          weight, not noise to average away. {RISK_WEIGHTING_EXPLAINER}
        </p>
        <p className="mt-1 text-[11px] leading-relaxed text-slate-400" data-testid="weights-framework-note">
          Over all {FRAMEWORK_WEIGHTED_TOTALS.controls} controls in the framework, before the {FRAMEWORK_WEIGHTED_TOTALS.excluded}{' '}
          not-applicable ones are set aside, the same weights give {FRAMEWORK_WEIGHTED_TOTALS.derivedOnly.toFixed(1)} derived-only and{' '}
          {FRAMEWORK_WEIGHTED_TOTALS.includingUnderived.toFixed(1)} including {FRAMEWORK_WEIGHTED_TOTALS.underived} underived: a
          different population, not a different answer.
        </p>
      </div>
    </Card>
  );
}
