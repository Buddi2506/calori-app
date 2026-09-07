import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Diary from './pages/Diary';
import CustomMeals from './pages/CustomMeals';
import Goals from './pages/Goals';
import Reports from './pages/Reports';
import FoodList from './pages/FoodList';
import Login from './pages/Login';
import AdminUsers from './pages/AdminUsers';
import ForcePasswordChangeModal from './components/ForcePasswordChangeModal';

// Route wrapper that checks authentication
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#ECEEF1] flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-amber-500 flex items-center justify-center text-white font-black text-lg shadow-md animate-bounce">
          C
        </div>
        <div className="text-xs font-semibold text-gray-400">Loading your profile...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return (
    <>
      <ForcePasswordChangeModal />
      {children}
    </>
  );
};

// Route wrapper for admin-only pages
const AdminRoute = ({ children }) => {
  const { isAdmin, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return children;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="diary" element={<Diary />} />
        <Route path="diary/:date" element={<Diary />} />
        <Route path="foods" element={<FoodList />} />
        <Route path="meals" element={<CustomMeals />} />
        <Route path="goals" element={<Goals />} />
        <Route path="reports" element={<Reports />} />
        <Route
          path="admin/users"
          element={
            <AdminRoute>
              <AdminUsers />
            </AdminRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
