# Derives the ministry figures used by the prototype, and writes src/data/ministry.ts.
#
#   python3 -I docs/evidence/derive_ministry_figures.py <engine-root> src/data/ministry.ts
#
# It READS the engine's golden output and risk-weight table and writes nothing into the engine
# repository. Only numbers leave it. It first reproduces the engine's four published views (after
# state) exactly from per-control data and refuses to write if any differ; the before-upload state
# is then derived with the same model under RULE R below. RULE R is a selection from the engine's
# own per-control data -- the verdicts that rest on testimony or documents -- not a model of its own;
# the facts that make it a projection and not an invention are asserted below ("provenance of rule R")
# and written beside the figures. The one choice that is the prototype's (JNCSF-139) is stated there.
import csv, json, sys, collections as C
from fractions import Fraction as F
root = sys.argv[1].rstrip('/')
d = json.load(open(root + '/backend/tests/golden/government_ministry.json'))
rw = {r['control_id']: r for r in csv.DictReader(open(root + '/data/catalogue/jncsf-2024.06/risk_weights.csv'))}
claims = {c['control_id']: c for c in d['claims']}
ua = set(c if isinstance(c, str) else c['control_id'] for c in d['coverage']['unauthored_applicable'])
Q = [(F(str(a)), F(str(b))) for a, b in d['scoring']['quartile_table']]          # share >= a -> credit b
def quart(s): return next(b for a, b in Q if s >= a)
BASIS_CREDIT = {'testimonial': F(3, 10), 'indicative_path': F(1, 10), 'monitor_only': F(1, 10), 'pilot': F(1, 10)}
def credit(c):
    if c['state'] == 'green': return F(1)
    if c['state'] == 'red': return F(0)
    if c['state'] == 'yellow':
        b = c['partial_basis']
        iv = c['deployment_share_interval']
        if iv is None:
            return {'testimonial': F(1, 10), 'indicative_path': F(1, 10), 'monitor_only': F(1, 10), 'pilot': F(1, 10)}[b]
        cr = quart(F(str(iv['lower'])))
        return min(cr, F(1, 2)) if iv['basis'] == 'claimed' else cr
    return None  # unknown
def weight(cid):
    r = rw[cid]; return F(1) if r['weight_basis'] == 'underived' else F(r['risk_weight']).limit_denominator(1000)
def view(state, include, weighted):
    ids = [i for i in claims if include(i)]
    w = {i: (weight(i) if weighted else F(1)) for i in ids}
    W = sum(w.values()); num = sum(w[i] * state(i) for i in ids if state(i) is not None)
    unk = sum(w[i] for i in ids if state(i) is None)
    return dict(n=len(ids), W=W, lower=num / W, upper=(num + unk) / W, unknown=sum(1 for i in ids if state(i) is None))
after = lambda i: credit(claims[i])
S = d['scoring']
spec = {
 'unweighted': (lambda i: True, False, S['unweighted']),
 'weighted_including_underived': (lambda i: True, True, S['weighted_including_underived']),
 'weighted_derived_only': (lambda i: rw[i]['weight_basis'] != 'underived', True, S['weighted_derived_only']['score']),
 'authored_scope': (lambda i: i not in ua, False, S['authored_scope']['score']),
}
print('--- reproduce the four published views (after state) from per-control claims')
bad = 0
for k, (inc, wt, pub) in spec.items():
    v = view(after, inc, wt)
    ok = (v['lower'] == F(pub['lower_exact']) and v['upper'] == F(pub['upper_exact']) and v['n'] == pub['applicable_count'] and v['unknown'] == pub['unknown_count']
          and F(v['n'] - v['unknown'], v['n']) == F(pub['coverage_exact']))
    bad += (not ok)
    print(('OK ' if ok else 'MISMATCH '), k, 'n', v['n'], 'W', v['W'], 'lower', v['lower'], 'upper', v['upper'], '| published', pub['lower_exact'], pub['upper_exact'], 'total_weight', pub.get('total_weight'))
print('mismatching views:', bad)

print('--- weighted components: engine vs mine (including underived)')
pub = S['weighted_including_underived']
lb = pub['lower_breakdown']; W = F(pub['total_weight_exact'])
print('published compliant weight', F(lb['compliant_exact']) * W, ' partial_total weight', F(str(lb['partial_total'])).limit_denominator(100000) * W)
for p in lb['partial']: print('  published', p['basis'], 'count', p['count'], 'weight-credit', F(p['contribution_exact']) * W)
mg = sum(weight(i) for i in claims if claims[i]['state'] == 'green')
print('mine: green weight', mg, '| green count', sum(1 for i in claims if claims[i]['state']=='green'))
byb = C.defaultdict(lambda: [0, F(0)])
for i, c in claims.items():
    if c['state'] == 'yellow':
        byb[c['partial_basis']][0] += 1; byb[c['partial_basis']][1] += weight(i) * credit(c)
for k, v in byb.items(): print('  mine', k, 'count', v[0], 'weight-credit', v[1])
print('published upper', pub['upper_exact'], ' unknown weight published:', (F(pub['upper_exact']) - F(pub['lower_exact'])) * W)
print('mine unknown weight', sum(weight(i) for i in claims if claims[i]['state'] == 'unknown'))
print('published width parts (x W):', {k: F(pub['width'][k + '_exact']) * W for k in ('unauthored', 'unevidenced', 'uncollectable')})

# ------------------------------------------------------------------------------------------
# RULE R: before the evidence bundle exists, only verdicts resting on testimony or documents
# (assurance L0 / L1) exist. Verdicts resting on machine collection, absence checks, observation of
# an artifact or analyst attestation do not, and every other control is Unknown. This is a selection
# by evidence kind from the engine's per-control data, with no exception: its premises are asserted
# from that data below, not assumed.
# JNCSF-139 has no authored path yet carries a Gap whose basis is `observed` over an artifact. An
# artifact arrives with the bundle, so under the rule it is Unknown before and a Gap after: the upload
# changes a control OUTSIDE the authored scope, by observation. (The golden file carries no date or age
# on a claim, so nothing in the data shows its artifact predates the bundle; an earlier commit kept it
# in the before-state and it was flipped on the owner's ruling.)
# ------------------------------------------------------------------------------------------
CAP = {'Security in Architecture and Portfolio': 'arch', 'Development': 'dev', 'Delivery': 'del', 'Operation': 'ops', 'Foundational': 'found'}
def before(i):
    c = claims[i]
    if c['state'] != 'unknown' and c['evidence_kind'] in ('testimony', 'document'): return credit(c)
    return None
def frac(x): return [x.numerator, x.denominator]
def state_figures(label, st):
    ids = list(claims)
    def ucat(i):  # why Unknown
        c = claims[i]
        if i in ua: return 'unauthored'
        return c['gap_reason'] if label == 'after' else 'not_provided'
    unknown_ids = [i for i in ids if st(i) is None]
    if label == 'after': assert all(claims[i]['state'] == 'unknown' for i in unknown_ids)
    kinds = C.Counter(ucat(i) for i in unknown_ids)
    ue = {k: v for k, v in kinds.items() if k != 'unauthored'}
    def parts(inc, wt):
        ids2 = [i for i in ids if inc(i)]
        w = {i: (weight(i) if wt else F(1)) for i in ids2}; W = sum(w.values())
        un = {k: sum(w[i] for i in ids2 if st(i) is None and (ucat(i) == 'unauthored') == (k == 'unauthored')) / W for k in ('unauthored', 'unevidenced')}
        return {'unauthored': un['unauthored'], 'unevidenced': un['unevidenced'], 'uncollectable': F(0)}
    out = {'buckets': {k: sum(1 for i in ids if (claims[i]['state'] if label == 'after' else (None)) == k) for k in ()}}
    def bucket(i):
        v = st(i)
        if v is None: return 'unknown'
        c = claims[i]; return c['state']
    out['buckets'] = dict(C.Counter(bucket(i) for i in ids))
    out['unknown_unauthored'] = kinds.get('unauthored', 0); out['unevidenced_by_reason'] = ue
    out['partial_credit'] = frac(sum(st(i) for i in ids if claims[i]['state'] == 'yellow' and st(i) is not None))
    out['credit_numerator'] = frac(sum(st(i) for i in ids if st(i) is not None))
    out['views'] = {}
    for k, (inc, wt, _) in spec.items():
        v = view(st, inc, wt); p = parts(inc, wt)
        ids2 = [i for i in ids if inc(i)]; known = sum(1 for i in ids2 if st(i) is not None)
        wgt = {i: (weight(i) if wt else F(1)) for i in ids2}
        cov = F(known, len(ids2))      # the engine's coverage is a count: controls with a verdict / controls in the view
        assert p['unauthored'] + p['unevidenced'] + p['uncollectable'] == v['upper'] - v['lower'], (label, k)   # exact-sum assertion
        out['views'][k] = {'applicable': v['n'], 'unknown': v['unknown'], 'total_weight': frac(v['W']), 'lower': frac(v['lower']), 'upper': frac(v['upper']),
                           'coverage': frac(cov), 'coverage_count': known, 'width': {a: frac(b) for a, b in p.items()}}
    caps = {}
    for cap in set(CAP.values()):
        ids2 = [i for i in ids if CAP[rw[i]['capability']] == cap]
        caps[cap] = {'applicable': len(ids2), 'authored': sum(1 for i in ids2 if i not in ua), 'green': sum(1 for i in ids2 if bucket(i) == 'green'),
                     'yellow': sum(1 for i in ids2 if bucket(i) == 'yellow'), 'red': sum(1 for i in ids2 if bucket(i) == 'red'),
                     'unknown': sum(1 for i in ids2 if st(i) is None), 'unknown_unauthored': sum(1 for i in ids2 if st(i) is None and i in ua),
                     'credit_numerator': frac(sum(st(i) for i in ids2 if st(i) is not None))}
    out['capabilities'] = caps
    return out
result = {'after': state_figures('after', after), 'before': state_figures('before', before)}

# ------------------------------------------------------------------------------------------
# Provenance of rule R, and the engine's assurance level. Everything here is asserted from the
# golden file; a failed assertion stops the write.
# ------------------------------------------------------------------------------------------
LEVEL_OF_KIND = {'testimony': 'L0', 'document': 'L1', 'machine_collected': 'L2', 'analyst_attestation': 'L3'}
def assurance_level(c):
    # engine/scoring.py, per-control assurance: read from evidence KIND. testimony -> L0, document -> L1,
    # machine_collected -> L2, analyst attestation -> L3; an inference from absence backed by a successful
    # module, or an observed Gap established by machine evidence -> L2 (such a claim carries no kind).
    if c['evidence_kind'] is not None: return LEVEL_OF_KIND[c['evidence_kind']]
    assert c['state'] == 'red' and c['gap_basis'] in ('absence', 'observed'), c['control_id']
    return 'L2'
known_ids = [i for i in claims if claims[i]['state'] != 'unknown']
dist = C.Counter(assurance_level(claims[i]) for i in known_ids)
A = S['assurance']
GOLD_LEVEL = {'l0_declared': 'L0', 'l1_documented': 'L1', 'l2_tool_evidenced': 'L2', 'l3_analyst_signed': 'L3'}
assert {GOLD_LEVEL[k]: v for k, v in A['distribution'].items()} == {k: dist.get(k, 0) for k in ('L0', 'L1', 'L2', 'L3')}, 'assurance distribution not reproduced'
thr = F(str(A['assurance_proportion_threshold']))
total = len(known_ids); cum = 0; head = None
for lvl in ('L3', 'L2', 'L1', 'L0'):                      # highest level whose cumulative share meets the threshold
    cum += dist.get(lvl, 0)
    if F(cum, total) >= thr: head = lvl; break
assert head == GOLD_LEVEL[A['base_level']] == GOLD_LEVEL[A['reported_level']] and A['demotions'] == [], 'headline level not reproduced'
l2_up = dist['L2'] + dist['L3']
print('--- assurance: distribution', dict(dist), '| total', total, '| L2-or-above', l2_up, 'of', total, '=', float(F(l2_up, total)), '| threshold', thr, '| headline', head)
# premise 1: every Compliant rests on machine collection -- none on a document
greens = [i for i in known_ids if claims[i]['state'] == 'green']
assert greens and all(claims[i]['evidence_kind'] == 'machine_collected' for i in greens), 'a Compliant is not machine-collected'
# premise 2: the before-state's verdicts are exactly the engine's L0 and L1 verdicts, with no exception
b_known = [i for i in claims if before(i) is not None]
assert set(b_known) == {i for i in known_ids if assurance_level(claims[i]) in ('L0', 'L1')}, 'rule R is not the L0/L1 verdicts'
assert len(b_known) == dist['L0'] + dist['L1']
# premise 3: a verdict for a control with no authored path is machine evidence and so arrives with the bundle
outside = [i for i in known_ids if i in ua]
assert outside == ['JNCSF-139'], outside
o = claims['JNCSF-139']
assert assurance_level(o) == 'L2' and o['gap_basis'] == 'observed' and o['evidence_class'] == 'artifact' and o['evidence_kind'] is None
assert o['negative_evidence_module_run_id'] is None and o['satisfied_path_label'] is None
assert not any(before(i) is not None for i in outside)
print('--- provenance of rule R: compliants', len(greens), '(all machine_collected) | before verdicts', len(b_known), '= the engine L0/L1 verdicts, no exception | verdicts outside the authored scope', len(outside), outside, '(observed, artifact: arrive with the bundle)')
prov = {'greens': len(greens), 'b_known': len(b_known), 'outside': len(outside), 'outside_ids': outside}

# the engine's demotion checks: every one is listed, and one that could not run is neither passed nor failed
import re
CANNOT_RUN = {'unresolved_profile_challenge': ('not modelled', 'not_modelled'), 'na_rate_above_baseline': ('no sector baseline', 'no_baseline')}
checks = []
for ch in A['checks']:
    e = {'cause': ch['cause'], 'status': ch['status'], 'count': None, 'of': None, 'threshold': None, 'because': None, 'components': []}
    if ch['status'] == 'not_assessed':
        phrase, code = CANNOT_RUN[ch['cause']]
        assert phrase in ch['detail'] and ch['measured'] is None and ch['threshold'] is None, ch['cause']
        e['because'] = code
    else:
        if ch['cause'] == 'declined_module':
            m = re.match(r'(\d+)/(\d+) in-scope signals', ch['detail']); n, dn = int(m.group(1)), int(m.group(2))
        else:
            assert ch['cause'] == 'unusable_evidence_proportion', ch['cause']
            n = sum(c['count'] for c in ch['components']); dn = ch['components'][0]['denominator']
            assert all(c['denominator'] == dn for c in ch['components'])
            e['components'] = [(c['reason'], c['count']) for c in ch['components']]
        assert float(F(n, dn)) == ch['measured'], ch['cause']          # the count and the denominator ARE the measured value
        e['count'], e['of'] = n, dn; e['threshold'] = F(str(ch['threshold']))
    checks.append(e)
assert [c['cause'] for c in checks] == ['declined_module', 'unresolved_profile_challenge', 'unusable_evidence_proportion', 'na_rate_above_baseline']
print('--- demotion checks:', [(c['cause'], c['status'], c['count'], c['of']) for c in checks], '| demotions applied:', len(A['demotions']))
# framework-wide facts over the applicable controls
basis = C.Counter(rw[i]['weight_basis'] for i in claims)
out_basis = {k: {'controls': v, 'weight': str(F(next(r for r in rw.values() if r['weight_basis'] == k)['risk_weight'] or 1).limit_denominator(1000)) if k != 'underived' else '1'} for k, v in basis.items()}
result['applicable_by_weight_basis'] = dict(basis)
result['framework_by_weight_basis'] = dict(C.Counter(r['weight_basis'] for r in rw.values()))
excluded = [e['control_id'] if isinstance(e, dict) else e for e in d['exclusions']]
result['excluded_by_weight_basis'] = dict(C.Counter(rw[i]['weight_basis'] for i in excluded))
result['excluded_weight_sum'] = str(sum(weight(i) for i in excluded)); result['excluded_authored'] = [i for i in excluded if i not in ua]
result['excluded_capability'] = dict(C.Counter(CAP[rw[i]['capability']] for i in excluded))
result['out_of_scope_known'] = [i for i in ua if claims[i]['state'] != 'unknown']

# ---------------------------------------------------------------------------------------------
if bad:
    sys.exit('refusing to write: the model does not reproduce the published views')
APP = result['after']['views']['unweighted']['applicable']
def lit(n):                       # keep the framework-wide literals in one place (src/data/figures.ts)
    return 'APPLICABLE_CONTROLS' if n == APP else str(n)
def fr(f): return '[%s, %s]' % (lit(f[0]), lit(f[1]))
def width(w): return '{ unauthored: %s, unevidenced: %s, uncollectable: %s }' % (fr(w['unauthored']), fr(w['unevidenced']), fr(w['uncollectable']))
ORDER = ['unweighted', 'weighted_including_underived', 'weighted_derived_only', 'authored_scope']
CAPS = ['arch', 'dev', 'del', 'ops', 'found']
def state_ts(s, indent='  '):
    o = []
    o.append("%sgreen: %d," % (indent, s['buckets'].get('green', 0)))
    o.append("%syellow: %d," % (indent, s['buckets'].get('yellow', 0)))
    o.append("%sred: %d," % (indent, s['buckets'].get('red', 0)))
    o.append("%sunknown: %d," % (indent, s['buckets'].get('unknown', 0)))
    o.append("%sunknownUnauthored: %d," % (indent, s['unknown_unauthored']))
    reasons = ', '.join('%s: %d' % (k, v) for k, v in sorted(s['unevidenced_by_reason'].items()))
    o.append("%sunevidencedByReason: { %s }," % (indent, reasons))
    o.append("%spartialCredit: %s," % (indent, fr(s['partial_credit'])))
    o.append("%screditNumerator: %s," % (indent, fr(s['credit_numerator'])))
    o.append("%sviews: {" % indent)
    for k in ORDER:
        v = s['views'][k]
        o.append("%s  %s: {" % (indent, k))
        o.append("%s    applicable: %s, unknown: %d, known: %d," % (indent, lit(v['applicable']), v['unknown'], v['coverage_count']))
        o.append("%s    lower: %s, upper: %s," % (indent, fr(v['lower']), fr(v['upper'])))
        o.append("%s    coverage: %s, totalWeight: %s," % (indent, fr(v['coverage']), fr(v['total_weight'])))
        o.append("%s    width: %s," % (indent, width(v['width'])))
        o.append("%s  }," % indent)
    o.append("%s}," % indent)
    o.append("%scapabilities: {" % indent)
    for c in CAPS:
        v = s['capabilities'][c]
        o.append("%s  %s: { applicable: %d, authored: %d, green: %d, yellow: %d, red: %d, unknown: %d, unknownUnauthored: %d, creditNumerator: %s }," % (
            indent, c, v['applicable'], v['authored'], v['green'], v['yellow'], v['red'], v['unknown'], v['unknown_unauthored'], fr(v['credit_numerator'])))
    o.append("%s}," % indent)
    return '\n'.join(o)
def basis_ts(d):
    keys = ['nist_baseline_low', 'nist_baseline_moderate', 'nist_baseline_high', 'nist_no_baseline', 'underived']
    return '{ ' + ', '.join('%s: %d' % (k, d.get(k, 0)) for k in keys) + ' }'
ts = """// Figures for the demonstration organisation (a government ministry), as an exact-fraction module.
//
// GENERATED by docs/evidence/derive_ministry_figures.py from the engine's output for this profile.
// Do not edit by hand: change the generator and regenerate. Numbers only. Every fraction is [numerator,
// denominator], so sums can be asserted exactly and nothing is rounded until it is displayed.
//
// The `after` state is the engine's assessed state. The `before` state is the engine's own per-control
// data under ONE stated projection (rule R): before an evidence bundle exists, only the verdicts that
// rest on testimony or documents exist. Its two premises are asserted by the generator from the
// engine's output, not assumed, and exported below as RULE_R_PROVENANCE:
//   - all @@greens@@ Compliant verdicts rest on machine collection (evidence kind machine_collected);
//     none rests on a document, so no Compliant can exist before an upload;
//   - the engine's assurance distribution over the settled verdicts has @@b_known@@ at L0 or L1, and
//     those @@b_known@@ are exactly the before-state's verdicts, with no exception.
// A control with no authored path can still have a verdict: @@outside@@ does (JNCSF-139), a Gap whose basis is
// `observed` over an artifact. An artifact arrives with the bundle, so it is Unknown in `before` and a Gap in
// `after`: the upload changes a control outside the authored scope, by observation. The golden file carries no
// date on a claim, so nothing in the data shows that artifact predates the bundle.
//
// Tier: illustrative. These are real engine figures, but the prototype does not read them from the engine.

import { APPLICABLE_CONTROLS } from './figures';
import type { GapReason } from './controls';

/** An exact fraction [numerator, denominator]. */
export type Frac = readonly [number, number];
export type ViewId = 'unweighted' | 'weighted_including_underived' | 'weighted_derived_only' | 'authored_scope';
export type CapabilityId = 'arch' | 'dev' | 'del' | 'ops' | 'found';

export interface WidthParts {
  /** the tool's limitation: no evidence requirement authored */
  unauthored: Frac;
  /** the organisation's: a requirement exists and evidence was not (or could not be) provided */
  unevidenced: Frac;
  /** structural: no supported method can reach it */
  uncollectable: Frac;
}

export interface ViewFigures {
  applicable: number;
  unknown: number;
  known: number;
  lower: Frac;
  upper: Frac;
  coverage: Frac;
  totalWeight: Frac;
  width: WidthParts;
}

export interface CapabilityFigures {
  applicable: number;
  authored: number;
  green: number;
  yellow: number;
  red: number;
  unknown: number;
  unknownUnauthored: number;
  creditNumerator: Frac;
}

export interface StateFigures {
  green: number;
  yellow: number;
  red: number;
  unknown: number;
  unknownUnauthored: number;
  unevidencedByReason: Partial<Record<GapReason, number>>;
  /** total credit earned by the Partial controls */
  partialCredit: Frac;
  /** green controls plus partial credit: the numerator of the unweighted lower bound */
  creditNumerator: Frac;
  views: Record<ViewId, ViewFigures>;
  capabilities: Record<CapabilityId, CapabilityFigures>;
}

export const MINISTRY: { before: StateFigures; after: StateFigures } = {
  before: {
%s
  },
  after: {
%s
  },
};

/** Controls by risk-weight basis. `applicable` is what the weighted totals are computed over; `framework`
 *  is all controls in the framework; `excluded` is the difference (the not-applicable controls). */
export const WEIGHT_BASIS_COUNTS = {
  applicable: %s,
  framework: %s,
  excluded: %s,
} as const;
""" % (state_ts(result['before'], '    '), state_ts(result['after'], '    '),
       basis_ts(result['applicable_by_weight_basis']), basis_ts(result['framework_by_weight_basis']), basis_ts(result['excluded_by_weight_basis']))
ts = ts.replace('@@greens@@', str(prov['greens'])).replace('@@b_known@@', str(prov['b_known'])).replace('@@outside@@', str(prov['outside']))
ts += """
/** The engine's assurance for this assessment (the `after` state), over its settled (non-Unknown) verdicts.
 *  The headline level is the highest level L such that the share of verdicts at L or above meets
 *  `proportionThreshold`; the engine reports it from the distribution and demotes nothing here. */
export const ASSURANCE = {
  distribution: { L0: %d, L1: %d, L2: %d, L3: %d },
  proportionThreshold: [%d, %d] as Frac,
  reported: '%s',
} as const;

/** The premises of the before-state's rule, asserted by the generator from the engine's output. */
export const RULE_R_PROVENANCE = {
  /** Compliant verdicts in the engine's output, and how many of them rest on machine collection */
  compliant: %d,
  compliantMachineCollected: %d,
  /** the before-state's verdicts, which are exactly the engine's L0 and L1 verdicts */
  beforeVerdicts: %d,
  beforeVerdictsAtL0OrL1: %d,
  /** verdicts for controls with no authored path: observed from an artifact, so they arrive with the bundle */
  verdictsOutsideAuthoredScope: %d,
} as const;

/** Controls with no authored evidence path that nonetheless have a verdict after the upload. */
export const VERDICT_OUTSIDE_AUTHORED_SCOPE: readonly { id: string; state: 'green' | 'yellow' | 'red'; gapBasis: string | null }[] = [%s];

export type CheckCause = 'declined_module' | 'unresolved_profile_challenge' | 'unusable_evidence_proportion' | 'na_rate_above_baseline';
export type CheckStatus = 'passed' | 'triggered' | 'not_assessed';
/** One of the engine's demotion checks. An assessed check carries its measured value (count of `of`) and the
 *  threshold it was compared with; a check that could not run carries neither and says why in `because`. */
export interface DemotionCheck {
  cause: CheckCause;
  status: CheckStatus;
  count: number | null;
  of: number | null;
  threshold: Frac | null;
  /** why a check could not run */
  because: 'not_modelled' | 'no_baseline' | null;
  components: readonly (readonly [string, number])[];
}

/** Every demotion check the engine runs, always all four, in the engine's order. `DEMOTIONS_APPLIED` is how
 *  many levels the reported level was demoted from the base level. */
export const DEMOTION_CHECKS: readonly DemotionCheck[] = [
%s
];
export const DEMOTIONS_APPLIED = %d;
export const BASE_LEVEL = '%s';
""" % (dist['L0'], dist['L1'], dist['L2'], dist['L3'], thr.numerator, thr.denominator, head,
       prov['greens'], prov['greens'], prov['b_known'], prov['b_known'], prov['outside'],
       ', '.join("{ id: '%s', state: '%s', gapBasis: %s }" % (x, claims[x]['state'], 'null' if claims[x]['gap_basis'] is None else "'%s'" % claims[x]['gap_basis']) for x in prov['outside_ids']),
       '\n'.join("  { cause: '%s', status: '%s', count: %s, of: %s, threshold: %s, because: %s, components: [%s] }," % (
           c['cause'], c['status'], 'null' if c['count'] is None else c['count'], 'null' if c['of'] is None else ('APPLICABLE_CONTROLS' if c['of'] == len(claims) else c['of']),
           'null' if c['threshold'] is None else '[%d, %d]' % (c['threshold'].numerator, c['threshold'].denominator),
           'null' if c['because'] is None else "'%s'" % c['because'], ', '.join("['%s', %d]" % t for t in c['components'])) for c in checks),
       len(A['demotions']), GOLD_LEVEL[A['base_level']])
open(sys.argv[2], 'w').write(ts)
print('wrote', sys.argv[2])
