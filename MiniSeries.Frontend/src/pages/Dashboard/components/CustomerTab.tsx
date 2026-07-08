import { useState, useEffect } from 'react';
import { api } from '../../../services/api';

interface CustomerProfile {
  id: string;
  email: string;
  fullName: string;
  role: string;
  planName: string;
  mangaMonthlyLimit: number;
  usedMangaCount: number;
  videoMonthlyLimit: number;
  usedVideoCount: number;
  accountStatus: string;
  tokenBalance: number;
  createdAt: string;
  usedManga?: number;
  mangaLimit?: number;
  usedVideo?: number;
  videoLimit?: number;
}

interface CustomerTabProps {
  showToast: (msg: string, type?: 'success' | 'error') => void;
  showConfirm: (msg: string, onConfirm: () => void, title?: string) => void;
  activeSubTab: 'customers' | 'tokens';
}

export default function CustomerTab({ showToast, showConfirm, activeSubTab }: CustomerTabProps) {
  const [customers, setCustomers] = useState<CustomerProfile[]>([]);
  const [customersLoading, setCustomersLoading] = useState<boolean>(false);

  const [tokenSummary, setTokenSummary] = useState<{
    totalTokens: number;
    plusPackageCount: number;
    proMaxPackageCount: number;
  }>({ totalTokens: 0, plusPackageCount: 0, proMaxPackageCount: 0 });
  const [tokenUsers, setTokenUsers] = useState<CustomerProfile[]>([]);
  const [tokensLoading, setTokensLoading] = useState<boolean>(false);

  // Editing token modal
  const [editingTokenUser, setEditingTokenUser] = useState<CustomerProfile | null>(null);
  const [mangaDelta, setMangaDelta] = useState<number>(0);
  const [videoDelta, setVideoDelta] = useState<number>(0);
  const [tokenPlan, setTokenPlan] = useState<string>('Free');

  // Search & Pagination
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterOption1, setFilterOption1] = useState<string>('');
  const [filterOption2, setFilterOption2] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [sortColumn, setSortColumn] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    setSearchTerm('');
    setFilterOption1('');
    setFilterOption2('');
    setCurrentPage(1);
    setSortColumn('');
    setSortDirection('desc');
  }, [activeSubTab]);

  useEffect(() => {
    if (activeSubTab === 'customers') {
      loadCustomers();
    } else {
      loadTokens();
    }
  }, [activeSubTab]);

  const loadCustomers = async () => {
    setCustomersLoading(true);
    try {
      const data = await api.adminGetCustomers();
      setCustomers(Array.isArray(data) ? data : []);
    } catch (err: any) {
      showToast(err.message || 'Không thể tải danh sách khách hàng', 'error');
    } finally {
      setCustomersLoading(false);
    }
  };

  const loadTokens = async () => {
    setTokensLoading(true);
    try {
      const [summary, users] = await Promise.all([
        api.adminGetTokenSummary(),
        api.adminGetTokenUsers()
      ]);
      setTokenSummary({
        totalTokens: summary?.totalTokensIssued ?? summary?.totalTokens ?? 0,
        plusPackageCount: summary?.plusPackageCount ?? summary?.totalPlus ?? 0,
        proMaxPackageCount: summary?.proMaxPackageCount ?? summary?.totalProMax ?? 0
      });
      setTokenUsers(Array.isArray(users) ? users : []);
    } catch (err: any) {
      showToast(err.message || 'Không thể tải dữ liệu token', 'error');
    } finally {
      setTokensLoading(false);
    }
  };

  const handleToggleBlockCustomer = async (userId: string, isBlocked: boolean) => {
    const action = isBlocked ? "mở khóa" : "khóa";
    showConfirm(`Bạn có chắc chắn muốn ${action} tài khoản khách hàng này?`, async () => {
      try {
        await api.adminToggleBlockCustomer(userId);
        showToast(`Đã ${isBlocked ? 'mở khóa' : 'khóa'} tài khoản thành công!`);
        loadCustomers();
      } catch (err: any) {
        showToast(err.message || 'Thao tác thất bại', 'error');
      }
    }, isBlocked ? "Mở khóa khách hàng" : "Khóa khách hàng");
  };

  const handleDeleteCustomer = async (userId: string) => {
    showConfirm("Bạn có chắc chắn muốn xóa vĩnh viễn tài khoản khách hàng này?", async () => {
      try {
        await api.adminDeleteCustomer(userId);
        showToast('Đã xóa tài khoản thành công!');
        loadCustomers();
      } catch (err: any) {
        showToast(err.message || 'Không thể xóa tài khoản', 'error');
      }
    }, "Xóa khách hàng");
  };

  const handleOpenTokenModal = (user: CustomerProfile) => {
    setEditingTokenUser(user);
    setMangaDelta(0);
    setVideoDelta(0);
    setTokenPlan(user.planName || 'Free');
  };

  const handleTokenUpdateSubmit = async () => {
    if (!editingTokenUser) return;
    try {
      await api.adminUpdateUserToken(editingTokenUser.id, mangaDelta, videoDelta, tokenPlan);
      showToast('Cập nhật hạn mức và gói thành công!');
      setEditingTokenUser(null);
      loadTokens();
    } catch (err: any) {
      showToast(err.message || 'Lỗi cập nhật hạn mức/gói', 'error');
    }
  };

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  };

  const sortData = <T extends Record<string, any>>(data: T[]): T[] => {
    if (!sortColumn) return data;
    return [...data].sort((a, b) => {
      let valA = a[sortColumn];
      let valB = b[sortColumn];

      if (sortColumn === 'mangaLimit') {
        valA = (a.mangaLimit ?? 3) - (a.usedManga ?? 0);
        valB = (b.mangaLimit ?? 3) - (b.usedManga ?? 0);
      } else if (sortColumn === 'videoLimit') {
        valA = (a.videoLimit ?? 1) - (a.usedVideo ?? 0);
        valB = (b.videoLimit ?? 1) - (b.usedVideo ?? 0);
      }

      if (valA === undefined || valA === null) return 1;
      if (valB === undefined || valB === null) return -1;

      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortDirection === 'asc' ? valA - valB : valB - valA;
      }

      const strA = String(valA);
      const strB = String(valB);

      const dateA = Date.parse(strA);
      const dateB = Date.parse(strB);
      if (!isNaN(dateA) && !isNaN(dateB) && isNaN(Number(strA)) && isNaN(Number(strB))) {
        return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
      }

      return sortDirection === 'asc' 
        ? strA.toLowerCase().localeCompare(strB.toLowerCase(), 'vi', { sensitivity: 'base' })
        : strB.toLowerCase().localeCompare(strA.toLowerCase(), 'vi', { sensitivity: 'base' });
    });
  };

  const formatDate = (value?: string) => {
    if (!value) return '—';
    const d = new Date(value);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleString('vi-VN');
  };

  const renderSortableHeader = (label: string, field: string) => {
    const isCurrent = sortColumn === field;
    return (
      <th onClick={() => handleSort(field)} style={{ cursor: 'pointer', userSelect: 'none' }} className="sortable-header">
        <div className="flex items-center gap-1">
          {label}
          <span className={`sort-arrow ${isCurrent ? 'active' : ''}`} style={{ fontSize: '10px', opacity: isCurrent ? 1 : 0.4 }}>
            {isCurrent ? (sortDirection === 'asc' ? ' ▲' : ' ▼') : ' ↕'}
          </span>
        </div>
      </th>
    );
  };

  const renderSearchFilterBar = (placeholder: string, filters?: { value: string; onChange: (val: string) => void; options: { value: string; label: string }[] }[]) => {
    return (
      <div className="search-filter-bar">
        <div className="search-input-wrapper">
          <svg className="search-icon" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder={placeholder}
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="search-input"
          />
          {searchTerm && (
            <button type="button" className="clear-search-btn" onClick={() => { setSearchTerm(''); setCurrentPage(1); }}>&times;</button>
          )}
        </div>
        {filters && filters.length > 0 && (
          <div className="filter-group">
            {filters.map((filter, index) => (
              <div className="filter-select-wrapper" key={index}>
                <select
                  value={filter.value}
                  onChange={(e) => {
                    filter.onChange(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="filter-select"
                >
                  {filter.options.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderPagination = (totalItems: number) => {
    const totalPages = Math.ceil(totalItems / 10);
    if (totalPages <= 1) return null;

    const pages: number[] = [];
    for (let i = 1; i <= totalPages; i++) pages.push(i);

    return (
      <div className="table-pagination-bar">
        <div className="pagination-controls">
          <button
            type="button"
            className="btn-pagination-nav"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
          >
            Trước
          </button>
          {pages.map((p) => (
            <button
              key={p}
              type="button"
              className={`btn-pagination-page ${currentPage === p ? 'active' : ''}`}
              onClick={() => setCurrentPage(p)}
            >
              {p}
            </button>
          ))}
          <button
            type="button"
            className="btn-pagination-nav"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
          >
            Sau
          </button>
        </div>
      </div>
    );
  };

  const renderLoadingState = (message: string) => (
    <div className="cyber-loading-state">
      <div className="cyber-spinner"></div>
      <p className="cyber-loading-text">{message}</p>
    </div>
  );

  const renderEmptyState = (message: string) => (
    <div className="cyber-empty-state">
      <svg className="cyber-empty-icon" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 13.5h3.86a2.25 2.25 0 012.008 1.24l.885 1.77a2.25 2.25 0 002.007 1.24h1.98a2.25 2.25 0 002.007-1.24l.885-1.77a2.25 2.25 0 012.007-1.24h3.86m-18 0h18a2.25 2.25 0 012.25 2.25v4.5A2.25 2.25 0 0118 21H6a2.25 2.25 0 01-2.25-2.25v-4.5a2.25 2.25 0 012.25-2.25zM6 7.5l6-6 6 6m-6-6v12" />
      </svg>
      <p className="cyber-empty-text">{message}</p>
    </div>
  );

  const blockedCustomers = customers.filter(c => c.accountStatus?.toLowerCase() === 'blocked').length;

  return (
    <>
      {activeSubTab === 'customers' && (
        <section className="dashboard-fade-in space-y-6">
          <div className="section-header">
            <h2 className="section-title">Quản lý Khách hàng</h2>
            <p className="section-subtitle">Danh sách Customer và trạng thái Online/Offline realtime theo dữ liệu API.</p>
          </div>

          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-title">Tổng số khách hàng</div>
              <div className="stat-value">{customers.length}</div>
            </div>
            <div className="stat-card">
              <div className="stat-title">Đang Online 🟢</div>
              <div className="stat-value green">0</div>
            </div>
            <div className="stat-card">
              <div className="stat-title">Offline ⚪</div>
              <div className="stat-value">{Math.max(0, customers.length - blockedCustomers)}</div>
            </div>
          </div>

          {renderSearchFilterBar("Tìm kiếm khách hàng theo tên, email...", [
            {
              value: filterOption1,
              onChange: setFilterOption1,
              options: [
                { value: '', label: 'Tất cả trạng thái' },
                { value: 'active', label: 'Hoạt động (Active)' },
                { value: 'blocked', label: 'Bị khóa (Blocked)' }
              ]
            },
            {
              value: filterOption2,
              onChange: setFilterOption2,
              options: [
                { value: '', label: 'Tất cả gói cước' },
                { value: 'Free', label: 'Free' },
                { value: 'Basic', label: 'Basic' },
                { value: 'Premium', label: 'Premium' }
              ]
            }
          ])}

          <div className="data-table-container">
            {customersLoading ? (
              renderLoadingState("Đang tải danh sách khách hàng...")
            ) : customers.length === 0 ? (
              renderEmptyState("Chưa có khách hàng (Role = Customer) trên Supabase.")
            ) : (() => {
              const filtered = customers.filter(c => {
                const matchesSearch = !searchTerm || 
                  c.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                  c.email?.toLowerCase().includes(searchTerm.toLowerCase());
                
                const isBlocked = c.accountStatus?.toLowerCase() === 'blocked';
                const matchesStatus = !filterOption1 || 
                  (filterOption1 === 'active' && !isBlocked) || 
                  (filterOption1 === 'blocked' && isBlocked);

                const plan = c.planName || 'Free';
                const matchesPlan = !filterOption2 || plan === filterOption2;

                return matchesSearch && matchesStatus && matchesPlan;
              });

              const sorted = sortData(filtered);
              const paginated = sorted.slice((currentPage - 1) * 10, currentPage * 10);

              if (filtered.length === 0) {
                return renderEmptyState("Không tìm thấy khách hàng phù hợp.");
              }

              return (
                <>
                  <table className="cyber-table">
                    <thead>
                      <tr>
                        {renderSortableHeader("ID", "id")}
                        {renderSortableHeader("Tên khách hàng", "fullName")}
                        {renderSortableHeader("Email", "email")}
                        {renderSortableHeader("Gói cước", "planName")}
                        {renderSortableHeader("Trạng thái", "accountStatus")}
                        {renderSortableHeader("Ngày đăng ký", "createdAt")}
                        <th>Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginated.map((c) => {
                        const isBlocked = c.accountStatus?.toLowerCase() === 'blocked';
                        return (
                          <tr key={c.id}>
                            <td className="monospace-id">{c.id}</td>
                            <td className="font-semibold text-slate-200">{c.fullName}</td>
                            <td>{c.email}</td>
                            <td className="font-semibold text-zinc-300">{c.planName || 'Free'}</td>
                            <td>
                              {isBlocked ? (
                                <span className="status-badge badge-blocked">Blocked</span>
                              ) : (
                                <span className="status-badge badge-offline">Offline</span>
                              )}
                            </td>
                            <td className="text-zinc-500 text-xs">{formatDate(c.createdAt)}</td>
                            <td>
                              <div className="flex gap-2">
                                <button 
                                  type="button"
                                  className="btn-table-action btn-table-action-warning"
                                  onClick={() => handleToggleBlockCustomer(c.id, isBlocked)}
                                >
                                  {isBlocked ? "Mở khóa" : "Khóa"}
                                </button>
                                <button 
                                  type="button"
                                  className="btn-table-action btn-table-action-danger"
                                  onClick={() => handleDeleteCustomer(c.id)}
                                >
                                  Xóa
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {renderPagination(filtered.length)}
                </>
              );
            })()}
          </div>
        </section>
      )}

      {activeSubTab === 'tokens' && (
        <section className="dashboard-fade-in space-y-6">
          <div className="section-header">
            <h2 className="section-title">Quản lý Hạn ngạch & Gói</h2>
            <p className="section-subtitle">Theo dõi số lượt Manga, Video và gói nạp của khách hàng.</p>
          </div>

          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-title">Tổng khách hàng</div>
              <div className="stat-value">{tokenUsers.length}</div>
            </div>
            <div className="stat-card">
              <div className="stat-title">Gói Basic / Plus</div>
              <div className="stat-value purple">{tokenSummary.plusPackageCount}</div>
            </div>
            <div className="stat-card">
              <div className="stat-title">Gói Pro Max / Premium</div>
              <div className="stat-value gold">{tokenSummary.proMaxPackageCount}</div>
            </div>
          </div>

          {renderSearchFilterBar("Tìm kiếm người dùng theo tên, email...", [
            {
              value: filterOption1,
              onChange: setFilterOption1,
              options: [
                { value: '', label: 'Tất cả gói cước' },
                { value: 'Free', label: 'Free' },
                { value: 'Basic', label: 'Basic' },
                { value: 'Premium', label: 'Premium' }
              ]
            }
          ])}

          <div className="data-table-container">
            {tokensLoading ? (
              renderLoadingState("Đang tải danh sách token...")
            ) : tokenUsers.length === 0 ? (
              renderEmptyState("Chưa có khách hàng nào.")
            ) : (() => {
              const filtered = tokenUsers.filter(u => {
                const matchesSearch = !searchTerm || 
                  u.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                  u.email?.toLowerCase().includes(searchTerm.toLowerCase());
                
                const plan = u.planName || 'Free';
                const matchesPlan = !filterOption1 || plan === filterOption1;

                return matchesSearch && matchesPlan;
              });

              const sorted = sortData(filtered);
              const paginated = sorted.slice((currentPage - 1) * 10, currentPage * 10);

              if (filtered.length === 0) {
                return renderEmptyState("Không tìm thấy người dùng phù hợp.");
              }

              return (
                <>
                  <table className="cyber-table">
                    <thead>
                      <tr>
                        {renderSortableHeader("ID người dùng", "id")}
                        {renderSortableHeader("Tên user", "fullName")}
                        {renderSortableHeader("Email", "email")}
                        {renderSortableHeader("Lượt Manga (Còn lại / Tổng)", "mangaLimit")}
                        {renderSortableHeader("Lượt Video (Còn lại / Tổng)", "videoLimit")}
                        {renderSortableHeader("Gói đang dùng", "planName")}
                        <th>Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginated.map((u) => (
                        <tr key={u.id}>
                          <td className="monospace-id">{u.id}</td>
                          <td className="font-semibold text-slate-200">{u.fullName}</td>
                          <td>{u.email}</td>
                          <td className="font-semibold text-zinc-300">
                            {(u.mangaLimit ?? 3) - (u.usedManga ?? 0)} / {(u.mangaLimit ?? 3)}
                          </td>
                          <td className="font-semibold text-zinc-300">
                            {(u.videoLimit ?? 1) - (u.usedVideo ?? 0)} / {(u.videoLimit ?? 1)}
                          </td>
                          <td className="font-semibold text-indigo-400">{u.planName || 'Free'}</td>
                          <td>
                            <button 
                              type="button"
                              className="btn-table-action btn-table-action-cyan"
                              onClick={() => handleOpenTokenModal(u)}
                            >
                              Cập nhật
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {renderPagination(filtered.length)}
                </>
              );
            })()}
          </div>
        </section>
      )}

      {/* Edit Tokens & Plans Modal */}
      {editingTokenUser && (
        <div className="modal-overlay" onClick={() => setEditingTokenUser(null)}>
          <div className="modal-panel animate-in fade-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">Cập nhật Hạn mức & Gói</div>
            <div className="modal-desc">
              Thay đổi số lượt tạo truyện/video và phân cấp gói dịch vụ cho <span className="text-cyan-400 font-bold">{editingTokenUser.fullName}</span>.
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 uppercase tracking-wider block mb-1">Cộng/trừ Manga</label>
                  <input 
                    type="number" 
                    value={mangaDelta} 
                    onChange={(e) => setMangaDelta(Number(e.target.value))} 
                    className="modal-input" 
                    placeholder="Ví dụ: 5 hoặc -2"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 uppercase tracking-wider block mb-1">Cộng/trừ Video</label>
                  <input 
                    type="number" 
                    value={videoDelta} 
                    onChange={(e) => setVideoDelta(Number(e.target.value))} 
                    className="modal-input" 
                    placeholder="Ví dụ: 2 hoặc -1"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-400 uppercase tracking-wider block mb-1">Gói dịch vụ</label>
                <select 
                  value={tokenPlan} 
                  onChange={(e) => setTokenPlan(e.target.value)} 
                  className="modal-input"
                >
                  <option value="Free">Free</option>
                  <option value="Basic">Basic</option>
                  <option value="Premium">Premium</option>
                </select>
              </div>
              
              <div className="flex justify-end gap-3 pt-2">
                <button 
                  type="button" 
                  className="btn-secondary"
                  onClick={() => setEditingTokenUser(null)}
                >
                  Hủy
                </button>
                <button 
                  type="button" 
                  className="btn-primary"
                  onClick={handleTokenUpdateSubmit}
                >
                  Lưu thay đổi
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
