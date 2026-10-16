# Verifies the figures in the Round 2 brief against the engine's data, computing each one rather than
# reading it from prose.   python3 -I docs/evidence/verify_brief_figures.py <engine-root>
# Reads only. Prints OK / MISMATCH per figure and exits non-zero if any differ.
import csv, json, sys, collections as C
from fractions import Fraction as F
root = sys.argv[1].rstrip('/')
cat = root + '/data/catalogue/jncsf-2024.06/'
d = json.load(open(root + '/backend/tests/golden/government_ministry.json'))
rows = []
def norm(x): return json.dumps(x, sort_keys=True, default=str)
def chk(name, got, want):
    rows.append(('OK  ' if norm(got) == norm(want) else 'MISMATCH', name, got, want))

# ---- Task 2: the ministry table (golden file)
S = d['scoring']; u = S['unweighted']; w = u['width']; pc = lambda x: f"{float(x)*100:.2f}"
claims = {c['control_id']: c for c in d['claims']}
chk('applicable', len(d['applicable']), 557); chk('excluded', len(d['exclusions']), 19)
chk('unweighted lower', pc(u['lower_bound']), '4.87'); chk('unweighted upper', pc(u['upper_bound']), '95.54')
chk('coverage', pc(u['coverage']), '9.34'); chk('coverage exact', u['coverage_exact'], '52/557'); chk('unknown', u['unknown_count'], 505)
chk('width', pc(F(u['upper_exact']) - F(u['lower_exact'])), '90.66')
chk('width unauthored', pc(w['unauthored']), '88.15'); chk('unauthored controls', w['unauthored_exact'], '491/557')
chk('width unevidenced', pc(w['unevidenced']), '2.51'); chk('unevidenced controls', w['unevidenced_exact'], '14/557'); chk('width uncollectable', pc(w['uncollectable']), '0.00')
chk('three parts sum exactly', F(w['unauthored_exact']) + F(w['unevidenced_exact']) + F(w['uncollectable_exact']), F(u['upper_exact']) - F(u['lower_exact']))
reasons = {r['reason']: r['count'] for r in w['unevidenced_by_reason']}
chk('unevidenced by reason', sorted(reasons.items()), sorted({'not_provided': 5, 'declined': 3, 'insufficient_permission': 3, 'module_failed': 2, 'stale': 1}.items()))
wi = S['weighted_including_underived']; wd = S['weighted_derived_only']['score']; a = S['authored_scope']['score']
chk('weighted incl', (pc(wi['lower_bound']), pc(wi['upper_bound']), wi['applicable_count']), ('5.14', '95.57', 557))
chk('weighted derived', (pc(wd['lower_bound']), pc(wd['upper_bound']), wd['applicable_count']), ('5.38', '94.60', 390))
chk('authored scope', (pc(a['lower_bound']), pc(a['upper_bound']), a['applicable_count'], pc(a['coverage']), a['unknown_count']), ('41.77', '63.31', 65, '78.46', 14))
chk('weighted totals', (S['weighted_derived_only']['score']['total_weight'], wi['total_weight'], S['weighted_derived_only']['excluded_count']), (331.4, 498.4, 167))
chk('per-state buckets', dict(C.Counter(c['state'] for c in claims.values())), {'unknown': 505, 'red': 6, 'green': 21, 'yellow': 25})

# ---- Task 5: authoring figures, from the catalogue's data tables
paths = list(csv.DictReader(open(cat + 'evidence_paths.csv')))
signals = list(csv.DictReader(open(root + '/data/catalogue/signals.csv')))
maps = list(csv.DictReader(open(cat + 'jncsf_mappings.csv')))
rw = {r['control_id']: r for r in csv.DictReader(open(cat + 'risk_weights.csv'))}
authored = set(p['control_id'] for p in paths)
conclusive_ctl = set(p['control_id'] for p in paths if p['sufficiency'] == 'conclusive')
path_keys = set((p['control_id'], p['path_label']) for p in paths)
path_suff = {}
for p in paths: path_suff.setdefault((p['control_id'], p['path_label']), set()).add(p['sufficiency'])
chk('authored controls', len(authored), 66)
chk('with a conclusive path', len(conclusive_ctl), 59); chk('indicative only', len(authored - conclusive_ctl), 7)
chk('unauthored (of 576)', len(rw) - len(authored), 510)
chk('evidence paths', len(path_keys), 125)
chk('signals', len(signals), 115)
doc = [s for s in signals if s['signal_key'].startswith('document.')]
chk('documentary signals (key prefix)', len(doc), 45); chk('machine-collected signals', len(signals) - len(doc), 70)
chk('negative-capable signals', sum(1 for s in signals if s['negative_capable'] == 'true'), 38)
chk('negative_capable_basis of the rest', dict(C.Counter(s['negative_capable_basis'] for s in signals if s['negative_capable'] != 'true')), {'by_rule': 45, 'judgement': 31, 'uncertainty': 1})
cap = {'Security in Architecture and Portfolio': 'arch', 'Development': 'dev', 'Delivery': 'del', 'Operation': 'ops', 'Foundational': 'found'}
by = {k: [0, 0] for k in cap.values()}
for cid, r in rw.items():
    by[cap[r['capability']]][0] += 1; by[cap[r['capability']]][1] += cid in authored
chk('controls per capability', {k: v[0] for k, v in by.items()}, {'arch': 25, 'dev': 69, 'del': 44, 'ops': 299, 'found': 139})
chk('authored per capability', {k: v[1] for k, v in by.items()}, {'arch': 5, 'dev': 4, 'del': 44, 'ops': 9, 'found': 4})
chk('Delivery complete (authored == controls)', by['del'][0] == by['del'][1], True)
chk('Operations share of framework', f"{by['ops'][0]*100/len(rw):.0f}%", '52%')
nist = set(m['control_id'] for m in maps if m['standard'] == 'nist80053'); iso = set(m['control_id'] for m in maps if m['standard'] == 'iso27002')
chk('reach via NIST', len(nist), 403); chk('reach via ISO', len(iso), 341)
chk('reach via either', len(nist | iso), 568); chk('either as a share', f"{len(nist | iso)*100/576:.1f}%", '98.6%')
chk('reach via neither', 576 - len(nist | iso), 8)
chk('partition both / NIST only / ISO only', (len(nist & iso), len(nist - iso), len(iso - nist)), (176, 227, 165))
chk('control population', len(rw), 576)
for r in rows: print(*r, sep=' | ')
bad = sum(1 for r in rows if r[0] == 'MISMATCH'); print('MISMATCHES:', bad, 'of', len(rows)); sys.exit(1 if bad else 0)
