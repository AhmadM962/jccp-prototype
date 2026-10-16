# Derives the ministry figures used by the prototype, and writes src/data/ministry.ts.
#
#   python3 -I docs/evidence/derive_ministry_figures.py <engine-root> src/data/ministry.ts
#
# It READS the engine's golden output and risk-weight table and writes nothing into the engine
# repository. Only numbers leave it. It first reproduces the engine's four published views (after
# state) exactly from per-control data and refuses to write if any differ; the before-upload state
# is then derived with the same model under RULE R below, which is the prototype's own rule and not
# an engine figure.
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
# RULE R (prototype-authored, NOT an engine figure): before the evidence bundle exists, only
# verdicts resting on testimony or documents (assurance L0 / L1) exist. Verdicts resting on
# machine collection, absence checks or analyst attestation do not. Controls outside the authored
# scope are unaffected by the upload (JNCSF-139 keeps its verdict in both states).
# ------------------------------------------------------------------------------------------
CAP = {'Security in Architecture and Portfolio': 'arch', 'Development': 'dev', 'Delivery': 'del', 'Operation': 'ops', 'Foundational': 'found'}
def before(i):
    c = claims[i]
    if i in ua: return credit(c)                                      # outside the authored scope: unaffected
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
// The `after` state is the engine's assessed state. The `before` state is NOT an engine figure: it is
// derived with the same model under a stated rule (before an evidence bundle exists, only verdicts
// resting on testimony or documents exist; the authored scope is the only part an upload can move).
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
open(sys.argv[2], 'w').write(ts)
print('wrote', sys.argv[2])
