import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ControlState } from '../data/controls';
import { defaultProfile, type OrgProfile } from '../data/scenario';

export type Phase = 'profile' | 'planning' | 'intake' | 'assessed';

export type Role = 'owner' | 'analyst' | 'executive' | 'contributor' | 'regulator';

export const ROLE_LABEL: Record<Role, string> = {
  owner: 'Assessment Owner',
  analyst: 'Analyst',
  executive: 'Executive',
  contributor: 'Contributor',
  regulator: 'Regulator',
};

/** An analyst override — never a silent state swap. Carries its own audit trail. */
export interface OverrideRecord {
  state: ControlState;
  previousState: ControlState;
  justification: string;
  analystId: string;
  timestamp: string;
}

/** A scoping-challenge decision. Recorded, not just a boolean. */
export interface ChallengeDecision {
  decision: 'confirmed' | 'restored';
  justification: string;
  decidedBy: string;
  decidedAt: string;
}

/** Uploaded evidence slot state (typed intake). */
export interface SlotUpload {
  artifact: string;
  acceptedAt: string;
}

interface AssessmentState {
  phase: Phase;
  role: Role;
  profile: OrgProfile;
  /** the single flag that flips the whole before/after transformation */
  evidenceUploaded: boolean;
  interviewsCompleted: string[]; // role ids
  interviewStatus: Record<string, 'not started' | 'in progress' | 'submitted' | 'under review' | 'accepted'>;
  providedRequests: string[]; // evidence-request ids (Remediation Tab B simulation)
  uploadedSlots: Record<string, SlotUpload>; // typed intake slots, keyed by artifact name
  overriddenControls: Record<string, OverrideRecord>;
  /** cloud scoping challenge — null until the user decides */
  profileChallenge: ChallengeDecision | null;
  /** exclusions the user has opened / acknowledged (demo affordance) */
  reviewedExclusions: string[];

  setPhase: (p: Phase) => void;
  setRole: (r: Role) => void;
  setProfile: (patch: Partial<OrgProfile>) => void;
  setPdpl: (patch: Partial<OrgProfile['pdplHoldings']>) => void;
  uploadEvidence: () => void;
  resetEvidence: () => void;
  resetDemo: () => void;
  completeInterview: (id: string) => void;
  setInterviewStatus: (id: string, s: AssessmentState['interviewStatus'][string]) => void;
  provideRequest: (id: string) => void;
  uploadSlot: (artifact: string) => void;
  uploadSlotsBulk: (artifacts: string[]) => void;
  overrideControl: (id: string, rec: OverrideRecord) => void;
  clearOverride: (id: string) => void;
  resolveProfileChallenge: (decision: ChallengeDecision) => void;
  clearProfileChallenge: () => void;
}

const initial = {
  phase: 'profile' as Phase,
  role: 'owner' as Role,
  profile: defaultProfile,
  evidenceUploaded: false,
  interviewsCompleted: [] as string[],
  interviewStatus: {} as AssessmentState['interviewStatus'],
  providedRequests: [] as string[],
  uploadedSlots: {} as Record<string, SlotUpload>,
  overriddenControls: {} as Record<string, OverrideRecord>,
  profileChallenge: null as ChallengeDecision | null,
  reviewedExclusions: [] as string[],
};

export const useAssessment = create<AssessmentState>()(
  persist(
    (set) => ({
      ...initial,

      setPhase: (p) => set({ phase: p }),
      setRole: (r) => set({ role: r }),
      setProfile: (patch) => set((s) => ({ profile: { ...s.profile, ...patch } })),
      setPdpl: (patch) =>
        set((s) => ({ profile: { ...s.profile, pdplHoldings: { ...s.profile.pdplHoldings, ...patch } } })),
      uploadEvidence: () => set({ evidenceUploaded: true, phase: 'assessed' }),
      resetEvidence: () => set({ evidenceUploaded: false }),
      resetDemo: () => set({ ...initial }),
      completeInterview: (id) =>
        set((s) => ({
          interviewsCompleted: s.interviewsCompleted.includes(id)
            ? s.interviewsCompleted
            : [...s.interviewsCompleted, id],
          interviewStatus: { ...s.interviewStatus, [id]: 'submitted' },
        })),
      setInterviewStatus: (id, st) =>
        set((s) => ({ interviewStatus: { ...s.interviewStatus, [id]: st } })),
      provideRequest: (id) =>
        set((s) => ({
          providedRequests: s.providedRequests.includes(id)
            ? s.providedRequests
            : [...s.providedRequests, id],
        })),
      uploadSlot: (artifact) =>
        set((s) => ({
          uploadedSlots: {
            ...s.uploadedSlots,
            [artifact]: { artifact, acceptedAt: new Date().toISOString() },
          },
        })),
      uploadSlotsBulk: (artifacts) =>
        set((s) => {
          const next = { ...s.uploadedSlots };
          const now = new Date().toISOString();
          for (const a of artifacts) next[a] = { artifact: a, acceptedAt: now };
          return { uploadedSlots: next };
        }),
      overrideControl: (id, rec) =>
        set((s) => ({ overriddenControls: { ...s.overriddenControls, [id]: rec } })),
      clearOverride: (id) =>
        set((s) => {
          const next = { ...s.overriddenControls };
          delete next[id];
          return { overriddenControls: next };
        }),
      resolveProfileChallenge: (decision) => set({ profileChallenge: decision }),
      clearProfileChallenge: () => set({ profileChallenge: null }),
    }),
    // Storage key carries a version suffix: the profile shape changed (sector is now an id,
    // regulator is derived, CICSC toggle added), so stale earlier data is ignored.
    { name: 'jccp-assessment-v3' },
  ),
);
