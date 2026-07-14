import { useEffect, useRef, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { PROFILE_CACHE_KEY, PROFILE_UPDATED_EVENT, api } from '../services/api';
import BookPortalBackground from './BookPortalBackground';
import Logo from './Logo';
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

function formatQuota(remaining: number | null, _limit: number | null) {
  return remaining === null ? '--' : String(remaining);
}

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const isHomePage = location.pathname === '/';
  const isProfilePage = location.pathname === '/profile';
  const useStudioNavbar = !isHomePage;

  const handleNavClick = (event: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    event.preventDefault();
    if (location.pathname === '/') {
      const element = document.getElementById(targetId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    } else {
      navigate('/', { state: { scrollTo: targetId } });
    }
  };

  const [profile, setProfile] = useState<HeaderProfile | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
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

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

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
      {!isHomePage && !isProfilePage && <BookPortalBackground />}

      {useStudioNavbar ? (
        <header className="nav studio-nav cyber-nav-glass" style={{ height: '70px', padding: '0 40px' }}>
          <Link to="/" className="cyber-logo-container" style={{ textDecoration: 'none' }}>
            <Logo width={32} height={32} />
          </Link>

          <div className="studio-nav-right">
            {/* Desktop links — hidden on mobile via CSS */}
            <Link to="/studio" className="cyber-nav-link mobile-hidden">Studio</Link>
            <Link to="/tu-van" className="cyber-nav-link mobile-hidden">Tư vấn</Link>
            <Link to="/pricing" className="cyber-nav-link mobile-hidden">Bảng giá</Link>

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
                  <div className="cyber-profile-dropdown premium-dropdown-card">
                    {/* User Header */}
                    <div className="dropdown-user-info">
                      <div className="avatar-wrapper">
                        <img src={profile.avatarUrl} alt="Avatar" className="dropdown-avatar" />
                        <span className="user-online-badge"></span>
                      </div>
                      <div className="dropdown-user-text">
                        <h4 className="dropdown-fullname">{profile.fullName}</h4>
                        <p className="dropdown-email">{profile.email}</p>
                      </div>
                    </div>

                    {/* Button to go to Profile Page directly */}
                    <button
                      type="button"
                      onClick={() => { navigate('/profile'); setIsDropdownOpen(false); }}
                      className="dropdown-profile-link-btn"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px', verticalAlign: 'middle', display: 'inline-block' }}>
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                      </svg>
                      Trang cá nhân của tôi
                    </button>

                    {/* Quota Section */}
                    <div className="dropdown-quota-summary">
                      <div className="quota-header">
                        <span className="quota-label-main">Hạn mức tài khoản</span>
                        <span className="quota-badge-tier">{(profile.tier || 'Free').toUpperCase()}</span>
                      </div>
                      <div className="quota-tokens-grid">
                        <div className="quota-token-card manga-card">
                          <span className="quota-token-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#14b8a6' }}>
                              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                            </svg>
                          </span>
                          <div className="quota-token-data">
                            <span className="quota-token-value">{formatQuota(profile.mangaTokens, profile.mangaLimit)}</span>
                            <span className="quota-token-name">Truyện</span>
                          </div>
                        </div>
                        <div className="quota-token-card video-card">
                          <span className="quota-token-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#38bdf8' }}>
                              <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"></rect>
                              <line x1="7" y1="2" x2="7" y2="22"></line>
                              <line x1="17" y1="2" x2="17" y2="22"></line>
                              <line x1="2" y1="12" x2="22" y2="12"></line>
                              <line x1="2" y1="7" x2="7" y2="7"></line>
                              <line x1="2" y1="17" x2="7" y2="17"></line>
                              <line x1="17" y1="17" x2="22" y2="17"></line>
                              <line x1="17" y1="7" x2="22" y2="7"></line>
                            </svg>
                          </span>
                          <div className="quota-token-data">
                            <span className="quota-token-value">{formatQuota(profile.videoTokens, profile.videoLimit)}</span>
                            <span className="quota-token-name">Video</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action Items */}
                    <div className="dropdown-actions">
                      <button type="button" onClick={() => { navigate('/profile'); setIsDropdownOpen(false); }} className="dropdown-action-btn-new">
                        <span className="btn-icon">
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                          </svg>
                        </span>
                        Series yêu thích
                      </button>
                      <button type="button" onClick={() => { navigate('/pricing'); setIsDropdownOpen(false); }} className="dropdown-action-btn-new upgrade-btn">
                        <span className="btn-icon">
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                          </svg>
                        </span>
                        Mua thêm lượt / Gói
                      </button>
                      <div className="dropdown-divider-new" />
                      <button type="button" onClick={handleLogout} className="dropdown-action-btn-new logout-btn">
                        <span className="btn-icon">
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                            <polyline points="16 17 21 12 16 7"></polyline>
                            <line x1="21" y1="12" x2="9" y2="12"></line>
                          </svg>
                        </span>
                        Đăng xuất tài khoản
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link to="/login" className="cyber-nav-link">Đăng nhập</Link>
            )}

            {/* Hamburger button — visible only on mobile */}
            <button
              type="button"
              className="mobile-hamburger"
              onClick={() => setIsMobileMenuOpen((o) => !o)}
              aria-label="Mở menu"
            >
              {isMobileMenuOpen ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="3" y1="6" x2="21" y2="6"></line>
                  <line x1="3" y1="12" x2="21" y2="12"></line>
                  <line x1="3" y1="18" x2="21" y2="18"></line>
                </svg>
              )}
            </button>
          </div>

          {/* Mobile slide-down menu */}
          {isMobileMenuOpen && (
            <div className="mobile-nav-menu">
              <Link to="/studio" className="mobile-nav-link" onClick={() => setIsMobileMenuOpen(false)}>Studio</Link>
              <Link to="/tu-van" className="mobile-nav-link" onClick={() => setIsMobileMenuOpen(false)}>Tư vấn</Link>
              <Link to="/pricing" className="mobile-nav-link" onClick={() => setIsMobileMenuOpen(false)}>Bảng giá</Link>
            </div>
          )}
        </header>
      ) : (
        <header className="nav">
          <Link to="/" className="nav-brand" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
            <Logo width={32} height={32} />
          </Link>
          <div className="nav-links">
            <Link to="/" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>Trang chủ</Link>
            <a href="#flow" onClick={(e) => handleNavClick(e, 'flow')}>Tính năng</a>
            <a href="#comparison" onClick={(e) => handleNavClick(e, 'comparison')}>Trải nghiệm</a>
            <a href="#feedback" onClick={(e) => handleNavClick(e, 'feedback')}>Phản hồi</a>
            <a href="#download-apk" onClick={(e) => handleNavClick(e, 'download-apk')} className="apk-nav-link">Tải APK</a>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <a href="https://github.com/Thong-LH/MiniSeries/releases/download/latest/MiniSeries.apk" className="apk-nav-link-mobile" style={{ color: '#fb923c', fontWeight: 'bold', fontSize: '0.9rem', textDecoration: 'none' }}>Tải APK</a>
            <Link to="/login" onClick={handleProtectedNavigation} className="nav-login">Bắt đầu</Link>
          </div>
        </header>
      )}

      <main style={useStudioNavbar ? { paddingTop: '70px' } : undefined}>
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
