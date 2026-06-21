import { useState, useEffect } from 'react';
import Toast from '../components/Toast';
import { api } from '../services/api';

export default function TuVan() {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const cachedEmail = localStorage.getItem('user_email');
    const cachedName = localStorage.getItem('user_name');
    if (cachedEmail) setEmail(cachedEmail);
    if (cachedName) setFullName(cachedName);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !content.trim()) {
      setError('Vui lòng điền đầy đủ Email và Nội dung cần tư vấn.');
      return;
    }
    setSubmitting(true);
    setError(null);
    setMessage(null);
    try {
      await api.supportCreate(email.trim(), content.trim());
      setMessage('Đã ghi nhận yêu cầu tư vấn. Đội ngũ sẽ phản hồi qua email sau.');
      setContent('');
    } catch (err: any) {
      setError(err.message || 'Có lỗi xảy ra khi gửi yêu cầu tư vấn. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ padding: '60px 20px', textAlign: 'center', minHeight: '80vh', color: '#fff' }}>
      <Toast message={message} type="success" onClose={() => setMessage(null)} />
      <Toast message={error} type="error" onClose={() => setError(null)} />

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
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#cbd5e1', fontSize: '14px' }}>Họ và tên</label>
            <input 
              type="text" 
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              style={{ width: '100%', padding: '12px', background: 'rgba(0,0,0,0.3)', border: '1px solid #334155', borderRadius: '8px', color: 'white' }} 
              placeholder="Nhập tên của bạn" 
              required 
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#cbd5e1', fontSize: '14px' }}>Email liên hệ</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ width: '100%', padding: '12px', background: 'rgba(0,0,0,0.3)', border: '1px solid #334155', borderRadius: '8px', color: 'white' }} 
              placeholder="Nhập email" 
              required 
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#cbd5e1', fontSize: '14px' }}>Nội dung cần tư vấn</label>
            <textarea 
              rows={5} 
              value={content}
              onChange={(e) => setContent(e.target.value)}
              style={{ width: '100%', padding: '12px', background: 'rgba(0,0,0,0.3)', border: '1px solid #334155', borderRadius: '8px', color: 'white', resize: 'vertical' }} 
              placeholder="Bạn cần chúng tôi giúp gì?" 
              required 
            />
          </div>

          <button 
            type="submit" 
            disabled={submitting}
            style={{
              width: '100%',
              padding: '14px',
              background: 'linear-gradient(135deg, #0284c7 0%, #3b82f6 100%)',
              border: 'none',
              color: 'white',
              borderRadius: '8px',
              fontWeight: 'bold',
              cursor: submitting ? 'not-allowed' : 'pointer',
              opacity: submitting ? 0.7 : 1
            }}
          >
            {submitting ? 'Đang gửi...' : 'Gửi yêu cầu'}
          </button>
        </form>
      </div>
    </div>
  );
}
