// usage: node lockdiff.js <rev-a> <rev-b>   (run from the repo root)
const { execSync } = require('child_process');
const pk = (r) => JSON.parse(execSync(`git show ${r}:package-lock.json`, { maxBuffer: 1e9 })).packages;
const [a, b] = [pk(process.argv[2]), pk(process.argv[3])];
const ks = Object.keys(b).filter((k) => k);
const added = ks.filter((k) => !(k in a)).length;
const removed = Object.keys(a).filter((k) => k && !(k in b)).length;
const changed = ks.filter((k) => k in a && JSON.stringify(a[k]) !== JSON.stringify(b[k]));
const core = changed.filter((k) => ['version', 'resolved', 'integrity'].some((f) => a[k][f] !== b[k][f]));
console.log(JSON.stringify({ added, removed, changedEntries: changed.length, changedVersionResolvedOrIntegrity: core.length }));
