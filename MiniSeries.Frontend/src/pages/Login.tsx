import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';

export default function Login() {
  const [isRegister, setIsRegister] = useState(false);
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate API call and redirect
    console.log("Login submitted");
    navigate('/dashboard');
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate API call
    console.log("Register submitted");
    setIsRegister(false);
  };

  return (
    <div className="login-page">
      <div className="login-glow-1"></div>
      <div className="login-glow-2"></div>
      
      <div className="login-container">
        <div className="login-header">
          <h1 className="login-title"><span>MiniSeries</span>Learning</h1>
          <p className="login-subtitle">
            {isRegister 
              ? "Đăng ký tài khoản mới để trải nghiệm hệ thống" 
              : "Đăng nhập để bắt đầu chuyển đổi bài học"}
          </p>
        </div>

        {!isRegister ? (
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label className="form-label" htmlFor="loginEmail">Email</label>
              <input 
                type="email" 
                id="loginEmail" 
                className="form-input" 
                placeholder="name@example.com" 
                required 
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="loginPassword">Mật khẩu</label>
              <input 
                type="password" 
                id="loginPassword" 
                className="form-input" 
                placeholder="••••••••" 
                required 
              />
            </div>
            <button type="submit" className="login-btn">
              Đăng nhập
            </button>
            <div className="login-footer">
              Chưa có tài khoản?{' '}
              <span className="login-link" onClick={() => setIsRegister(true)}>
                Đăng ký ngay
              </span>
            </div>
          </form>
        ) : (
          <form onSubmit={handleRegister}>
            <div className="form-group">
              <label className="form-label" htmlFor="regName">Họ và tên</label>
              <input 
                type="text" 
                id="regName" 
                className="form-input" 
                placeholder="Nguyễn Văn A" 
                required 
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="regEmail">Email</label>
              <input 
                type="email" 
                id="regEmail" 
                className="form-input" 
                placeholder="name@example.com" 
                required 
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="regPassword">Mật khẩu</label>
              <input 
                type="password" 
                id="regPassword" 
                className="form-input" 
                placeholder="Tối thiểu 6 ký tự" 
                required 
                minLength={6}
              />
            </div>
            <button type="submit" className="login-btn">
              Đăng ký tài khoản
            </button>
            <div className="login-footer">
              Đã có tài khoản?{' '}
              <span className="login-link" onClick={() => setIsRegister(false)}>
                Quay lại đăng nhập
              </span>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
