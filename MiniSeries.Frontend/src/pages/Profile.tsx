import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Profile.css';
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

type TabKey = 'account' | 'lessons' | 'payments' | 'feedback';

const SHOW_LEGACY_LESSON_TABLE = false;

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
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn("localStorage write failed (quota exceeded or disabled):", e);
  }
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
  const [totalLessonsCount, setTotalLessonsCount] = useState(() =>
    Number(localStorage.getItem(getScopedCacheKey("my_lessons_total_count"))) || 0
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [inputPage, setInputPage] = useState(String(currentPage));
  const itemsPerPage = 6;

  useEffect(() => {
    setInputPage(String(currentPage));
  }, [currentPage]);

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

  // Feedback state
  const [fbRating, setFbRating] = useState(0);
  const [fbComment, setFbComment] = useState('');
  const [fbSubmitting, setFbSubmitting] = useState(false);
  const [fbSubmitted, setFbSubmitted] = useState(false);
  const [fbError, setFbError] = useState<string | null>(null);



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
    setCurrentPage(1);
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
    setLessonsLoading(true);

    api.getMyLessons(currentPage, itemsPerPage)
      .then((res) => {
        if (ignore) return;

        let fetchedLessons: LessonSummary[] = [];
        let fetchedCount = 0;

        if (res && typeof res === 'object' && 'data' in res) {
          fetchedLessons = Array.isArray((res as any).data) ? (res as any).data : [];
          fetchedCount = Number((res as any).totalCount) || 0;
        } else {
          fetchedLessons = Array.isArray(res) ? res : [];
          fetchedCount = fetchedLessons.length;
        }

        setLessons(fetchedLessons);
        setTotalLessonsCount(fetchedCount);
        writeJsonCache(getScopedCacheKey(MY_LESSONS_CACHE_PREFIX), fetchedLessons);
        localStorage.setItem(getScopedCacheKey("my_lessons_total_count"), String(fetchedCount));
        setLessonsLoaded(true);
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
  }, [activeTab, currentPage, handleAuthError, readErrorMessage]);

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
        setPaymentsError(readErrorMessage(err, 'Không tải được lịch sử thanh toán của bạn.'));
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
      <section style={{ padding: '110px 20px 60px', color: '#fff', textAlign: 'center', minHeight: '70vh' }}>
        <h1 style={{ color: '#f87171', marginBottom: '12px' }}>Không tải được hồ sơ</h1>
        <p>{profileError}</p>
      </section>
    );
  }

  if (!profile) {
    return (
      <section className="profile-section">
        <div className="profile-loader-container">
          <div className="cosmic-portal-loader"></div>
          <p className="cosmic-loader-text">Đang tải hồ sơ...</p>
        </div>
      </section>
    );
  }

  const currentLessons = lessons;
  const totalPages = Math.ceil(totalLessonsCount / itemsPerPage) || 1;

  return (
    <section className="profile-section">
      <div className="profile-container">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
          <h1 className="profile-title" style={{ margin: 0 }}>Hồ sơ cá nhân</h1>
          <button
            type="button"
            onClick={() => navigate('/studio')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              borderRadius: '8px',
              border: '1px solid rgba(6, 182, 212, 0.4)',
              background: 'rgba(6, 182, 212, 0.12)',
              color: '#67e8f9',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              transition: 'all 0.2s',
              fontFamily: 'inherit'
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
            Quay lại Studio
          </button>
        </div>

        <div className="profile-tabs">
          <button type="button" style={tabButtonStyle(activeTab === 'account')} onClick={() => selectTab('account')}>
            Tài khoản
          </button>
          <button type="button" style={tabButtonStyle(activeTab === 'lessons')} onClick={() => selectTab('lessons')}>
            Bài học của tôi
          </button>
          <button type="button" style={tabButtonStyle(activeTab === 'payments')} onClick={() => selectTab('payments')}>
            Thanh toán
          </button>
          <button type="button" style={tabButtonStyle(activeTab === 'feedback')} onClick={() => selectTab('feedback')}>
            Đánh giá
          </button>
        </div>

        {activeTab === 'account' && (
          <div className="profile-card">
            <div className="profile-avatar-col">
              <img
                src={profile.avatarUrl}
                alt="Avatar"
                className="profile-avatar"
              />
              <p className="profile-plan">
                {profile.planName || 'Free'}
              </p>
            </div>

            <div className="profile-info-col">
              <div className="profile-info-item">
                <p>Tên</p>
                <strong>{profile.fullName}</strong>
              </div>
              <div className="profile-info-item">
                <p>Email</p>
                <strong>{profile.email}</strong>
              </div>
              <div className="profile-info-item">
                <p>Vai trò</p>
                <strong>{profile.role}</strong>
              </div>

              <div className="profile-quotas">
                <div className="profile-quota-card manga">
                  <p>Lượt tạo truyện còn lại</p>
                  <strong>{profile.remainingMangaCount} lượt</strong>
                </div>
                <div className="profile-quota-card video">
                  <p>Lượt tạo video còn lại</p>
                  <strong>{profile.remainingVideoCount} lượt</strong>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'lessons' && (
          <div className="profile-content-card">
            <h2 style={{ color: '#67e8f9' }}>Bài học đã tạo</h2>
            {lessonsLoading && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 0', gap: '12px' }}>
                <div className="cosmic-portal-loader" style={{ width: '40px', height: '40px' }}></div>
                <p style={{ color: 'rgba(250,250,250,0.5)', fontSize: '0.8rem', letterSpacing: '0.05em', margin: 0 }}>Đang tải lịch sử bài học...</p>
              </div>
            )}
            {lessonsError && <p style={{ color: '#f87171' }}>{lessonsError}</p>}
            {!lessonsLoading && !lessonsError && lessons.length === 0 && (
              <p style={{ color: '#94a3b8' }}>Bạn chưa tạo bài học nào.</p>
            )}
            {lessons.length > 0 && (
              <>
                <div className="lessons-grid">
                  {currentLessons.map((lesson) => {
                    const thumbnailUrl = getLessonThumbnail(lesson);
                    const mode = formatOutputMode(lesson.outputMode);
                    const isVideo = mode === 'Video';

                    return (
                      <article
                        key={lesson.id}
                        onClick={() => navigate(`/studio?lessonId=${lesson.id}`)}
                        className="lesson-card"
                      >
                        <div className={`lesson-thumbnail-container ${isVideo ? 'video-mode' : 'manga-mode'}`}>
                          {thumbnailUrl ? (
                            <img
                              src={thumbnailUrl}
                              alt={lesson.title}
                              className="lesson-thumbnail"
                            />
                          ) : (
                            <div className={`lesson-mode-fallback ${isVideo ? 'video' : 'manga'}`}>
                              {mode}
                            </div>
                          )}
                          <span className={`lesson-badge ${isVideo ? 'video' : 'manga'}`}>
                            {mode}
                          </span>
                        </div>

                        <div className="lesson-body">
                          <h3 className="lesson-title-text">
                            {lesson.title}
                          </h3>
                          <div className="lesson-info-row">
                            <span>{formatDate(lesson.createdAt)}</span>
                            <strong style={{ color: '#e2e8f0' }}>{lesson.chapterCount} chapter</strong>
                          </div>
                          <p className="lesson-status">
                            {formatScriptStatus(lesson.scriptStatus)}
                          </p>
                        </div>
                      </article>
                    );
                  })}
                </div>

                {totalPages > 1 && (
                  <div className="pagination-controls" style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: '8px',
                    marginTop: '24px'
                  }}>
                    <button
                      type="button"
                      disabled={currentPage === 1}
                      onClick={() => {
                        setCurrentPage(prev => Math.max(prev - 1, 1));
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      style={{
                        padding: '8px 16px',
                        borderRadius: '8px',
                        border: '1px solid rgba(6, 182, 212, 0.28)',
                        background: 'rgba(15, 23, 42, 0.6)',
                        color: currentPage === 1 ? '#475569' : '#67e8f9',
                        cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s',
                        fontWeight: 800
                      }}
                    >
                      Trước
                    </button>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#cbd5e1', fontSize: '0.85rem', fontWeight: 700, margin: '0 10px' }}>
                      <span>Trang</span>
                      <input
                        type="number"
                        min={1}
                        max={totalPages}
                        value={inputPage}
                        onChange={(e) => setInputPage(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            const val = Math.max(1, Math.min(totalPages, Number(inputPage) || 1));
                            setCurrentPage(val);
                            setInputPage(String(val));
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }
                        }}
                        onBlur={() => {
                          const val = Math.max(1, Math.min(totalPages, Number(inputPage) || 1));
                          setCurrentPage(val);
                          setInputPage(String(val));
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        style={{
                          width: '56px',
                          textAlign: 'center',
                          padding: '6px 8px',
                          borderRadius: '6px',
                          border: '1px solid rgba(6, 182, 212, 0.42)',
                          background: 'rgba(15, 23, 42, 0.75)',
                          color: '#67e8f9',
                          fontWeight: 800,
                          outline: 'none',
                        }}
                      />
                      <span style={{ color: '#64748b' }}>/ {totalPages}</span>
                    </div>
                    <button
                      type="button"
                      disabled={currentPage === totalPages}
                      onClick={() => {
                        setCurrentPage(prev => Math.min(prev + 1, totalPages));
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      style={{
                        padding: '8px 16px',
                        borderRadius: '8px',
                        border: '1px solid rgba(6, 182, 212, 0.28)',
                        background: 'rgba(15, 23, 42, 0.6)',
                        color: currentPage === totalPages ? '#475569' : '#67e8f9',
                        cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s',
                        fontWeight: 800
                      }}
                    >
                      Sau
                    </button>
                  </div>
                )}
              </>
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
          <div className="profile-content-card payments-table-container">
            <h2 style={{ marginBottom: '14px', color: '#c084fc' }}>Lịch sử thanh toán</h2>
            {paymentsLoading && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 0', gap: '12px' }}>
                <div className="cosmic-portal-loader" style={{ width: '40px', height: '40px' }}></div>
                <p style={{ color: 'rgba(250,250,250,0.5)', fontSize: '0.8rem', letterSpacing: '0.05em', margin: 0 }}>Đang tải lịch sử thanh toán...</p>
              </div>
            )}
            {paymentsError && <p style={{ color: '#f87171' }}>{paymentsError}</p>}
            {!paymentsLoading && !paymentsError && payments.length === 0 && (
              <p style={{ color: '#94a3b8' }}>Bạn chưa có giao dịch thanh toán.</p>
            )}
            {payments.length > 0 && (
              <table className="payments-table">
                <thead>
                  <tr>
                    <th>Mã</th>
                    <th>Gói</th>
                    <th>Số tiền</th>
                    <th>Quota</th>
                    <th>Trạng thái</th>
                    <th>Ngày</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment) => (
                    <tr key={`${payment.orderId}-${payment.paymentCode}`}>
                      <td style={{ fontWeight: 800 }}>{payment.paymentCode}</td>
                      <td>{payment.planName}</td>
                      <td>{formatMoney(payment.amount)}</td>
                      <td>
                        Truyện {payment.mangaMonthlyLimit ?? 0} / Video {payment.videoMonthlyLimit ?? 0}
                      </td>
                      <td>
                        <span className={`payment-status-badge ${payment.isCompleted ? 'success' : 'pending'}`}>
                          {payment.isCompleted ? 'Đã thanh toán' : payment.status}
                        </span>
                      </td>
                      <td>
                        {formatDate(payment.paidAt || payment.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {activeTab === 'feedback' && (
          <div className="profile-content-card" style={{
            maxWidth: 560,
            background: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(24px)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            boxShadow: '0 24px 48px -12px rgba(0, 0, 0, 0.5)',
            borderRadius: '24px',
            padding: '40px 32px'
          }}>
            <h2 style={{ marginBottom: '8px', color: '#facc15', fontFamily: "'Playfair Display', serif", fontSize: '1.6rem', fontWeight: 700, letterSpacing: '0.05em' }}>Đánh giá MiniSeries</h2>
            <p style={{ color: 'rgba(250, 250, 250, 0.55)', fontSize: '0.85rem', marginBottom: '28px', lineHeight: '1.5' }}>Chia sẻ trải nghiệm của bạn để giúp chúng tôi cải thiện sản phẩm tốt hơn.</p>

            {fbSubmitted ? (
              <div style={{ textAlign: 'center', padding: '30px 0' }}>
                <p style={{ fontSize: '48px', marginBottom: '16px', filter: 'drop-shadow(0 0 10px rgba(6, 182, 212, 0.3))' }}>🎉</p>
                <h3 style={{ color: '#fafafa', marginBottom: '8px', fontFamily: "'Inter', sans-serif", fontSize: '1.25rem', fontWeight: 700 }}>Cảm ơn bạn đã đánh giá!</h3>
                <p style={{ color: 'rgba(250, 250, 250, 0.55)', fontSize: '0.85rem' }}>Phản hồi quý giá của bạn giúp chúng tôi cải thiện sản phẩm tốt hơn.</p>
                <button
                  style={{
                    marginTop: '24px',
                    padding: '12px 32px',
                    borderRadius: '999px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #06b6d4, #0891b2)',
                    color: '#fff',
                    fontWeight: 800,
                    fontSize: '0.85rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    boxShadow: '0 8px 24px rgba(6, 182, 212, 0.25)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onClick={() => { setFbSubmitted(false); setFbRating(0); setFbComment(''); }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-1.5px)';
                    e.currentTarget.style.boxShadow = '0 12px 30px rgba(6, 182, 212, 0.35)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(6, 182, 212, 0.25)';
                  }}
                >
                  Gửi đánh giá khác
                </button>
              </div>
            ) : (
              <>
                <div style={{ marginBottom: '24px', textAlign: 'center' }}>
                  <label style={{ display: 'block', color: 'rgba(250, 250, 250, 0.45)', fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '12px' }}>Mức độ hài lòng của bạn</label>
                  <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', margin: '12px 0' }}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setFbRating(star)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '38px',
                          color: star <= fbRating ? ['#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e'][fbRating - 1] : 'rgba(255,255,255,0.15)',
                          transition: 'all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                          transform: star <= fbRating ? 'scale(1.2)' : 'scale(1)',
                          filter: star <= fbRating ? 'drop-shadow(0 0 8px rgba(250,204,21,0.25))' : 'none'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'scale(1.25)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = star <= fbRating ? 'scale(1.2)' : 'scale(1)';
                        }}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                  {fbRating > 0 && (
                    <div style={{
                      display: 'inline-flex',
                      padding: '4px 14px',
                      borderRadius: '999px',
                      backgroundColor: ['rgba(239, 68, 68, 0.08)', 'rgba(249, 115, 22, 0.08)', 'rgba(234, 179, 8, 0.08)', 'rgba(132, 204, 22, 0.08)', 'rgba(34, 197, 94, 0.08)'][fbRating - 1],
                      border: `1px solid ${['rgba(239, 68, 68, 0.15)', 'rgba(249, 115, 22, 0.15)', 'rgba(234, 179, 8, 0.15)', 'rgba(132, 204, 22, 0.15)', 'rgba(34, 197, 94, 0.15)'][fbRating - 1]}`,
                      marginTop: '6px'
                    }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: ['#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e'][fbRating - 1] }}>
                        {['Rất tệ 😡', 'Tệ 😞', 'Bình thường 😐', 'Tốt 🙂', 'Tuyệt vời 😍'][fbRating - 1]}
                      </span>
                    </div>
                  )}
                </div>

                <div style={{ marginBottom: '28px' }}>
                  <label style={{ display: 'block', color: 'rgba(250, 250, 250, 0.45)', fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '8px' }}>Nội dung đánh giá</label>
                  <textarea
                    value={fbComment}
                    onChange={(e) => setFbComment(e.target.value)}
                    placeholder="Hãy chia sẻ trải nghiệm học tập và cảm nhận của bạn về các nội dung truyện tranh, video AI..."
                    maxLength={500}
                    style={{
                      width: '100%',
                      minHeight: '130px',
                      padding: '16px',
                      borderRadius: '16px',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      background: 'rgba(9, 9, 11, 0.5)',
                      color: '#fafafa',
                      fontSize: '0.9rem',
                      fontWeight: 500,
                      lineHeight: '1.5',
                      resize: 'none',
                      outline: 'none',
                      boxSizing: 'border-box',
                      fontFamily: 'inherit',
                      transition: 'all 0.2s ease',
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(6, 182, 212, 0.4)';
                      e.currentTarget.style.boxShadow = '0 0 15px rgba(6, 182, 212, 0.1)';
                      e.currentTarget.style.backgroundColor = 'rgba(9, 9, 11, 0.8)';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                      e.currentTarget.style.boxShadow = 'none';
                      e.currentTarget.style.backgroundColor = 'rgba(9, 9, 11, 0.5)';
                    }}
                  />
                  <p style={{ textAlign: 'right', fontSize: '11px', color: 'rgba(250, 250, 250, 0.3)', marginTop: '6px' }}>{fbComment.length}/500 ký tự</p>
                </div>

                {fbError && (
                  <div style={{
                    padding: '10px 16px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(239, 68, 68, 0.05)',
                    border: '1px solid rgba(239, 68, 68, 0.15)',
                    marginBottom: '16px'
                  }}>
                    <p style={{ color: '#f87171', fontSize: '0.8rem', fontWeight: 600, margin: 0 }}>⚠️ {fbError}</p>
                  </div>
                )}

                <button
                  type="button"
                  disabled={fbSubmitting}
                  onClick={async () => {
                    if (fbRating === 0) { setFbError('Vui lòng chọn mức độ hài lòng.'); return; }
                    if (!fbComment.trim()) { setFbError('Vui lòng nhập nội dung đánh giá của bạn.'); return; }
                    setFbError(null);
                    setFbSubmitting(true);
                    try {
                      const token = (localStorage.getItem('token') || '').trim();
                      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5088/api'}/feedback/create`, {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                          'Authorization': `Bearer ${token}`,
                        },
                        body: JSON.stringify({ rating: fbRating, comment: fbComment.trim() }),
                      });
                      if (!res.ok) {
                        const data = await res.json().catch(() => ({}));
                        throw new Error(data.message || 'Gửi đánh giá thất bại.');
                      }
                      setFbSubmitted(true);
                    } catch (err: any) {
                      setFbError(err?.message || 'Gửi đánh giá thất bại.');
                    } finally {
                      setFbSubmitting(false);
                    }
                  }}
                  style={{
                    width: '100%',
                    padding: '14px',
                    borderRadius: '999px',
                    border: 'none',
                    background: fbSubmitting ? 'rgba(255, 255, 255, 0.15)' : 'linear-gradient(135deg, #06b6d4, #0891b2)',
                    color: fbSubmitting ? 'rgba(255, 255, 255, 0.35)' : '#fff',
                    fontSize: '0.85rem',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    boxShadow: fbSubmitting ? 'none' : '0 8px 24px rgba(6, 182, 212, 0.25)',
                    cursor: fbSubmitting ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    if (!fbSubmitting) {
                      e.currentTarget.style.transform = 'translateY(-1.5px)';
                      e.currentTarget.style.boxShadow = '0 12px 30px rgba(6, 182, 212, 0.35)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!fbSubmitting) {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 8px 24px rgba(6, 182, 212, 0.25)';
                    }
                  }}
                >
                  {fbSubmitting ? 'ĐANG GỬI ĐÁNH GIÁ...' : 'GỬI ĐÁNH GIÁ NGAY'}
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

