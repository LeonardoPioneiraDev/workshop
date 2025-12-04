import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export function AuthManager() {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (isLoading) {
      return; // Do nothing while loading
    }

    const publicPaths = ['/login', '/instrucoes', '/forgot-password', '/reset-password'];
    const isAuthPage = publicPaths.includes(location.pathname);

    // Case 1: User is NOT authenticated
    if (!isAuthenticated && !isAuthPage) {
      navigate('/login', { replace: true });
    }

    // Case 2: User IS authenticated
    if (isAuthenticated && isAuthPage) {
      navigate('/home', { replace: true });
    }
  }, [isAuthenticated, isLoading, location.pathname, navigate]);

  return null; // This component does not render anything
}
