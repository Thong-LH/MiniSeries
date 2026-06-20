import { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { api, clearAuthSession, hasLocalSession } from '../services/api';

export default function AuthGuard() {
  const location = useLocation();
  const [status, setStatus] = useState<'allowed' | 'denied'>(
    hasLocalSession() ? 'allowed' : 'denied'
  );
  const localSession = hasLocalSession();

  useEffect(() => {
    if (!localSession) {
      return;
    }

    let ignore = false;

    api.getCurrentProfile()
      .then(() => undefined)
      .catch(() => {
        if (ignore) return;
        clearAuthSession();
        setStatus('denied');
      });

    return () => {
      ignore = true;
    };
  }, [localSession, location.pathname]);

  if (!localSession || status === 'denied') {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  const role = localStorage.getItem('userRole') || localStorage.getItem('user_role') || 'Customer';
  const isDashboard = location.pathname.startsWith('/dashboard');

  if (isDashboard) {
    if (role !== 'Admin' && role !== 'Staff') {
      return <Navigate to="/studio" replace />;
    }
  } else {
    if (role === 'Admin' || role === 'Staff') {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return <Outlet />;
}
