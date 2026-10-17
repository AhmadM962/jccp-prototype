// A value that depends on which assessment is active, built the first time each profile asks for it and then kept.
// It looks like the object or array it stands for, so a call site reads `capabilities.map(...)` or `TOTALS.after`
// exactly as before, and gets the ACTIVE profile's. Nothing may copy a property out of one into a module-level constant:
// that fixes it to the profile that was active at import.

import { activeProfileId, type ProfileId } from '../data/profiles';

export function lazyByProfile<T extends object>(build: () => T, shape: 'object' | 'array' = 'object'): T {
  const built = new Map<ProfileId, T>();
  const current = (): T => {
    const id = activeProfileId();
    let v = built.get(id);
    if (v === undefined) {
      v = build();
      built.set(id, v);
    }
    return v;
  };
  return new Proxy((shape === 'array' ? [] : {}) as T, {
    get: (_t, key) => Reflect.get(current(), key),
    has: (_t, key) => Reflect.has(current(), key),
    ownKeys: () => Reflect.ownKeys(current()),
    getOwnPropertyDescriptor: (_t, key) => {
      const d = Reflect.getOwnPropertyDescriptor(current(), key);
      return d && key !== 'length' ? { ...d, configurable: true } : d;
    },
  });
}
