import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, writeProfileSnapshot } from '../services/api';
import Toast from '../components/Toast';
import './Login.css';

function generateUUID() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0,
      v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export default function Login() {
  const [step, setStep] = useState<'login' | 'register' | 'otp'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [otpCode, setOtpCode] = useState('');
  
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [tempRegisterData, setTempRegisterData] = useState<{ userId: string; email: string; fullName: string } | null>(null);

  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    const token = localStorage.getItem('token')?.trim();
    const userId = localStorage.getItem('userId')?.trim();
    if (token && userId) {
      const role = localStorage.getItem('userRole') || 'Customer';
      if (role === 'Admin' || role === 'Staff') {
        navigate('/dashboard', { replace: true });
      } else {
        navigate('/studio', { replace: true });
      }
    }
  }, [navigate]);

  useEffect(() => {
    void api.warmup();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
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
      
      if (role === "Admin" || role === "Staff") {
        navigate('/dashboard', { replace: true });
      } else {
        navigate('/studio', { replace: true });
      }
    } catch (err: any) {
      setError(err.message || "Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    const cleanFullName = fullName.trim();
    const cleanPassword = password;

    if (!cleanEmail || !cleanFullName || !cleanPassword) {
      setError("Vui lòng điền đầy đủ thông tin.");
      return;
    }

    if (cleanPassword.length < 6) {
      setError("Mật khẩu tối thiểu 6 ký tự.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);
    const userId = generateUUID();

    try {
      const data = await api.register(cleanEmail, cleanPassword, cleanFullName, userId);
      setTempRegisterData({
        userId,
        email: cleanEmail,
        fullName: cleanFullName
      });
      setSuccess(data.message || "Mã OTP đã được gửi đến Email của bạn.");
      setStep('otp');
    } catch (err: any) {
      setError(err.message || "Lỗi đăng ký không xác định");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode.trim().length !== 6) {
      setError("Vui lòng nhập đủ mã xác nhận gồm 6 chữ số.");
      return;
    }

    if (!tempRegisterData) {
      setError("Phiên đăng ký không hợp lệ. Vui lòng đăng ký lại.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const data = await api.verifyOtp(
        tempRegisterData.email,
        otpCode.trim(),
        tempRegisterData.fullName,
        tempRegisterData.userId
      );
      setSuccess(data.message || "Xác thực email thành công! Bạn có thể đăng nhập ngay.");
      
      // Reset forms and go to login
      setTimeout(() => {
        setStep('login');
        setOtpCode('');
        setPassword('');
        setError(null);
        setSuccess(null);
      }, 400);
    } catch (err: any) {
      setError(err.message || "Mã xác nhận không chính xác hoặc đã hết hạn.");
    } finally {
      setLoading(false);
    }
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
            {step === 'login' && "Đăng nhập để bắt đầu chuyển đổi bài học"}
            {step === 'register' && "Đăng ký tài khoản mới để trải nghiệm hệ thống"}
            {step === 'otp' && "Xác thực Email tài khoản"}
          </p>
        </div>

        {step === 'login' && (
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label className="form-label" htmlFor="loginEmail">Email</label>
              <input 
                type="email" 
                id="loginEmail" 
                className="form-input" 
                placeholder="name@example.com" 
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
              {loading ? "Đang đăng nhập..." : "Đăng nhập"}
            </button>
            <div className="login-footer">
              Chưa có tài khoản?{' '}
              <span className="login-link" onClick={() => { setStep('register'); setError(null); setSuccess(null); }}>
                Đăng ký ngay
              </span>
            </div>
          </form>
        )}

        {step === 'register' && (
          <form onSubmit={handleRegister}>
            <div className="form-group">
              <label className="form-label" htmlFor="regName">Họ và tên</label>
              <input 
                type="text" 
                id="regName" 
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
                placeholder="name@example.com" 
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
                minLength={6}
                disabled={loading}
              />
            </div>
            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? "Đang gửi mã OTP..." : "Đăng ký tài khoản"}
            </button>
            <div className="login-footer">
              Đã có tài khoản?{' '}
              <span className="login-link" onClick={() => { setStep('login'); setError(null); setSuccess(null); }}>
                Quay lại đăng nhập
              </span>
            </div>
          </form>
        )}

        {step === 'otp' && (
          <form onSubmit={handleVerifyOtp}>
            <div className="form-group">
              <label className="form-label" htmlFor="otpCode">Mã OTP (6 chữ số)</label>
              <input 
                type="text" 
                id="otpCode" 
                className="form-input" 
                placeholder="000000" 
                maxLength={6}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                style={{
                  textAlign: 'center',
                  fontSize: '1.75rem',
                  fontWeight: 'bold',
                  letterSpacing: '0.25em'
                }}
                required 
                disabled={loading}
              />
            </div>
            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? "Đang xác thực..." : "Xác nhận kích hoạt"}
            </button>
            <div className="login-footer">
              Muốn thay đổi thông tin?{' '}
              <span className="login-link" onClick={() => { setStep('register'); setError(null); setSuccess(null); }}>
                Quay lại đăng ký
              </span>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
