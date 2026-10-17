// The Word report for the active assessment. Every sentence is a template filled from the assessment result: nothing in
// the document was written by a model, and the document says so. `reportModel` is plain data; `generateReportBlob` turns
// it into a .docx and loads the `docx` library only when it is called, so the main bundle does not carry it.

import { CURRENT } from '../data/current';
import { completenessStatement } from './coverage';
import { assuranceLabel, assuranceMeasurement, assuranceReason } from './assurance';
import { topTie } from './narrative';
import { AUTHORED_SCOPE_LABEL, VIEW_LABEL, VIEW_ORDER, WIDTH_OWNER, viewPercents, widthParts } from './views';
import { TOTALS } from '../data/capabilities';

export type Block =
  | { kind: 'title'; text: string }
  | { kind: 'h1'; text: string }
  | { kind: 'p'; text: string; bold?: boolean }
  | { kind: 'table'; head: string[]; rows: string[][] };

export interface ReportMeta {
  organisation: string;
  /** the named entity, when one has been chosen on the Profile screen */
  entity?: string;
  sector?: string;
}

const f1 = (n: number) => n.toFixed(1);
const f2 = (n: number) => n.toFixed(2);

export function reportModel(meta: ReportMeta): Block[] {
  const a = CURRENT.after;
  const u = viewPercents(a.views.unweighted);
  const cs = completenessStatement(true);
  const tie = topTie();
  const m = assuranceMeasurement();
  const b: Block[] = [];

  // cover
  b.push({ kind: 'title', text: 'JNCSF compliance assessment' });
  b.push({ kind: 'p', text: `Organisation: ${meta.organisation}.`, bold: true });
  if (meta.entity) b.push({ kind: 'p', text: `Entity: ${meta.entity}${meta.sector ? ` (sector: ${meta.sector})` : ''}.` });
  b.push({ kind: 'p', text: `Assessment date: ${CURRENT.asOf.slice(0, 10)}. Framework: ${CURRENT.framework.name} ${CURRENT.framework.version}.` });
  b.push({ kind: 'p', text: `Source file: ${CURRENT.source.file}.` });
  b.push({ kind: 'p', text: `SHA-256 of the source file: ${CURRENT.source.sha256}.` });
  b.push({
    kind: 'p',
    text: 'Every sentence in this document is a template filled from the assessment result. No prose in it was written by a model, and no figure in it was typed.',
  });

  // the interval
  b.push({ kind: 'h1', text: 'The interval' });
  b.push({
    kind: 'p',
    text: `Compliance is ${f1(u.lowerPct)}–${f1(u.upperPct)}%, a band ${f1(u.widthPts)} points wide, at ${f1(u.coveragePct)}% coverage (${u.known} of ${u.applicable} applicable controls have a verdict). It is reported as an interval because a single percentage would conceal what was not established. The width of the band is exactly what the assessment did not establish.`,
  });
  b.push({
    kind: 'table',
    head: ['Cause of width', 'Controls', 'Points', 'Whose limitation'],
    rows: widthParts(a.views.unweighted.width).map((p) => [p.cause, String(p.frac[0]), f2(p.pts), WIDTH_OWNER[p.cause]]),
  });

  // the four views
  b.push({ kind: 'h1', text: 'The four views' });
  b.push({
    kind: 'table',
    head: ['View', 'Lower %', 'Upper %', 'Width (points)', 'Coverage %'],
    rows: VIEW_ORDER.map((id) => {
      const v = viewPercents(a.views[id]);
      return [VIEW_LABEL[id], f1(v.lowerPct), f1(v.upperPct), f1(v.widthPts), f1(v.coveragePct)];
    }),
  });
  b.push({ kind: 'p', text: `Authored scope: ${AUTHORED_SCOPE_LABEL}` });

  // exclusions
  b.push({ kind: 'h1', text: 'Scope exclusions' });
  b.push({ kind: 'p', text: `${CURRENT.totals.excluded} of ${CURRENT.totals.framework} controls are excluded from this assessment; ${CURRENT.totals.applicable} apply.` });
  if (CURRENT.exclusions.length > 0) {
    b.push({
      kind: 'table',
      head: ['Control', 'Excluded because', 'Justification (the engine’s)'],
      rows: CURRENT.exclusions.map((e) => [e.controlId, `${e.triggeringFlag} = ${e.triggeringValue}`, e.justification]),
    });
  }

  // completeness
  b.push({ kind: 'h1', text: 'Completeness statement' });
  b.push({
    kind: 'p',
    text: `This assessment covers ${cs.covered} of ${cs.applicable} applicable controls. ${cs.unknown} are not established: ${cs.unauthored} because no evidence requirement has been authored (a limitation of the tool), ${cs.unevidenced} because evidence was not provided, and ${cs.uncollectable} because they are outside the tool's collection reach. Assurance level: ${cs.assurance}.`,
  });

  // ranked actions
  b.push({ kind: 'h1', text: 'Ranked actions' });
  if (tie) {
    b.push({
      kind: 'p',
      text: `The engine ranked ${CURRENT.ranking.items.length} actions. ${tie.size} actions share the highest rank, all of equal magnitude: ${tie.fixes.length} fixes for Gaps and ${tie.requests.length} requests for evidence. The engine does not break a tie it cannot justify (${tie.note}).`,
    });
    b.push({
      kind: 'table',
      head: ['Rank', 'Control', 'Action', 'Description', 'Magnitude (points)'],
      rows: CURRENT.ranking.items.slice(0, Math.max(10, tie.size)).map((i) => [String(i.rank), i.controlId, i.actionType, i.description, f2(i.magnitudePoints)]),
    });
  } else {
    b.push({ kind: 'p', text: 'The engine ranked no action for this assessment.' });
  }

  // assurance
  b.push({ kind: 'h1', text: 'Assurance' });
  b.push({ kind: 'p', text: `Assurance level: ${assuranceLabel(TOTALS.after.assurance)}. ${assuranceReason() || `The highest level, ${m.level}, is reported.`}` });
  b.push({
    kind: 'table',
    head: ['Demotion check', 'Status', 'Detail (the engine’s)'],
    rows: CURRENT.assurance.checks.map((c) => [c.cause, c.status.replace('_', ' '), c.detail]),
  });

  // provenance
  b.push({ kind: 'h1', text: 'Appendix: provenance' });
  b.push({ kind: 'p', text: `The figures in this document are read from ${CURRENT.source.file}, the assessment engine's output for this assessment.` });
  b.push({ kind: 'p', text: `SHA-256: ${CURRENT.source.sha256}.` });
  b.push({ kind: 'p', text: `To check it, hash that file and compare: sha256sum ${CURRENT.source.file}.` });
  b.push({
    kind: 'table',
    head: ['Parameter', 'Value'],
    rows: Object.entries(CURRENT.parameters).map(([k, v]) => [k, String(v)]),
  });
  return b;
}

/** Build the .docx. The `docx` library is imported here, on demand, and nowhere else. */
export async function generateReportBlob(meta: ReportMeta): Promise<Blob> {
  const d = await import('docx');
  const border = { style: d.BorderStyle.SINGLE, size: 4, color: 'BBBBBB' };
  const borders = { top: border, bottom: border, left: border, right: border };
  const cell = (text: string, head = false) =>
    new d.TableCell({ borders, children: [new d.Paragraph({ children: [new d.TextRun({ text, bold: head, size: 18 })] })] });
  const children = reportModel(meta).map((blk) => {
    switch (blk.kind) {
      case 'title':
        return new d.Paragraph({ heading: d.HeadingLevel.TITLE, children: [new d.TextRun(blk.text)] });
      case 'h1':
        return new d.Paragraph({ heading: d.HeadingLevel.HEADING_1, children: [new d.TextRun(blk.text)] });
      case 'p':
        return new d.Paragraph({ spacing: { after: 120 }, children: [new d.TextRun({ text: blk.text, bold: blk.bold })] });
      case 'table':
        return new d.Table({
          width: { size: 100, type: d.WidthType.PERCENTAGE },
          rows: [new d.TableRow({ tableHeader: true, children: blk.head.map((h) => cell(h, true)) }), ...blk.rows.map((r) => new d.TableRow({ children: r.map((c) => cell(c)) }))],
        });
    }
  });
  const doc = new d.Document({
    creator: 'JCCP',
    title: 'JNCSF compliance assessment',
    sections: [{ children }],
  });
  return d.Packer.toBlob(doc);
}

export const reportFileName = (): string => `jccp-assessment-${CURRENT.source.file.replace(/\.json$/, '')}-${CURRENT.asOf.slice(0, 10)}.docx`;
