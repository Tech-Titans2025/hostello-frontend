import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback
} from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  const getStoredValue = useCallback((key) => {
    const value = localStorage.getItem(key);
    if (!value || value === 'undefined' || value === 'null') {
      return null;
    }
    return value;
  }, []);

  const getDashboardPath = useCallback((role) => {
    const normalizedRole = role?.toUpperCase();

    switch (normalizedRole) {
      case 'ADMIN':
        return '/admin/dashboard';
      case 'RECTOR':
        return '/rector/dashboard';
      case 'STUDENT':
        return '/student/dashboard';
      default:
        return '/';
    }
  }, []);

  const clearSession = useCallback(() => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userId');
    setUser(null);
    setIsAuthenticated(false);
  }, []);

  const redirectToLogin = useCallback(() => {
    clearSession();
    navigate('/login', { replace: true });
  }, [clearSession, navigate]);

  const checkAuthStatus = useCallback(async () => {
    setLoading(true);

    const token = getStoredValue('accessToken');

    if (!token) {
      clearSession();
      setLoading(false);
      return;
    }

    try {
      const profile = await authAPI.getProfile();
      const normalizedRole = profile?.role?.toUpperCase();

      const userInfo = {
        ...profile,
        role: normalizedRole
      };

      setUser(userInfo);
      setIsAuthenticated(true);

      if (normalizedRole) {
        localStorage.setItem('userRole', normalizedRole);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      redirectToLogin();
    } finally {
      setLoading(false);
    }
  }, [clearSession, getStoredValue, redirectToLogin]);

  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  const login = async (credentials) => {
    try {
      const response = await authAPI.login(credentials);
      console.log("Login API response:", response);

      if (response?.error) {
        clearSession();
        throw new Error(response.error);
      }

      // Store tokens (handle both 'accessToken' and 'token' response formats)
      const token = response.token || response.accessToken;
      if (!token) {
        clearSession();
        throw new Error('Invalid login response. Please try again.');
      }

      localStorage.setItem('accessToken', token);

      if (response.refreshToken) {
        localStorage.setItem('refreshToken', response.refreshToken);
      } else {
        localStorage.removeItem('refreshToken');
      }
      const normalizedRole = response.role?.toUpperCase();
      const dashboardPath = getDashboardPath(normalizedRole);
      if (normalizedRole) {
        localStorage.setItem('userRole', normalizedRole);
      } else {
        localStorage.removeItem('userRole');
      }
      localStorage.setItem('userId', response.userId || response.prn || credentials.userId || credentials.username);
      
      if (response.prn) {
        localStorage.setItem('prn', response.prn);
      }
      
      
      // Set user info from login response
      const userInfo = {
        userId: response.userId || response.prn || credentials.userId || credentials.username,
        role: normalizedRole,
        username: response.prn || response.userId || credentials.userId || credentials.username,
        firstName: response.firstName || response.prn || response.userId || credentials.userId || credentials.username,
        mobileNumber: response.mobileNumber,
        token: token
      };
      
      setUser(userInfo);
      setIsAuthenticated(true);
      
      return { ...response, ...userInfo, role: normalizedRole, dashboardPath };
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      const role = localStorage.getItem('userRole');
      if (role) {
        await authAPI.logout(role);
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      clearSession();
      navigate('/login', { replace: true });
    }
  };

  const refreshToken = async () => {
    try {
      const refreshTokenValue = localStorage.getItem('refreshToken');
      if (!refreshTokenValue) {
        throw new Error('No refresh token available');
      }
      
      const response = await authAPI.refreshToken(refreshTokenValue);
      localStorage.setItem('accessToken', response.accessToken);
      return response.accessToken;
    } catch (error) {
      console.error('Token refresh failed:', error);
      logout();
      throw error;
    }
  };

  const value = {
    user,
    isAuthenticated,
    loading,
    login,
    logout,
    refreshToken,
    checkAuthStatus,
    getDashboardPath,
    clearSession
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};


