import { Link } from 'react-router-dom';
import { BookCheck, CheckCircle2 } from 'lucide-react';
import { Card, Pill } from '../components/ui';
import { useAssessment } from '../store/useAssessment';
import { stateFor } from '../lib/views';
import { Provenance } from '../components/Provenance';
import { MINISTRY } from '../data/ministry';
import { EXCLUDED_COUNT, TOTAL_CONTROLS } from '../data/figures';
import {
  AUTHORED_CONTROLS,
  AUTHORING,
  CAPABILITY_AUTHORING,
  REACH,
  SIGNALS_TOTAL,
  UNAUTHORED_CONTROLS,
} from '../data/authoring';

// How much of the framework has a written evidence requirement, and what it would take to write the
// rest. Every figure is read from src/data/authoring.ts (or the assessment figures); none is typed here.

const pct1 = (n: number) => `${n.toFixed(1)}%`;

function Stat({ label, value, children, testid }: { label: string; value: React.ReactNode; children?: React.ReactNode; testid?: string }) {
  return (
    <div data-testid={testid} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{label}</div>
      <div className="tnum mt-1 text-2xl font-bold text-slate-900">{value}</div>
      {children && <div className="mt-1.5 text-[12px] leading-snug text-slate-600">{children}</div>}
    </div>
  );
}

export default function Authoring() {
  const uploaded = useAssessment((s) => s.evidenceUploaded);
  const del = CAPABILITY_AUTHORING.find((c) => c.id === 'del')!;
  // Delivery's Unknown controls in the state being viewed: before the evidence upload there are many more,
  // but none of them is Unknown for want of a requirement.
  const delNow = stateFor(uploaded).capabilities.del;
  const scope = MINISTRY.after.views.authored_scope;

  // Unauthored controls that apply to this organisation: the framework's unauthored controls less the
  // unauthored ones among the excluded. One authored control is excluded, so 18 of the 19 exclusions are unauthored.
  const authoredExcluded = AUTHORED_CONTROLS - scope.applicable;
  const unauthoredExcluded = EXCLUDED_COUNT - authoredExcluded;
  const unauthoredApplicable = UNAUTHORED_CONTROLS - unauthoredExcluded;
  const withVerdict = unauthoredApplicable - MINISTRY.after.unknownUnauthored;

  return (
    <Provenance tier="illustrative" className="space-y-6">
      {/* The proof the method finishes: one capability authored end to end */}
      <div
        data-testid="authoring-lead"
        className="rounded-2xl border-2 border-emerald-300 bg-emerald-50/60 p-6"
      >
        <div className="flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-800">
          <BookCheck size={15} /> Proof the work finishes
        </div>
        <div className="mt-2 flex flex-wrap items-baseline gap-3">
          <span data-testid="delivery-figure" className="tnum text-4xl font-extrabold text-slate-900">
            {del.authored} of {del.controls}
          </span>
          <span className="text-lg font-semibold text-slate-800">{del.name}</span>
          {del.complete && (
            <span data-testid="delivery-complete" className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2.5 py-0.5 text-xs font-bold text-white">
              <CheckCircle2 size={13} /> complete
            </span>
          )}
        </div>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-700">
          Every control in this capability has an evidence requirement. Writing the requirements down is finite work
          that can be finished one capability at a time, and where it is finished the tool's own gap closes: in this
          assessment {del.name} has <strong className="tnum">{delNow.unknown}</strong> Unknown controls, and{' '}
          <strong className="tnum">{delNow.unknownUnauthored}</strong> of them are Unknown for want of a requirement. The
          rest are the organisation's to evidence.
        </p>
      </div>

      {/* Scale */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Stat label="Authored" value={<>{AUTHORED_CONTROLS} <span className="text-base font-semibold text-slate-500">of {TOTAL_CONTROLS}</span></>} testid="stat-authored">
          <span className="tnum font-semibold">{AUTHORING.authoredConclusive}</span> with a conclusive path, which can reach Compliant ·{' '}
          <span className="tnum font-semibold">{AUTHORING.authoredIndicativeOnly}</span> indicative only, capped at Partial
        </Stat>
        <Stat label="Unauthored" value={UNAUTHORED_CONTROLS} testid="stat-unauthored">
          Across the framework. In this assessment <span className="tnum font-semibold">{unauthoredApplicable}</span> of them apply
          ({EXCLUDED_COUNT} controls are excluded as not applicable); <span className="tnum font-semibold">{MINISTRY.after.unknownUnauthored}</span> are Unknown
          and {withVerdict} carries a verdict. That share of the width is the tool's limitation —{' '}
          <Link to="/dashboard" className="font-semibold text-accent hover:underline">see the Dashboard</Link>.
        </Stat>
        <Stat label="Signals" value={SIGNALS_TOTAL} testid="stat-signals">
          <span className="tnum font-semibold">{AUTHORING.signals.machineCollected}</span> machine-collected ·{' '}
          <span className="tnum font-semibold">{AUTHORING.signals.documentary}</span> documentary
        </Stat>
        <Stat label="Negative-capable signals" value={<>{AUTHORING.signals.negativeCapable} <span className="text-base font-semibold text-slate-500">of {SIGNALS_TOTAL}</span></>} testid="stat-negative">
          A signal is negative-capable when its absence proves the negative; only these can support a Gap.
        </Stat>
        <Stat label="Evidence paths" value={AUTHORING.paths} testid="stat-paths">
          across the {AUTHORED_CONTROLS} authored controls
        </Stat>
        <Stat label="Prioritised authoring queue" value={AUTHORING.queue} testid="stat-queue">
          unauthored controls ready to be written first
        </Stat>
      </div>

      {/* Reach through the published mappings */}
      <Card
        title="Reach through the published mappings"
        subtitle="Controls that carry at least one code of the standard, so something published against it can be attached"
      >
        <div data-testid="reach" className="grid gap-4 sm:grid-cols-4">
          <div>
            <div className="text-[11px] uppercase tracking-wide text-slate-400">via NIST SP 800-53</div>
            <div className="tnum text-2xl font-bold text-slate-900" data-reach="nist">{REACH.nist}</div>
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-wide text-slate-400">via ISO/IEC 27002</div>
            <div className="tnum text-2xl font-bold text-slate-900" data-reach="iso">{REACH.iso}</div>
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-wide text-slate-400">via either</div>
            <div className="tnum text-2xl font-bold text-slate-900" data-reach="either">
              {REACH.either} <span className="text-base font-semibold text-slate-500">of {TOTAL_CONTROLS}</span>
            </div>
            <div className="tnum text-[12px] text-slate-500" data-reach="either-pct">{pct1(REACH.either_pct)}</div>
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-wide text-slate-400">via neither</div>
            <div className="tnum text-2xl font-bold text-slate-900" data-reach="neither">{REACH.neither}</div>
          </div>
        </div>
        <div className="mt-4 rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-700" data-testid="floor">
          <span className="font-semibold text-slate-800">Documentary floor for the remainder:</span> roughly{' '}
          <span className="tnum font-bold text-slate-900">{AUTHORING.documentaryFloor.low}–{AUTHORING.documentaryFloor.high}</span> new
          documentary signals would give every unauthored control at least an indicative path.
        </div>
      </Card>

      {/* By capability */}
      <Card title="By capability" subtitle="Where the authored work sits, and where it does not">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[620px] text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-[11px] uppercase tracking-wide text-slate-400">
                <th className="py-2 pr-4 font-medium">Capability</th>
                <th className="py-2 pr-4 text-right font-medium">Controls</th>
                <th className="py-2 pr-4 text-right font-medium">Of the framework</th>
                <th className="w-[26%] py-2 pr-4 font-medium">Authored</th>
                <th className="py-2 pr-4 text-right font-medium">Authored</th>
                <th className="py-2 pr-4 text-right font-medium">Unauthored</th>
                <th className="py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {CAPABILITY_AUTHORING.map((c) => (
                <tr
                  key={c.id}
                  data-capability={c.id}
                  data-complete={c.complete ? 'true' : 'false'}
                  className={`border-b border-slate-100 ${c.complete ? 'bg-emerald-50/50' : ''}`}
                >
                  <td className="py-2.5 pr-4 font-semibold text-slate-800">{c.name}</td>
                  <td className="tnum py-2.5 pr-4 text-right text-slate-700">{c.controls}</td>
                  <td className="tnum py-2.5 pr-4 text-right text-slate-500">{c.frameworkPct.toFixed(0)}%</td>
                  <td className="py-2.5 pr-4">
                    <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                      <div className={`h-full ${c.complete ? 'bg-emerald-500' : 'bg-orange-600'}`} style={{ width: `${c.authoredPct}%` }} />
                    </div>
                  </td>
                  <td className="tnum py-2.5 pr-4 text-right font-semibold text-slate-900">{c.authored}</td>
                  <td className="tnum py-2.5 pr-4 text-right text-slate-700">{c.unauthored}</td>
                  <td className="py-2.5">
                    {c.complete ? <Pill tone="green">complete</Pill> : <span className="tnum text-[12px] text-slate-500">{c.authoredPct.toFixed(1)}% authored</span>}
                  </td>
                </tr>
              ))}
              <tr className="font-semibold text-slate-900">
                <td className="py-2.5 pr-4">Framework</td>
                <td className="tnum py-2.5 pr-4 text-right" data-testid="cap-total-controls">{CAPABILITY_AUTHORING.reduce((n, c) => n + c.controls, 0)}</td>
                <td />
                <td />
                <td className="tnum py-2.5 pr-4 text-right" data-testid="cap-total-authored">{CAPABILITY_AUTHORING.reduce((n, c) => n + c.authored, 0)}</td>
                <td className="tnum py-2.5 pr-4 text-right" data-testid="cap-total-unauthored">{CAPABILITY_AUTHORING.reduce((n, c) => n + c.unauthored, 0)}</td>
                <td />
              </tr>
            </tbody>
          </table>
        </div>
      </Card>
    </Provenance>
  );
}
