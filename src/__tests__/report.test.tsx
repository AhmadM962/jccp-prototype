import { beforeEach, expect, it, vi } from 'vitest';
import { fireEvent, render, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import JSZip from 'jszip';
import ExportScreen from '../screens/08_Export';
import { useAssessment } from '../store/useAssessment';
import { CURRENT } from '../data/current';
import { viewPercents } from '../lib/views';

beforeEach(() => {
  localStorage.clear();
  useAssessment.getState().resetDemo();
});

it('clicking Generate produces a real .docx that contains the interval and the source hash', async () => {
  useAssessment.setState({ evidenceUploaded: true });
  let blob: Blob | undefined;
  let name = '';
  URL.createObjectURL = (b: Blob | MediaSource) => {
    blob = b as Blob;
    return 'blob:test';
  };
  URL.revokeObjectURL = () => {};
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
    name = this.download;
  });
  const { getByText } = render(<MemoryRouter><ExportScreen /></MemoryRouter>);
  fireEvent.click(getByText('Generate Word report (.docx)'));
  await waitFor(() => expect(blob).toBeDefined(), { timeout: 20000 });
  expect(name).toMatch(/\.docx$/);
  const buf = await new Promise<ArrayBuffer>((res) => {
    const r = new FileReader();
    r.onload = () => res(r.result as ArrayBuffer);
    r.readAsArrayBuffer(blob!);
  });
  const xml = await (await JSZip.loadAsync(buf)).file('word/document.xml')!.async('string');
  const u = viewPercents(CURRENT.after.views.unweighted);
  expect(xml).toContain(`${u.lowerPct.toFixed(1)}–${u.upperPct.toFixed(1)}%`);
  expect(xml).toContain(CURRENT.source.sha256);
  expect(xml).toContain('No prose in it was written by a model');
}, 30000);
