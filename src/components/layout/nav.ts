import {
  Building2,
  ClipboardList,
  Inbox,
  LayoutDashboard,
  Grid3x3,
  Wrench,
  FileJson,
  MessagesSquare,
  Ban,
  Landmark,
  ShieldHalf,
  ListTodo,
} from 'lucide-react';
import type { Phase, Role } from '../../store/useAssessment';

export interface NavItem {
  to: string;
  label: string;
  icon: typeof Building2;
  step: number;
  phase?: Phase;
  /** roles that may see this nav entry; omit = everyone */
  roles?: Role[];
}

export const NAV: NavItem[] = [
  { to: '/profile', label: 'Organisation Profile', icon: Building2, step: 1, phase: 'profile', roles: ['owner', 'analyst'] },
  { to: '/request-plan', label: 'Evidence Request Plan', icon: ClipboardList, step: 2, phase: 'planning', roles: ['owner', 'analyst'] },
  { to: '/intake', label: 'Intake', icon: Inbox, step: 3, phase: 'intake', roles: ['owner', 'analyst'] },
  { to: '/dashboard', label: 'Compliance Dashboard', icon: LayoutDashboard, step: 4, phase: 'assessed', roles: ['owner', 'analyst', 'executive'] },
  { to: '/gap-matrix', label: 'Gap Matrix', icon: Grid3x3, step: 5, phase: 'assessed', roles: ['owner', 'analyst'] },
  { to: '/exclusions', label: 'Scope Exclusions', icon: Ban, step: 5, roles: ['owner', 'analyst'] },
  { to: '/tasks', label: 'My Tasks', icon: ListTodo, step: 3, roles: ['contributor'] },
  { to: '/remediation', label: 'Remediation & Requests', icon: Wrench, step: 7, phase: 'assessed', roles: ['owner', 'analyst'] },
  { to: '/export', label: 'OSCAL Export', icon: FileJson, step: 8, phase: 'assessed', roles: ['owner', 'analyst', 'regulator'] },
  { to: '/rollup', label: 'National Rollup', icon: Landmark, step: 8, roles: ['owner', 'analyst', 'regulator'] },
  { to: '/admin', label: 'Roles & Access', icon: ShieldHalf, step: 9, roles: ['owner', 'analyst'] },
  { to: '/chat', label: 'Compliance Chat', icon: MessagesSquare, step: 9, roles: ['owner', 'analyst', 'executive'] },
];

export function navForRole(role: Role): NavItem[] {
  return NAV.filter((n) => !n.roles || n.roles.includes(role));
}

export const PHASE_ORDER: Phase[] = ['profile', 'planning', 'intake', 'assessed'];
export const PHASE_LABEL: Record<Phase, string> = {
  profile: 'Profile',
  planning: 'Planning',
  intake: 'Intake',
  assessed: 'Assessed',
};
