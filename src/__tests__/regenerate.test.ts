// @ts-nocheck
// Uses Node built-ins (fs, child_process, crypto): the project carries no @types/node, and one opt-in test does not
// warrant a new dependency, so this file is excluded from type checking. It runs only when the engine checkout is
// named:  ENGINE_ROOT=/path/to/jccp npm test
import { describe, expect, it } from 'vitest';
import { existsSync, mkdtempSync, readFileSync, readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { PROFILES, PROFILE_ORDER } from '../data/profiles';

const all = PROFILE_ORDER.map((id) => PROFILES[id]);

describe.skipIf(!process.env.ENGINE_ROOT)('regeneration (needs ENGINE_ROOT)', () => {
  it('each module regenerates byte-identical, and its recorded hash is the hash of the golden file', () => {
    const root = process.env.ENGINE_ROOT!;
    const out = mkdtempSync(join(tmpdir(), 'profiles-'));
    execFileSync('python3', ['-I', 'docs/evidence/derive_profiles.py', root, out], { stdio: 'pipe' });
    for (const p of all) {
      const regenerated = readFileSync(join(out, `${p.id}.ts`), 'utf8');
      const committed = readFileSync(join(process.cwd(), 'src/data/profiles', `${p.id}.ts`), 'utf8');
      expect(regenerated === committed, `${p.id} regenerates byte-identical`).toBe(true);
      const golden = join(root, 'backend/tests/golden', p.source.file);
      expect(existsSync(golden), golden).toBe(true);
      expect(createHash('sha256').update(readFileSync(golden)).digest('hex'), p.id).toBe(p.source.sha256);
    }
    expect(readdirSync(out).sort()).toEqual(['bank.ts', 'ministry.ts', 'utility.ts']);
  });
});
