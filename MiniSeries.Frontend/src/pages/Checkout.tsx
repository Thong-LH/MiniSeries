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
  const [simulating, setSimulating] = useState(false);
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

  const handleSimulatePayment = async () => {
    if (!paymentCode) return;
    setSimulating(true);
    setError(null);

    try {
      // Simulate bank webhook call
      const result = await api.simulateBankWebhook(paymentCode, price);
      if (result.success) {
        // Refresh token snapshot
        await api.refreshProfileCache();
        setSuccess(true);
      } else {
        throw new Error(result.message || 'Giả lập thanh toán không thành công.');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Đã xảy ra lỗi khi giả lập cổng thanh toán.');
    } finally {
      setSimulating(false);
    }
  };

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
          <div>
            <h1 style={{ color: '#fafafa', marginBottom: '8px', fontSize: '2.2rem', textAlign: 'center', fontFamily: 'Cinzel, serif', fontWeight: 800, letterSpacing: '0.05em' }}>
              CỔNG THANH TOÁN
            </h1>
            <p style={{ color: 'rgba(250, 250, 250, 0.6)', textAlign: 'center', marginBottom: '36px', fontSize: '0.9rem' }}>
              Quét mã QR dưới đây hoặc bấm nút giả lập chuyển khoản để nâng cấp gói tài khoản.
            </p>
 
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1.2fr 1fr',
              gap: '28px',
              background: 'rgba(12, 12, 14, 0.85)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '24px',
              padding: '32px',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              boxShadow: '0 32px 64px -16px rgba(0, 0, 0, 0.6)'
            }}>
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
 
                <div style={{ marginTop: '36px' }}>
                  <button
                    onClick={handleSimulatePayment}
                    disabled={simulating}
                    style={{
                      width: '100%',
                      padding: '14px',
                      background: simulating ? 'rgba(255, 255, 255, 0.05)' : 'linear-gradient(90deg, #38bdf8, #0d9488)',
                      border: 'none',
                      color: simulating ? 'rgba(250, 250, 250, 0.3)' : '#09090b',
                      fontSize: '0.9rem',
                      fontWeight: 800,
                      borderRadius: '999px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      cursor: simulating ? 'not-allowed' : 'pointer',
                      boxShadow: simulating ? 'none' : '0 8px 24px rgba(56, 189, 248, 0.25)',
                      transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '10px'
                    }}
                  >
                    {simulating && <div className="inline-spinner" style={{ borderColor: '#09090b', borderTopColor: 'transparent' }}></div>}
                    {simulating ? 'Đang giả lập thanh toán...' : '✦ Giả lập quét mã thành công (Auto-Pay)'}
                  </button>
                  <p style={{ color: 'rgba(250, 250, 250, 0.35)', fontSize: '0.78rem', textAlign: 'center', marginTop: '10px' }}>
                    * Nút này mô phỏng hành vi quét mã QR chuyển khoản thành công của người dùng trên thực tế.
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
