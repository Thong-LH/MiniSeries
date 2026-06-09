import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Pricing from './pages/Pricing';
import Checkout from './pages/Checkout';
import Profile from './pages/Profile';
import TuVan from './pages/TuVan';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="pricing" element={<Pricing />} />
        <Route path="checkout" element={<Checkout />} />
        <Route path="profile" element={<Profile />} />
        <Route path="tu-van" element={<TuVan />} />
      </Route>
      <Route path="/login" element={<Login />} />
      <Route path="/dashboard" element={<Dashboard />} />
    </Routes>
  );
}

export default App;
