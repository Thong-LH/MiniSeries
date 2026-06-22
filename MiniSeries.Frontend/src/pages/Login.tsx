import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, clearAuthSession, hasLocalSession, writeProfileSnapshot } from '../services/api';
import Toast from '../components/Toast';
import './Login.css';

export default function Login() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Modes: 'login' | 'register' | 'otp' | 'forgot-password' | 'verify-reset-otp' | 'reset-password'
  const [viewMode, setViewMode] = useState<'login' | 'register' | 'otp' | 'forgot-password' | 'verify-reset-otp' | 'reset-password'>('login');
  
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');

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

  // Handle traditional Login
  const handleEmailLogin = async (e: React.FormEvent) => {
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
      setSuccess("Đăng nhập thành công!");

      setTimeout(() => {
        if (role === "Admin" || role === "Staff") {
          navigate('/dashboard', { replace: true });
        } else {
          navigate('/studio', { replace: true });
        }
      }, 600);
    } catch (err: any) {
      setError(err.message || "Đăng nhập thất bại. Vui lòng kiểm tra lại tài khoản.");
      setLoading(false);
    }
  };

  // Handle Registration
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanFullName = fullName.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password;

    if (!cleanFullName || !cleanEmail || !cleanPassword) {
      setError("Vui lòng điền đầy đủ thông tin.");
      return;
    }

    if (cleanPassword.length < 6) {
      setError("Mật khẩu phải chứa ít nhất 6 ký tự.");
      return;
    }

    if (cleanPassword !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await api.register(cleanEmail, cleanPassword, cleanFullName, "");
      setSuccess("Mã OTP xác thực đã được gửi đến email của bạn.");
      setViewMode('otp');
    } catch (err: any) {
      setError(err.message || "Đăng ký thất bại. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  // Handle OTP Verification
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    const cleanOtp = otpCode.trim();

    if (!cleanOtp) {
      setError("Vui lòng nhập mã OTP.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const data = await api.verifyOtp(cleanEmail, cleanOtp, fullName.trim(), "");
      
      // Auto login with the data returned from verifyOtp
      const role = data.role || "Customer";
      writeProfileSnapshot(data);
      
      if (data.accessToken) {
        localStorage.setItem("token", data.accessToken);
      }
      if (data.userId) {
        localStorage.setItem("userId", data.userId);
      }
      if (data.fullName) {
        localStorage.setItem("user_name", data.fullName);
      }
      if (data.email) {
        localStorage.setItem("user_email", data.email);
      }

      setSuccess("Xác thực và kích hoạt tài khoản thành công!");

      setTimeout(() => {
        if (role === "Admin" || role === "Staff") {
          navigate('/dashboard', { replace: true });
        } else {
          navigate('/studio', { replace: true });
        }
      }, 600);
    } catch (err: any) {
      setError(err.message || "Xác thực mã OTP thất bại. Vui lòng kiểm tra lại.");
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    const cleanFullName = fullName.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await api.register(cleanEmail, cleanPassword, cleanFullName, "");
      setSuccess("Mã OTP mới đã được gửi thành công.");
    } catch (err: any) {
      setError(err.message || "Gửi lại OTP thất bại.");
    } finally {
      setLoading(false);
    }
  };

  // Handle Forgot Password
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      setError("Vui lòng điền Email.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await api.forgotPassword(cleanEmail);
      setSuccess("Mã OTP khôi phục mật khẩu đã được gửi đến email của bạn.");
      setOtpCode('');
      setViewMode('verify-reset-otp');
    } catch (err: any) {
      setError(err.message || "Không thể gửi mã khôi phục. Vui lòng kiểm tra lại.");
    } finally {
      setLoading(false);
    }
  };

  // Handle Verify Reset OTP
  const handleVerifyResetOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    const cleanOtp = otpCode.trim();

    if (!cleanEmail || !cleanOtp) {
      setError("Vui lòng nhập mã OTP.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await api.verifyResetOtp(cleanEmail, cleanOtp);
      setSuccess("Xác thực mã OTP thành công. Vui lòng nhập mật khẩu mới.");
      setPassword('');
      setConfirmPassword('');
      setViewMode('reset-password');
    } catch (err: any) {
      setError(err.message || "Mã xác thực không chính xác hoặc đã hết hạn.");
    } finally {
      setLoading(false);
    }
  };

  // Handle Reset Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    const cleanOtp = otpCode.trim();
    const cleanPassword = password;

    if (!cleanEmail || !cleanOtp || !cleanPassword) {
      setError("Vui lòng nhập đầy đủ mật khẩu mới.");
      return;
    }

    if (cleanPassword.length < 6) {
      setError("Mật khẩu mới phải có tối thiểu 6 ký tự.");
      return;
    }

    if (cleanPassword !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const data = await api.resetPassword(cleanEmail, cleanOtp, cleanPassword);
      setSuccess(data.message || "Đặt lại mật khẩu thành công!");
      
      // Back to login screen
      setTimeout(() => {
        setPassword('');
        setConfirmPassword('');
        setOtpCode('');
        setViewMode('login');
        setLoading(false);
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Đặt lại mật khẩu thất bại. Vui lòng thử lại.");
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

  const isDualLayout = viewMode === 'login' || viewMode === 'register';

  return (
    <div className="login-page">
      <Toast message={error} type="error" onClose={() => setError(null)} />
      <Toast message={success} type="success" onClose={() => setSuccess(null)} />

      <div className="login-glow-1"></div>
      <div className="login-glow-2"></div>
      
      <div className={`login-container ${isDualLayout ? 'dual-layout' : ''}`}>
        <div className="login-header">
          {viewMode === 'login' && (
            <>
              <h1 className="login-title"><span>MiniSeries</span>Learning</h1>
              <p className="login-subtitle">Hệ thống bài học chuyển đổi tự động bằng Video & Manga</p>
            </>
          )}
          {viewMode === 'register' && (
            <>
              <h1 className="login-title"><span>Đăng Ký</span> Thành Viên</h1>
              <p className="login-subtitle">Tạo tài khoản mới để bắt đầu học tập</p>
            </>
          )}
          {viewMode === 'otp' && (
            <>
              <h1 className="login-title"><span>Xác Minh</span> OTP</h1>
              <p className="login-subtitle">Nhập mã xác thực để kích hoạt tài khoản của bạn</p>
            </>
          )}
          {viewMode === 'forgot-password' && (
            <>
              <h1 className="login-title"><span>Quên</span> Mật Khẩu</h1>
              <p className="login-subtitle">Nhập email của bạn để khôi phục mật khẩu</p>
            </>
          )}
          {viewMode === 'verify-reset-otp' && (
            <>
              <h1 className="login-title"><span>Xác Minh</span> OTP</h1>
              <p className="login-subtitle">Nhập mã xác thực để khôi phục mật khẩu</p>
            </>
          )}
          {viewMode === 'reset-password' && (
            <>
              <h1 className="login-title"><span>Đặt Lại</span> Mật Khẩu</h1>
              <p className="login-subtitle">Thiết lập mật khẩu mới cho tài khoản của bạn</p>
            </>
          )}
        </div>

        {loading ? (
          <div className="login-loading-container">
            <div className="spinner"></div>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Vui lòng đợi giây lát...</p>
          </div>
        ) : (
          <div>
            {isDualLayout ? (
              <div className="login-grid">
                {/* CỘT TRÁI: Đăng nhập bằng Google */}
                <div className="login-side-oauth">
                  <button className="google-btn" type="button" onClick={handleGoogleLogin} disabled={loading}>
                    <svg className="google-icon" viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    Tiếp tục với Google
                  </button>
                </div>

                {/* CỘT PHÂN CHIA (VERTICAL DIVIDER) */}
                <div className="login-divider-col">
                  <div className="login-divider-line-v"></div>
                  <div className="login-divider-text-v">HOẶC</div>
                  <div className="login-divider-line-v"></div>
                </div>

                {/* CỘT PHẢI: Form đăng nhập hoặc đăng ký truyền thống */}
                <div className="login-side-form">
                  {viewMode === 'login' ? (
                    <form onSubmit={handleEmailLogin}>
                      <h3 style={{ color: '#06b6d4', marginBottom: '1.25rem', fontSize: '1.1rem', fontWeight: 'bold' }}>
                        Tài khoản Email
                      </h3>
                      
                      <div className="form-group">
                        <label className="form-label" htmlFor="loginEmail">Email</label>
                        <input 
                          type="email" 
                          id="loginEmail" 
                          className="form-input" 
                          placeholder="example@email.com" 
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required 
                          disabled={loading}
                        />
                      </div>
                      <div className="form-group" style={{ marginBottom: '0.5rem' }}>
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

                      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.25rem' }}>
                        <span className="login-link" style={{ fontSize: '0.8rem' }} onClick={() => { setViewMode('forgot-password'); setError(null); }}>
                          Quên mật khẩu?
                        </span>
                      </div>
                      
                      <button type="submit" className="login-btn" disabled={loading}>
                        Đăng Nhập
                      </button>

                      <div className="login-footer" style={{ marginTop: '1.5rem' }}>
                        Chưa có tài khoản?{' '}
                        <span className="login-link" onClick={() => { setViewMode('register'); setError(null); }}>
                          Đăng ký ngay
                        </span>
                      </div>
                    </form>
                  ) : (
                    <form onSubmit={handleRegister}>
                      <h3 style={{ color: '#06b6d4', marginBottom: '1.25rem', fontSize: '1.1rem', fontWeight: 'bold' }}>
                        Đăng ký mới
                      </h3>
                      
                      <div className="form-group">
                        <label className="form-label" htmlFor="regFullName">Họ và tên</label>
                        <input 
                          type="text" 
                          id="regFullName" 
                          className="form-input" 
                          placeholder="Nguyễn Văn A" 
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          required 
                          disabled={loading}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label" htmlFor="regEmail">Email</label>
                        <input 
                          type="email" 
                          id="regEmail" 
                          className="form-input" 
                          placeholder="example@email.com" 
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required 
                          disabled={loading}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label" htmlFor="regPassword">Mật khẩu</label>
                        <input 
                          type="password" 
                          id="regPassword" 
                          className="form-input" 
                          placeholder="Tối thiểu 6 ký tự" 
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required 
                          disabled={loading}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label" htmlFor="regConfirmPassword">Xác nhận mật khẩu</label>
                        <input 
                          type="password" 
                          id="regConfirmPassword" 
                          className="form-input" 
                          placeholder="••••••••" 
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          required 
                          disabled={loading}
                        />
                      </div>
                      
                      <button type="submit" className="login-btn" disabled={loading}>
                        Đăng Ký
                      </button>

                      <div className="login-footer" style={{ marginTop: '1.5rem' }}>
                        Đã có tài khoản?{' '}
                        <span className="login-link" onClick={() => { setViewMode('login'); setError(null); }}>
                          Đăng nhập
                        </span>
                      </div>
                    </form>
                  )}
                </div>
              </div>
            ) : (
              /* MÀN HÌNH ĐƠN (OTP, QUÊN MẬT KHẨU, XÁC MINH OTP KHÔI PHỤC, ĐẶT LẠI MẬT KHẨU) */
              <div>
                {viewMode === 'otp' && (
                  <form onSubmit={handleVerifyOtp} style={{ maxWidth: '380px', margin: '0 auto' }}>
                    <p style={{ color: '#e2e8f0', marginBottom: '1.5rem', fontSize: '0.9rem', textAlign: 'center', lineHeight: '1.5' }}>
                      Hệ thống đã gửi một mã OTP gồm 6 chữ số tới địa chỉ email <strong style={{ color: '#c084fc' }}>{email}</strong>. Vui lòng nhập mã để hoàn tất đăng ký.
                    </p>

                    <div className="form-group">
                      <label className="form-label" htmlFor="otpCode">Mã xác thực OTP</label>
                      <input 
                        type="text" 
                        id="otpCode" 
                        className="form-input" 
                        placeholder="123456" 
                        maxLength={6}
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value)}
                        required 
                        disabled={loading}
                        style={{ textAlign: 'center', letterSpacing: '8px', fontSize: '1.3rem', fontWeight: 'bold' }}
                      />
                    </div>
                    
                    <button type="submit" className="login-btn" disabled={loading}>
                      Xác minh & Đăng nhập
                    </button>

                    <div className="login-footer">
                      Không nhận được mã?{' '}
                      <span className="login-link" onClick={handleResendOtp}>
                        Gửi lại mã OTP
                      </span>
                    </div>

                    <div className="login-footer">
                      Quay lại bước đăng ký?{' '}
                      <span className="login-link" onClick={() => { setViewMode('register'); setError(null); }}>
                        Đăng ký mới
                      </span>
                    </div>
                  </form>
                )}

                {viewMode === 'forgot-password' && (
                  <form onSubmit={handleForgotPassword} style={{ maxWidth: '380px', margin: '0 auto' }}>
                    <p style={{ color: '#e2e8f0', marginBottom: '1.5rem', fontSize: '0.9rem', textAlign: 'center', lineHeight: '1.5' }}>
                      Nhập địa chỉ email đăng ký tài khoản của bạn. Hệ thống sẽ gửi một mã OTP để xác nhận đổi mật khẩu mới.
                    </p>

                    <div className="form-group">
                      <label className="form-label" htmlFor="forgotEmail">Email tài khoản</label>
                      <input 
                        type="email" 
                        id="forgotEmail" 
                        className="form-input" 
                        placeholder="example@email.com" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required 
                        disabled={loading}
                      />
                    </div>
                    
                    <button type="submit" className="login-btn" disabled={loading}>
                      Gửi mã xác thực
                    </button>

                    <div className="login-footer">
                      Quay lại đăng nhập?{' '}
                      <span className="login-link" onClick={() => { setViewMode('login'); setError(null); }}>
                        Đăng nhập
                      </span>
                    </div>
                  </form>
                )}

                {viewMode === 'verify-reset-otp' && (
                  <form onSubmit={handleVerifyResetOtp} style={{ maxWidth: '380px', margin: '0 auto' }}>
                    <p style={{ color: '#e2e8f0', marginBottom: '1.5rem', fontSize: '0.9rem', textAlign: 'center', lineHeight: '1.5' }}>
                      Mã OTP khôi phục mật khẩu đã được gửi tới email <strong style={{ color: '#c084fc' }}>{email}</strong>. Vui lòng nhập mã để tiếp tục.
                    </p>

                    <div className="form-group">
                      <label className="form-label" htmlFor="resetOtp">Mã xác thực OTP</label>
                      <input 
                        type="text" 
                        id="resetOtp" 
                        className="form-input" 
                        placeholder="123456" 
                        maxLength={6}
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value)}
                        required 
                        disabled={loading}
                        style={{ textAlign: 'center', letterSpacing: '8px', fontSize: '1.3rem', fontWeight: 'bold' }}
                      />
                    </div>
                    
                    <button type="submit" className="login-btn" disabled={loading}>
                      Xác minh mã OTP
                    </button>

                    <div className="login-footer">
                      Không nhận được mã?{' '}
                      <span className="login-link" onClick={() => api.forgotPassword(email).then(() => setSuccess("Mã OTP mới đã được gửi."))}>
                        Gửi lại mã OTP
                      </span>
                    </div>

                    <div className="login-footer">
                      Quay lại đăng nhập?{' '}
                      <span className="login-link" onClick={() => { setViewMode('login'); setError(null); }}>
                        Đăng nhập
                      </span>
                    </div>
                  </form>
                )}

                {viewMode === 'reset-password' && (
                  <form onSubmit={handleResetPassword} style={{ maxWidth: '380px', margin: '0 auto' }}>
                    <p style={{ color: '#e2e8f0', marginBottom: '1.5rem', fontSize: '0.9rem', textAlign: 'center', lineHeight: '1.5' }}>
                      Xác thực OTP thành công. Vui lòng thiết lập mật khẩu mới cho tài khoản <strong style={{ color: '#06b6d4' }}>{email}</strong>.
                    </p>

                    <div className="form-group">
                      <label className="form-label" htmlFor="resetPassword">Mật khẩu mới</label>
                      <input 
                        type="password" 
                        id="resetPassword" 
                        className="form-input" 
                        placeholder="Tối thiểu 6 ký tự" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required 
                        disabled={loading}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label" htmlFor="resetConfirmPassword">Xác nhận mật khẩu mới</label>
                      <input 
                        type="password" 
                        id="resetConfirmPassword" 
                        className="form-input" 
                        placeholder="••••••••" 
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required 
                        disabled={loading}
                      />
                    </div>
                    
                    <button type="submit" className="login-btn" disabled={loading}>
                      Cập nhật mật khẩu
                    </button>

                    <div className="login-footer">
                      Quay lại đăng nhập?{' '}
                      <span className="login-link" onClick={() => { setViewMode('login'); setError(null); }}>
                        Đăng nhập
                      </span>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
