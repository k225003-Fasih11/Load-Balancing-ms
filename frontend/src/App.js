import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

import Layout        from './components/common/Layout';
import Login         from './pages/Login';
import Register      from './pages/Register';
import Dashboard     from './pages/Dashboard';
import Servers       from './pages/Servers';
import Algorithms    from './pages/Algorithms';
import Incidents     from './pages/Incidents';
import Analytics     from './pages/Analytics';
import Alerts        from './pages/Alerts';
import Reports       from './pages/Reports';
import Users         from './pages/Users';
import ActivityLog   from './pages/ActivityLog';
import Settings      from './pages/Settings';

const PrivateRoute = ({ children, adminOnly }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading">Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  if (adminOnly && user.role !== 'admin') return <Navigate to="/" />;
  return children;
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login"    element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
            <Route index                element={<Dashboard />} />
            <Route path="servers"       element={<Servers />} />
            <Route path="algorithms"    element={<Algorithms />} />
            <Route path="incidents"     element={<Incidents />} />
            <Route path="analytics"     element={<Analytics />} />
            <Route path="alerts"        element={<Alerts />} />
            <Route path="reports"       element={<Reports />} />
            <Route path="activity"      element={<PrivateRoute adminOnly><ActivityLog /></PrivateRoute>} />
            <Route path="users"         element={<PrivateRoute adminOnly><Users /></PrivateRoute>} />
            <Route path="settings"      element={<Settings />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
