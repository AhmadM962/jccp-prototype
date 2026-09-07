import { Navigate, Route, Routes } from 'react-router-dom';
import Sidebar from './components/layout/Sidebar';
import TopBar from './components/layout/TopBar';
import Profile from './screens/01_Profile';
import RequestPlan from './screens/02_RequestPlan';
import Intake from './screens/03_Intake';
import Dashboard from './screens/04_Dashboard';
import GapMatrix from './screens/05_GapMatrix';
import ControlDetail from './screens/06_ControlDetail';
import Remediation from './screens/07_Remediation';
import ExportScreen from './screens/08_Export';
import Chat from './screens/09_Chat';

export default function App() {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />
        <main className="scroll-slim flex-1 overflow-y-auto bg-slate-50">
          <div className="mx-auto max-w-6xl px-6 py-6">
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
              <Route path="*" element={<Navigate to="/profile" replace />} />
            </Routes>
          </div>
        </main>
      </div>
    </div>
  );
}
