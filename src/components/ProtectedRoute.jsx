import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, user, loading, getDashboardPath } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '18px'
      }}>
        Loading...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const normalizedRole = user?.role?.toUpperCase();

  if (!normalizedRole) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && normalizedRole && !allowedRoles.includes(normalizedRole)) {
    const fallbackPath = getDashboardPath(normalizedRole);
    return <Navigate to={fallbackPath} replace />;
  }

  return children;
};

export default ProtectedRoute;



