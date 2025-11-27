import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { rootAdminAPI } from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";

const HomeRedirect = () => {
  const [checking, setChecking] = useState(true);
  const navigate = useNavigate();
  const { isAuthenticated, user, loading: authLoading, getDashboardPath } = useAuth();

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (isAuthenticated && user?.role) {
      const targetPath = getDashboardPath(user.role);
      setChecking(false);
      navigate(targetPath, { replace: true });
      return;
    }

    let isMounted = true;

    const checkRootAdmin = async () => {
      try {
        const data = await rootAdminAPI.checkExists();

        console.log("Backend /admin/exists response:", data);

        if (!isMounted) return;

        if (data.exists) {
          console.log("Root admin exists → redirecting to /login");
          navigate("/login", { replace: true });
        } else {
          console.log("No root admin → redirecting to /root-register");
          navigate("/root-register", { replace: true });
        }
      } catch (error) {
        console.error("Error checking root admin:", error);
        if (isMounted) {
          navigate("/login", { replace: true });
        }
      } finally {
        if (isMounted) {
          setChecking(false);
        }
      }
    };

    checkRootAdmin();

    return () => {
      isMounted = false;
    };
  }, [authLoading, getDashboardPath, isAuthenticated, navigate, user]);

  if (checking) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '18px',
        color: '#6c757d'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            width: '40px', 
            height: '40px', 
            border: '4px solid #f3f3f3',
            borderTop: '4px solid #667eea',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px'
          }}></div>
          <p>Checking system status...</p>
        </div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return null;
};

export default HomeRedirect;
