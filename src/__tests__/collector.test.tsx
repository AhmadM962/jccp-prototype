import { beforeEach, expect, it } from 'vitest';
import { fireEvent, render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Intake from '../screens/03_Intake';
import { useAssessment } from '../store/useAssessment';
import { COLLECTOR_SIGNALS, controlsFor } from '../lib/collector';
import script from '../../collectors/windows_ad/Collect-JccpEvidence.ps1?raw';

beforeEach(() => {
  localStorage.clear();
  useAssessment.getState().resetDemo();
});

it('the collector transcript lists six signals, each with its query, drawn from the script, and the script writes nothing but its two files', () => {
  const { container, getByText, getByTestId } = render(<MemoryRouter><Intake /></MemoryRouter>);
  fireEvent.click(getByText('Evidence bundle'));
  const rows = container.querySelectorAll('[data-testid="collector-signals"] > li');
  expect(rows.length).toBe(6);
  for (const s of COLLECTOR_SIGNALS) {
    const row = getByTestId(`collector-${s.id}`);
    expect(row.querySelector('[data-testid="collector-query"]')!.textContent).toBe(s.query);
    expect(script, s.id).toContain(s.query.replace(/'/g, "''")); // the panel shows the script's own query
    expect(script, s.id).toContain(`Id = '${s.id}'`);
    expect(controlsFor(s.engineSignal).length, s.engineSignal).toBeGreaterThan(0); // query → signal → control, from the plan
  }
  expect(container.querySelector('[data-testid="collector-script"]')).toBeNull();
  fireEvent.click(getByText(/Show the script/));
  expect(getByTestId('collector-script').textContent).toContain('DESIGN RULES');
  const code = script.replace(/<#[\s\S]*?#>/g, '').replace(/^\s*#.*$/gm, '');
  expect(code).not.toMatch(/\b(Set|New|Remove|Add|Enable|Disable|Clear|Move|Rename|Reset|Unlock|Out|Export)-(?!Null\b|String\b)\w+|Invoke-Expression|Get-Credential|Password\b/i);
  for (const rule of ['READ-ONLY', 'NO CREDENTIALS STORED', 'RAW RECORDS ARE SEPARATE', 'FAILED QUERY RECORDS ITSELF AS A FAILURE']) expect(script).toContain(rule);
});
