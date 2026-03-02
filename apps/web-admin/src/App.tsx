import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/auth';
import AdminLayout from './components/layouts/AdminLayout';
import LoginPage from './pages/Auth/Login';
import DashboardPage from './pages/Dashboard';
import PlumbersPage from './pages/Plumbers';
import PlumberDetailPage from './pages/Plumbers/Detail';
import CoveragePage from './pages/Coverage';
import BookingsPage from './pages/Bookings';
import OrdersPage from './pages/Orders';
import MissionsPage from './pages/Missions';
import InvoicesPage from './pages/Invoices';
import CustomersPage from './pages/Customers';
import ProductsPage from './pages/Products';
import MatchingPage from './pages/Matching';
import ProjectsPage from './pages/Projects';
import ProjectDetailPage from './pages/Projects/Detail';
import AuditPage from './pages/Audit';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role !== 'admin') {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="plumbers" element={<PlumbersPage />} />
        <Route path="plumbers/:id" element={<PlumberDetailPage />} />
        <Route path="coverage" element={<CoveragePage />} />
        <Route path="matching" element={<MatchingPage />} />
        <Route path="customers" element={<CustomersPage />} />
        <Route path="bookings" element={<BookingsPage />} />
        <Route path="orders" element={<OrdersPage />} />
        <Route path="missions" element={<MissionsPage />} />
        <Route path="invoices" element={<InvoicesPage />} />
        <Route path="projects" element={<ProjectsPage />} />
        <Route path="projects/:id" element={<ProjectDetailPage />} />
        <Route path="products" element={<ProductsPage />} />
        <Route path="audit" element={<AuditPage />} />
      </Route>
    </Routes>
  );
};

export default App;
