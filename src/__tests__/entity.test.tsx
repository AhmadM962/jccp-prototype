import { beforeEach, expect, it } from 'vitest';
import { fireEvent, render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from '../App';
import { useAssessment } from '../store/useAssessment';

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem('jccp-tour-seen', '1');
  useAssessment.getState().resetDemo();
});

it('selecting a real entity shows the empty assessment state and no interval, anywhere', () => {
  useAssessment.setState({ evidenceUploaded: true });
  const { getByLabelText, getByText, getByTestId, container } = render(<MemoryRouter initialEntries={['/profile']}><App /></MemoryRouter>);
  fireEvent.change(container.querySelector('option[value="water"]')!.parentElement!, { target: { value: 'water' } });
  const entity = getByLabelText('Entity') as HTMLSelectElement;
  expect(Array.from(entity.options).map((o) => o.textContent)).toEqual(expect.arrayContaining(['Miyahuna (Jordan Water Company)', 'Yarmouk Water Company', 'Aqaba Water Company', 'Other — enter a name']));
  fireEvent.change(entity, { target: { value: 'miyahuna' } });
  expect(getByTestId('entity-note').textContent).toContain('No assessment has been run for this organisation');
  for (const screen of ['Compliance Dashboard', 'Gap Matrix', 'Remediation & Requests']) {
    fireEvent.click(getByText(screen));
    expect(getByTestId('no-assessment').textContent).toContain('No assessment has been run for this organisation.');
    expect(container.textContent).not.toMatch(/\d+(\.\d+)?%/); // no interval, no coverage, no figure about the organisation
    expect(container.querySelector('[data-testid="source-stamp"]')).toBeNull();
  }
  // choosing the demonstration organisation again brings the assessment back
  fireEvent.click(container.querySelector('[data-tour="nav-/profile"]')!);
  fireEvent.change(getByLabelText('Entity'), { target: { value: 'demo' } });
  fireEvent.click(getByText('Compliance Dashboard'));
  expect(container.querySelector('[data-testid="no-assessment"]')).toBeNull();
});
