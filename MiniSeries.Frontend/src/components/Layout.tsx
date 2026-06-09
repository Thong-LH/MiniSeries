import { useEffect, useRef, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { PROFILE_CACHE_KEY, PROFILE_UPDATED_EVENT, api } from '../services/api';
import '../pages/Home.css';

type HeaderProfile = {
  userId: string;
  fullName: string;
  email: string;
  mangaTokens: number | null;
  mangaLimit: number | null;
  videoTokens: number | null;
  videoLimit: number | null;
  tier: string;
  avatarUrl: string;
};

const AUTH_KEYS = [
  'token',
  'userId',
  'userRole',
  'user_role',
  'user_name',
  'user_email',
  PROFILE_CACHE_KEY
];

function clearAuthSession() {
  AUTH_KEYS.forEach((key) => localStorage.removeItem(key));
}

function getSession() {
  const token = localStorage.getItem('token')?.trim() || '';
  const userId = localStorage.getItem('userId')?.trim() || '';
  return { token, userId, isAuthenticated: Boolean(token && userId) };
}

function buildAvatarUrl(fullName: string) {
  return `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(fullName || 'User')}`;
}

function mapProfileResponse(data: any): HeaderProfile {
  const fullName = data.fullName || localStorage.getItem('user_name') || 'User';
  return {
    userId: String(data.id || data.userId || localStorage.getItem('userId') || ''),
    fullName,
    email: data.email || localStorage.getItem('user_email') || '',
    mangaTokens: data.remainingMangaCount ?? null,
    mangaLimit: data.mangaMonthlyLimit ?? null,
    videoTokens: data.remainingVideoCount ?? null,
    videoLimit: data.videoMonthlyLimit ?? null,
    tier: data.planName || data.tier || 'Free',
    avatarUrl: data.avatarUrl || buildAvatarUrl(fullName)
  };
}

function readCachedProfile(userId: string): HeaderProfile | null {
  try {
    const raw = localStorage.getItem(PROFILE_CACHE_KEY);
    if (!raw) return null;

    const cached = JSON.parse(raw) as HeaderProfile;
    return cached.userId === userId ? cached : null;
  } catch {
    localStorage.removeItem(PROFILE_CACHE_KEY);
    return null;
  }
}

function buildSessionProfile(userId: string): HeaderProfile {
  const fullName = localStorage.getItem('user_name') || 'User';
  return {
    userId,
    fullName,
    email: localStorage.getItem('user_email') || '',
    mangaTokens: null,
    mangaLimit: null,
    videoTokens: null,
    videoLimit: null,
    tier: '',
    avatarUrl: buildAvatarUrl(fullName)
  };
}

function formatQuota(remaining: number | null, limit: number | null) {
  return remaining === null || limit === null ? '--/--' : `${remaining}/${limit}`;
}

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const isHomePage = location.pathname === '/';
  const useStudioNavbar = !isHomePage;

  const [profile, setProfile] = useState<HeaderProfile | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let ignore = false;

    if (!useStudioNavbar) {
      setProfile(null);
      return;
    }

    const session = getSession();
    if (!session.isAuthenticated) {
      setProfile(null);
      return;
    }

    setProfile(readCachedProfile(session.userId) ?? buildSessionProfile(session.userId));

    api.getCurrentProfile()
      .then((data) => {
        if (ignore) return;

        const nextProfile = mapProfileResponse(data);
        setProfile(nextProfile);
        localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(nextProfile));
      })
      .catch((err) => {
        if (ignore) return;

        console.error('Lỗi tải thông tin tài khoản:', err);
        if (err?.status === 401 || err?.status === 403) {
          clearAuthSession();
          setProfile(null);
          navigate('/login', { replace: true, state: { from: location.pathname } });
        }
      });

    return () => {
      ignore = true;
    };
  }, [useStudioNavbar, location.pathname, navigate]);

  useEffect(() => {
    if (!useStudioNavbar) return;

    function handleProfileUpdated() {
      const session = getSession();
      if (!session.isAuthenticated) {
        setProfile(null);
        return;
      }

      setProfile(readCachedProfile(session.userId) ?? buildSessionProfile(session.userId));
    }

    window.addEventListener(PROFILE_UPDATED_EVENT, handleProfileUpdated);
    return () => window.removeEventListener(PROFILE_UPDATED_EVENT, handleProfileUpdated);
  }, [useStudioNavbar]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleProtectedNavigation = (event: React.MouseEvent) => {
    event.preventDefault();
    navigate(getSession().isAuthenticated ? '/studio' : '/login');
  };

  const handleLogout = () => {
    clearAuthSession();
    setIsDropdownOpen(false);
    setProfile(null);
    navigate('/', { replace: true });
  };

  return (
    <div className="content-wrapper">
      <div className="side-accent side-left">
        <span className="accent-text">MINI SERIES // ENGINE</span>
        <div style={{ width: '1px', flex: 1, background: 'linear-gradient(to bottom, transparent, rgba(255,255,255,0.2), transparent)', margin: '20px 0' }} />
        <span className="accent-text" style={{ color: 'var(--sky-blue)' }}>V2.4.1</span>
      </div>
      <div className="side-accent side-right">
        <span className="accent-text" style={{ color: 'var(--soft-orange)' }}>ONLINE</span>
        <div style={{ width: '1px', flex: 1, background: 'linear-gradient(to bottom, transparent, rgba(255,255,255,0.2), transparent)', margin: '20px 0' }} />
        <span className="accent-text">GENERATIVE WORKFLOW</span>
      </div>

      {useStudioNavbar ? (
        <header className="nav studio-nav cyber-nav-glass" style={{ height: '70px', padding: '0 40px' }}>
          <Link to="/" className="cyber-logo-container">
            <span className="highlight-letter">M</span>ini
            <span className="highlight-letter">S</span>eries
            <span className="highlight-letter">L</span>earning
          </Link>

          <div className="studio-nav-right">
            <Link to="/studio" className="cyber-nav-link">Studio</Link>
            <Link to="/tu-van" className="cyber-nav-link">Tư vấn</Link>
            <Link to="/pricing" className="cyber-nav-link">Bảng giá</Link>

            {profile ? (
              <div style={{ position: 'relative' }} ref={dropdownRef}>
                <button
                  type="button"
                  className="studio-user-badge"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                >
                  <span className="quota-pill manga">Truyện {formatQuota(profile.mangaTokens, profile.mangaLimit)}</span>
                  <span className="quota-pill video">Video {formatQuota(profile.videoTokens, profile.videoLimit)}</span>
                  <span className="user-badge-name">{profile.fullName}</span>
                  <img src={profile.avatarUrl} alt="Avatar" className="user-badge-avatar" />
                </button>

                {isDropdownOpen && (
                  <div className="cyber-profile-dropdown">
                    <div className="dropdown-user-info">
                      <img src={profile.avatarUrl} alt="Avatar" className="dropdown-avatar" />
                      <div className="dropdown-user-text">
                        <h4 className="dropdown-fullname">{profile.fullName}</h4>
                        <p className="dropdown-email">{profile.email}</p>
                      </div>
                    </div>

                    <div className="dropdown-quota-summary">
                      <div className="quota-summary-item">
                        <span className="quota-summary-label">Tài khoản</span>
                        <span className="quota-summary-tier">{(profile.tier || 'Đang cập nhật').toUpperCase()}</span>
                      </div>
                      <div className="quota-summary-item" style={{ textAlign: 'right' }}>
                        <span className="quota-summary-label">Quota còn lại</span>
                        <span className="quota-summary-tokens manga">Truyện {formatQuota(profile.mangaTokens, profile.mangaLimit)}</span>
                        <span className="quota-summary-tokens video">Video {formatQuota(profile.videoTokens, profile.videoLimit)}</span>
                      </div>
                    </div>

                    <div className="dropdown-actions">
                      <button type="button" onClick={() => { navigate('/profile'); setIsDropdownOpen(false); }} className="dropdown-action-btn">
                        Series yêu thích
                      </button>
                      <button type="button" onClick={() => { navigate('/pricing'); setIsDropdownOpen(false); }} className="dropdown-action-btn upgrade">
                        Mua thêm lượt / Gói
                      </button>
                      <hr className="dropdown-divider" />
                      <button type="button" onClick={handleLogout} className="dropdown-action-btn logout">
                        Đăng xuất tài khoản
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link to="/login" className="cyber-nav-link">Đăng nhập</Link>
            )}
          </div>
        </header>
      ) : (
        <header className="nav">
          <Link to="/" className="nav-brand">MiniSeries</Link>
          <div className="nav-links">
            <Link to="/" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>Trang chủ</Link>
            <a href="#flow">Tính năng</a>
            <a href="#feedback">Phản hồi</a>
          </div>
          <Link to="/login" onClick={handleProtectedNavigation} className="nav-login">Bắt đầu</Link>
        </header>
      )}

      <main>
        <Outlet />
      </main>

      <footer className="site-footer">
        <div className="footer-links">
          <Link to="/pricing">Bảng giá</Link>
          <Link to="/tu-van">Tư vấn</Link>
          <a href="#">Điều khoản</a>
          <a href="#">Quyền riêng tư</a>
        </div>
        <div className="footer-copy">
          © 2026 MiniSeries. The Story Stream.
        </div>
      </footer>
    </div>
  );
}
