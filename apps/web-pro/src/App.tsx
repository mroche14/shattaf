import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/auth';

// Layouts
import ProLayout from './components/layouts/ProLayout';
import AuthLayout from './components/layouts/AuthLayout';

// Pages
import LandingPage from './pages/Landing';
import LoginPage from './pages/Auth/Login';
import RegisterPage from './pages/Auth/Register';
import DashboardPage from './pages/Dashboard';
import MissionsPage from './pages/Missions';
import MissionDetailPage from './pages/Missions/Detail';
import MissionExecutionPage from './pages/Missions/Execution';
import EarningsPage from './pages/Earnings';
import ProfilePage from './pages/Profile';
import OnboardingPage from './pages/Onboarding';
import AIDevisGenerator from './pages/Devis/AIDevisGenerator';
import VerificationsPage from './pages/Verification';
import VerificationDetailPage from './pages/Verification/Detail';

// Protected route wrapper
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// Public route wrapper - redirect to dashboard if authenticated
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <Routes>
      {/* Public landing page */}
      <Route
        path="/"
        element={
          <PublicRoute>
            <LandingPage />
          </PublicRoute>
        }
      />

      {/* Auth routes */}
      <Route element={<AuthLayout />}>
        <Route
          path="/login"
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicRoute>
              <RegisterPage />
            </PublicRoute>
          }
        />
      </Route>

      {/* Onboarding (protected, no ProLayout) */}
      <Route
        path="/onboarding"
        element={
          <ProtectedRoute>
            <OnboardingPage />
          </ProtectedRoute>
        }
      />

      {/* Protected routes */}
      <Route
        element={
          <ProtectedRoute>
            <ProLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/missions" element={<MissionsPage />} />
        <Route path="/missions/:id" element={<MissionDetailPage />} />
        <Route path="/missions/:id/execution" element={<MissionExecutionPage />} />
        <Route path="/devis/ai/:bookingId" element={<AIDevisGenerator />} />
        <Route path="/verifications" element={<VerificationsPage />} />
        <Route path="/verifications/:id" element={<VerificationDetailPage />} />
        <Route path="/earnings" element={<EarningsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
