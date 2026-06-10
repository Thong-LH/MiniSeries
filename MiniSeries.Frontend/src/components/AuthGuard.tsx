import { Navigate, Outlet, useLocation } from 'react-router-dom';

function hasLocalSession() {
  const token = localStorage.getItem('token')?.trim();
  const userId = localStorage.getItem('userId')?.trim();
  return Boolean(token && userId);
}

export default function AuthGuard() {
  const location = useLocation();

  if (!hasLocalSession()) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}
