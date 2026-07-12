import { Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import Layout from './components/Layout';
import AuthGuard from './components/AuthGuard';
import Home from './pages/Home';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Pricing from './pages/Pricing';
import Checkout from './pages/Checkout';
import Profile from './pages/Profile';
import TuVan from './pages/TuVan';
import Studio from './pages/Studio';
import { api } from './services/api';

function App() {
  const location = useLocation();

  useEffect(() => {
    api.trackTraffic(location.pathname, 'Web');
  }, [location.pathname]);

  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route element={<AuthGuard />}>
          <Route path="studio" element={<Studio />} />
          <Route path="pricing" element={<Pricing />} />
          <Route path="checkout" element={<Checkout />} />
          <Route path="profile" element={<Profile />} />
          <Route path="tu-van" element={<TuVan />} />
        </Route>
      </Route>
      <Route path="/login" element={<Login />} />
      <Route element={<AuthGuard />}>
        <Route path="/dashboard" element={<Dashboard />} />
      </Route>
    </Routes>
  );
}

export default App;
