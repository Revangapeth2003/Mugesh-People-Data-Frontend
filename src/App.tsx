// src/App.tsx - Remove BrowserRouter from here
import { Routes, Route, Navigate } from 'react-router-dom'; // ✅ Remove BrowserRouter
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import People from './pages/People';
import AdminManagement from './pages/AdminManagement';
import Messages from './pages/Messages';
import Templates from './pages/Templates';
import Settings from './pages/Settings';

function App() {
  return (
    <AuthProvider>
      {/* ✅ NO Router here since it's in main.tsx */}
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/people"
          element={
            <ProtectedRoute>
              <People />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminManagement />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/messages"
          element={
            <ProtectedRoute>
              <Messages />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/templates"
          element={
            <ProtectedRoute>
              <Templates />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          }
        />
        <Route path="/admin-management" element={
  <ProtectedRoute>
    <AdminManagement />
  </ProtectedRoute>
} />
        
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<div>Page Not Found</div>} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
