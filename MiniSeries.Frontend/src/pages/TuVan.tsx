import { useState, useEffect } from 'react';
import Toast from '../components/Toast';
import { api } from '../services/api';
import './TuVan.css';

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
    <div className="tuvan-page">
      <Toast message={message} type="success" onClose={() => setMessage(null)} />
      <Toast message={error} type="error" onClose={() => setError(null)} />

      <h1 className="tuvan-title">Tư vấn dịch vụ</h1>
      <p className="tuvan-subtitle">
        Liên hệ với đội ngũ chuyên gia để được giải đáp thắc mắc và tư vấn giải pháp phù hợp.
      </p>

      <div className="tuvan-container">
        <form onSubmit={handleSubmit}>
          <div className="tuvan-form-group">
            <label className="tuvan-label">Họ và tên</label>
            <input 
              type="text" 
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="tuvan-input"
              placeholder="Nhập tên của bạn" 
              required 
            />
          </div>

          <div className="tuvan-form-group">
            <label className="tuvan-label">Email liên hệ</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="tuvan-input"
              placeholder="Nhập email" 
              required 
            />
          </div>

          <div className="tuvan-form-group">
            <label className="tuvan-label">Nội dung cần tư vấn</label>
            <textarea 
              rows={5} 
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="tuvan-textarea"
              placeholder="Bạn cần chúng tôi giúp gì?" 
              required 
            />
          </div>

          <button 
            type="submit" 
            disabled={submitting}
            className="tuvan-btn"
          >
            {submitting ? 'Đang gửi...' : 'Gửi yêu cầu'}
          </button>
        </form>
      </div>
    </div>
  );
}
