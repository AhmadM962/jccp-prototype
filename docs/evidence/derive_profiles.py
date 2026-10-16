# Derives the figures and per-control data the prototype shows, for each of the engine's three golden
# assessments, and writes one TypeScript module per profile.
#
#   python3 -I docs/evidence/derive_profiles.py <engine-root> <out-dir>        (out-dir: src/data/profiles)
#
# It READS the engine's golden outputs and risk-weight table and writes nothing into the engine
# repository. For each golden it
#   1. records the SHA-256 of the file the figures came from (shown on screen, so that someone who
#      distrusts us can hash the file and compare);
#   2. reproduces the engine's four published views (the assessed state) exactly, from per-control claims,
#      and refuses to write if any differ;
#   3. derives the before-upload state under RULE R (below), a selection from the same data;
#   4. asserts the premises of rule R and the engine's assurance level from the golden file;
#   5. emits every figure, the assurance block with its four checks, the CICSC boundary, the exclusions,
#      the dual-standard projection, the ranking and EVERY applicable claim.
# The engine's own generated strings (check detail, the dual-standard label, basis and path labels,
# ranking descriptions, exclusion justifications, contradicted-testimony explanations) cross as data,
# because they are output. Documentation, comments and design papers do not.
import csv, hashlib, json, os, re, sys, collections as C
from fractions import Fraction as F

PROFILES = [('ministry', 'government_ministry'), ('bank', 'bank'), ('utility', 'utility_with_ot')]
CAP = {'Security in Architecture and Portfolio': 'arch', 'Development': 'dev', 'Delivery': 'del', 'Operation': 'ops', 'Foundational': 'found'}
CAPS = ['arch', 'dev', 'del', 'ops', 'found']
ORDER = ['unweighted', 'weighted_including_underived', 'weighted_derived_only', 'authored_scope']
LEVEL_OF_KIND = {'testimony': 'L0', 'document': 'L1', 'machine_collected': 'L2', 'analyst_attestation': 'L3'}
GOLD_LEVEL = {'l0_declared': 'L0', 'l1_documented': 'L1', 'l2_tool_evidenced': 'L2', 'l3_analyst_signed': 'L3'}
CANNOT_RUN = {'unresolved_profile_challenge': 'not modelled', 'na_rate_above_baseline': 'no sector baseline'}


def frac(x):
    return [x.numerator, x.denominator]


def camel(k):
    p = k.split('_')
    return p[0] + ''.join(w.capitalize() for w in p[1:])


def camelize(o):
    if isinstance(o, dict):
        return {camel(k): camelize(v) for k, v in o.items()}
    if isinstance(o, list):
        return [camelize(v) for v in o]
    return o


def derive(root, golden):
    path = root + '/backend/tests/golden/' + golden + '.json'
    raw = open(path, 'rb').read()
    sha = hashlib.sha256(raw).hexdigest()
    d = json.loads(raw)
    rw = {r['control_id']: r for r in csv.DictReader(open(root + '/data/catalogue/jncsf-2024.06/risk_weights.csv'))}
    claims = {c['control_id']: c for c in d['claims']}
    ua = set(c if isinstance(c, str) else c['control_id'] for c in d['coverage']['unauthored_applicable'])
    S = d['scoring']
    Q = [(F(str(a)), F(str(b))) for a, b in S['quartile_table']]

    def quart(s):
        return next(b for a, b in Q if s >= a)

    def credit(c):
        if c['state'] == 'green': return F(1)
        if c['state'] == 'red': return F(0)
        if c['state'] == 'yellow':
            iv = c['deployment_share_interval']
            if iv is None:
                return {'testimonial': F(1, 10), 'indicative_path': F(1, 10), 'monitor_only': F(1, 10), 'pilot': F(1, 10)}[c['partial_basis']]
            cr = quart(F(str(iv['lower'])))
            return min(cr, F(1, 2)) if iv['basis'] == 'claimed' else cr
        return None

    def weight(cid):
        r = rw[cid]
        return F(1) if r['weight_basis'] == 'underived' else F(r['risk_weight']).limit_denominator(1000)

    def view(state, include, weighted):
        ids = [i for i in claims if include(i)]
        w = {i: (weight(i) if weighted else F(1)) for i in ids}
        W = sum(w.values()); num = sum(w[i] * state(i) for i in ids if state(i) is not None)
        unk = sum(w[i] for i in ids if state(i) is None)
        return dict(n=len(ids), W=W, lower=num / W, upper=(num + unk) / W, unknown=sum(1 for i in ids if state(i) is None))

    after = lambda i: credit(claims[i])
    spec = {
        'unweighted': (lambda i: True, False, S['unweighted']),
        'weighted_including_underived': (lambda i: True, True, S['weighted_including_underived']),
        'weighted_derived_only': (lambda i: rw[i]['weight_basis'] != 'underived', True, S['weighted_derived_only']['score']),
        'authored_scope': (lambda i: i not in ua, False, S['authored_scope']['score']),
    }
    print('=== %s (%s) sha256 %s' % (golden, len(claims), sha))
    bad = 0
    for k, (inc, wt, pub) in spec.items():
        v = view(after, inc, wt)
        ok = (v['lower'] == F(pub['lower_exact']) and v['upper'] == F(pub['upper_exact']) and v['n'] == pub['applicable_count'] and v['unknown'] == pub['unknown_count']
              and F(v['n'] - v['unknown'], v['n']) == F(pub['coverage_exact']))
        bad += (not ok)
        print(('OK ' if ok else 'MISMATCH '), k, 'n', v['n'], 'lower', v['lower'], 'upper', v['upper'], '| published', pub['lower_exact'], pub['upper_exact'])
    print('mismatching views:', bad)
    if bad:
        sys.exit('refusing to write: the model does not reproduce the published views of ' + golden)

    # ------------------------------------------------------------------------------------------
    # RULE R: before the evidence bundle exists, only verdicts resting on testimony or documents
    # (assurance L0 / L1) exist. Verdicts resting on machine collection, absence checks, observation of
    # an artifact or analyst attestation do not, and every other control is Unknown. This is a selection
    # by evidence kind from the engine's per-control data, with no exception; its premises are asserted
    # below. A control with no authored path can still carry a verdict, observed over an artifact: it
    # arrives with the bundle, so it is Unknown before and a Gap after. (No claim carries a date, so
    # nothing in the data shows an artifact predates the bundle.)
    # ------------------------------------------------------------------------------------------
    def before(i):
        c = claims[i]
        if c['state'] != 'unknown' and c['evidence_kind'] in ('testimony', 'document'): return credit(c)
        return None

    def state_figures(label, st):
        ids = list(claims)

        def ucat(i):
            c = claims[i]
            if i in ua: return 'unauthored'
            return c['gap_reason'] if label == 'after' else 'not_provided'

        def bucket(i):
            return 'unknown' if st(i) is None else claims[i]['state']

        unknown_ids = [i for i in ids if st(i) is None]
        if label == 'after': assert all(claims[i]['state'] == 'unknown' for i in unknown_ids)
        kinds = C.Counter(ucat(i) for i in unknown_ids)

        def parts(inc, wt):
            ids2 = [i for i in ids if inc(i)]
            w = {i: (weight(i) if wt else F(1)) for i in ids2}; W = sum(w.values())
            un = {k: sum(w[i] for i in ids2 if st(i) is None and (ucat(i) == 'unauthored') == (k == 'unauthored')) / W for k in ('unauthored', 'unevidenced')}
            return {'unauthored': un['unauthored'], 'unevidenced': un['unevidenced'], 'uncollectable': F(0)}

        out = {'buckets': dict(C.Counter(bucket(i) for i in ids))}
        out['unknown_unauthored'] = kinds.get('unauthored', 0)
        out['unevidenced_by_reason'] = {k: v for k, v in sorted(kinds.items()) if k != 'unauthored'}
        out['partial_credit'] = frac(sum(st(i) for i in ids if claims[i]['state'] == 'yellow' and st(i) is not None))
        out['credit_numerator'] = frac(sum(st(i) for i in ids if st(i) is not None))
        out['views'] = {}
        for k, (inc, wt, _) in spec.items():
            v = view(st, inc, wt); p = parts(inc, wt)
            ids2 = [i for i in ids if inc(i)]; known = sum(1 for i in ids2 if st(i) is not None)
            assert p['unauthored'] + p['unevidenced'] + p['uncollectable'] == v['upper'] - v['lower'], (label, k)       # exact-sum assertion
            out['views'][k] = {'applicable': v['n'], 'unknown': v['unknown'], 'known': known, 'lower': frac(v['lower']), 'upper': frac(v['upper']),
                               'coverage': frac(F(known, len(ids2))), 'totalWeight': frac(v['W']),
                               'width': {a: frac(b) for a, b in p.items()}}
        out['capabilities'] = {}
        for cap in CAPS:
            ids2 = [i for i in ids if CAP[rw[i]['capability']] == cap]
            out['capabilities'][cap] = {'applicable': len(ids2), 'authored': sum(1 for i in ids2 if i not in ua), 'green': sum(1 for i in ids2 if bucket(i) == 'green'),
                                        'yellow': sum(1 for i in ids2 if bucket(i) == 'yellow'), 'red': sum(1 for i in ids2 if bucket(i) == 'red'),
                                        'unknown': sum(1 for i in ids2 if st(i) is None), 'unknownUnauthored': sum(1 for i in ids2 if st(i) is None and i in ua),
                                        'creditNumerator': frac(sum(st(i) for i in ids2 if st(i) is not None))}
        # camel-case the two keys the shared emitter expects
        out['views'] = {k: v for k, v in out['views'].items()}
        return {'green': out['buckets'].get('green', 0), 'yellow': out['buckets'].get('yellow', 0), 'red': out['buckets'].get('red', 0),
                'unknown': out['buckets'].get('unknown', 0), 'unknownUnauthored': out['unknown_unauthored'],
                'unevidencedByReason': out['unevidenced_by_reason'], 'partialCredit': out['partial_credit'], 'creditNumerator': out['credit_numerator'],
                'views': out['views'], 'capabilities': out['capabilities']}

    result_after, result_before = state_figures('after', after), state_figures('before', before)

    # ------------------------------------------------------------------------------------------
    # The engine's assurance level, and the premises of rule R. Everything here is asserted.
    # ------------------------------------------------------------------------------------------
    def assurance_level(c):
        if c['evidence_kind'] is not None: return LEVEL_OF_KIND[c['evidence_kind']]
        assert c['state'] == 'red' and c['gap_basis'] in ('absence', 'observed'), c['control_id']
        return 'L2'

    known_ids = [i for i in claims if claims[i]['state'] != 'unknown']
    dist = C.Counter(assurance_level(claims[i]) for i in known_ids)
    A = S['assurance']
    assert {GOLD_LEVEL[k]: v for k, v in A['distribution'].items()} == {k: dist.get(k, 0) for k in ('L0', 'L1', 'L2', 'L3')}, 'assurance distribution not reproduced'
    thr = F(str(A['assurance_proportion_threshold']))

    def headline(dc, total):
        cum = 0
        for lvl in ('L3', 'L2', 'L1', 'L0'):
            cum += dc.get(lvl, 0)
            if F(cum, total) >= thr: return lvl

    head = headline(dist, len(known_ids))
    assert head == GOLD_LEVEL[A['base_level']] == GOLD_LEVEL[A['reported_level']] and A['demotions'] == [], 'headline level not reproduced'
    greens = [i for i in known_ids if claims[i]['state'] == 'green']
    assert greens and all(claims[i]['evidence_kind'] == 'machine_collected' for i in greens), 'a Compliant is not machine-collected'
    b_known = [i for i in claims if before(i) is not None]
    assert set(b_known) == {i for i in known_ids if assurance_level(claims[i]) in ('L0', 'L1')}, 'rule R is not the L0/L1 verdicts'
    outside = [i for i in known_ids if i in ua]
    for i in outside:
        o = claims[i]
        assert assurance_level(o) == 'L2' and o['gap_basis'] == 'observed' and o['evidence_class'] == 'artifact' and o['evidence_kind'] is None, i
        assert o['negative_evidence_module_run_id'] is None and o['satisfied_path_label'] is None, i
        assert before(i) is None, i
    bdist = C.Counter(assurance_level(claims[i]) for i in b_known)
    bhead = headline(bdist, len(b_known))
    print('--- assurance', dict(dist), 'headline', head, '| before', dict(bdist), 'headline', bhead, '| compliants', len(greens), '(all machine_collected) | outside the authored scope', outside)

    checks = []
    for ch in A['checks']:
        e = {'cause': ch['cause'], 'status': ch['status'], 'count': None, 'of': None, 'threshold': None, 'detail': ch['detail'], 'components': []}
        if ch['status'] == 'not_assessed':
            assert CANNOT_RUN[ch['cause']] in ch['detail'] and ch['measured'] is None and ch['threshold'] is None, ch['cause']
        else:
            if ch['cause'] == 'declined_module':
                m = re.match(r'(\d+)/(\d+) in-scope signals', ch['detail']); n, dn = int(m.group(1)), int(m.group(2))
            else:
                assert ch['cause'] == 'unusable_evidence_proportion', ch['cause']
                n = sum(c['count'] for c in ch['components']); dn = ch['components'][0]['denominator']
                assert all(c['denominator'] == dn for c in ch['components'])
                e['components'] = [[c['reason'], c['count']] for c in ch['components']]
            assert float(F(n, dn)) == ch['measured'], ch['cause']
            e['count'], e['of'] = n, dn; e['threshold'] = frac(F(str(ch['threshold'])))
        checks.append(e)
    assert [c['cause'] for c in checks] == ['declined_module', 'unresolved_profile_challenge', 'unusable_evidence_proportion', 'na_rate_above_baseline']

    # ------------------------------------------------------------------------------------------
    # Per control
    # ------------------------------------------------------------------------------------------
    def claim_out(i):
        c = claims[i]; r = rw[i]
        o = {'id': i, 'capability': CAP[r['capability']], 'weight': frac(weight(i)), 'weightBasis': r['weight_basis'], 'authored': i not in ua,
             'state': c['state'], 'evidenceClass': c['evidence_class']}
        if c['evidence_kind']: o['evidenceKind'] = c['evidence_kind']
        if c['gap_reason']: o['gapReason'] = c['gap_reason']
        if c['gap_basis']: o['gapBasis'] = c['gap_basis']
        if c['partial_basis']: o['partialBasis'] = c['partial_basis']
        if c['satisfied_path_label']: o['pathLabel'] = c['satisfied_path_label']
        if c['negative_evidence_module_run_id']: o['runId'] = c['negative_evidence_module_run_id']
        if c['deployment_share'] is not None or c['deployment_share_interval'] is not None:
            iv = c['deployment_share_interval']
            o['share'] = {'value': c['deployment_share'], 'basis': c['deployment_share_basis'],
                          'interval': None if iv is None else {'basis': iv['basis'], 'lower': iv['lower'], 'upper': iv['upper'], 'lowerBoundSource': iv['lower_bound_source'], 'census': iv['census']}}
        if c['enforcement_mode']: o['enforcement'] = {'mode': c['enforcement_mode'], 'basis': c['enforcement_mode_basis']}
        if c['population_description']: o['population'] = c['population_description']
        if c['exception_population'] is not None: o['exceptionPopulation'] = c['exception_population']
        if c['reasoning']: o['reasoning'] = c['reasoning']
        if c['testimony_contradicted']:
            o['contradicted'] = [{'basis': t['basis'], 'contradictedBy': t['contradicted_by'], 'locator': t['locator'], 'signalKey': t['signal_key'], 'stance': t['stance'],
                                  'respondentRole': t['span']['respondent_role'], 'sourceRef': t['span']['source_ref']} for t in c['testimony_contradicted']]
        if c['documents_overruled']: o['overruled'] = c['documents_overruled']
        cr = credit(c)
        if cr is not None: o['credit'] = frac(cr)
        o['beforeVerdict'] = before(i) is not None
        return o

    def num(i): return int(i.split('-')[1])
    claims_out = [claim_out(i) for i in sorted(claims, key=num)]

    excluded = [e['control_id'] for e in d['exclusions']]
    basis = C.Counter(rw[i]['weight_basis'] for i in claims)
    keys = ['nist_baseline_low', 'nist_baseline_moderate', 'nist_baseline_high', 'nist_no_baseline', 'underived']
    wb = lambda cnt: {k: cnt.get(k, 0) for k in keys}      # the engine's own basis identifiers, as on each claim

    def ratio(s):
        n, dn = s.split('/'); return [int(n), int(dn)]

    r = d['ranking']
    rank_items = []
    for it in r['items']:
        a = it['attack']
        rank_items.append({'rank': it['rank'], 'controlId': it['control_id'], 'actionType': it['action_type'], 'description': it['description'], 'effort': it['effort'],
                           'tieGroupSize': it['tie_group_size'], 'signalsRequested': it['signals_requested'],
                           'magnitude': ratio(it['magnitude_exact']), 'magnitudePoints': it['magnitude_points'],
                           'unweightedMagnitude': ratio(it['unweighted_magnitude_exact']), 'unweightedMagnitudePoints': it['unweighted_magnitude_points'],
                           'attack': {'exposure': a['exposure'], 'broadCount': a['broad_count'], 'diffuseCount': a['diffuse_count'], 'suppressedCount': a['suppressed_count'], 'techniqueIds': a['technique_ids']}})
    assert all(it['tieGroupSize'] == sum(1 for j in rank_items if j['rank'] == it['rank']) for it in rank_items), 'tie group sizes'

    dual = d['dual']
    cic = d['cicsc_boundary']
    out = {
        'id': None, 'source': {'file': golden + '.json', 'sha256': sha},
        'framework': {'name': d['framework_name'], 'version': d['framework_version']}, 'asOf': d['as_of'],
        'parameters': camelize(d['parameters']),
        'cicsc': camelize(cic),
        'totals': {'framework': len(rw), 'applicable': len(claims), 'excluded': len(excluded)},
        'exclusions': camelize(d['exclusions']),
        'before': result_before, 'after': result_after,
        'weightBasisCounts': {'applicable': wb(basis), 'framework': wb(C.Counter(x['weight_basis'] for x in rw.values())), 'excluded': wb(C.Counter(rw[i]['weight_basis'] for i in excluded))},
        'assurance': {'distribution': {k: dist.get(k, 0) for k in ('L0', 'L1', 'L2', 'L3')}, 'proportionThreshold': frac(thr), 'reported': head, 'baseLevel': GOLD_LEVEL[A['base_level']],
                      'demotionsApplied': len(A['demotions']), 'checks': checks},
        'assuranceBefore': {'distribution': {k: bdist.get(k, 0) for k in ('L0', 'L1', 'L2', 'L3')}, 'reported': bhead},
        'ruleR': {'compliant': len(greens), 'compliantMachineCollected': len(greens), 'beforeVerdicts': len(b_known), 'beforeVerdictsAtL0OrL1': dist['L0'] + dist['L1'],
                  'verdictsOutsideAuthoredScope': [{'id': i, 'state': claims[i]['state'], 'gapBasis': claims[i]['gap_basis']} for i in outside]},
        'dual': camelize(dual),
        'coverage': {'gaps': camelize(d['coverage']['gaps']), 'provided': d['coverage']['provided'], 'required': d['coverage']['required'],
                     'uncollectableApplicable': len(d['coverage']['uncollectable_applicable'])},
        'ranking': {'items': rank_items, 'unauthoredExcluded': r['unauthored_excluded'], 'uncollectableExcluded': r['uncollectable_excluded'],
                    'conflictingEvidenceExcluded': r['conflicting_evidence_excluded'], 'tieOrderNote': r['tie_order_note']},
        'claims': claims_out,
    }
    return out


def dumps(o):
    return json.dumps(o, ensure_ascii=False, separators=(', ', ': '))


def emit(pid, label, data):
    data = dict(data); data['id'] = pid
    big = ('claims',)
    o = []
    o.append("// GENERATED by docs/evidence/derive_profiles.py from the engine's golden output %s." % data['source']['file'])
    o.append("// Do not edit by hand: change the generator and regenerate. Source SHA-256 (hash the golden file and compare):")
    o.append("//   %s" % data['source']['sha256'])
    o.append("//")
    o.append("// The `after` state is the engine's assessed state: MEASURED, in the sense that it is read from that file.")
    o.append("// The `before` state is the same per-control data under rule R (before an evidence bundle exists, only the")
    o.append("// verdicts that rest on testimony or documents exist): a projection, not an engine run, so ILLUSTRATIVE.")
    o.append("// The engine's own generated strings (check detail, labels, path and basis names, descriptions) are output")
    o.append("// and cross as data. Every fraction is [numerator, denominator].")
    o.append("")
    o.append("import type { ProfileData } from './types';")
    o.append("")
    o.append("export const PROFILE: ProfileData = {")
    for k, v in data.items():
        if k == 'claims':
            o.append("  claims: [")
            for c in v: o.append("    " + dumps(c) + ",")
            o.append("  ],")
        elif k == 'ranking':
            o.append("  ranking: {")
            for kk, vv in v.items():
                if kk == 'items':
                    o.append("    items: [")
                    for it in vv: o.append("      " + dumps(it) + ",")
                    o.append("    ],")
                else:
                    o.append("    %s: %s," % (kk, dumps(vv)))
            o.append("  },")
        elif k in ('before', 'after'):
            o.append("  %s: {" % k)
            for kk, vv in v.items():
                o.append("    %s: %s," % (kk, dumps(vv)))
            o.append("  },")
        else:
            o.append("  %s: %s," % (k, dumps(v)))
    o.append("};")
    return '\n'.join(o) + '\n'


if __name__ == '__main__':
    root = sys.argv[1].rstrip('/')
    outdir = sys.argv[2].rstrip('/')
    os.makedirs(outdir, exist_ok=True)
    seen = {}
    for pid, golden in PROFILES:
        data = derive(root, golden)
        seen[pid] = data
        open('%s/%s.ts' % (outdir, pid), 'w').write(emit(pid, golden, data))
        print('wrote %s/%s.ts' % (outdir, pid))
    # the three profiles must differ, and each carries its own source hash
    hashes = [seen[p]['source']['sha256'] for p, _ in PROFILES]
    assert len(set(hashes)) == 3, 'the three goldens must be three different files'
    assert len({json.dumps(seen[p]['after']['views']['unweighted']) for p, _ in PROFILES}) == 3, 'the three profiles must give three different results'
