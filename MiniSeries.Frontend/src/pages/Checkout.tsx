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

  // Create invoice on enter
  useEffect(() => {
    let ignore = false;

    const initInvoice = async () => {
      try {
        const response = await api.createInvoice(price, planName);
        if (ignore) return;
        setPaymentCode(response.paymentCode);
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
            <h2 style={{ color: '#06b6d4' }}>Đang khởi tạo hóa đơn giao dịch...</h2>
            <p style={{ color: '#94a3b8' }}>Vui lòng đợi trong giây lát.</p>
          </div>
        ) : success ? (
          <div style={{
            background: 'rgba(15, 23, 42, 0.85)',
            border: '1px solid rgba(34, 197, 94, 0.4)',
            borderRadius: '20px',
            padding: '48px 32px',
            textAlign: 'center',
            boxShadow: '0 0 30px rgba(34, 197, 94, 0.15)',
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
            <h1 style={{ color: '#22c55e', marginBottom: '14px', fontSize: '2rem' }}>Thanh toán thành công!</h1>
            <p style={{ color: '#cbd5e1', fontSize: '1.1rem', marginBottom: '32px', maxWidth: '500px', margin: '0 auto 32px' }}>
              Tài khoản của bạn đã được nâng cấp lên gói <strong>{planName}</strong> thành công. Lượt tạo bài học đã được cộng thêm vào tài khoản của bạn.
            </p>
            <button
              onClick={() => navigate('/profile')}
              className="btn-primary"
              style={{
                background: 'linear-gradient(90deg, #22c55e, #10b981)',
                border: 'none',
                boxShadow: '0 0 15px rgba(34, 197, 94, 0.4)',
                padding: '12px 28px',
                fontSize: '1rem',
                fontWeight: 'bold',
                cursor: 'pointer',
                borderRadius: '8px'
              }}
            >
              Xem trang Hồ sơ cá nhân
            </button>
          </div>
        ) : (
          <div>
            <h1 style={{ color: '#06b6d4', marginBottom: '8px', fontSize: '2.2rem', textAlign: 'center' }}>
              Cổng Thanh Toán
            </h1>
            <p style={{ color: '#94a3b8', textAlign: 'center', marginBottom: '36px' }}>
              Quét mã QR dưới đây hoặc bấm nút giả lập chuyển khoản để nâng cấp gói tài khoản.
            </p>

            <div style={{
              display: 'grid',
              gridTemplateColumns: '1.2fr 1fr',
              gap: '28px',
              background: 'rgba(15, 23, 42, 0.82)',
              border: '1px solid rgba(6, 182, 212, 0.28)',
              borderRadius: '20px',
              padding: '32px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)'
            }}>
              {/* Order Info */}
              <div style={{ color: '#fff', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <h3 style={{ color: '#67e8f9', borderBottom: '1px solid rgba(148, 163, 184, 0.22)', paddingBottom: '10px', marginBottom: '20px' }}>
                    Chi tiết đơn hàng
                  </h3>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '14px' }}>
                    <span style={{ color: '#94a3b8' }}>Gói cước nâng cấp:</span>
                    <strong style={{ color: '#e2e8f0', fontSize: '1.1rem' }}>{planName}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '14px' }}>
                    <span style={{ color: '#94a3b8' }}>Số tiền cần thanh toán:</span>
                    <strong style={{ color: '#67e8f9', fontSize: '1.2rem' }}>{formattedPrice}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                    <span style={{ color: '#94a3b8' }}>Mã nội dung chuyển khoản:</span>
                    <strong style={{ color: '#a78bfa', background: 'rgba(167, 139, 250, 0.1)', padding: '4px 10px', borderRadius: '6px', border: '1px solid rgba(167, 139, 250, 0.3)', fontFamily: 'monospace', letterSpacing: '1px' }}>
                      {paymentCode}
                    </strong>
                  </div>

                  <h3 style={{ color: '#67e8f9', borderBottom: '1px solid rgba(148, 163, 184, 0.22)', paddingBottom: '10px', marginBottom: '20px', marginTop: '28px' }}>
                    Thông tin tài khoản nhận
                  </h3>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '0.95rem' }}>
                    <span style={{ color: '#94a3b8' }}>Ngân hàng:</span>
                    <span style={{ color: '#cbd5e1', fontWeight: 'bold' }}>MB Bank (Ngân hàng Quân Đội)</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '0.95rem' }}>
                    <span style={{ color: '#94a3b8' }}>Số tài khoản:</span>
                    <span style={{ color: '#cbd5e1', fontWeight: 'bold' }}>0909090909</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '0.95rem' }}>
                    <span style={{ color: '#94a3b8' }}>Tên người thụ hưởng:</span>
                    <span style={{ color: '#cbd5e1', fontWeight: 'bold' }}>MINISERIES LEARNING CO.</span>
                  </div>
                </div>

                <div style={{ marginTop: '36px' }}>
                  <button
                    onClick={handleSimulatePayment}
                    disabled={simulating}
                    style={{
                      width: '100%',
                      padding: '14px',
                      background: simulating ? 'rgba(148, 163, 184, 0.1)' : 'linear-gradient(90deg, #a855f7, #6366f1)',
                      border: 'none',
                      color: simulating ? '#475569' : '#fff',
                      fontSize: '1rem',
                      fontWeight: 800,
                      borderRadius: '10px',
                      cursor: simulating ? 'not-allowed' : 'pointer',
                      boxShadow: simulating ? 'none' : '0 4px 18px rgba(168, 85, 247, 0.35)',
                      transition: 'all 0.25s',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '10px'
                    }}
                  >
                    {simulating && <div className="inline-spinner" style={{ borderColor: '#fff', borderTopColor: 'transparent' }}></div>}
                    {simulating ? 'Đang giả lập thanh toán...' : '✦ Giả lập quét mã thành công (Auto-Pay)'}
                  </button>
                  <p style={{ color: '#64748b', fontSize: '0.8rem', textAlign: 'center', marginTop: '10px' }}>
                    * Nút này mô phỏng hành vi quét mã QR chuyển khoản thành công của người dùng trên thực tế.
                  </p>
                </div>
              </div>

              {/* QR Code */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '14px', border: '1px solid rgba(255, 255, 255, 0.05)', padding: '24px' }}>
                <div style={{ background: '#fff', padding: '16px', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.2)', marginBottom: '16px' }}>
                  <img
                    src={`https://api.vietqr.io/image/970422-0909090909-5D1pG8K.jpg?amount=${price}&addInfo=${paymentCode}&accountName=MINISERIES%20LEARNING%20CO`}
                    alt="VietQR Code"
                    style={{ width: '220px', height: '220px', display: 'block' }}
                  />
                </div>
                <span style={{ color: '#cbd5e1', fontSize: '0.9rem', fontWeight: 'bold' }}>Quét QR qua Mobile Banking</span>
                <small style={{ color: '#64748b', fontSize: '0.75rem', marginTop: '4px', textAlign: 'center' }}>
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
