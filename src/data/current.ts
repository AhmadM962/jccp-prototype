// A handle on the ACTIVE assessment. `CURRENT.after.views.unweighted` is the active profile's figure, read when the
// property is read, so it follows a change of profile. Do not copy a value out of it into a module-level constant.

import { activeProfile } from './profiles';
import type { ProfileData } from './profiles/types';

export const CURRENT: ProfileData = new Proxy({} as ProfileData, {
  get: (_t, key) => (activeProfile() as unknown as Record<string | symbol, unknown>)[key],
  has: (_t, key) => key in activeProfile(),
  ownKeys: () => Reflect.ownKeys(activeProfile()),
  getOwnPropertyDescriptor: (_t, key) => ({ enumerable: true, configurable: true, value: (activeProfile() as unknown as Record<string | symbol, unknown>)[key] }),
});

export type {
  AssuranceLevelId,
  Attack,
  CapabilityFigures,
  CapabilityId,
  CheckCause,
  CheckStatus,
  Claim,
  ControlState,
  DemotionCheck,
  EvidenceClass,
  EvidenceKind,
  Exclusion,
  Frac,
  GapBasis,
  GapReason,
  PartialBasis,
  ProfileData,
  ProfileId,
  RankItem,
  StateFigures,
  ViewFigures,
  ViewId,
  WeightBasis,
  WidthParts,
} from './profiles/types';
