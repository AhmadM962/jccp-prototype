import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ControlState } from '../data/controls';
import { defaultProfile, type OrgProfile } from '../data/scenario';

export type Phase = 'profile' | 'planning' | 'intake' | 'assessed';

interface AssessmentState {
  phase: Phase;
  profile: OrgProfile;
  /** the single flag that flips the whole before/after transformation */
  evidenceUploaded: boolean;
  interviewsCompleted: string[]; // role ids
  /** provided evidence-request ids (Remediation Tab B simulation) */
  providedRequests: string[];
  overriddenControls: Record<string, ControlState>;
  profileChallengeResolved: boolean;

  setPhase: (p: Phase) => void;
  setProfile: (patch: Partial<OrgProfile>) => void;
  setPdpl: (patch: Partial<OrgProfile['pdplHoldings']>) => void;
  uploadEvidence: () => void;
  resetEvidence: () => void;
  resetDemo: () => void;
  completeInterview: (id: string) => void;
  provideRequest: (id: string) => void;
  overrideControl: (id: string, state: ControlState) => void;
  clearOverride: (id: string) => void;
  resolveProfileChallenge: () => void;
}

export const useAssessment = create<AssessmentState>()(
  persist(
    (set) => ({
  phase: 'profile',
  profile: defaultProfile,
  evidenceUploaded: false,
  interviewsCompleted: [],
  providedRequests: [],
  overriddenControls: {},
  profileChallengeResolved: false,

  setPhase: (p) => set({ phase: p }),
  setProfile: (patch) => set((s) => ({ profile: { ...s.profile, ...patch } })),
  setPdpl: (patch) =>
    set((s) => ({ profile: { ...s.profile, pdplHoldings: { ...s.profile.pdplHoldings, ...patch } } })),
  uploadEvidence: () => set({ evidenceUploaded: true, phase: 'assessed' }),
  resetEvidence: () => set({ evidenceUploaded: false }),
  resetDemo: () =>
    set({
      evidenceUploaded: false,
      phase: 'profile',
      profile: defaultProfile,
      interviewsCompleted: [],
      providedRequests: [],
      overriddenControls: {},
      profileChallengeResolved: false,
    }),
  completeInterview: (id) =>
    set((s) => ({
      interviewsCompleted: s.interviewsCompleted.includes(id)
        ? s.interviewsCompleted
        : [...s.interviewsCompleted, id],
    })),
  provideRequest: (id) =>
    set((s) => ({
      providedRequests: s.providedRequests.includes(id)
        ? s.providedRequests
        : [...s.providedRequests, id],
    })),
  overrideControl: (id, state) =>
    set((s) => ({ overriddenControls: { ...s.overriddenControls, [id]: state } })),
  clearOverride: (id) =>
    set((s) => {
      const next = { ...s.overriddenControls };
      delete next[id];
      return { overriddenControls: next };
    }),
  resolveProfileChallenge: () => set({ profileChallengeResolved: true }),
    }),
    { name: 'jccp-assessment' },
  ),
);
