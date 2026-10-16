import { beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Remediation from '../screens/07_Remediation';
import { evidenceRequests } from '../data/remediation';
import { useAssessment } from '../store/useAssessment';

// Property test over every subset of the five providable artifacts (2^5 = 32): what the
// "What you didn't provide" card actually prints must be a possible interval, with one width.

const IDS = evidenceRequests.map((r) => r.id);

function shown(subset: string[]) {
  useAssessment.setState({ providedRequests: subset });
  const { container, getByText, unmount } = render(
    <MemoryRouter>
      <Remediation />
    </MemoryRouter>,
  );
  fireEvent.click(getByText("What you didn't provide"));
  const text = container.textContent ?? '';
  const nums = Array.from(container.querySelectorAll('span.text-3xl')).map((e) =>
    parseFloat((e.textContent ?? '').replace('%', '')),
  );
  const heroWidth = /width (-?\d+\.\d) points/.exec(text);
  const subWidth = /Band width falls to (-?\d+\.\d) pts/.exec(text);
  unmount();
  return {
    lower: nums[0],
    upper: nums[1],
    heroWidth: heroWidth ? parseFloat(heroWidth[1]) : NaN,
    subWidth: subWidth ? parseFloat(subWidth[1]) : null,
  };
}

beforeEach(() => {
  localStorage.clear();
  useAssessment.getState().resetDemo();
});

describe('projected interval, all 32 subsets of the five artifacts', () => {
  it('always shows lower ≤ upper, width ≥ 0, and the same width in hero and subline', () => {
    const failures: string[] = [];
    for (let mask = 0; mask < 32; mask++) {
      const subset = IDS.filter((_, i) => mask & (1 << i));
      const s = shown(subset);
      const label = `{${subset.join(',') || 'none'}}`;
      if (!(s.lower <= s.upper)) failures.push(`${label}: lower ${s.lower} > upper ${s.upper}`);
      if (!(s.heroWidth >= 0)) failures.push(`${label}: hero width ${s.heroWidth} is negative`);
      if (Math.abs(s.upper - s.lower - s.heroWidth) > 0.15)
        failures.push(`${label}: hero width ${s.heroWidth} != upper-lower ${(s.upper - s.lower).toFixed(1)}`);
      if (subset.length > 0) {
        if (s.subWidth === null) failures.push(`${label}: no 'Band width falls to' subline`);
        else if (s.subWidth !== s.heroWidth)
          failures.push(`${label}: hero width ${s.heroWidth} != subline width ${s.subWidth}`);
      }
    }
    expect(failures).toEqual([]);
  });
});
