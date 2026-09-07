import type { ReactNode } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import Sidebar from './components/layout/Sidebar';
import TopBar from './components/layout/TopBar';
import { navForRole } from './components/layout/nav';
import { useAssessment } from './store/useAssessment';
import Profile from './screens/01_Profile';
import RequestPlan from './screens/02_RequestPlan';
import Intake from './screens/03_Intake';
import Dashboard from './screens/04_Dashboard';
import GapMatrix from './screens/05_GapMatrix';
import ControlDetail from './screens/06_ControlDetail';
import Remediation from './screens/07_Remediation';
import ExportScreen from './screens/08_Export';
import Chat from './screens/09_Chat';
import Exclusions from './screens/10_Exclusions';
import Admin from './screens/11_Admin';
import Tasks from './screens/12_Tasks';
import Rollup from './screens/13_Rollup';

/** Redirect to the role's first allowed screen if the current path isn't permitted. */
function RoleGate({ children }: { children: ReactNode }) {
  const role = useAssessment((s) => s.role);
  const { pathname } = useLocation();
  const allowed = navForRole(role).map((n) => n.to);
  // control detail is allowed wherever the gap matrix is
  const extra = allowed.includes('/gap-matrix') ? ['/control'] : [];
  const ok =
    pathname === '/' ||
    [...allowed, ...extra].some((a) => pathname === a || pathname.startsWith(a + '/'));
  if (!ok) return <Navigate to={navForRole(role)[0]?.to ?? '/dashboard'} replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />
        <main className="scroll-slim flex-1 overflow-y-auto bg-slate-50">
          <div className="mx-auto max-w-6xl px-6 py-6">
            <RoleGate>
              <Routes>
                <Route path="/" element={<Navigate to="/profile" replace />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/request-plan" element={<RequestPlan />} />
                <Route path="/intake" element={<Intake />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/gap-matrix" element={<GapMatrix />} />
                <Route path="/control/:id" element={<ControlDetail />} />
                <Route path="/remediation" element={<Remediation />} />
                <Route path="/export" element={<ExportScreen />} />
                <Route path="/chat" element={<Chat />} />
                <Route path="/exclusions" element={<Exclusions />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="/tasks" element={<Tasks />} />
                <Route path="/rollup" element={<Rollup />} />
                <Route path="*" element={<Navigate to="/profile" replace />} />
              </Routes>
            </RoleGate>
          </div>
        </main>
      </div>
    </div>
  );
}
