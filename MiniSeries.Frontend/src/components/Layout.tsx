import { Outlet, Link } from 'react-router-dom';
import '../pages/Home.css';

export default function Layout() {
  return (
    <div className="content-wrapper">
      {/* Impeccable Side Accents from index.html */}
      <div className="side-accent side-left">
        <span className="accent-text">MINI SERIES // ENGINE</span>
        <div style={{ width: '1px', flex: 1, background: 'linear-gradient(to bottom, transparent, rgba(255,255,255,0.2), transparent)', margin: '20px 0' }}></div>
        <span className="accent-text" style={{ color: 'var(--sky-blue)' }}>V2.4.1</span>
      </div>
      <div className="side-accent side-right">
        <span className="accent-text" style={{ color: 'var(--soft-orange)' }}>ONLINE</span>
        <div style={{ width: '1px', flex: 1, background: 'linear-gradient(to bottom, transparent, rgba(255,255,255,0.2), transparent)', margin: '20px 0' }}></div>
        <span className="accent-text">GENERATIVE WORKFLOW</span>
      </div>

      <header className="nav">
        <Link to="/" className="nav-brand">MiniSeries</Link>
        <div className="nav-links">
          <Link to="/" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>Home</Link>
          <a href="#flow">Features</a>
          <a href="#feedback">Feedback</a>
        </div>
        <Link to="/login" className="nav-login">Get Started</Link>
      </header>

      <main>
        <Outlet />
      </main>

      <footer className="site-footer">
        <div className="footer-links">
          <Link to="/pricing">Pricing</Link>
          <Link to="/tu-van">Consulting</Link>
          <a href="#">Terms of Service</a>
          <a href="#">Privacy Policy</a>
        </div>
        <div className="footer-copy">
          © 2026 MiniSeries. The Story Stream.
        </div>
      </footer>
    </div>
  );
}
