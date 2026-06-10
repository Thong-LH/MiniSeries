import { useState } from 'react';
import Toast from '../components/Toast';

export default function TuVan() {
  const [message, setMessage] = useState<string | null>(null);

  return (
    <div style={{ padding: '60px 20px', textAlign: 'center', minHeight: '80vh', color: '#fff' }}>
      <Toast message={message} type="success" onClose={() => setMessage(null)} />

      <h1 style={{ color: '#38bdf8', marginBottom: '20px' }}>Tư vấn dịch vụ</h1>
      <p style={{ color: '#94a3b8', marginBottom: '40px' }}>
        Liên hệ với đội ngũ chuyên gia để được giải đáp thắc mắc và tư vấn giải pháp phù hợp.
      </p>

      <div style={{
        maxWidth: '500px',
        margin: '0 auto',
        padding: '30px',
        background: 'rgba(15, 23, 42, 0.6)',
        borderRadius: '16px',
        border: '1px solid rgba(56, 189, 248, 0.3)',
        textAlign: 'left'
      }}>
        <form onSubmit={(e) => {
          e.preventDefault();
          setMessage('Đã ghi nhận yêu cầu tư vấn. Đội ngũ sẽ phản hồi sau.');
          e.currentTarget.reset();
        }}>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#cbd5e1', fontSize: '14px' }}>Họ và tên</label>
            <input type="text" style={{ width: '100%', padding: '12px', background: 'rgba(0,0,0,0.3)', border: '1px solid #334155', borderRadius: '8px', color: 'white' }} placeholder="Nhập tên của bạn" required />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#cbd5e1', fontSize: '14px' }}>Email liên hệ</label>
            <input type="email" style={{ width: '100%', padding: '12px', background: 'rgba(0,0,0,0.3)', border: '1px solid #334155', borderRadius: '8px', color: 'white' }} placeholder="Nhập email" required />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#cbd5e1', fontSize: '14px' }}>Nội dung cần tư vấn</label>
            <textarea rows={5} style={{ width: '100%', padding: '12px', background: 'rgba(0,0,0,0.3)', border: '1px solid #334155', borderRadius: '8px', color: 'white', resize: 'vertical' }} placeholder="Bạn cần chúng tôi giúp gì?" required></textarea>
          </div>

          <button type="submit" style={{
            width: '100%',
            padding: '14px',
            background: 'linear-gradient(135deg, #0284c7 0%, #3b82f6 100%)',
            border: 'none',
            color: 'white',
            borderRadius: '8px',
            fontWeight: 'bold',
            cursor: 'pointer'
          }}>Gửi yêu cầu</button>
        </form>
      </div>
    </div>
  );
}
