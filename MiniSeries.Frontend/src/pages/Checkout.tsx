import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import Toast from '../components/Toast';
import './Studio.css'; // Reuse scifi space backgrounds and loader styles

export default function Checkout() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const planName = searchParams.get('plan') || 'Basic';
  const price = Number(searchParams.get('price')) || 150000;

  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentCode, setPaymentCode] = useState('');
  
  // Dynamic bank details from backend settings
  const [bankBin, setBankBin] = useState('970422');
  const [accountNumber, setAccountNumber] = useState('0909090909');
  const [accountName, setAccountName] = useState('MINISERIES STUDIO');

  // Create invoice on enter
  useEffect(() => {
    let ignore = false;

    const initInvoice = async () => {
      try {
        const response = await api.createInvoice(price, planName);
        if (ignore) return;
        setPaymentCode(response.paymentCode);
        if (response.bankBin) setBankBin(response.bankBin);
        if (response.accountNumber) setAccountNumber(response.accountNumber);
        if (response.accountName) setAccountName(response.accountName);
        setLoading(false);
      } catch (err: any) {
        if (ignore) return;
        console.error(err);
        setError(err.message || 'Không thể khởi tạo hóa đơn thanh toán.');
        setLoading(false);
      }
    };

    void initInvoice();
    return () => {
      ignore = true;
    };
  }, [price, planName]);

  // Poll payment status automatically for real bank webhook callback
  useEffect(() => {
    if (!paymentCode || success) return;

    const intervalId = setInterval(async () => {
      try {
        const result = await api.checkPaymentStatus(paymentCode);
        if (result && result.isPaid) {
          clearInterval(intervalId);
          await api.refreshProfileCache();
          setSuccess(true);
        }
      } catch (err) {
        console.error('Error polling payment status:', err);
      }
    }, 4000);

    return () => clearInterval(intervalId);
  }, [paymentCode, success]);

  const formattedPrice = new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0
  }).format(price);

  return (
    <div className="studio-page-wrapper" style={{ minHeight: '90vh', padding: '110px 20px 60px' }}>
      <Toast message={error} type="error" onClose={() => setError(null)} />

      {/* Cosmic background */}
      <div className="cyber-space-bg">
        <div className="stars-layer-1"></div>
        <div className="stars-layer-2"></div>
        <div className="nebula-glow"></div>
      </div>

      <div style={{ maxWidth: '900px', margin: '0 auto', position: 'relative', zIndex: 10 }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: '#fff' }}>
            <div className="loader" style={{ margin: '0 auto 20px' }}></div>
            <h2 style={{ color: '#38bdf8' }}>Đang khởi tạo hóa đơn giao dịch...</h2>
            <p style={{ color: '#94a3b8' }}>Vui lòng đợi trong giây lát.</p>
          </div>
        ) : success ? (
          <div style={{
            background: 'rgba(12, 12, 14, 0.85)',
            border: '1px solid rgba(34, 197, 94, 0.4)',
            borderRadius: '24px',
            padding: '48px 32px',
            textAlign: 'center',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            boxShadow: '0 32px 64px -16px rgba(0, 0, 0, 0.6)',
            color: '#fff'
          }}>
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '999px',
              background: 'rgba(34, 197, 94, 0.1)',
              border: '2px solid #22c55e',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2.5rem',
              color: '#22c55e',
              margin: '0 auto 24px'
            }}>
              ✓
            </div>
            <h1 style={{ color: '#22c55e', marginBottom: '14px', fontSize: '2rem', fontWeight: 800 }}>Thanh toán thành công!</h1>
            <p style={{ color: '#cbd5e1', fontSize: '1.1rem', marginBottom: '32px', maxWidth: '500px', margin: '0 auto 32px' }}>
              Tài khoản của bạn đã được nâng cấp lên gói <strong>{planName}</strong> thành công. Lượt tạo bài học đã được cộng thêm vào tài khoản của bạn.
            </p>
            <button
              onClick={() => navigate('/profile')}
              className="btn-primary"
              style={{
                background: 'linear-gradient(90deg, #22c55e, #10b981)',
                border: 'none',
                boxShadow: '0 8px 24px rgba(34, 197, 94, 0.35)',
                padding: '12px 28px',
                fontSize: '1rem',
                fontWeight: 'bold',
                cursor: 'pointer',
                borderRadius: '999px'
              }}
            >
              Xem trang Hồ sơ cá nhân
            </button>
          </div>
        ) : (
          <div style={{ position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '8px' }}>
              <button
                onClick={() => navigate('/pricing')}
                style={{
                  background: 'transparent',
                  color: 'rgba(250, 250, 250, 0.5)',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 16px',
                  borderRadius: '999px',
                  backgroundColor: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#38bdf8';
                  e.currentTarget.style.backgroundColor = 'rgba(56, 189, 248, 0.08)';
                  e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'rgba(250, 250, 250, 0.5)';
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.03)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="19" y1="12" x2="5" y2="12"></line>
                  <polyline points="12 19 5 12 12 5"></polyline>
                </svg>
                Quay lại Bảng giá
              </button>
            </div>

            <h1 style={{ color: '#fafafa', marginBottom: '8px', fontSize: '2.2rem', textAlign: 'center', fontFamily: 'Cinzel, serif', fontWeight: 800, letterSpacing: '0.05em' }}>
              CỔNG THANH TOÁN
            </h1>
            <p style={{ color: 'rgba(250, 250, 250, 0.6)', textAlign: 'center', marginBottom: '36px', fontSize: '0.9rem' }}>
              Quét mã QR dưới đây hoặc bấm nút giả lập chuyển khoản để nâng cấp gói tài khoản.
            </p>
 
            <div className="checkout-container-grid">
              {/* Order Info */}
              <div style={{ color: '#fff', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <h3 style={{ color: '#38bdf8', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '10px', marginBottom: '20px', fontSize: '1.1rem', fontWeight: 700 }}>
                    Chi tiết đơn hàng
                  </h3>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '14px' }}>
                    <span style={{ color: 'rgba(250, 250, 250, 0.5)', fontSize: '0.9rem' }}>Gói cước nâng cấp:</span>
                    <strong style={{ color: '#fafafa', fontSize: '1.05rem' }}>{planName}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '14px' }}>
                    <span style={{ color: 'rgba(250, 250, 250, 0.5)', fontSize: '0.9rem' }}>Số tiền cần thanh toán:</span>
                    <strong style={{ color: '#38bdf8', fontSize: '1.15rem', fontWeight: 800 }}>{formattedPrice}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', alignItems: 'center' }}>
                    <span style={{ color: 'rgba(250, 250, 250, 0.5)', fontSize: '0.9rem' }}>Mã nội dung chuyển khoản:</span>
                    <strong style={{ color: '#a78bfa', background: 'rgba(167, 139, 250, 0.1)', padding: '4px 10px', borderRadius: '6px', border: '1px solid rgba(167, 139, 250, 0.3)', fontFamily: 'monospace', letterSpacing: '1px' }}>
                      {paymentCode}
                    </strong>
                  </div>
 
                  <h3 style={{ color: '#38bdf8', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '10px', marginBottom: '20px', marginTop: '28px', fontSize: '1.1rem', fontWeight: 700 }}>
                    Thông tin tài khoản nhận
                  </h3>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '0.9rem' }}>
                    <span style={{ color: 'rgba(250, 250, 250, 0.5)' }}>Ngân hàng:</span>
                    <span style={{ color: '#fafafa', fontWeight: '600' }}>{bankBin === '970418' ? 'BIDV (Ngân hàng Đầu tư & Phát triển VN)' : 'MB Bank (Ngân hàng Quân Đội)'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '0.9rem' }}>
                    <span style={{ color: 'rgba(250, 250, 250, 0.5)' }}>Số tài khoản:</span>
                    <span style={{ color: '#fafafa', fontWeight: '600' }}>{accountNumber}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '0.9rem' }}>
                    <span style={{ color: 'rgba(250, 250, 250, 0.5)' }}>Tên người thụ hưởng:</span>
                    <span style={{ color: '#fafafa', fontWeight: '600' }}>{accountName}</span>
                  </div>
                </div>
 
                <div style={{ marginTop: '36px', padding: '16px', background: 'rgba(56, 189, 248, 0.05)', border: '1px solid rgba(56, 189, 248, 0.12)', borderRadius: '14px' }}>
                  <p style={{ margin: 0, color: '#38bdf8', fontSize: '0.82rem', lineHeight: '1.5', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                    <span>ℹ️</span>
                    <span>Hệ thống tự động quét giao dịch và kích hoạt gói cước ngay khi nhận được chuyển khoản từ bạn. Vui lòng giữ nguyên trang hoặc theo dõi trạng thái tại trang Lịch sử thanh toán.</span>
                  </p>
                </div>
              </div>
 
              {/* QR Code */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(255, 255, 255, 0.02)',
                borderRadius: '16px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                padding: '24px',
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
                boxShadow: '0 16px 32px rgba(0, 0, 0, 0.3)'
              }}>
                <div style={{ background: '#fff', padding: '16px', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.2)', marginBottom: '16px' }}>
                  <img
                    src={`https://api.vietqr.io/image/${bankBin}-${accountNumber}-compact.jpg?amount=${price}&addInfo=${paymentCode}&accountName=${encodeURIComponent(accountName)}`}
                    alt="VietQR Code"
                    style={{ width: '220px', height: '220px', display: 'block' }}
                  />
                </div>
                <span style={{ color: '#fafafa', fontSize: '0.9rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Quét QR qua Mobile Banking</span>
                <small style={{ color: 'rgba(250, 250, 250, 0.4)', fontSize: '0.75rem', marginTop: '4px', textAlign: 'center', lineHeight: 1.4 }}>
                  Mã QR này chứa sẵn số tiền và nội dung chuyển khoản tự động.
                </small>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
