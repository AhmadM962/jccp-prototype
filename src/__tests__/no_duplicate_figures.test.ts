import { describe, expect, it } from 'vitest';
import * as ts from 'typescript';

// Guard: the canonical figures live in src/data/figures.ts. The literals below may not
// appear in any other source file except where the allow-list says so. The allow-list is
// the frozen set of existing duplicates — it may shrink, never grow. Counts are exact, so
// both a new duplicate and a removed one (stale entry) fail until the list is updated.
//
// A "literal" here is a numeric literal, string literal, template-literal text or JSX text
// that contains the number as a whole token. Comments and import declarations are ignored.
// Test files (src/__tests__, src/test) are not scanned — they necessarily name the numbers.

const LITERALS = ['576', '557', '405', '135', '39'] as const;
type Lit = (typeof LITERALS)[number];

const ALLOW: Record<string, Partial<Record<Lit, number>>> = {
  // TODO round 3: use TOTAL_CONTROLS from figures.ts
  'src/components/AttackExposure.tsx': { '576': 1 },
  // TODO round 3: use CICSC_CONTROLS / TOTAL_CONTROLS from figures.ts
  'src/data/attack.ts': { '405': 1, '576': 1 },
  // Round 3: the per-profile figures live in src/data/profiles/*.ts, GENERATED from the engine's golden outputs.
  // They are the single source of those numbers (the applicable count differs by profile), so they are exempt
  // from this scan (see SCANNED below); everything else is still scanned.
  // The one '39' left is control number 39 in the seed list (the uncollectable 39 is gone with the old fixture).
  'src/data/controls.ts': { '39': 1 },
  // TODO round 3: use TOTAL_CONTROLS
  'src/data/scenario.ts': { '576': 2 },
  // TODO round 3: use CICSC_CONTROLS, CICSC_LEVEL1_CONTROLS, TOTAL_CONTROLS
  'src/screens/01_Profile.tsx': { '135': 1, '405': 2, '576': 1 },
  // TODO round 3: use CICSC_CONTROLS
  'src/screens/04_Dashboard.tsx': { '405': 2 },
  // Round 3 removed every entry for 08_Export.tsx: its figures come from the assessment and figures.ts.
  // TODO round 3: use TOTAL_CONTROLS
  'src/screens/09_Chat.tsx': { '576': 2 },
  // TODO round 3: use TOTAL_CONTROLS
  'src/tour/glossary.ts': { '576': 2 },
  'src/tour/helpContent.ts': { '576': 1 },
};

const sources = import.meta.glob('/src/**/*.{ts,tsx}', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

const SCANNED = Object.entries(sources)
  .map(([p, text]) => [p.replace(/^\//, ''), text] as const)
  .filter(([p]) => !p.startsWith('src/__tests__/') && !p.startsWith('src/test/') && !p.startsWith('src/data/profiles/') && p !== 'src/data/figures.ts');

export function countLiterals(file: string, text: string): Partial<Record<Lit, number>> {
  const sf = ts.createSourceFile(
    file,
    text,
    ts.ScriptTarget.Latest,
    true,
    file.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );
  const out: Partial<Record<Lit, number>> = {};
  const K = ts.SyntaxKind;
  const visit = (n: ts.Node) => {
    if (ts.isImportDeclaration(n)) return;
    if (
      n.kind === K.NumericLiteral ||
      n.kind === K.StringLiteral ||
      n.kind === K.NoSubstitutionTemplateLiteral ||
      n.kind === K.TemplateHead ||
      n.kind === K.TemplateMiddle ||
      n.kind === K.TemplateTail ||
      n.kind === K.JsxText
    ) {
      const t = n.getText(sf);
      for (const l of LITERALS) {
        const re = new RegExp(`(?<![\\w.])${l}(?!\\w|\\.\\d)`, 'g');
        const hits = t.match(re)?.length ?? 0;
        if (hits) out[l] = (out[l] ?? 0) + hits;
      }
    }
    ts.forEachChild(n, visit);
  };
  visit(sf);
  return out;
}

describe('figures are not duplicated outside src/data/figures.ts', () => {
  it('scans the source tree', () => {
    expect(SCANNED.length).toBeGreaterThan(40);
    expect(SCANNED.some(([p]) => p === 'src/data/scenario.ts')).toBe(true);
  });

  it('detects a literal in code (self-check of the scanner)', () => {
    expect(countLiterals('x.ts', 'const x = 557; // 576')).toEqual({ '557': 1 });
    expect(countLiterals('x.tsx', 'const a = <p>405 controls</p>; const b = `n=${1} 39`;')).toEqual({
      '405': 1,
      '39': 1,
    });
  });

  it('finds no literal outside the frozen allow-list', () => {
    const problems: string[] = [];
    const seen = new Set<string>();
    for (const [file, text] of SCANNED) {
      const c = countLiterals(file, text);
      const allowed = ALLOW[file] ?? {};
      for (const l of LITERALS) {
        const n = c[l] ?? 0;
        const a = allowed[l] ?? 0;
        if (n > a) problems.push(`${file}: literal ${l} appears ${n}x, allow-list permits ${a}x — import it from src/data/figures.ts`);
        if (n < a) problems.push(`${file}: literal ${l} appears ${n}x but the allow-list still permits ${a}x — tighten the allow-list`);
      }
      seen.add(file);
    }
    for (const file of Object.keys(ALLOW)) {
      if (!seen.has(file)) problems.push(`${file}: allow-listed but not found in src/`);
    }
    expect(problems).toEqual([]);
  });
});
