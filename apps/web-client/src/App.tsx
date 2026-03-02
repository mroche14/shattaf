import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/auth';

// Layouts
import MainLayout from './components/layouts/MainLayout';
import AuthLayout from './components/layouts/AuthLayout';

// Pages
import HomePage from './pages/Home';
import ProductsPage from './pages/Products';
import ProductDetailPage from './pages/Products/Detail';
import LoginPage from './pages/Auth/Login';
import RegisterPage from './pages/Auth/Register';
import BookingStepsPage from './pages/Booking/Steps';
import BookingConfirmPage from './pages/Booking/Confirm';
import MyBookingsPage from './pages/Account/Bookings';
import BookingDetailPage from './pages/Account/BookingDetail';
import MyOrdersPage from './pages/Account/Orders';
import OrderDetailPage from './pages/Account/OrderDetail';
import CheckoutPage from './pages/Checkout';
import CheckoutSuccessPage from './pages/Checkout/Success';
import AccountPage from './pages/Account';
import TrackingPage from './pages/Track';
import MarketplacePage from './pages/Marketplace';
import QuotesListPage from './pages/Marketplace/QuotesList';

// Protected route wrapper
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <Routes>
      {/* Landing page - no layout wrapper */}
      <Route path="/" element={<HomePage />} />

      {/* Public tracking page - no auth required */}
      <Route path="/track/:bookingId" element={<TrackingPage />} />

      {/* Public routes with layout */}
      <Route element={<MainLayout />}>
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/products/:id" element={<ProductDetailPage />} />
        <Route path="/marketplace" element={<MarketplacePage />} />
      </Route>

      {/* Auth routes */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      {/* Protected routes */}
      <Route
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/booking" element={<BookingStepsPage />} />
        <Route path="/booking/confirm" element={<BookingConfirmPage />} />
        <Route path="/checkout/:orderId" element={<CheckoutPage />} />
        <Route path="/checkout/:orderId/success" element={<CheckoutSuccessPage />} />
        <Route path="/account" element={<AccountPage />} />
        <Route path="/account/bookings" element={<MyBookingsPage />} />
        <Route path="/account/bookings/:id" element={<BookingDetailPage />} />
        <Route path="/account/orders" element={<MyOrdersPage />} />
        <Route path="/account/orders/:id" element={<OrderDetailPage />} />
        <Route path="/marketplace/quotes/:bookingId" element={<QuotesListPage />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
