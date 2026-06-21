import { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { api, clearAuthSession, hasLocalSession, writeProfileSnapshot, PROFILE_UPDATED_EVENT } from '../services/api';

export default function AuthGuard() {
  const location = useLocation();
  const [status, setStatus] = useState<'allowed' | 'denied'>(
    hasLocalSession() ? 'allowed' : 'denied'
  );
  const [role, setRole] = useState<string>(
    localStorage.getItem('userRole') || localStorage.getItem('user_role') || 'Customer'
  );
  const localSession = hasLocalSession();

  useEffect(() => {
    if (!localSession) {
      return;
    }

    let ignore = false;

    api.getCurrentProfile()
      .then((profile) => {
        if (ignore) return;
        writeProfileSnapshot(profile);
        const nextRole = profile.role || 'Customer';
        setRole(nextRole);
      })
      .catch(() => {
        if (ignore) return;
        clearAuthSession();
        setStatus('denied');
      });

    return () => {
      ignore = true;
    };
  }, [localSession, location.pathname]);

  useEffect(() => {
    function handleProfileUpdated() {
      const nextRole = localStorage.getItem('userRole') || localStorage.getItem('user_role') || 'Customer';
      setRole(nextRole);
    }
    window.addEventListener(PROFILE_UPDATED_EVENT, handleProfileUpdated);
    return () => window.removeEventListener(PROFILE_UPDATED_EVENT, handleProfileUpdated);
  }, []);

  if (!localSession || status === 'denied') {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

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
