import { useState, type ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Check, X, ShieldCheck, FileQuestion, Crosshair } from 'lucide-react';
import { Card, Pill, Button, SectionLabel } from '../components/ui';
import { Provenance, StateProvenance } from '../components/Provenance';
import StateBadge, { STATE_META } from '../components/StateBadge';
import { useAssessment, ROLE_LABEL, type OverrideRecord } from '../store/useAssessment';
import {
  controlById,
  controls,
  snapshotFor,
  EVIDENCE_CLASS_LABEL,
  EVIDENCE_KIND_LABEL,
  GAP_BASIS_LABEL,
  GAP_REASON_LABEL,
  PARTIAL_BASIS_LABEL,
  EVIDENCE_CEILING,
  type EvidenceClass,
  type ControlState,
} from '../data/controls';
import { CURRENT } from '../data/current';
import { capabilityById } from '../data/capabilities';
import { IntervalConsistencyError, YELLOW_QUARTILE_NAME, yellowQuartileForShare, yellowWeightForShare } from '../lib/scoring';
import { toNumber } from '../lib/frac';

const LADDER: EvidenceClass[] = ['none', 'testimonial', 'artifact', 'analyst_signed'];

function OverrideModal({
  controlId,
  from,
  to,
  onCancel,
  onConfirm,
}: {
  controlId: string;
  from: ControlState;
  to: ControlState;
  onCancel: () => void;
  onConfirm: (justification: string) => void;
}) {
  const [j, setJ] = useState('');
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4" onClick={onCancel}>
      <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">Analyst override — {controlId}</h3>
          <button onClick={onCancel} className="text-slate-400 hover:text-slate-700"><X size={16} /></button>
        </div>
        <p className="mt-2 text-sm text-slate-600">
          Changing engine verdict <StateBadge state={from} size="sm" /> → <StateBadge state={to} size="sm" />.
          An override sets the evidence class to <strong>analyst-signed</strong> — it does not bypass the
          state ceiling, it asserts a higher class of evidence. It is recorded in the audit trail and
          surfaced in the OSCAL Assessment Results as analyst-attested.
        </p>
        <textarea
          value={j}
          onChange={(e) => setJ(e.target.value)}
          rows={3}
          placeholder="Justification (required) — what did you review, and why does it warrant this verdict?"
          className="mt-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <div className="mt-3 flex justify-end gap-2">
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          <Button variant="primary" disabled={j.trim().length < 12} onClick={() => onConfirm(j.trim())}>
            Record override
          </Button>
        </div>
      </div>
    </div>
  );
}

/** One labelled line of the measured panel. */
function Fact({ label, testid, children }: { label: string; testid?: string; children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5 py-1.5 text-sm">
      <dt className="w-44 shrink-0 text-[12px] text-slate-400">{label}</dt>
      <dd data-testid={testid} className="min-w-0 flex-1 text-slate-800">{children}</dd>
    </div>
  );
}

const pct = (x: number) => `${Math.round(x * 1000) / 10}%`;

export default function ControlDetail() {
  const { id } = useParams();
  const control = id ? controlById(id) : undefined;
  const uploaded = useAssessment((s) => s.evidenceUploaded);
  const role = useAssessment((s) => s.role);
  const overrides = useAssessment((s) => s.overriddenControls);
  const overrideControl = useAssessment((s) => s.overrideControl);
  const clearOverride = useAssessment((s) => s.clearOverride);

  const [pending, setPending] = useState<ControlState | null>(null);

  if (!control) {
    return (
      <Card>
        <p className="text-sm text-slate-600">
          No such control. <Link to="/gap-matrix" className="text-accent underline">Back to the Gap Matrix</Link>.
        </p>
      </Card>
    );
  }

  const claim = control.claim;
  const base = snapshotFor(control, uploaded);
  const ov = overrides[control.id];
  const effectiveState: ControlState = ov?.state ?? base.state;
  const effectiveClass: EvidenceClass = ov ? 'analyst_signed' : base.evidenceClass;
  const cap = capabilityById(control.capability);
  // the ranking is the engine's output for the assessed state: it is not shown for the before-upload projection
  const ranked = uploaded ? CURRENT.ranking.items.filter((it) => it.controlId === control.id) : [];
  const ceiling = EVIDENCE_CEILING[effectiveClass];
  const canOverride = role === 'analyst' || role === 'owner';


  // The partial credit this control earns is the engine's (`claim.credit`); the quartile it falls in is shown from the
  // share's lower bound. A `claimed` share is capped at the second quartile, so the credit can be lower than the quartile's.
  const share = claim.share;
  const shareLower = share?.interval?.lower ?? share?.value ?? null;
  const claimedShare = share?.interval?.basis === 'claimed';
  let creditText: string | undefined;
  if (base.credit && base.state === 'yellow') {
    creditText = `partial credit ${toNumber(base.credit)}`;
    if (shareLower !== null && claim.partialBasis === 'share') {
      // the prototype's own quartile model must agree with the engine's credit, or the figure is withheld
      const expected = yellowWeightForShare(shareLower, claimedShare ? 'claimed' : 'measured');
      if (Math.abs(expected - toNumber(base.credit)) > 1e-9) {
        throw new IntervalConsistencyError('ControlDetail', `Credit for ${control.id} is ${toNumber(base.credit)} but the quartile model gives ${expected}`);
      }
      const q = yellowQuartileForShare(shareLower);
      creditText += ` (${YELLOW_QUARTILE_NAME[q]}${claimedShare && q < 2 ? `; capped at the ${YELLOW_QUARTILE_NAME[2]} because the share is claimed, not counted` : ''})`;
    }
  }

  const related = controls()
    .filter((c) => c.id !== control.id && c.capability === control.capability)
    .slice(0, 4);

  const applyOverride = (to: ControlState) => {
    if (to === effectiveState && !ov) return;
    setPending(to);
  };

  return (
    <div className="space-y-5">
      <Link to="/gap-matrix" className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent hover:underline">
        <ArrowLeft size={15} /> Gap Matrix
      </Link>

      {/* 1. Header */}
      <StateProvenance uploaded={uploaded} overridesActive={ov ? 1 : 0} from="claims">
        <Card>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-2xl">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-sm font-bold text-slate-500">{control.id}</span>
                {cap && <Pill tone="slate">{cap.shortName}</Pill>}
                {uploaded && control.changed && <Pill tone="blue">changed by the upload</Pill>}
                {ov && <Pill tone="violet">analyst override</Pill>}
              </div>
              {control.description ? (
                <h2 className="mt-2 text-lg font-semibold leading-snug text-slate-900">{control.description}</h2>
              ) : (
                <h2 className="mt-2 text-sm font-medium text-slate-400">Control text is not held in this prototype.</h2>
              )}
              <p className="mt-1 text-[11px] text-slate-400">Assessment as of {CURRENT.asOf.slice(0, 10)}</p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <StateBadge state={effectiveState} size="lg" />
              <Pill tone={effectiveClass === 'artifact' ? 'green' : effectiveClass === 'testimonial' ? 'blue' : effectiveClass === 'analyst_signed' ? 'violet' : 'slate'}>
                {EVIDENCE_CLASS_LABEL[effectiveClass]}
              </Pill>
              {base.state === 'unknown' && base.gapReason && (
                <Pill tone={base.gapReason === 'unauthored' ? 'orange' : 'violet'}>{GAP_REASON_LABEL[base.gapReason]}</Pill>
              )}
            </div>
          </div>
        </Card>
      </StateProvenance>

      {/* 2. What the engine concluded — every value here is read from the assessment file */}
      <StateProvenance uploaded={uploaded} overridesActive={ov ? 1 : 0} from="claims">
        <Card dataTour="cd-measured" title="What the engine concluded" subtitle={uploaded ? 'Read from the assessment file named at the top of the page' : 'Before the upload: which verdicts exist is rule R’s projection'}>
          <dl data-testid="measured-panel" className="divide-y divide-slate-100">
            <Fact label="State" testid="measured-state">
              <span data-state={base.state}>{STATE_META[base.state].label}</span>
              {uploaded && control.changed && <span className="text-slate-400"> · {STATE_META[control.before.state].label} before the upload (projection)</span>}
            </Fact>
            <Fact label="Evidence" testid="measured-evidence">
              {EVIDENCE_CLASS_LABEL[base.evidenceClass]}
              {base.evidenceKind && <span className="text-slate-500"> · {EVIDENCE_KIND_LABEL[base.evidenceKind]} <code className="font-mono text-[11px]">({base.evidenceKind})</code></span>}
            </Fact>
            {base.state === 'unknown' && base.gapReason && (
              <Fact label="Why Unknown" testid="measured-gap-reason">
                {GAP_REASON_LABEL[base.gapReason]} <code className="font-mono text-[11px] text-slate-500">({base.gapReason})</code>
              </Fact>
            )}
            {base.state === 'red' && base.gapBasis && (
              <Fact label="Gap basis" testid="measured-gap-basis">
                <code className="font-mono text-[12px]">{base.gapBasis}</code>
                <span className="text-slate-500"> — {GAP_BASIS_LABEL[base.gapBasis]}</span>
              </Fact>
            )}
            {base.state === 'red' && base.runId && (
              <Fact label="Module run" testid="measured-run">
                <code className="font-mono text-[12px]">{base.runId}</code>
                <span className="text-slate-500"> — the successful run whose complete enumeration found nothing</span>
              </Fact>
            )}
            {base.state === 'yellow' && base.partialBasis && (
              <Fact label="Partial basis" testid="measured-partial-basis">
                <code className="font-mono text-[12px]">{base.partialBasis}</code>
                <span className="text-slate-500"> — {PARTIAL_BASIS_LABEL[base.partialBasis]}</span>
              </Fact>
            )}
            {base.pathLabel && (
              <Fact label="Satisfied path" testid="measured-path">{base.pathLabel}</Fact>
            )}
            {share && (share.value !== null || share.interval) && (
              <Fact label="Deployment share" testid="measured-share">
                {share.value !== null && <span className="tnum">{pct(share.value)}</span>}
                {share.basis && <span className="text-slate-500"> ({share.basis})</span>}
                {share.interval && share.value === null && (
                  <span className="tnum">
                    {pct(share.interval.lower)}–{pct(share.interval.upper)} <span className="text-slate-500">({share.interval.basis}; lower bound {share.interval.lowerBoundSource})</span>
                  </span>
                )}
                {share.interval?.lowerBoundSource === 'host_census' && Boolean(share.interval.census) && (
                  <span className="block text-[12px] text-slate-500">
                    {(share.interval.census as Record<string, number>).compliant_hosts} of {(share.interval.census as Record<string, number>).all_hosts} hosts compliant,{' '}
                    {(share.interval.census as Record<string, number>).unreached_hosts} not reached: a host the collector did not reach is never a Gap.
                  </span>
                )}
                {creditText && <span className="block text-[12px] text-slate-600">— {creditText}</span>}
              </Fact>
            )}
            {!share && creditText && <Fact label="Credit" testid="measured-credit">{creditText}</Fact>}
            {claim.enforcement && (
              <Fact label="Enforcement mode" testid="measured-enforcement">
                {claim.enforcement.mode}
                {claim.enforcement.basis && <span className="text-slate-500"> ({claim.enforcement.basis})</span>}
              </Fact>
            )}
            {claim.population && <Fact label="Population">{claim.population}</Fact>}
            {claim.reasoning && <Fact label="Engine's note" testid="measured-reasoning">{claim.reasoning}</Fact>}
            <Fact label="Risk weight" testid="measured-weight">
              <span className="tnum">{toNumber(control.weight)}</span> <span className="text-slate-500">({claim.weightBasis})</span>
            </Fact>
            <Fact label="Evidence requirement">{control.authored ? 'authored' : 'not authored'}</Fact>
          </dl>

          {claim.contradicted && claim.contradicted.length > 0 && (
            <div data-testid="contradicted-testimony" className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-[12px]">
              <div className="font-semibold text-slate-700">Testimony the conclusion went against (retained, not outvoted)</div>
              <ul className="mt-1.5 space-y-2">
                {claim.contradicted.map((t, i) => (
                  <li key={i} className="text-slate-700">
                    <span className="font-mono text-[11px] text-slate-500">{t.basis}</span> · {t.respondentRole} ({t.stance})
                    <div className="text-slate-600">{t.contradictedBy}</div>
                    <div className="font-mono text-[11px] text-slate-400">{t.locator} · {t.signalKey}</div>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {claim.overruled && claim.overruled.length > 0 && (
            <p className="mt-3 text-[12px] text-slate-600">{claim.overruled.length} document{claim.overruled.length === 1 ? '' : 's'} overruled by machine evidence, retained on the claim.</p>
          )}
        </Card>
      </StateProvenance>

      {/* 3. Standards mapping — the NCSC catalogue content the prototype holds for this control (not from the assessment) */}
      {(control.iso.length > 0 || control.nist.length > 0 || control.description) && (
        <Provenance tier="illustrative" note="Catalogue content the prototype carries for this control; it is not part of the assessment file.">
          <Card title="Standards mapping" subtitle="ISO/IEC 27002 and NIST SP 800-53">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <SectionLabel>ISO 27002</SectionLabel>
                <div className="flex flex-wrap gap-1.5">
                  {control.iso.length === 0 && <span className="text-sm text-slate-400">—</span>}
                  {control.iso.map((ref, i) => (
                    <Pill key={ref} tone="blue" title={control.isoNames[i]}>{ref} · {control.isoNames[i]}</Pill>
                  ))}
                </div>
              </div>
              <div>
                <SectionLabel>NIST 800-53</SectionLabel>
                <div className="flex flex-wrap gap-1.5">
                  {control.nist.length === 0 && <span className="text-sm text-slate-400">—</span>}
                  {control.nist.map((ref, i) => (
                    <Pill key={ref} tone="slate" title={control.nistNames[i]}>{ref} · {control.nistNames[i]}</Pill>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </Provenance>
      )}

      {/* 4. Evidence — an unauthored control has none to show: no requirement was ever written, so nothing was sought. */}
      {!control.authored && (
        <div
          data-testid="unauthored-statement"
          className="flex items-start gap-3 rounded-xl border-2 border-orange-300 bg-orange-50 p-4 text-sm text-orange-950"
        >
          <FileQuestion size={18} className="mt-0.5 shrink-0 text-orange-600" />
          <div>
            <p className="font-semibold">No evidence requirement has been authored for this control.</p>
            <p className="mt-1 leading-relaxed text-orange-900">
              The tool has not yet been told what would count as evidence that this control is met, so it did not
              look for that.
              {effectiveState === 'unknown' &&
                ' This is a limitation of the tool, not a finding about the organisation: nothing here says the control is met, and nothing says it is not.'}{' '}
              Uploading evidence cannot establish that this control is met.
            </p>
          </div>
        </div>
      )}

      {/* 5. Evidence sufficiency ladder: the engine's rule applied to this control's measured evidence class */}
      {control.authored && (
        <StateProvenance uploaded={uploaded} overridesActive={ov ? 1 : 0} from="claims">
          <Card title="Evidence sufficiency" subtitle="The evidence class sets the highest state a control may reach">
            <div className="flex items-stretch gap-2">
              {LADDER.map((cls) => {
                const current = cls === effectiveClass;
                return (
                  <div key={cls} className={`flex-1 rounded-lg border p-3 text-center ${current ? 'border-accent bg-accent/5' : 'border-slate-200'}`}>
                    <div className={`text-xs font-semibold ${current ? 'text-slate-900' : 'text-slate-400'}`}>{EVIDENCE_CLASS_LABEL[cls]}</div>
                    <div className="mt-1.5 flex justify-center">
                      <StateBadge state={EVIDENCE_CEILING[cls]} size="sm" showLabel={false} />
                    </div>
                    <div className="mt-1 text-[10px] text-slate-400">ceiling: {STATE_META[EVIDENCE_CEILING[cls]].label}</div>
                    {current && <div className="mt-1 text-[10px] font-bold uppercase text-accent">current</div>}
                  </div>
                );
              })}
            </div>
            <p className="mt-3 text-[12px] text-slate-500">
              This control's evidence is <strong>{EVIDENCE_CLASS_LABEL[effectiveClass]}</strong>, so it can reach
              at most <strong>{STATE_META[ceiling].label}</strong>. Testimony alone can never mark a control
              Compliant — only machine-collected artifacts or an analyst signature.
            </p>
          </Card>
        </StateProvenance>
      )}

      {/* 6. ATT&CK exposure: the engine's, where the control is ranked */}
      {ranked.length > 0 && (
        <Provenance tier="measured" from="ranking.items" note="The engine's exposure for this control's ranked action.">
          <Card dataTour="cd-attack" title="ATT&CK exposure (engine)" subtitle="From the ranking in the assessment file">
            {ranked.slice(0, 1).map((it) => (
              <div key={it.rank + it.description} data-testid="engine-attack" className="text-sm text-slate-700">
                <div className="flex flex-wrap items-center gap-2">
                  <Crosshair size={14} className="text-slate-400" />
                  <code className="font-mono text-[12px]">{it.attack.exposure}</code>
                </div>
                <p className="mt-1 text-[12px] text-slate-600">
                  {it.attack.techniqueIds.length} technique{it.attack.techniqueIds.length === 1 ? '' : 's'} shown
                  {it.attack.techniqueIds.length > 0 && <>: <span className="font-mono">{it.attack.techniqueIds.join(', ')}</span></>}; {it.attack.broadCount} broad, {it.attack.diffuseCount} diffuse,{' '}
                  <strong>{it.attack.suppressedCount} suppressed</strong> by the engine (withheld, not counted as exposure).
                </p>
              </div>
            ))}
          </Card>
        </Provenance>
      )}
      {/* How to evidence this */}
      {control.authored && (base.state === 'unknown' || base.evidenceClass === 'testimonial') && ranked.length > 0 && (
        <Card title="How to evidence this" subtitle="Move this control out of Unknown / off the Yellow ceiling">
          {ranked.length > 0 && (
            <Provenance tier="measured" from="ranking.items" note="The engine's ranked action for this control.">
              <ul data-testid="engine-actions" className="space-y-1.5 text-sm text-slate-700">
                {ranked.map((it) => (
                  <li key={it.description} className="flex items-start gap-2">
                    <Check size={14} className="mt-0.5 shrink-0 text-slate-300" />
                    <span>
                      {it.description} <span className="text-slate-400">· rank {it.rank} · {it.actionType}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </Provenance>
          )}
          <Link to="/remediation" className="mt-3 inline-block text-xs font-semibold text-accent hover:underline">
            Open in Remediation
          </Link>
        </Card>
      )}

      {/* 8. Analyst actions + audit trail */}
      <Card title="Analyst actions" subtitle={canOverride ? 'Overrides are recorded and move the dashboard interval' : `Read-only in the ${ROLE_LABEL[role]} view`}>
        <div className="flex flex-wrap gap-2">
          <Button variant={effectiveState === 'green' ? 'primary' : 'outline'} disabled={!canOverride} onClick={() => applyOverride('green')}>
            Accept as Compliant
          </Button>
          <Button variant={effectiveState === 'red' ? 'danger' : 'outline'} disabled={!canOverride} onClick={() => applyOverride('red')}>
            Override to Gap
          </Button>
          <Button variant="outline" disabled={!canOverride} onClick={() => applyOverride('unknown')}>
            Set to Unknown — request more evidence
          </Button>
          {ov && (
            <Button variant="ghost" onClick={() => clearOverride(control.id)}>
              Clear override (engine verdict: {STATE_META[base.state].label})
            </Button>
          )}
        </div>

        {ov && (
          <div className="mt-4 rounded-lg border border-violet-200 bg-violet-50 p-3 text-[12px]">
            <div className="flex items-center gap-1.5 font-semibold text-violet-900">
              <ShieldCheck size={13} /> Override audit record
            </div>
            <table className="mt-1.5 text-slate-700">
              <tbody>
                <tr><td className="pr-3 text-slate-400">was</td><td>{STATE_META[ov.previousState].label}</td></tr>
                <tr><td className="pr-3 text-slate-400">now</td><td>{STATE_META[ov.state].label} · analyst-signed</td></tr>
                <tr><td className="pr-3 text-slate-400">by</td><td>{ov.analystId}</td></tr>
                <tr><td className="pr-3 text-slate-400">at</td><td className="tnum">{ov.timestamp}</td></tr>
                <tr><td className="pr-3 align-top text-slate-400">why</td><td>“{ov.justification}”</td></tr>
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Related controls */}
      <Card title="Related controls" subtitle={`Other ${cap?.shortName} controls`}>
        <div className="flex flex-wrap gap-2">
          {related.map((c) => (
            <Link key={c.id} to={`/control/${c.id}`} className="rounded-md border border-slate-200 px-2.5 py-1.5 text-xs hover:border-accent">
              <span className="font-mono font-semibold text-slate-500">{c.id}</span>
              {c.description && <span className="text-slate-600"> {c.description.slice(0, 44)}…</span>}
            </Link>
          ))}
        </div>
      </Card>

      {pending && (
        <OverrideModal
          controlId={control.id}
          from={base.state}
          to={pending}
          onCancel={() => setPending(null)}
          onConfirm={(justification) => {
            const rec: OverrideRecord = {
              state: pending,
              previousState: base.state,
              justification,
              analystId: `${ROLE_LABEL[role]} · demo`,
              timestamp: new Date().toISOString().slice(0, 16).replace('T', ' '),
            };
            overrideControl(control.id, rec);
            setPending(null);
          }}
        />
      )}
    </div>
  );
}
