import {
  Building2,
  ClipboardList,
  Inbox,
  LayoutDashboard,
  Grid3x3,
  Wrench,
  FileJson,
  MessagesSquare,
} from 'lucide-react';
import type { Phase } from '../../store/useAssessment';

export interface NavItem {
  to: string;
  label: string;
  icon: typeof Building2;
  step: number; // 1..9
  phase?: Phase;
}

export const NAV: NavItem[] = [
  { to: '/profile', label: 'Organisation Profile', icon: Building2, step: 1, phase: 'profile' },
  { to: '/request-plan', label: 'Evidence Request Plan', icon: ClipboardList, step: 2, phase: 'planning' },
  { to: '/intake', label: 'Intake', icon: Inbox, step: 3, phase: 'intake' },
  { to: '/dashboard', label: 'Compliance Dashboard', icon: LayoutDashboard, step: 4, phase: 'assessed' },
  { to: '/gap-matrix', label: 'Gap Matrix', icon: Grid3x3, step: 5, phase: 'assessed' },
  { to: '/remediation', label: 'Remediation & Requests', icon: Wrench, step: 7, phase: 'assessed' },
  { to: '/export', label: 'OSCAL Export', icon: FileJson, step: 8, phase: 'assessed' },
  { to: '/chat', label: 'Compliance Chat', icon: MessagesSquare, step: 9 },
];

export const PHASE_ORDER: Phase[] = ['profile', 'planning', 'intake', 'assessed'];
export const PHASE_LABEL: Record<Phase, string> = {
  profile: 'Profile',
  planning: 'Planning',
  intake: 'Intake',
  assessed: 'Assessed',
};
