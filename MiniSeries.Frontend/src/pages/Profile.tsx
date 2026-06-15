import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  api,
  MY_LESSONS_CACHE_PREFIX,
  MY_PAYMENTS_CACHE_PREFIX,
  PROFILE_CACHE_KEY,
  PROFILE_DETAILS_CACHE_KEY
} from '../services/api';

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

type LessonSummary = {
  id: string;
  title: string;
  thumbnailUrl?: string | null;
  outputMode: string | number;
  scriptStatus: string | number;
  chapterCount: number;
  createdAt: string;
  approvedAt?: string | null;
};

type PaymentHistoryItem = {
  historyId?: string | null;
  orderId: number;
  paymentCode: string;
  planName: string;
  amount: number;
  tokensReceived: number;
  mangaMonthlyLimit?: number;
  videoMonthlyLimit?: number;
  monthlyGenerationLimit?: number;
  status: string;
  isCompleted: boolean;
  createdAt: string;
  paidAt?: string | null;
};

type TabKey = 'account' | 'lessons' | 'payments';

const SHOW_LEGACY_LESSON_TABLE = false;

const cardStyle = {
  background: 'rgba(15, 23, 42, 0.82)',
  border: '1px solid rgba(6, 182, 212, 0.28)',
  borderRadius: '18px'
};

function formatDate(value?: string | null) {
  if (!value) return 'Chưa có';
  return new Date(value).toLocaleDateString('vi-VN');
}

function formatMoney(value: number) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0
  }).format(value || 0);
}

function formatOutputMode(value: string | number) {
  return value === 'Video' || value === 1 ? 'Video' : 'Manga';
}

function formatScriptStatus(value: string | number) {
  const map: Record<string, string> = {
    Draft: 'Bản nháp',
    AwaitingReview: 'Chờ duyệt',
    RevisionRequested: 'Cần sửa',
    Approved: 'Đã duyệt',
    '0': 'Bản nháp',
    '1': 'Chờ duyệt',
    '2': 'Cần sửa',
    '3': 'Đã duyệt'
  };
  return map[String(value)] || String(value);
}

function getLessonThumbnail(lesson: LessonSummary) {
  return lesson.thumbnailUrl || '';
}

function tabButtonStyle(isActive: boolean) {
  return {
    padding: '10px 16px',
    borderRadius: '999px',
    border: isActive ? '1px solid rgba(6, 182, 212, 0.75)' : '1px solid rgba(148, 163, 184, 0.28)',
    background: isActive ? 'rgba(6, 182, 212, 0.16)' : 'rgba(15, 23, 42, 0.5)',
    color: isActive ? '#67e8f9' : '#cbd5e1',
    fontWeight: 800,
    cursor: 'pointer'
  };
}

function getScopedCacheKey(prefix: string) {
  const userId = localStorage.getItem('userId')?.trim() || 'anonymous';
  return `${prefix}:${userId}`;
}

function readJsonCache<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) as T : null;
  } catch {
    localStorage.removeItem(key);
    return null;
  }
}

function writeJsonCache(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value));
}

function readCachedProfile(): ProfileData | null {
  const scoped = readJsonCache<ProfileData>(getScopedCacheKey(PROFILE_DETAILS_CACHE_KEY));
  if (scoped) return scoped;

  const snapshot = readJsonCache<{
    fullName?: string;
    email?: string;
    avatarUrl?: string;
    tier?: string;
    mangaTokens?: number | null;
    mangaLimit?: number | null;
    videoTokens?: number | null;
    videoLimit?: number | null;
  }>(PROFILE_CACHE_KEY);
  if (!snapshot) return null;

  return {
    email: snapshot.email || localStorage.getItem('user_email') || '',
    fullName: snapshot.fullName || localStorage.getItem('user_name') || 'User',
    role: localStorage.getItem('userRole') || localStorage.getItem('user_role') || 'Customer',
    avatarUrl: snapshot.avatarUrl || '',
    planName: snapshot.tier || 'Free',
    mangaMonthlyLimit: snapshot.mangaLimit ?? 0,
    remainingMangaCount: snapshot.mangaTokens ?? 0,
    videoMonthlyLimit: snapshot.videoLimit ?? 0,
    remainingVideoCount: snapshot.videoTokens ?? 0,
    currentPeriodEnd: ''
  };
}

export default function Profile() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabKey>('account');
  const [profile, setProfile] = useState<ProfileData | null>(() => readCachedProfile());
  const [profileError, setProfileError] = useState<string | null>(null);
  const [lessons, setLessons] = useState<LessonSummary[]>(() =>
    readJsonCache<LessonSummary[]>(getScopedCacheKey(MY_LESSONS_CACHE_PREFIX)) ?? []
  );
  const [lessonsLoading, setLessonsLoading] = useState(false);
  const [lessonsLoaded, setLessonsLoaded] = useState(() =>
    readJsonCache<LessonSummary[]>(getScopedCacheKey(MY_LESSONS_CACHE_PREFIX)) !== null
  );
  const [lessonsError, setLessonsError] = useState<string | null>(null);
  const [payments, setPayments] = useState<PaymentHistoryItem[]>(() =>
    readJsonCache<PaymentHistoryItem[]>(getScopedCacheKey(MY_PAYMENTS_CACHE_PREFIX)) ?? []
  );
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const [paymentsLoaded, setPaymentsLoaded] = useState(() =>
    readJsonCache<PaymentHistoryItem[]>(getScopedCacheKey(MY_PAYMENTS_CACHE_PREFIX)) !== null
  );
  const [paymentsError, setPaymentsError] = useState<string | null>(null);

  const handleAuthError = useCallback((err: unknown) => {
    const status = typeof err === 'object' && err !== null && 'status' in err
      ? Number((err as { status?: number }).status)
      : undefined;
    if (status === 401 || status === 403) {
      localStorage.clear();
      navigate('/login', { replace: true });
      return true;
    }
    return false;
  }, [navigate]);

  const readErrorMessage = useCallback((err: unknown, fallback: string) => {
    return typeof err === 'object' && err !== null && 'message' in err
      ? String((err as { message?: string }).message || fallback)
      : fallback;
  }, []);

  const selectTab = (tab: TabKey) => {
    setActiveTab(tab);
    if (tab === 'lessons' && !lessonsLoaded) {
      setLessonsLoading(true);
      setLessonsError(null);
    }
    if (tab === 'payments' && !paymentsLoaded) {
      setPaymentsLoading(true);
      setPaymentsError(null);
    }
  };

  useEffect(() => {
    let ignore = false;

    api.getCurrentProfile()
      .then((data) => {
        if (!ignore) {
          setProfile(data);
          writeJsonCache(getScopedCacheKey(PROFILE_DETAILS_CACHE_KEY), data);
        }
      })
      .catch((err) => {
        if (ignore || handleAuthError(err)) return;
        setProfileError(readErrorMessage(err, 'Không tải được hồ sơ tài khoản.'));
      });

    return () => {
      ignore = true;
    };
  }, [handleAuthError, readErrorMessage]);

  useEffect(() => {
    if (activeTab !== 'lessons') return;

    let ignore = false;

    api.getMyLessons()
      .then((data) => {
        if (!ignore) {
          const nextLessons = Array.isArray(data) ? data : [];
          setLessons(nextLessons);
          writeJsonCache(getScopedCacheKey(MY_LESSONS_CACHE_PREFIX), nextLessons);
          setLessonsLoaded(true);
        }
      })
      .catch((err) => {
        if (ignore || handleAuthError(err)) return;
        setLessonsError(readErrorMessage(err, 'Không tải được lịch sử bài học.'));
        setLessonsLoaded(true);
      })
      .finally(() => {
        if (!ignore) setLessonsLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [activeTab, handleAuthError, readErrorMessage]);

  useEffect(() => {
    if (activeTab !== 'payments') return;

    let ignore = false;

    api.getMyPaymentHistory()
      .then((data) => {
        if (!ignore) {
          const nextPayments = Array.isArray(data) ? data : [];
          setPayments(nextPayments);
          writeJsonCache(getScopedCacheKey(MY_PAYMENTS_CACHE_PREFIX), nextPayments);
          setPaymentsLoaded(true);
        }
      })
      .catch((err) => {
        if (ignore || handleAuthError(err)) return;
        setPaymentsError(readErrorMessage(err, 'Không tải được lịch sử thanh toán.'));
        setPaymentsLoaded(true);
      })
      .finally(() => {
        if (!ignore) setPaymentsLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [activeTab, handleAuthError, readErrorMessage]);

  if (profileError) {
    return (
      <section style={{ padding: '80px 20px', color: '#fff', textAlign: 'center', minHeight: '70vh' }}>
        <h1 style={{ color: '#f87171', marginBottom: '12px' }}>Không tải được hồ sơ</h1>
        <p>{profileError}</p>
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
      <div style={{ maxWidth: '1040px', margin: '0 auto' }}>
        <h1 style={{ color: '#06b6d4', marginBottom: '18px' }}>Hồ sơ cá nhân</h1>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '22px' }}>
          <button type="button" style={tabButtonStyle(activeTab === 'account')} onClick={() => selectTab('account')}>
            Tài khoản
          </button>
          <button type="button" style={tabButtonStyle(activeTab === 'lessons')} onClick={() => selectTab('lessons')}>
            Bài học của tôi
          </button>
          <button type="button" style={tabButtonStyle(activeTab === 'payments')} onClick={() => selectTab('payments')}>
            Thanh toán
          </button>
        </div>

        {activeTab === 'account' && (
          <div style={{
            ...cardStyle,
            display: 'grid',
            gridTemplateColumns: '220px 1fr',
            gap: '24px',
            padding: '28px'
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
                Chu kỳ hiện tại kết thúc: {formatDate(profile.currentPeriodEnd)}
              </p>
            </div>
          </div>
        )}

        {activeTab === 'lessons' && (
          <div style={{ ...cardStyle, padding: '24px' }}>
            <h2 style={{ marginBottom: '14px', color: '#67e8f9' }}>Bài học đã tạo</h2>
            {lessonsLoading && <p style={{ color: '#94a3b8' }}>Đang tải lịch sử bài học...</p>}
            {lessonsError && <p style={{ color: '#f87171' }}>{lessonsError}</p>}
            {!lessonsLoading && !lessonsError && lessons.length === 0 && (
              <p style={{ color: '#94a3b8' }}>Bạn chưa tạo bài học nào.</p>
            )}
            {lessons.length > 0 && (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                gap: '18px'
              }}>
                {lessons.map((lesson) => {
                  const thumbnailUrl = getLessonThumbnail(lesson);
                  const mode = formatOutputMode(lesson.outputMode);
                  const isVideo = mode === 'Video';

                  return (
                    <article
                      key={lesson.id}
                      onClick={() => navigate(`/studio?lessonId=${lesson.id}`)}
                      style={{
                        overflow: 'hidden',
                        borderRadius: '14px',
                        border: '1px solid rgba(148, 163, 184, 0.22)',
                        background: 'rgba(2, 6, 23, 0.62)',
                        cursor: 'pointer',
                        minHeight: '280px'
                      }}
                    >
                      <div style={{
                        position: 'relative',
                        aspectRatio: '16 / 10',
                        background: isVideo
                          ? 'linear-gradient(135deg, rgba(168, 85, 247, 0.28), rgba(15, 23, 42, 0.92))'
                          : 'linear-gradient(135deg, rgba(6, 182, 212, 0.26), rgba(15, 23, 42, 0.92))'
                      }}>
                        {thumbnailUrl ? (
                          <img
                            src={thumbnailUrl}
                            alt={lesson.title}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                              display: 'block'
                            }}
                          />
                        ) : (
                          <div style={{
                            height: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: isVideo ? '#c084fc' : '#67e8f9',
                            fontWeight: 900,
                            letterSpacing: '0.08em'
                          }}>
                            {mode}
                          </div>
                        )}
                        <span style={{
                          position: 'absolute',
                          top: '10px',
                          left: '10px',
                          padding: '6px 10px',
                          borderRadius: '999px',
                          background: isVideo ? 'rgba(168, 85, 247, 0.88)' : 'rgba(6, 182, 212, 0.88)',
                          color: '#020617',
                          fontSize: '0.75rem',
                          fontWeight: 900
                        }}>
                          {mode}
                        </span>
                      </div>

                      <div style={{ padding: '14px' }}>
                        <h3 style={{
                          minHeight: '48px',
                          margin: '0 0 10px',
                          color: '#f8fafc',
                          fontSize: '1rem',
                          lineHeight: 1.35
                        }}>
                          {lesson.title}
                        </h3>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '10px',
                          color: '#94a3b8',
                          fontSize: '0.88rem'
                        }}>
                          <span>{formatDate(lesson.createdAt)}</span>
                          <strong style={{ color: '#e2e8f0' }}>{lesson.chapterCount} chapter</strong>
                        </div>
                        <p style={{ marginTop: '10px', color: '#94a3b8', fontSize: '0.86rem' }}>
                          {formatScriptStatus(lesson.scriptStatus)}
                        </p>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
            {SHOW_LEGACY_LESSON_TABLE && lessons.length > 0 && (
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '760px' }}>
                <thead>
                  <tr style={{ color: '#94a3b8', textAlign: 'left' }}>
                    <th style={{ padding: '12px', borderBottom: '1px solid rgba(148, 163, 184, 0.22)' }}>Tiêu đề</th>
                    <th style={{ padding: '12px', borderBottom: '1px solid rgba(148, 163, 184, 0.22)' }}>Loại</th>
                    <th style={{ padding: '12px', borderBottom: '1px solid rgba(148, 163, 184, 0.22)' }}>Trạng thái</th>
                    <th style={{ padding: '12px', borderBottom: '1px solid rgba(148, 163, 184, 0.22)' }}>Chapter</th>
                    <th style={{ padding: '12px', borderBottom: '1px solid rgba(148, 163, 184, 0.22)' }}>Ngày tạo</th>
                    <th style={{ padding: '12px', borderBottom: '1px solid rgba(148, 163, 184, 0.22)' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {lessons.map((lesson) => (
                    <tr key={lesson.id}>
                      <td style={{ padding: '12px', borderBottom: '1px solid rgba(148, 163, 184, 0.12)', fontWeight: 700 }}>{lesson.title}</td>
                      <td style={{ padding: '12px', borderBottom: '1px solid rgba(148, 163, 184, 0.12)' }}>{formatOutputMode(lesson.outputMode)}</td>
                      <td style={{ padding: '12px', borderBottom: '1px solid rgba(148, 163, 184, 0.12)' }}>{formatScriptStatus(lesson.scriptStatus)}</td>
                      <td style={{ padding: '12px', borderBottom: '1px solid rgba(148, 163, 184, 0.12)' }}>{lesson.chapterCount}</td>
                      <td style={{ padding: '12px', borderBottom: '1px solid rgba(148, 163, 184, 0.12)' }}>{formatDate(lesson.createdAt)}</td>
                      <td style={{ padding: '12px', borderBottom: '1px solid rgba(148, 163, 184, 0.12)', textAlign: 'right' }}>
                        <button
                          type="button"
                          onClick={() => navigate(`/studio?lessonId=${lesson.id}`)}
                          style={{
                            padding: '8px 12px',
                            borderRadius: '8px',
                            border: '1px solid rgba(6, 182, 212, 0.42)',
                            background: 'rgba(6, 182, 212, 0.16)',
                            color: '#67e8f9',
                            fontWeight: 800,
                            cursor: 'pointer'
                          }}
                        >
                          Mở
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {activeTab === 'payments' && (
          <div style={{ ...cardStyle, padding: '24px', overflowX: 'auto' }}>
            <h2 style={{ marginBottom: '14px', color: '#c084fc' }}>Lịch sử thanh toán</h2>
            {paymentsLoading && <p style={{ color: '#94a3b8' }}>Đang tải lịch sử thanh toán...</p>}
            {paymentsError && <p style={{ color: '#f87171' }}>{paymentsError}</p>}
            {!paymentsLoading && !paymentsError && payments.length === 0 && (
              <p style={{ color: '#94a3b8' }}>Bạn chưa có giao dịch thanh toán.</p>
            )}
            {payments.length > 0 && (
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '780px' }}>
                <thead>
                  <tr style={{ color: '#94a3b8', textAlign: 'left' }}>
                    <th style={{ padding: '12px', borderBottom: '1px solid rgba(148, 163, 184, 0.22)' }}>Mã</th>
                    <th style={{ padding: '12px', borderBottom: '1px solid rgba(148, 163, 184, 0.22)' }}>Gói</th>
                    <th style={{ padding: '12px', borderBottom: '1px solid rgba(148, 163, 184, 0.22)' }}>Số tiền</th>
                    <th style={{ padding: '12px', borderBottom: '1px solid rgba(148, 163, 184, 0.22)' }}>Quota</th>
                    <th style={{ padding: '12px', borderBottom: '1px solid rgba(148, 163, 184, 0.22)' }}>Trạng thái</th>
                    <th style={{ padding: '12px', borderBottom: '1px solid rgba(148, 163, 184, 0.22)' }}>Ngày</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment) => (
                    <tr key={`${payment.orderId}-${payment.paymentCode}`}>
                      <td style={{ padding: '12px', borderBottom: '1px solid rgba(148, 163, 184, 0.12)', fontWeight: 800 }}>{payment.paymentCode}</td>
                      <td style={{ padding: '12px', borderBottom: '1px solid rgba(148, 163, 184, 0.12)' }}>{payment.planName}</td>
                      <td style={{ padding: '12px', borderBottom: '1px solid rgba(148, 163, 184, 0.12)' }}>{formatMoney(payment.amount)}</td>
                      <td style={{ padding: '12px', borderBottom: '1px solid rgba(148, 163, 184, 0.12)' }}>
                        Truyện {payment.mangaMonthlyLimit ?? 0} / Video {payment.videoMonthlyLimit ?? 0}
                      </td>
                      <td style={{ padding: '12px', borderBottom: '1px solid rgba(148, 163, 184, 0.12)', color: payment.isCompleted ? '#86efac' : '#facc15' }}>
                        {payment.isCompleted ? 'Đã thanh toán' : payment.status}
                      </td>
                      <td style={{ padding: '12px', borderBottom: '1px solid rgba(148, 163, 184, 0.12)' }}>
                        {formatDate(payment.paidAt || payment.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
