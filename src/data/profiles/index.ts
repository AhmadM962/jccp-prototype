// The three engine assessments the prototype can show, and which of them is active.
//
// `activeProfile()` is read at call time by everything that shows a figure; the store (src/store/useAssessment.ts)
// keeps the choice, and the app remounts its routes when it changes. Nothing outside this file should hold a
// profile's data in a module-level constant, because that would not follow a change of profile.

import { PROFILE as ministry } from './ministry';
import { PROFILE as bank } from './bank';
import { PROFILE as utility } from './utility';
import type { ProfileData, ProfileId } from './types';

export type { ProfileData, ProfileId } from './types';

export const PROFILES: Record<ProfileId, ProfileData> = { ministry, bank, utility };

/** In the order the profile selector lists them. */
export const PROFILE_ORDER: readonly ProfileId[] = ['ministry', 'bank', 'utility'];

/** How each assessment is named for a reader. The sector name and the framework come from the engine's output. */
export const PROFILE_LABEL: Record<ProfileId, string> = {
  ministry: 'Government ministry',
  bank: 'Bank',
  utility: 'Utility with operational technology',
};

export const DEFAULT_PROFILE: ProfileId = 'ministry';

let active: ProfileId = DEFAULT_PROFILE;

export const activeProfileId = (): ProfileId => active;
export const activeProfile = (): ProfileData => PROFILES[active];
export const setActiveProfile = (id: ProfileId): void => {
  if (!(id in PROFILES)) throw new Error(`Unknown profile: ${String(id)}`);
  active = id;
};
export const isProfileId = (x: unknown): x is ProfileId => typeof x === 'string' && x in PROFILES;
