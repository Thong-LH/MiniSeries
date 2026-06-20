import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, clearAuthSession, hasLocalSession, writeProfileSnapshot } from '../services/api';
import Toast from '../components/Toast';
import './Login.css';

export default function Login() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  // States for internal login (Staff/Admin)
  const [showInternalForm, setShowInternalForm] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    if (!hasLocalSession()) {
      return;
    }

    let ignore = false;

    api.getCurrentProfile()
      .then((profile) => {
        if (ignore) return;
        writeProfileSnapshot(profile);
        const role = profile.role || localStorage.getItem('userRole') || 'Customer';
        navigate(role === 'Admin' || role === 'Staff' ? '/dashboard' : '/studio', { replace: true });
      })
      .catch(() => {
        if (ignore) return;
        clearAuthSession();
      });

    return () => {
      ignore = true;
    };
  }, [navigate]);

  useEffect(() => {
    void api.warmup();
  }, []);

  // Handle Google OAuth Callback (hash URL containing #access_token=...)
  useEffect(() => {
    const hash = window.location.hash;
    if (hash && hash.includes('access_token=')) {
      const params = new URLSearchParams(hash.substring(1));
      const accessToken = params.get('access_token');
      if (accessToken) {
        setLoading(true);
        setError(null);
        setSuccess("Đang xác thực tài khoản Google...");

        // Clean the hash from the browser URL history
        window.history.replaceState(null, "", window.location.pathname);

        api.googleSignIn(accessToken)
          .then((data) => {
            const role = data.role || "Customer";
            writeProfileSnapshot(data);
            setSuccess("Đăng nhập thành công!");
            
            setTimeout(() => {
              if (role === "Admin" || role === "Staff") {
                navigate('/dashboard', { replace: true });
              } else {
                navigate('/studio', { replace: true });
              }
            }, 600);
          })
          .catch((err) => {
            setError(err.message || "Xác thực tài khoản Google thất bại.");
            setLoading(false);
          });
      }
    }
  }, [navigate]);

  // Handle traditional Login (Admin/Staff)
  const handleInternalLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password;

    if (!cleanEmail || !cleanPassword) {
      setError("Vui lòng điền đầy đủ Email và Mật khẩu.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const data = await api.login(cleanEmail, cleanPassword);
      const role = data.role || "Customer";
      writeProfileSnapshot(data);
      setSuccess("Đăng nhập nội bộ thành công!");

      setTimeout(() => {
        if (role === "Admin" || role === "Staff") {
          navigate('/dashboard', { replace: true });
        } else {
          navigate('/studio', { replace: true });
        }
      }, 600);
    } catch (err: any) {
      setError(err.message || "Đăng nhập thất bại. Vui lòng kiểm tra lại tài khoản nhân viên.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://devnyzwnvyzgulqroyqa.supabase.co";
    const redirectUrl = encodeURIComponent(`${window.location.origin}/login`);
    
    window.location.href = `${supabaseUrl}/auth/v1/authorize?provider=google&redirect_to=${redirectUrl}`;
  };

  return (
    <div className="login-page">
      <Toast message={error} type="error" onClose={() => setError(null)} />
      <Toast message={success} type="success" onClose={() => setSuccess(null)} />

      <div className="login-glow-1"></div>
      <div className="login-glow-2"></div>
      
      <div className="login-container">
        <div className="login-header">
          <h1 className="login-title"><span>MiniSeries</span>Learning</h1>
          <p className="login-subtitle">
            Hệ thống bài học chuyển đổi tự động bằng Video & Manga
          </p>
        </div>

        {loading ? (
          <div className="login-loading-container">
            <div className="spinner"></div>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Vui lòng đợi giây lát...</p>
          </div>
        ) : (
          <div>
            {!showInternalForm ? (
              // 1. Google Sign-In View (for regular users)
              <div style={{ textAlign: 'center' }}>
                <p style={{ color: '#e2e8f0', marginBottom: '1.5rem', fontSize: '0.95rem', lineHeight: '1.5' }}>
                  Trải nghiệm chuyển đổi bài học nhanh chóng chỉ với một chạm qua tài khoản Google.
                </p>
                
                <button className="google-btn" onClick={handleGoogleLogin} disabled={loading}>
                  <svg className="google-icon" viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Đăng nhập bằng Google
                </button>

                <div className="login-footer" style={{ marginTop: '2.5rem' }}>
                  Bạn là quản trị viên?{' '}
                  <span className="login-link" onClick={() => setShowInternalForm(true)}>
                    Đăng nhập nội bộ
                  </span>
                </div>
              </div>
            ) : (
              // 2. Email/Password View (for admin/staff only)
              <form onSubmit={handleInternalLogin}>
                <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
                  <span style={{ fontSize: '0.8rem', background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', padding: '0.25rem 0.75rem', borderRadius: '20px', border: '1px solid rgba(239, 68, 68, 0.3)', fontWeight: 'bold' }}>
                    KÊNH NỘI BỘ (ADMIN & STAFF)
                  </span>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="loginEmail">Email Nhân Viên</label>
                  <input 
                    type="email" 
                    id="loginEmail" 
                    className="form-input" 
                    placeholder="staff@example.com" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required 
                    disabled={loading}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="loginPassword">Mật khẩu</label>
                  <input 
                    type="password" 
                    id="loginPassword" 
                    className="form-input" 
                    placeholder="••••••••" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required 
                    disabled={loading}
                  />
                </div>
                
                <button type="submit" className="login-btn" disabled={loading}>
                  {loading ? "Đang đăng nhập..." : "Xác nhận Đăng nhập"}
                </button>

                <div className="login-footer">
                  Quay lại đăng nhập nhanh?{' '}
                  <span className="login-link" onClick={() => { setShowInternalForm(false); setError(null); }}>
                    Sử dụng Google
                  </span>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
