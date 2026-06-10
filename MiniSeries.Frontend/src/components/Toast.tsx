import { useEffect } from 'react';
import './Toast.css';

type ToastType = 'error' | 'success' | 'info';

type ToastProps = {
  message: string | null;
  type?: ToastType;
  title?: string;
  durationMs?: number;
  onClose: () => void;
};

const defaultTitle: Record<ToastType, string> = {
  error: 'Cần kiểm tra',
  success: 'Hoàn tất',
  info: 'Thông báo'
};

export default function Toast({
  message,
  type = 'info',
  title,
  durationMs = 3600,
  onClose
}: ToastProps) {
  useEffect(() => {
    if (!message || durationMs <= 0) return;

    const timer = window.setTimeout(onClose, durationMs);
    return () => window.clearTimeout(timer);
  }, [durationMs, message, onClose]);

  if (!message) return null;

  return (
    <div className={`app-toast ${type}`} role="status" aria-live="polite">
      <div>
        <p className="app-toast-title">{title || defaultTitle[type]}</p>
        <p className="app-toast-message">{message}</p>
      </div>
      <button type="button" className="app-toast-close" onClick={onClose} aria-label="Đóng thông báo">
        x
      </button>
    </div>
  );
}
