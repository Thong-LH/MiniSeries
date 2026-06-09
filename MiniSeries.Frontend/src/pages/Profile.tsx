import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';

type ProfileData = {
  email: string;
  fullName: string;
  role: string;
  avatarUrl: string;
  planName: string;
  mangaMonthlyLimit: number;
  remainingMangaCount: number;
  videoMonthlyLimit: number;
  remainingVideoCount: number;
  currentPeriodEnd: string;
};

export default function Profile() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;

    api.getCurrentProfile()
      .then((data) => {
        if (!ignore) {
          setProfile(data);
        }
      })
      .catch((err) => {
        if (ignore) return;

        if (err?.status === 401 || err?.status === 403) {
          localStorage.clear();
          navigate('/login', { replace: true });
          return;
        }

        setError(err.message || 'Không tải được hồ sơ tài khoản.');
      });

    return () => {
      ignore = true;
    };
  }, [navigate]);

  if (error) {
    return (
      <section style={{ padding: '80px 20px', color: '#fff', textAlign: 'center', minHeight: '70vh' }}>
        <h1 style={{ color: '#f87171', marginBottom: '12px' }}>Không tải được hồ sơ</h1>
        <p>{error}</p>
      </section>
    );
  }

  if (!profile) {
    return (
      <section style={{ padding: '80px 20px', color: '#fff', textAlign: 'center', minHeight: '70vh' }}>
        <h1 style={{ color: '#06b6d4', marginBottom: '12px' }}>Đang tải hồ sơ...</h1>
      </section>
    );
  }

  return (
    <section style={{ padding: '60px 20px', minHeight: '80vh', color: '#fff' }}>
      <div style={{ maxWidth: '920px', margin: '0 auto' }}>
        <h1 style={{ color: '#06b6d4', marginBottom: '24px' }}>Hồ sơ cá nhân</h1>

        <div style={{
          display: 'grid',
          gridTemplateColumns: '220px 1fr',
          gap: '24px',
          padding: '28px',
          background: 'rgba(15, 23, 42, 0.82)',
          border: '1px solid rgba(6, 182, 212, 0.28)',
          borderRadius: '18px'
        }}>
          <div style={{ textAlign: 'center' }}>
            <img
              src={profile.avatarUrl}
              alt="Avatar"
              style={{
                width: '112px',
                height: '112px',
                borderRadius: '999px',
                background: 'rgba(255,255,255,0.08)',
                border: '2px solid rgba(139, 92, 246, 0.8)',
                padding: '8px'
              }}
            />
            <p style={{ marginTop: '16px', color: '#a78bfa', fontWeight: 800 }}>
              {profile.planName || 'Free'}
            </p>
          </div>

          <div>
            <div style={{ marginBottom: '20px' }}>
              <p style={{ color: '#94a3b8', marginBottom: '4px' }}>Tên</p>
              <strong>{profile.fullName}</strong>
            </div>
            <div style={{ marginBottom: '20px' }}>
              <p style={{ color: '#94a3b8', marginBottom: '4px' }}>Email</p>
              <strong>{profile.email}</strong>
            </div>
            <div style={{ marginBottom: '24px' }}>
              <p style={{ color: '#94a3b8', marginBottom: '4px' }}>Vai trò</p>
              <strong>{profile.role}</strong>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
              gap: '14px'
            }}>
              <div style={{ padding: '16px', borderRadius: '14px', background: 'rgba(6, 182, 212, 0.12)', border: '1px solid rgba(6, 182, 212, 0.28)' }}>
                <p style={{ color: '#67e8f9', marginBottom: '8px', fontWeight: 700 }}>Quota truyện</p>
                <strong>{profile.remainingMangaCount}/{profile.mangaMonthlyLimit}</strong>
              </div>
              <div style={{ padding: '16px', borderRadius: '14px', background: 'rgba(168, 85, 247, 0.12)', border: '1px solid rgba(168, 85, 247, 0.28)' }}>
                <p style={{ color: '#c084fc', marginBottom: '8px', fontWeight: 700 }}>Quota video</p>
                <strong>{profile.remainingVideoCount}/{profile.videoMonthlyLimit}</strong>
              </div>
            </div>

            <p style={{ marginTop: '20px', color: '#94a3b8' }}>
              Chu kỳ hiện tại kết thúc: {profile.currentPeriodEnd ? new Date(profile.currentPeriodEnd).toLocaleDateString('vi-VN') : 'Chưa có dữ liệu'}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
