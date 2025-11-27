import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import HomeRedirect from "./pages/HomeRedirect/HomeRedirect";
import Login from "./pages/Login/Login";
import RootAdminRegistration from "./pages/RootAdminRegistration/RootAdminRegistration";
import AdminDashboard from "./pages/Admin/AdminDashboard";
import RectorDashboard from "./pages/Rector/RectorDashboard";
import StudentDashboard from "./pages/Student/StudentDashboard";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Base URL will dynamically redirect depending on root admin existence */}
        <Route path="/" element={<HomeRedirect />} />

        {/* Root admin registration - only accessible if no root admin exists */}
        <Route path="/root-register" element={<RootAdminRegistration />} />

        {/* Login page */}
        <Route path="/login" element={<Login />} />

        {/* Protected routes */}
        <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="/rector" element={<Navigate to="/rector/dashboard" replace />} />
        <Route path="/student" element={<Navigate to="/student/dashboard" replace />} />

        <Route path="/admin/*" element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <AdminDashboard />
          </ProtectedRoute>
        } />

        <Route path="/rector/*" element={
          <ProtectedRoute allowedRoles={['RECTOR']}>
            <RectorDashboard />
          </ProtectedRoute>
        } />

        <Route path="/student/*" element={
          <ProtectedRoute allowedRoles={['STUDENT']}>
            <StudentDashboard />
          </ProtectedRoute>
        } />

        {/* Fallback: any unknown route will redirect to the base URL */}
        <Route path="*" element={<HomeRedirect />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
