// The organisation profile (the Profile screen's inputs) that each real assessment corresponds to, derived from the
// assessment itself so that choosing one sets the screen to what the engine was given and found, not to something typed.
//
// What the engine's output records is: the sector (by its Arabic name), whether CICSC applies, and which applicability
// variables the organisation declared "no" (each exclusion names the flag that removed it). It does not record the
// variables declared "yes" or "don't know"; a variable with no exclusion is shown as "yes" (its controls are in scope), which is
// all the output says about it. The remaining fields (size, hosting, counts, cloud) are not in the engine's output and
// keep the prototype's illustrative defaults.

import { PROFILES, PROFILE_LABEL, type ProfileId } from './profiles';
import { defaultProfile, type OrgProfile, type Ternary } from './scenario';
import { SECTORS } from './sectors';

type Variable = 'inHouseDevelopment' | 'outsourcedDevelopment' | 'mobileDevices' | 'wirelessNetwork' | 'remoteAccess';

const FLAG_FIELD: Record<string, Variable> = {
  in_house_development: 'inHouseDevelopment',
  outsourced_development: 'outsourcedDevelopment',
  mobile_devices: 'mobileDevices',
  wireless_network: 'wirelessNetwork',
  remote_access: 'remoteAccess',
};

export function orgProfileFor(id: ProfileId): OrgProfile {
  const p = PROFILES[id];
  const declared = Object.fromEntries(Object.values(FLAG_FIELD).map((f) => [f, 'yes'])) as Record<Variable, Ternary>;
  for (const e of p.exclusions) {
    const field = FLAG_FIELD[e.triggeringFlag];
    if (!field) throw new Error(`Exclusion ${e.controlId} names an applicability flag the prototype does not know: ${e.triggeringFlag}`);
    if (e.triggeringValue === 'no') declared[field] = 'no';
  }
  const sector = SECTORS.find((s) => s.arabicLabel === p.cicsc.sectorNameArabic);
  if (!sector) throw new Error(`No sector in the designation list has the Arabic name ${p.cicsc.sectorNameArabic}`);
  return {
    ...defaultProfile,
    ...(id === 'ministry' ? {} : { orgName: PROFILE_LABEL[id] }),
    sector: sector.id,
    operatesCriticalInfrastructure: p.cicsc.applies,
    ...declared,
  };
}
