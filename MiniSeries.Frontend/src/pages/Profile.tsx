import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Profile.css';
import FlyingPageBadgeWeb from '../components/FlyingPageBadgeWeb';
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
      <section style={{ padding: '110px 20px 60px', color: '#fff', textAlign: 'center', minHeight: '70vh' }}>
        <h1 style={{ color: '#f87171', marginBottom: '12px' }}>Không tải được hồ sơ</h1>
        <p>{profileError}</p>
      </section>
    );
  }

  if (!profile) {
    return (
      <section style={{ padding: '110px 20px 60px', color: '#fff', textAlign: 'center', minHeight: '70vh' }}>
        <h1 style={{ color: '#06b6d4', marginBottom: '12px' }}>Đang tải hồ sơ...</h1>
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
                  <p>Quota truyện</p>
                  <strong>{profile.remainingMangaCount}/{profile.mangaMonthlyLimit}</strong>
                </div>
                <div className="profile-quota-card video">
                  <p>Quota video</p>
                  <strong>{profile.remainingVideoCount}/{profile.videoMonthlyLimit}</strong>
                </div>
              </div>

              <p className="profile-period-text">
                Chu kỳ hiện tại kết thúc: {formatDate(profile.currentPeriodEnd)}
              </p>
            </div>
          </div>
        )}

        {activeTab === 'lessons' && (
          <div className="profile-content-card">
            <h2 style={{ color: '#67e8f9' }}>Bài học đã tạo</h2>
            {lessonsLoading && <p style={{ color: '#94a3b8' }}>Đang tải lịch sử bài học...</p>}
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
            {paymentsLoading && <p style={{ color: '#94a3b8' }}>Đang tải lịch sử thanh toán...</p>}
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
                      <td style={{ color: payment.isCompleted ? '#86efac' : '#facc15' }}>
                        {payment.isCompleted ? 'Đã thanh toán' : payment.status}
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


      </div>
    </section>
  );
}
