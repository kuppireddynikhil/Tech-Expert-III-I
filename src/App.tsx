// TECH EXPERT 2K26 — MASTER APPLICATION ROUTER
// Sri Venkateswara College of Engineering (SVCE)

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';

// Layouts
import { PublicLayout } from './layouts/PublicLayout';
import { ParticipantLayout } from './layouts/ParticipantLayout';
import { AdminLayout } from './layouts/AdminLayout';

// Public Pages
import { Home } from './pages/Home';
import { Register } from './pages/Register';
import { Login } from './pages/Login';
import { Leaderboard } from './pages/Leaderboard';

// Participant Pages
import { ParticipantDashboard } from './pages/ParticipantDashboard';
import { Phase1 } from './pages/Phase1';
import { Phase2 } from './pages/Phase2';
import { Phase3 } from './pages/Phase3';

// Admin Pages
import { AdminLogin } from './pages/admin/AdminLogin';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { PhaseAdvancement } from './pages/admin/PhaseAdvancement';
import { QuestionBank } from './pages/admin/QuestionBank';
import { QuestionEditor } from './pages/admin/QuestionEditor';
import { QuestionSetManagement } from './pages/admin/QuestionSetManagement';
import { PhaseManagement } from './pages/admin/PhaseManagement';
import { TimerConfiguration } from './pages/admin/TimerConfiguration';
import { ParticipantManagement } from './pages/admin/ParticipantManagement';
import { EvaluationReview } from './pages/admin/EvaluationReview';
import { LeaderboardManagement } from './pages/admin/LeaderboardManagement';
import { AuditLogs } from './pages/admin/AuditLogs';
import { Settings } from './pages/admin/Settings';

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
          </Route>

          {/* Dedicated Admin Login */}
          <Route path="/admin/login" element={<AdminLogin />} />

          {/* Participant Protected Routes */}
          <Route element={<ParticipantLayout />}>
            <Route path="/dashboard" element={<ParticipantDashboard />} />
            <Route path="/phase1" element={<Phase1 />} />
            <Route path="/phase2" element={<Phase2 />} />
            <Route path="/phase3" element={<Phase3 />} />
          </Route>

          {/* Admin Protected Routes */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="questions" element={<QuestionBank />} />
            <Route path="questions/new" element={<QuestionEditor />} />
            <Route path="questions/edit/:id" element={<QuestionEditor />} />
            <Route path="question-sets" element={<QuestionSetManagement />} />
            <Route path="phases" element={<PhaseManagement />} />
            <Route path="timers" element={<TimerConfiguration />} />
            <Route path="participants" element={<ParticipantManagement />} />
            <Route path="advancement" element={<PhaseAdvancement />} />
            <Route path="evaluations" element={<EvaluationReview />} />
            <Route path="leaderboard" element={<LeaderboardManagement />} />
            <Route path="audit-logs" element={<AuditLogs />} />
            <Route path="settings" element={<Settings />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
