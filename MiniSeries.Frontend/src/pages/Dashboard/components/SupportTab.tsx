import { useState, useEffect, Fragment } from 'react';
import { api } from '../../../services/api';

interface SupportTicket {
  id: string;
  customerEmail: string;
  content: string;
  reply: string;
  status: string;
  assignedStaffEmail?: string | null;
  createdAt: string;
}

interface CskhMessage {
  id: string;
  customer_email?: string;
  email_customer?: string;
  customerEmail?: string;
  subject?: string;
  Subject?: string;
  content: string;
  sender_role?: string;
  senderRole?: string;
  createdAt?: string;
  created_at?: string;
}

interface FeedbackItem {
  id: string;
  email: string;
  rating: number;
  comment: string;
  createdAt: string;
}

interface SupportTabProps {
  showToast: (msg: string, type?: 'success' | 'error') => void;
  activeSubTab: 'support' | 'feedback';
}

export default function SupportTab({ showToast, activeSubTab }: SupportTabProps) {
  const [supportTab, setSupportTab] = useState<'support-tickets' | 'cskh-emails'>('support-tickets');
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([]);
  const [supportAssigneeFilter, setSupportAssigneeFilter] = useState<'all' | 'mine'>('all');
  const [cskhHistory, setCskhHistory] = useState<CskhMessage[]>([]);
  const [supportLoading, setSupportLoading] = useState<boolean>(false);

  // CSKH Mail Compose Box
  const [cskhEmail, setCskhEmail] = useState<string>('');
  const [cskhSubject, setCskhSubject] = useState<string>('');
  const [cskhContent, setCskhContent] = useState<string>('');
  const [selectedCskhTicketId, setSelectedCskhTicketId] = useState<string | null>(null);
  const [isComposeOpen, setIsComposeOpen] = useState<boolean>(false);
  const [isComposeMinimized, setIsComposeMinimized] = useState<boolean>(false);

  const [activeReplySupportId, setActiveReplySupportId] = useState<string | null>(null);
  const [supportReplyText, setSupportReplyText] = useState<string>('');
  const [activeViewCskhId, setActiveViewCskhId] = useState<string | null>(null);
  const [replyingSupportId, setReplyingSupportId] = useState<string | null>(null);
  const [isSendingCskhEmail, setIsSendingCskhEmail] = useState<boolean>(false);

  // Feedbacks
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [feedbacksLoading, setFeedbacksLoading] = useState<boolean>(false);

  // Search & Pagination
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterOption1, setFilterOption1] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [sortColumn, setSortColumn] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    setSearchTerm('');
    setFilterOption1('');
    setCurrentPage(1);
    setSortColumn('');
    setSortDirection('desc');
  }, [activeSubTab, supportTab]);

  useEffect(() => {
    if (activeSubTab === 'support') {
      loadSupportData();
    } else if (activeSubTab === 'feedback') {
      loadFeedbacks();
    }
  }, [activeSubTab, supportTab]);

  const loadSupportData = async () => {
    setSupportLoading(true);
    try {
      const [tickets, history] = await Promise.all([
        api.supportGetList(),
        api.cskhGetHistory()
      ]);
      setSupportTickets(Array.isArray(tickets) ? tickets : []);
      setCskhHistory(Array.isArray(history) ? history : []);
    } catch (err: any) {
      showToast(err.message || 'Không thể tải dữ liệu hỗ trợ', 'error');
    } finally {
      setSupportLoading(false);
    }
  };

  const loadFeedbacks = async () => {
    setFeedbacksLoading(true);
    try {
      const data = await api.feedbackGetList();
      setFeedbacks(Array.isArray(data) ? data : []);
    } catch (err: any) {
      showToast(err.message || 'Không thể tải dữ liệu phản hồi', 'error');
    } finally {
      setFeedbacksLoading(false);
    }
  };

  const handleReplySupportTicket = async (ticketId: string) => {
    const reply = supportReplyText.trim();
    if (!reply) {
      showToast("Vui lòng nhập nội dung phản hồi.", "error");
      return;
    }
    setReplyingSupportId(ticketId);
    try {
      await api.supportReply(ticketId, reply);
      showToast('Phản hồi ticket hỗ trợ thành công!');
      setActiveReplySupportId(null);
      setSupportReplyText('');
      loadSupportData();
    } catch (err: any) {
      showToast(err.message || 'Phản hồi thất bại', 'error');
    } finally {
      setReplyingSupportId(null);
    }
  };

  const handleCancelCskhReply = () => {
    setCskhEmail('');
    setCskhSubject('');
    setCskhContent('');
    setSelectedCskhTicketId(null);
    setIsComposeOpen(false);
  };

  const handleSendCskhEmail = async () => {
    const email = cskhEmail.trim();
    const subject = cskhSubject.trim();
    const content = cskhContent.trim();
    if (!email || !content) {
      showToast("Vui lòng nhập đầy đủ địa chỉ nhận và nội dung phản hồi!", "error");
      return;
    }
    setIsSendingCskhEmail(true);
    try {
      await api.cskhSendEmail({
        customerEmail: email,
        subject: subject,
        content: content,
        ticketId: selectedCskhTicketId ?? undefined
      });
      showToast('Đã gửi mail phản hồi thành công!');
      setCskhContent('');
      handleCancelCskhReply();
      loadSupportData();
    } catch (err: any) {
      showToast(err.message || 'Gửi mail thất bại', 'error');
    } finally {
      setIsSendingCskhEmail(false);
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

      if (sortColumn === 'customerEmail') {
        valA = a.customerEmail ?? a.customer_email ?? a.email_customer;
        valB = b.customerEmail ?? b.customer_email ?? b.email_customer;
      } else if (sortColumn === 'createdAt') {
        valA = a.createdAt ?? a.created_at;
        valB = b.createdAt ?? b.created_at;
      } else if (sortColumn === 'senderRole') {
        valA = a.senderRole ?? a.sender_role;
        valB = b.senderRole ?? b.sender_role;
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

  const renderStars = (rating: number) => {
    const count = Math.max(0, Math.min(5, rating || 0));
    return "⭐".repeat(count) + "☆".repeat(5 - count);
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

  return (
    <>
      {activeSubTab === 'support' && (
        <section className="dashboard-fade-in space-y-6">
          <div className="section-header">
            <h2 className="section-title">Hỗ trợ khách hàng</h2>
            <p className="section-subtitle">Xem các yêu cầu tư vấn từ khách hàng và gửi mail phản hồi trực tiếp.</p>
          </div>

          <div className="support-tab-header">
            <button
              type="button"
              className={`support-tab-btn ${supportTab === 'support-tickets' ? 'active' : ''}`}
              onClick={() => setSupportTab('support-tickets')}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
              Yêu cầu tư vấn (Ticket)
            </button>
            <button
              type="button"
              className={`support-tab-btn ${supportTab === 'cskh-emails' ? 'active' : ''}`}
              onClick={() => setSupportTab('cskh-emails')}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" /></svg>
              Lịch sử CSKH (Email)
            </button>
          </div>

          {supportTab === 'support-tickets' ? (
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Phiếu yêu cầu tư vấn</h3>
              {renderSearchFilterBar("Tìm kiếm ticket theo email, nội dung...", [
                {
                  value: filterOption1,
                  onChange: setFilterOption1,
                  options: [
                    { value: '', label: 'Tất cả trạng thái' },
                    { value: 'pending', label: 'Chưa trả lời' },
                    { value: 'done', label: 'Đã trả lời' }
                  ]
                },
                {
                  value: supportAssigneeFilter,
                  onChange: (val) => setSupportAssigneeFilter(val as 'all' | 'mine'),
                  options: [
                    { value: 'all', label: 'Tất cả người xử lý' },
                    { value: 'mine', label: 'Phân cho tôi' }
                  ]
                }
              ])}
              <div className="data-table-container">
                {supportLoading ? (
                  renderLoadingState("Đang tải dữ liệu yêu cầu...")
                ) : supportTickets.length === 0 ? (
                  renderEmptyState("Chưa có yêu cầu tư vấn nào.")
                ) : (() => {
                  const loggedInEmail = (localStorage.getItem("user_email") || "").toLowerCase();
                  const filtered = supportTickets.filter(t => {
                    const matchesSearch = !searchTerm || 
                      t.customerEmail?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                      t.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      (t.reply && t.reply.toLowerCase().includes(searchTerm.toLowerCase()));

                    const isDone = t.status === 'Đã trả lời';
                    const matchesStatus = !filterOption1 || 
                      (filterOption1 === 'pending' && !isDone) || 
                      (filterOption1 === 'done' && isDone);

                    const matchesAssignee = supportAssigneeFilter === 'all' || 
                      (t.assignedStaffEmail && t.assignedStaffEmail.toLowerCase() === loggedInEmail);

                    return matchesSearch && matchesStatus && matchesAssignee;
                  });

                  const sorted = sortData(filtered);
                  const paginated = sorted.slice((currentPage - 1) * 10, currentPage * 10);

                  if (filtered.length === 0) {
                    return renderEmptyState("Không tìm thấy ticket phù hợp.");
                  }

                  return (
                    <>
                      <table className="cyber-table">
                        <thead>
                          <tr>
                            {renderSortableHeader("ID", "id")}
                            {renderSortableHeader("Email khách", "customerEmail")}
                            {renderSortableHeader("Nội dung", "content")}
                            {renderSortableHeader("Nhân viên xử lý", "assignedStaffEmail")}
                            {renderSortableHeader("Ngày gửi", "createdAt")}
                            {renderSortableHeader("Trạng thái", "status")}
                            <th>Thao tác</th>
                          </tr>
                        </thead>
                        <tbody>
                          {paginated.map((t) => {
                            const isDone = t.status === 'Đã trả lời';
                            const isReplying = activeReplySupportId === t.id;
                            return (
                              <Fragment key={t.id}>
                                <tr>
                                  <td className="monospace-id">#{t.id}</td>
                                  <td className="font-semibold text-slate-200">{t.customerEmail}</td>
                                  <td style={{ maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={t.content}>
                                    {t.content}
                                  </td>
                                  <td className="text-indigo-400 text-xs font-semibold">
                                    {t.assignedStaffEmail || 'Chưa phân phối'}
                                  </td>
                                  <td className="text-zinc-500 text-xs">{formatDate(t.createdAt)}</td>
                                  <td>
                                    {isDone ? (
                                      <span className="status-badge badge-done">Đã trả lời</span>
                                    ) : (
                                      <span className="status-badge badge-pending">Chưa trả lời</span>
                                    )}
                                  </td>
                                  <td>
                                    <button
                                      type="button"
                                      className="btn-table-action btn-table-action-primary"
                                      onClick={() => {
                                        if (isReplying) {
                                          setActiveReplySupportId(null);
                                        } else {
                                          setActiveReplySupportId(t.id);
                                          setSupportReplyText(t.reply || '');
                                        }
                                      }}
                                    >
                                      {isDone ? "Xem" : "Trả lời"}
                                    </button>
                                  </td>
                                </tr>
                                {isReplying && (
                                  <tr key={`reply-${t.id}`}>
                                    <td colSpan={7} className="table-expanded-row-cell">
                                      <div className="reply-box">
                                        <div className="reply-title">
                                          Trả lời tới: <span>{t.customerEmail}</span>
                                        </div>
                                        <textarea
                                          rows={4}
                                          value={supportReplyText}
                                          onChange={(e) => setSupportReplyText(e.target.value)}
                                          className="reply-textarea"
                                          placeholder="Nhập nội dung phản hồi..."
                                          disabled={isDone || replyingSupportId === t.id}
                                        />
                                        {!isDone && (
                                          <div className="reply-actions">
                                            <button
                                              type="button"
                                              className="btn-cancel"
                                              disabled={replyingSupportId === t.id}
                                              onClick={() => setActiveReplySupportId(null)}
                                            >
                                              Hủy
                                            </button>
                                            <button
                                              type="button"
                                              className="btn-confirm"
                                              disabled={replyingSupportId === t.id}
                                              onClick={() => handleReplySupportTicket(t.id)}
                                            >
                                              {replyingSupportId === t.id ? "Đang gửi..." : "Xác nhận gửi"}
                                            </button>
                                          </div>
                                        )}
                                      </div>
                                    </td>
                                  </tr>
                                )}
                              </Fragment>
                            );
                          })}
                        </tbody>
                      </table>
                      {renderPagination(filtered.length)}
                    </>
                  );
                })()}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Nhật ký gửi Email CSKH</h3>
                </div>
                {renderSearchFilterBar("Tìm kiếm email theo tiêu đề, nội dung, email...", [
                  {
                    value: filterOption1,
                    onChange: setFilterOption1,
                    options: [
                      { value: '', label: 'Tất cả người gửi' },
                      { value: 'Staff', label: 'Nhân viên (Staff)' },
                      { value: 'Admin', label: 'Quản trị viên (Admin)' }
                    ]
                  }
                ])}
                <div className="data-table-container">
                  {supportLoading ? (
                    renderLoadingState("Đang tải dữ liệu yêu cầu...")
                  ) : cskhHistory.length === 0 ? (
                    renderEmptyState("Chưa có email CSKH nào được gửi.")
                  ) : (() => {
                    const filtered = cskhHistory.filter(h => {
                      const email = h.customer_email || h.email_customer || h.customerEmail || "khachhang_an_danh@gmail.com";
                      const subject = h.subject || h.Subject || '(Không có tiêu đề)';
                      const sender = h.sender_role || h.senderRole || 'Staff';

                      const matchesSearch = !searchTerm ||
                        email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        h.content.toLowerCase().includes(searchTerm.toLowerCase());

                      const matchesSender = !filterOption1 || sender === filterOption1;

                      return matchesSearch && matchesSender;
                    });

                    const sorted = sortData(filtered);
                    const paginated = sorted.slice((currentPage - 1) * 10, currentPage * 10);

                    if (filtered.length === 0) {
                      return renderEmptyState("Không tìm thấy email CSKH phù hợp.");
                    }

                    return (
                      <>
                        <table className="cyber-table">
                          <thead>
                            <tr>
                              {renderSortableHeader("ID", "id")}
                              {renderSortableHeader("Email khách", "customerEmail")}
                              {renderSortableHeader("Tiêu đề", "subject")}
                              {renderSortableHeader("Người gửi", "senderRole")}
                              {renderSortableHeader("Ngày gửi", "createdAt")}
                              <th>Thao tác</th>
                            </tr>
                          </thead>
                          <tbody>
                            {paginated.map((h) => {
                              const email = h.customer_email || h.email_customer || h.customerEmail || "khachhang_an_danh@gmail.com";
                              const created = h.createdAt || h.created_at || '';
                              const subject = h.subject || h.Subject || '(Không có tiêu đề)';
                              const sender = h.sender_role || h.senderRole || 'Staff';
                              const isViewing = activeViewCskhId === h.id;

                              return (
                                <Fragment key={h.id}>
                                  <tr>
                                    <td className="monospace-id">#{h.id}</td>
                                    <td className="font-semibold text-slate-200">{email}</td>
                                    <td className="max-w-[200px] truncate" title={subject}>{subject}</td>
                                    <td className="font-semibold text-indigo-400">{sender}</td>
                                    <td className="text-zinc-500 text-xs">{formatDate(created)}</td>
                                    <td>
                                      <button
                                        type="button"
                                        className="btn-table-action btn-table-action-cyan"
                                        onClick={() => {
                                          if (isViewing) {
                                            setActiveViewCskhId(null);
                                          } else {
                                            setActiveViewCskhId(h.id);
                                          }
                                        }}
                                      >
                                        {isViewing ? "Đóng" : "Xem"}
                                      </button>
                                    </td>
                                  </tr>
                                  {isViewing && (
                                    <tr key={`view-${h.id}`}>
                                      <td colSpan={6} className="table-expanded-row-cell">
                                        <div className="reply-box">
                                          <div className="reply-title reply-title-subject">
                                            Tiêu đề: <span>{subject}</span>
                                          </div>
                                          <div className="text-zinc-400 text-xs mb-2">
                                            Người gửi: <span className="font-semibold text-zinc-200">{sender}</span> | Gửi tới: <span className="font-semibold text-zinc-200">{email}</span>
                                          </div>
                                          <div className="cskh-view-content" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                                            {h.content}
                                          </div>
                                          <div className="mt-3 text-right">
                                            <button
                                              type="button"
                                              className="btn-cancel px-3 py-1.5 text-xs"
                                              onClick={() => setActiveViewCskhId(null)}
                                            >
                                              Đóng
                                            </button>
                                          </div>
                                        </div>
                                      </td>
                                    </tr>
                                  )}
                                </Fragment>
                              );
                            })}
                          </tbody>
                        </table>
                        {renderPagination(filtered.length)}
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>
          )}
        </section>
      )}

      {activeSubTab === 'feedback' && (
        <section className="space-y-6">
          <div className="section-header">
            <h2 className="section-title">Quản lý Đánh giá</h2>
            <p className="section-subtitle">Danh sách feedback khách hàng gửi cho ứng dụng.</p>
          </div>

          {renderSearchFilterBar("Tìm kiếm đánh giá theo email, bình luận...", [
            {
              value: filterOption1,
              onChange: setFilterOption1,
              options: [
                { value: '', label: 'Tất cả mức sao' },
                { value: '5', label: '⭐ 5 sao' },
                { value: '4', label: '⭐ 4 sao' },
                { value: '3', label: '⭐ 3 sao' },
                { value: '2', label: '⭐ 2 sao' },
                { value: '1', label: '⭐ 1 sao' }
              ]
            }
          ])}

          <div className="data-table-container">
            {feedbacksLoading ? (
              renderLoadingState("Đang tải dữ liệu đánh giá...")
            ) : feedbacks.length === 0 ? (
              renderEmptyState("Chưa có đánh giá nào.")
            ) : (() => {
              const filtered = feedbacks.filter(f => {
                const matchesSearch = !searchTerm ||
                  f.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  f.comment?.toLowerCase().includes(searchTerm.toLowerCase());

                const matchesStars = !filterOption1 || f.rating === Number(filterOption1);

                return matchesSearch && matchesStars;
              });

              const sorted = sortData(filtered);
              const paginated = sorted.slice((currentPage - 1) * 10, currentPage * 10);

              if (filtered.length === 0) {
                return renderEmptyState("Không tìm thấy đánh giá phù hợp.");
              }

              return (
                <>
                  <table className="cyber-table">
                    <thead>
                      <tr>
                        {renderSortableHeader("ID", "id")}
                        {renderSortableHeader("Email", "email")}
                        {renderSortableHeader("Số sao", "rating")}
                        {renderSortableHeader("Bình luận", "comment")}
                        {renderSortableHeader("Ngày gửi", "createdAt")}
                      </tr>
                    </thead>
                    <tbody>
                      {paginated.map((f) => (
                        <tr key={f.id}>
                          <td className="monospace-id">{f.id}</td>
                          <td className="font-semibold text-slate-200">{f.email}</td>
                          <td className="font-bold text-amber-400">{renderStars(f.rating)}</td>
                          <td>{f.comment}</td>
                          <td className="text-zinc-500 text-xs">{formatDate(f.createdAt)}</td>
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

      {/* Floating compose button */}
      {activeSubTab === 'support' && !isComposeOpen && (
        <button 
          type="button" 
          className="gmail-compose-trigger"
          title="Soạn thư mới"
          onClick={() => {
            handleCancelCskhReply();
            setIsComposeOpen(true);
            setIsComposeMinimized(false);
          }}
        >
          <svg fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
        </button>
      )}

      {/* Gmail Compose box */}
      {isComposeOpen && (
        <div className={`gmail-compose-box ${isComposeMinimized ? 'minimized' : ''}`}>
          <div className="gmail-compose-header" onClick={() => setIsComposeMinimized(!isComposeMinimized)}>
            <span>{selectedCskhTicketId ? `Trả lời Ticket #${selectedCskhTicketId}` : 'Thư mới'}</span>
            <div className="gmail-compose-header-actions" onClick={(e) => e.stopPropagation()}>
              <button type="button" className="gmail-compose-header-btn" onClick={() => setIsComposeMinimized(!isComposeMinimized)}>
                {isComposeMinimized ? (
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" /></svg>
                ) : (
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
                )}
              </button>
              <button type="button" className="gmail-compose-header-btn" onClick={handleCancelCskhReply}>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          </div>
          {!isComposeMinimized && (
            <>
              <div className="gmail-compose-body">
                <div className="gmail-compose-field">
                  <label htmlFor="compose-to">Tới:</label>
                  <input
                    id="compose-to"
                    type="email"
                    value={cskhEmail}
                    onChange={(e) => setCskhEmail(e.target.value)}
                    placeholder="khachhang@gmail.com"
                    disabled={isSendingCskhEmail}
                  />
                </div>
                <div className="gmail-compose-field">
                  <label htmlFor="compose-subject">Tiêu đề:</label>
                  <input
                    id="compose-subject"
                    type="text"
                    value={cskhSubject}
                    onChange={(e) => setCskhSubject(e.target.value)}
                    placeholder="Tiêu đề phản hồi..."
                    disabled={isSendingCskhEmail}
                  />
                </div>
                <textarea
                  id="cskh-content"
                  className="gmail-compose-textarea"
                  value={cskhContent}
                  onChange={(e) => setCskhContent(e.target.value)}
                  placeholder="Nhập nội dung thư hỗ trợ ở đây..."
                  disabled={isSendingCskhEmail}
                />
              </div>
              <div className="gmail-compose-footer">
                <button
                  type="button"
                  className="gmail-compose-send-btn"
                  disabled={isSendingCskhEmail}
                  onClick={handleSendCskhEmail}
                >
                  {isSendingCskhEmail ? "Đang gửi..." : "Gửi"}
                </button>
                <button
                  type="button"
                  className="gmail-compose-discard-btn"
                  disabled={isSendingCskhEmail}
                  onClick={handleCancelCskhReply}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
