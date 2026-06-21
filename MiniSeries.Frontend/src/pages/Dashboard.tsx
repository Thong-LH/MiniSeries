import { useState, useEffect, Fragment } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import './Dashboard.css';

interface CustomerProfile {
  id: string;
  fullName: string;
  email: string;
  tokenBalance: number;
  planName: string;
  accountStatus: string;
  createdAt: string;
  role: string;
  mangaLimit?: number;
  usedManga?: number;
  videoLimit?: number;
  usedVideo?: number;
}

interface SupportTicket {
  id: string;
  customerEmail: string;
  content: string;
  createdAt: string;
  status: string;
  reply?: string;
}

interface CskhMessage {
  id: string;
  customer_email?: string;
  email_customer?: string;
  customerEmail?: string;
  subject?: string;
  Subject?: string;
  content: string;
  createdAt?: string;
  created_at?: string;
  status?: string;
  reply?: string;
  sender_role?: string;
  senderRole?: string;
}

interface FeedbackItem {
  id: string;
  email: string;
  rating: number;
  comment: string;
  createdAt: string;
}

interface StaffReport {
  id: string;
  staffName: string;
  content: string;
  status: string;
  adminReply?: string;
  createdAt: string;
}

interface PaymentHistory {
  id: string;
  transactionCode: string;
  userEmail: string;
  amount: number;
  createdAt: string;
}

interface RevenueStats {
  labels: string[];
  amounts: number[];
  totalRevenue: number;
  transactionCount: number;
}

export default function Dashboard() {
  const navigate = useNavigate();

  // Auth info
  const [userRole, setUserRole] = useState<string>('');
  const [userName, setUserName] = useState<string>('');
  const [authChecked, setAuthChecked] = useState<boolean>(false);

  // UI States
  const [activeTab, setActiveTab] = useState<string>('content');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    show: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  // Section Data
  const [customers, setCustomers] = useState<CustomerProfile[]>([]);
  const [customersLoading, setCustomersLoading] = useState<boolean>(false);

  const [tokenSummary, setTokenSummary] = useState<{
    totalTokens: number;
    plusPackageCount: number;
    proMaxPackageCount: number;
  }>({ totalTokens: 0, plusPackageCount: 0, proMaxPackageCount: 0 });
  const [tokenUsers, setTokenUsers] = useState<CustomerProfile[]>([]);
  const [tokensLoading, setTokensLoading] = useState<boolean>(false);
  const [editingTokenUser, setEditingTokenUser] = useState<CustomerProfile | null>(null);
  const [mangaDelta, setMangaDelta] = useState<number>(0);
  const [videoDelta, setVideoDelta] = useState<number>(0);
  const [tokenPlan, setTokenPlan] = useState<string>('Free');

  const [supportTab, setSupportTab] = useState<'support-tickets' | 'cskh-emails'>('support-tickets');
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([]);
  const [cskhHistory, setCskhHistory] = useState<CskhMessage[]>([]);
  const [supportLoading, setSupportLoading] = useState<boolean>(false);

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

  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [feedbacksLoading, setFeedbacksLoading] = useState<boolean>(false);

  const [staffReports, setStaffReports] = useState<StaffReport[]>([]);
  const [staffReportContent, setStaffReportContent] = useState<string>('');
  const [reportsLoading, setReportsLoading] = useState<boolean>(false);

  const [adminReports, setAdminReports] = useState<StaffReport[]>([]);
  const [adminReplies, setAdminReplies] = useState<Record<string, string>>({});

  const [payments, setPayments] = useState<PaymentHistory[]>([]);
  const [paymentsLoading, setPaymentsLoading] = useState<boolean>(false);

  const [revenueStats, setRevenueStats] = useState<RevenueStats | null>(null);
  const [revenueLoading, setRevenueLoading] = useState<boolean>(false);

  const [staffs, setStaffs] = useState<CustomerProfile[]>([]);
  const [staffsLoading, setStaffsLoading] = useState<boolean>(false);
  const [isStaffModalOpen, setIsStaffModalOpen] = useState<boolean>(false);
  const [newStaffName, setNewStaffName] = useState<string>('');
  const [newStaffEmail, setNewStaffEmail] = useState<string>('');
  const [newStaffPassword, setNewStaffPassword] = useState<string>('');
  const [creatingStaff, setCreatingStaff] = useState<boolean>(false);

  // Search, Filter & Pagination states
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterOption1, setFilterOption1] = useState<string>('');
  const [filterOption2, setFilterOption2] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Sorting states
  const [sortColumn, setSortColumn] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Reset states on activeTab or supportTab changes
  useEffect(() => {
    setSearchTerm('');
    setFilterOption1('');
    setFilterOption2('');
    setCurrentPage(1);
    setSortColumn('');
    setSortDirection('desc');
  }, [activeTab, supportTab]);

  // Sorting helper handler
  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  };

  // UI Helper for sortable headers
  const renderSortableHeader = (label: string, field: string) => {
    const isCurrent = sortColumn === field;
    return (
      <th 
        onClick={() => handleSort(field)} 
        className="sortable-header"
        style={{ cursor: 'pointer', userSelect: 'none' }}
      >
        <div className="flex items-center gap-1">
          {label}
          <span className={`sort-arrow ${isCurrent ? 'active' : ''}`} style={{ fontSize: '10px', opacity: isCurrent ? 1 : 0.4 }}>
            {isCurrent ? (sortDirection === 'asc' ? ' ▲' : ' ▼') : ' ↕'}
          </span>
        </div>
      </th>
    );
  };

  // Generic data sorting utility
  const sortData = <T extends Record<string, any>>(data: T[]): T[] => {
    if (!sortColumn) return data;
    return [...data].sort((a, b) => {
      let valA = a[sortColumn];
      let valB = b[sortColumn];

      // Handle inconsistent API naming formats
      if (sortColumn === 'customerEmail') {
        valA = a.customerEmail ?? a.customer_email ?? a.email_customer;
        valB = b.customerEmail ?? b.customer_email ?? b.email_customer;
      } else if (sortColumn === 'createdAt') {
        valA = a.createdAt ?? a.created_at;
        valB = b.createdAt ?? b.created_at;
      } else if (sortColumn === 'subject') {
        valA = a.subject ?? a.Subject;
        valB = b.subject ?? b.Subject;
      } else if (sortColumn === 'senderRole') {
        valA = a.senderRole ?? a.sender_role;
        valB = b.senderRole ?? b.sender_role;
      }

      if (valA === undefined || valA === null) return 1;
      if (valB === undefined || valB === null) return -1;

      // Handle numbers
      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortDirection === 'asc' ? valA - valB : valB - valA;
      }

      // Handle strings/dates
      const strA = String(valA);
      const strB = String(valB);

      // Check if it's a valid date string
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

  // UI Helper for Search & Filter Bar
  const renderSearchFilterBar = (
    placeholder: string,
    filters?: {
      value: string;
      onChange: (val: string) => void;
      options: { value: string; label: string }[];
    }[]
  ) => {
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
            <button
              type="button"
              className="clear-search-btn"
              onClick={() => {
                setSearchTerm('');
                setCurrentPage(1);
              }}
            >
              &times;
            </button>
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
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // UI Helper for Pagination
  const renderPagination = (totalItems: number, itemsPerPage: number = 10) => {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    if (totalPages <= 1) return null;

    const pages: number[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) {
        pages.push(-1); // ellipsis
      }
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) {
        if (!pages.includes(i)) pages.push(i);
      }
      if (currentPage < totalPages - 2) {
        pages.push(-2); // ellipsis
      }
      if (!pages.includes(totalPages)) pages.push(totalPages);
    }

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
          {pages.map((p, idx) => {
            if (p < 0) {
              return <span key={`ellipsis-${idx}`} className="pagination-ellipsis">...</span>;
            }
            return (
              <button
                key={p}
                type="button"
                className={`btn-pagination-page ${currentPage === p ? 'active' : ''}`}
                onClick={() => setCurrentPage(p)}
              >
                {p}
              </button>
            );
          })}
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

  // 1. Starfield Background effect removed

  // 2. Auth checking & Session loading
  useEffect(() => {
    const role = localStorage.getItem("userRole") || localStorage.getItem("user_role");
    const name = localStorage.getItem("user_name") || "User";
    const token = localStorage.getItem("token") || "";

    if (!token || !role || (role !== "Admin" && role !== "Staff")) {
      alert("Bạn không có quyền truy cập khu vực quản trị!");
      navigate('/login', { replace: true });
      return;
    }

    setUserRole(role);
    setUserName(name);
    setAuthChecked(true);
  }, [navigate]);

  // 3. Load tab data
  useEffect(() => {
    if (!authChecked) return;

    if (activeTab === 'customers') loadCustomers();
    else if (activeTab === 'tokens') loadTokens();
    else if (activeTab === 'support') loadSupportData();
    else if (activeTab === 'feedback') loadFeedbacks();
    else if (activeTab === 'reports-staff') loadStaffReports();
    else if (activeTab === 'reports-admin') loadAdminReports();
    else if (activeTab === 'payments') loadPaymentHistory();
    else if (activeTab === 'revenue') loadRevenueStats();
    else if (activeTab === 'staff') loadStaffs();
  }, [activeTab, authChecked]);

  // Toast Helper
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Confirm Dialog Helper
  const showConfirm = (message: string, onConfirm: () => void, title: string = 'Xác nhận') => {
    setConfirmModal({
      show: true,
      title,
      message,
      onConfirm: () => {
        onConfirm();
        setConfirmModal(null);
      }
    });
  };

  // --- API Load Callbacks ---

  const loadCustomers = async () => {
    if (customers.length === 0) setCustomersLoading(true);
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
    if (tokenUsers.length === 0) setTokensLoading(true);
    try {
      const [summary, users] = await Promise.all([
        api.adminGetTokenSummary(),
        api.adminGetTokenUsers()
      ]);
      setTokenSummary({
        totalTokens: summary.totalTokensIssued ?? summary.totalTokens ?? 0,
        plusPackageCount: summary.plusPackageCount ?? summary.totalPlus ?? 0,
        proMaxPackageCount: summary.proMaxPackageCount ?? summary.totalProMax ?? 0
      });
      setTokenUsers(Array.isArray(users) ? users : []);
    } catch (err: any) {
      showToast(err.message || 'Không thể tải dữ liệu token', 'error');
    } finally {
      setTokensLoading(false);
    }
  };

  const loadSupportData = async () => {
    if (supportTickets.length === 0 && cskhHistory.length === 0) setSupportLoading(true);
    try {
      const [tickets, history] = await Promise.all([
        api.supportGetList(),
        api.cskhGetHistory()
      ]);
      setSupportTickets(Array.isArray(tickets) ? tickets : []);
      setCskhHistory(Array.isArray(history) ? history : []);
    } catch (err: any) {
      showToast(err.message || 'Không thể tải phiếu yêu cầu hỗ trợ', 'error');
    } finally {
      setSupportLoading(false);
    }
  };

  const loadFeedbacks = async () => {
    if (feedbacks.length === 0) setFeedbacksLoading(true);
    try {
      const data = await api.feedbackGetList();
      setFeedbacks(Array.isArray(data) ? data : []);
    } catch (err: any) {
      showToast(err.message || 'Không thể tải danh sách đánh giá', 'error');
    } finally {
      setFeedbacksLoading(false);
    }
  };

  const loadStaffReports = async () => {
    if (staffReports.length === 0) setReportsLoading(true);
    try {
      const data = await api.reportGetList();
      setStaffReports(Array.isArray(data) ? data : []);
    } catch (err: any) {
      showToast(err.message || 'Không thể tải danh sách báo cáo', 'error');
    } finally {
      setReportsLoading(false);
    }
  };

  const loadAdminReports = async () => {
    if (adminReports.length === 0) setReportsLoading(true);
    try {
      const data = await api.reportGetList();
      setAdminReports(Array.isArray(data) ? data : []);
    } catch (err: any) {
      showToast(err.message || 'Không thể tải danh sách báo cáo nhân viên', 'error');
    } finally {
      setReportsLoading(false);
    }
  };

  const loadPaymentHistory = async () => {
    if (payments.length === 0) setPaymentsLoading(true);
    try {
      const data = await api.adminGetPaymentHistory();
      setPayments(Array.isArray(data) ? data : []);
    } catch (err: any) {
      showToast(err.message || 'Không thể tải lịch sử thanh toán', 'error');
    } finally {
      setPaymentsLoading(false);
    }
  };

  const loadRevenueStats = async () => {
    if (!revenueStats) setRevenueLoading(true);
    try {
      const data = await api.adminGetPaymentStats('month');
      setRevenueStats(data);
    } catch (err: any) {
      showToast(err.message || 'Không thể tải biểu đồ doanh thu', 'error');
    } finally {
      setRevenueLoading(false);
    }
  };

  const loadStaffs = async () => {
    if (staffs.length === 0) setStaffsLoading(true);
    try {
      const data = await api.adminGetStaffs();
      setStaffs(Array.isArray(data) ? data : []);
    } catch (err: any) {
      showToast(err.message || 'Không thể tải danh sách nhân viên', 'error');
    } finally {
      setStaffsLoading(false);
    }
  };

  // --- ACTIONS ---

  const handleLogout = () => {
    showConfirm("Bạn có chắc chắn muốn đăng xuất không?", () => {
      localStorage.clear();
      navigate('/login', { replace: true });
    }, "Đăng xuất");
  };

  // Customers Management Actions
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

  // Staff Management Actions
  const handleToggleBlockStaff = async (staffId: string, isBlocked: boolean) => {
    const action = isBlocked ? "mở khóa" : "khóa";
    showConfirm(`Bạn có chắc chắn muốn ${action} tài khoản nhân viên này?`, async () => {
      try {
        await api.adminToggleBlockStaff(staffId);
        showToast(`Đã ${isBlocked ? 'mở khóa' : 'khóa'} tài khoản nhân viên thành công!`);
        loadStaffs();
      } catch (err: any) {
        showToast(err.message || 'Thao tác thất bại', 'error');
      }
    }, isBlocked ? "Mở khóa nhân viên" : "Khóa nhân viên");
  };

  const handleDeleteStaff = async (staffId: string) => {
    showConfirm("Bạn có chắc chắn muốn xóa vĩnh viễn tài khoản nhân viên này?", async () => {
      try {
        await api.adminDeleteStaff(staffId);
        showToast('Đã xóa tài khoản nhân viên thành công!');
        loadStaffs();
      } catch (err: any) {
        showToast(err.message || 'Không thể xóa tài khoản nhân viên', 'error');
      }
    }, "Xóa nhân viên");
  };

  const handleCreateStaffSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffName.trim() || !newStaffEmail.trim() || !newStaffPassword.trim()) {
      showToast('Vui lòng nhập đầy đủ thông tin.', 'error');
      return;
    }
    setCreatingStaff(true);
    try {
      await api.adminCreateStaff({
        fullName: newStaffName,
        email: newStaffEmail,
        password: newStaffPassword
      });
      showToast('Đã tạo tài khoản Staff thành công!');
      setIsStaffModalOpen(false);
      setNewStaffName('');
      setNewStaffEmail('');
      setNewStaffPassword('');
      loadStaffs();
    } catch (err: any) {
      showToast(err.message || 'Lỗi tạo tài khoản Staff', 'error');
    } finally {
      setCreatingStaff(false);
    }
  };

  // Token Management actions
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

  // Support actions
  const handleReplySupportTicket = async (ticketId: string) => {
    const reply = supportReplyText.trim();
    if (!reply) {
      alert("Vui lòng nhập nội dung phản hồi.");
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
      alert("Vui lòng nhập đầy đủ địa chỉ nhận và nội dung phản hồi!");
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

  // Staff Reports Actions
  const handleCreateReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const content = staffReportContent.trim();
    if (!content) {
      showToast('Vui lòng nhập nội dung báo cáo.', 'error');
      return;
    }
    try {
      await api.reportCreate(content);
      showToast('Đã gửi báo cáo lên Admin.');
      setStaffReportContent('');
      loadStaffReports();
    } catch (err: any) {
      showToast(err.message || 'Gửi báo cáo thất bại', 'error');
    }
  };

  // Admin Reports Actions
  const handleReplyReport = async (reportId: string) => {
    const reply = (adminReplies[reportId] || '').trim();
    if (!reply) {
      showToast('Vui lòng nhập nội dung phản hồi.', 'error');
      return;
    }
    try {
      await api.reportReply(reportId, reply);
      showToast('Gửi phản hồi báo cáo thành công!');
      setAdminReplies(prev => ({ ...prev, [reportId]: '' }));
      loadAdminReports();
    } catch (err: any) {
      showToast(err.message || 'Gửi phản hồi thất bại', 'error');
    }
  };

  // Helper formatting functions
  const formatDate = (value?: string) => {
    if (!value) return '—';
    const d = new Date(value);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleString('vi-VN');
  };

  const formatVnd = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const renderStars = (rating: number) => {
    const count = Math.max(0, Math.min(5, rating || 0));
    return "⭐".repeat(count) + "☆".repeat(5 - count);
  };

  // SVG Area/Line Chart Renderer for Revenue
  const renderRevenueChart = () => {
    if (!revenueStats || !revenueStats.amounts || revenueStats.amounts.length === 0) {
      return (
        <div className="flex h-64 items-center justify-center text-slate-400">
          Chưa có dữ liệu biểu đồ doanh thu.
        </div>
      );
    }

    const { labels, amounts } = revenueStats;
    const maxVal = Math.max(...amounts, 100000); // minimum scale peak
    
    // Graph sizing details
    const width = 800;
    const height = 300;
    const paddingLeft = 90;
    const paddingRight = 30;
    const paddingTop = 30;
    const paddingBottom = 40;

    const plotWidth = width - paddingLeft - paddingRight;
    const plotHeight = height - paddingTop - paddingBottom;

    // Build data point coordinates
    const points = amounts.map((val, i) => {
      const x = paddingLeft + (i * plotWidth) / Math.max(1, labels.length - 1);
      const y = paddingTop + plotHeight - (val / maxVal) * plotHeight;
      return { x, y, value: val, label: labels[i] };
    });

    // Make paths
    const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    
    const areaPath = points.length > 0 
      ? `${linePath} L ${points[points.length - 1].x} ${paddingTop + plotHeight} L ${points[0].x} ${paddingTop + plotHeight} Z`
      : '';

    // Y axis divisions (5 ticks)
    const yTicks = Array.from({ length: 5 }, (_, i) => {
      const val = (maxVal * i) / 4;
      const y = paddingTop + plotHeight - (val / maxVal) * plotHeight;
      return { val, y };
    });

    return (
      <div className="relative overflow-x-auto">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto max-w-4xl mx-auto block">
          <defs>
            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines & Y Axis Labels */}
          {yTicks.map((tick, idx) => (
            <g key={idx}>
              <line 
                x1={paddingLeft} 
                y1={tick.y} 
                x2={width - paddingRight} 
                y2={tick.y} 
                stroke="#1e293b" 
                strokeDasharray="4 4" 
              />
              <text 
                x={paddingLeft - 15} 
                y={tick.y + 4} 
                fill="#94a3b8" 
                fontSize="11" 
                textAnchor="end"
                className="font-medium"
              >
                {formatVnd(tick.val)}
              </text>
            </g>
          ))}

          {/* Fill Area Chart */}
          {areaPath && (
            <path d={areaPath} fill="url(#chartGradient)" />
          )}

          {/* Chart Line */}
          {linePath && (
            <path 
              d={linePath} 
              fill="none" 
              stroke="#6366f1" 
              strokeWidth="2.5" 
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Data Nodes */}
          {points.map((p, idx) => (
            <g key={idx} className="group cursor-pointer">
              <circle 
                cx={p.x} 
                cy={p.y} 
                r="5" 
                fill="#0f172a" 
                stroke="#6366f1" 
                strokeWidth="2" 
                className="transition-all duration-200 hover:scale-125"
              />
              {/* Tooltip on Hover */}
              <title>{`${p.label}: ${formatVnd(p.value)}`}</title>
            </g>
          ))}

          {/* X Axis Labels */}
          {points.map((p, idx) => (
            <text 
              key={idx}
              x={p.x} 
              y={height - 10} 
              fill="#94a3b8" 
              fontSize="11" 
              textAnchor="middle"
              className="font-medium"
            >
              {p.label}
            </text>
          ))}

          {/* Bottom baseline */}
          <line 
            x1={paddingLeft} 
            y1={paddingTop + plotHeight} 
            x2={width - paddingRight} 
            y2={paddingTop + plotHeight} 
            stroke="#475569" 
            strokeWidth="1.5"
          />
        </svg>
      </div>
    );
  };

  if (!authChecked) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0b0f19] text-slate-300 font-bold">
        Đang kiểm tra quyền truy cập...
      </div>
    );
  }

  // Calculate customer metrics
  const blockedCustomers = customers.filter(c => c.accountStatus?.toLowerCase() === 'blocked').length;
  const offlineCustomers = customers.length; // online count is 0 based on backend code

  // Calculate staff metrics
  const blockedStaffs = staffs.filter(s => s.accountStatus?.toLowerCase() === 'blocked').length;
  const offlineStaffs = staffs.length;

  return (
    <div className="dashboard-container">
      <aside className="dashboard-sidebar">
        <div>
          <div className="sidebar-logo" onClick={() => window.location.reload()}>
            <span>Mini Series</span> <span className="brand-accent">Learning</span>
          </div>
          <p className="text-xs text-slate-500 mb-6 font-medium px-2">Bảng điều khiển nội bộ</p>

          <div className="nav-section-title">Chung</div>
          <nav className="sidebar-nav">
            <div 
              className={`sidebar-item ${activeTab === 'content' ? 'active' : ''}`}
              onClick={() => setActiveTab('content')}
            >
              <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" /></svg>
              Quản lý nội dung
            </div>
            <div 
              className={`sidebar-item ${activeTab === 'customers' ? 'active' : ''}`}
              onClick={() => setActiveTab('customers')}
            >
              <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>
              Quản lý Khách hàng
            </div>
            <div 
              className={`sidebar-item ${activeTab === 'tokens' ? 'active' : ''}`}
              onClick={() => setActiveTab('tokens')}
            >
              <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 5.625c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" /></svg>
              Quản lý Hạn ngạch
            </div>
            <div 
              className={`sidebar-item ${activeTab === 'support' ? 'active' : ''}`}
              onClick={() => setActiveTab('support')}
            >
              <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.084.29.125.597.125.911v5.777c0 2.002-1.63 3.63-3.63 3.63H9.122a18.14 18.14 0 01-3.622-.361 4.003 4.003 0 00-2.51 2.037L2.25 21v-3.75a4.002 4.002 0 014-4h10.25A4.002 4.002 0 0120.25 9.25V8.51zM10.5 8.25h5.25m-5.25 3.5h7.5m-7.5 3.5h7.5" /></svg>
              Hỗ trợ khách hàng
            </div>
            <div 
              className={`sidebar-item ${activeTab === 'feedback' ? 'active' : ''}`}
              onClick={() => setActiveTab('feedback')}
            >
              <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499c.15-.427.77-.427.92 0l1.97 5.517c.06.18.22.3.4.3l5.803.05c.45.004.63.57.27.844l-4.76 3.6c-.14.1-.2.29-.15.464l1.83 5.4c.14.42-.33.77-.69.5l-4.72-3.4c-.16-.12-.38-.12-.54 0l-4.72 3.4c-.36.27-.83-.08-.69-.5l1.83-5.4c.05-.17-.01-.36-.15-.464l-4.76-3.6c-.36-.27-.18-.84.27-.844l5.803-.05c.18-.01.34-.12.4-.3l1.97-5.517z" /></svg>
              Quản lý Đánh giá
            </div>
            {userRole === 'Staff' && (
              <div 
                className={`sidebar-item ${activeTab === 'reports-staff' ? 'active' : ''}`}
                onClick={() => setActiveTab('reports-staff')}
              >
                <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
                Báo cáo công việc
              </div>
            )}
          </nav>

          {userRole === 'Admin' && (
            <>
              <div className="nav-section-title">Quản trị hệ thống</div>
              <nav className="sidebar-nav">
                <div 
                  className={`sidebar-item ${activeTab === 'payments' ? 'active' : ''}`}
                  onClick={() => setActiveTab('payments')}
                >
                  <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-5.25-9h16.5a1.5 1.5 0 011.5 1.5v9a1.5 1.5 0 01-1.5 1.5H3.75A1.5 1.5 0 012.25 18v-9a1.5 1.5 0 011.5-1.5z" /></svg>
                  Lịch sử thanh toán
                </div>
                <div 
                  className={`sidebar-item ${activeTab === 'revenue' ? 'active' : ''}`}
                  onClick={() => setActiveTab('revenue')}
                >
                  <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.281m5.94 2.28-2.28 5.941" /></svg>
                  Biểu đồ doanh thu
                </div>
                <div 
                  className={`sidebar-item ${activeTab === 'staff' ? 'active' : ''}`}
                  onClick={() => setActiveTab('staff')}
                >
                  <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" /></svg>
                  Quản lý Nhân viên
                </div>
                <div 
                  className={`sidebar-item ${activeTab === 'reports-admin' ? 'active' : ''}`}
                  onClick={() => setActiveTab('reports-admin')}
                >
                  <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" /></svg>
                  Xem Báo cáo
                </div>
              </nav>
            </>
          )}
        </div>

        <div className="sidebar-footer">
          <div className="user-info">
            <span className={`role-badge ${userRole?.toLowerCase() === 'admin' ? 'admin' : 'staff'}`}>
              {userRole}
            </span>
            <div className="user-name">
              Xin chào, <span>{userName}</span>
            </div>
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            Đăng xuất
          </button>
        </div>
      </aside>

      <main className="dashboard-main">
        {/* Content Section */}
        {activeTab === 'content' && (
          <section className="dashboard-fade-in space-y-6">
            <div className="section-header">
              <h2 className="section-title">Quản lý nội dung</h2>
              <p className="section-subtitle">Duyệt bài học, truyền Manga và MiniSeries do người dùng tạo.</p>
            </div>
            <div className="stat-card pending-content-card">
              <div className="flex items-center gap-3">
                <span className="pending-indicator-ping"></span>
                <p className="pending-content-text">
                  Danh sách nội dung đang chờ duyệt: <strong className="pending-content-count">8</strong> mục
                </p>
              </div>
            </div>
          </section>
        )}

        {/* Customers Section */}
        {activeTab === 'customers' && (
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
                <div className="stat-value">{Math.max(0, offlineCustomers - blockedCustomers)}</div>
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
                <div className="p-8 text-center text-slate-400">Đang tải danh sách khách hàng...</div>
              ) : customers.length === 0 ? (
                <div className="p-8 text-center text-slate-400">Chưa có khách hàng (Role = Customer) trên Supabase.</div>
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
                  return <div className="p-8 text-center text-slate-400">Không tìm thấy khách hàng phù hợp.</div>;
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

        {/* Tokens Section */}
        {activeTab === 'tokens' && (
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
                <div className="stat-value gold">
                  {tokenSummary.proMaxPackageCount}
                </div>
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
                <div className="p-8 text-center text-slate-400">Đang tải danh sách token...</div>
              ) : tokenUsers.length === 0 ? (
                <div className="p-8 text-center text-slate-400">Chưa có khách hàng nào.</div>
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
                  return <div className="p-8 text-center text-slate-400">Không tìm thấy người dùng phù hợp.</div>;
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

        {/* Support Section */}
        {activeTab === 'support' && (
          <section className="dashboard-fade-in space-y-6">
            <div className="section-header">
              <h2 className="section-title">Hỗ trợ khách hàng</h2>
              <p className="section-subtitle">Xem các yêu cầu tư vấn từ khách hàng và gửi mail phản hồi trực tiếp.</p>
            </div>

            {/* Sub-tab selection */}
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
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Phiếu yêu cầu tư vấn
                </h3>
                {renderSearchFilterBar("Tìm kiếm ticket theo email, nội dung...", [
                  {
                    value: filterOption1,
                    onChange: setFilterOption1,
                    options: [
                      { value: '', label: 'Tất cả trạng thái' },
                      { value: 'pending', label: 'Chưa trả lời' },
                      { value: 'done', label: 'Đã trả lời' }
                    ]
                  }
                ])}
                <div className="data-table-container">
                  {supportLoading ? (
                    <div className="p-8 text-center text-slate-400">Đang tải dữ liệu yêu cầu...</div>
                  ) : supportTickets.length === 0 ? (
                    <div className="p-8 text-center text-slate-400">Chưa có yêu cầu tư vấn nào.</div>
                  ) : (() => {
                    const filtered = supportTickets.filter(t => {
                      const matchesSearch = !searchTerm || 
                        t.customerEmail?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        t.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        (t.reply && t.reply.toLowerCase().includes(searchTerm.toLowerCase()));

                      const isDone = t.status === 'Đã trả lời';
                      const matchesStatus = !filterOption1 || 
                        (filterOption1 === 'pending' && !isDone) || 
                        (filterOption1 === 'done' && isDone);

                      return matchesSearch && matchesStatus;
                    });

                    const sorted = sortData(filtered);
                    const paginated = sorted.slice((currentPage - 1) * 10, currentPage * 10);

                    if (filtered.length === 0) {
                      return <div className="p-8 text-center text-slate-400">Không tìm thấy ticket phù hợp.</div>;
                    }

                    return (
                      <>
                        <table className="cyber-table">
                          <thead>
                            <tr>
                              {renderSortableHeader("ID", "id")}
                              {renderSortableHeader("Email khách", "customerEmail")}
                              {renderSortableHeader("Nội dung", "content")}
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
                                      <td colSpan={6} className="table-expanded-row-cell">
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
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Nhật ký gửi Email CSKH
                    </h3>
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
                      <div className="p-8 text-center text-slate-400">Đang tải dữ liệu yêu cầu...</div>
                    ) : cskhHistory.length === 0 ? (
                      <div className="p-8 text-center text-slate-500">Chưa có email CSKH nào được gửi.</div>
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
                        return <div className="p-8 text-center text-slate-400">Không tìm thấy email CSKH phù hợp.</div>;
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
                                            <div className="cskh-view-content">
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

        {/* Feedback Section */}
        {activeTab === 'feedback' && (
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
                <div className="p-8 text-center text-slate-400">Đang tải dữ liệu đánh giá...</div>
              ) : feedbacks.length === 0 ? (
                <div className="p-8 text-center text-slate-400">Chưa có đánh giá nào.</div>
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
                  return <div className="p-8 text-center text-slate-400">Không tìm thấy đánh giá phù hợp.</div>;
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

        {/* Staff Reports Section */}
        {activeTab === 'reports-staff' && (
          <section className="dashboard-fade-in space-y-6">
            <div className="section-header">
              <h2 className="section-title">Báo cáo công việc</h2>
              <p className="section-subtitle">Gửi báo cáo hàng ngày lên quản trị viên (Admin).</p>
            </div>

            <form onSubmit={handleCreateReportSubmit} className="report-form">
              <div className="report-form-group">
                <label className="report-form-label">Nội dung báo cáo</label>
                <textarea
                  rows={5}
                  value={staffReportContent}
                  onChange={(e) => setStaffReportContent(e.target.value)}
                  className="reply-textarea"
                  placeholder="Ví dụ: Hôm nay đã xử lý xong 5 phiếu hỗ trợ, còn lại 2 phiếu đang chờ duyệt..."
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="cyber-btn-primary"
                >
                  Gửi lên Admin
                </button>
              </div>
            </form>

            <div className="space-y-3">
              <h3 className="text-sm font-bold text-slate-400 uppercase px-1">Lịch sử báo cáo đã gửi</h3>
              {renderSearchFilterBar("Tìm kiếm báo cáo theo nội dung, phản hồi...", [
                {
                  value: filterOption1,
                  onChange: setFilterOption1,
                  options: [
                    { value: '', label: 'Tất cả trạng thái' },
                    { value: 'pending', label: 'Chờ duyệt' },
                    { value: 'completed', label: 'Đã hoàn thành' }
                  ]
                }
              ])}
              <div className="data-table-container">
                {reportsLoading ? (
                  <div className="p-8 text-center text-slate-400">Đang tải lịch sử báo cáo...</div>
                ) : staffReports.length === 0 ? (
                  <div className="p-8 text-center text-slate-400">Chưa có báo cáo nào.</div>
                ) : (() => {
                  const filtered = staffReports.filter(r => {
                    const matchesSearch = !searchTerm ||
                      r.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      (r.adminReply && r.adminReply.toLowerCase().includes(searchTerm.toLowerCase()));

                    const isCompleted = r.status === 'Đã hoàn thành' || Boolean(r.adminReply);
                    const matchesStatus = !filterOption1 ||
                      (filterOption1 === 'pending' && !isCompleted) ||
                      (filterOption1 === 'completed' && isCompleted);

                    return matchesSearch && matchesStatus;
                  });

                  const sorted = sortData(filtered);
                  const paginated = sorted.slice((currentPage - 1) * 10, currentPage * 10);

                  if (filtered.length === 0) {
                    return <div className="p-8 text-center text-slate-400">Không tìm thấy báo cáo phù hợp.</div>;
                  }

                  return (
                    <>
                      <table className="cyber-table">
                        <thead>
                          <tr>
                            {renderSortableHeader("Ngày gửi", "createdAt")}
                            {renderSortableHeader("Nội dung", "content")}
                            {renderSortableHeader("Trạng thái", "status")}
                            {renderSortableHeader("Phản hồi Admin", "adminReply")}
                          </tr>
                        </thead>
                        <tbody>
                          {paginated.map((r) => {
                            const isCompleted = r.status === 'Đã hoàn thành' || Boolean(r.adminReply);
                            return (
                              <tr key={r.id}>
                                <td className="text-zinc-500 text-xs whitespace-nowrap">
                                  {formatDate(r.createdAt)}
                                </td>
                                <td>{r.content}</td>
                                <td>
                                  {isCompleted ? (
                                    <span className="status-badge badge-done">Đã hoàn thành</span>
                                  ) : (
                                    <span className="status-badge badge-pending">Chờ duyệt</span>
                                  )}
                                </td>
                                <td className="italic text-slate-300">{r.adminReply || '—'}</td>
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
            </div>
          </section>
        )}

        {/* Admin Reports section */}
        {activeTab === 'reports-admin' && (
          <section className="dashboard-fade-in space-y-6">
            <div className="section-header">
              <h2 className="section-title">Xem Báo cáo nhân viên</h2>
              <p className="section-subtitle">Danh sách các báo cáo tiến độ công việc do Staff gửi lên.</p>
            </div>

            {renderSearchFilterBar("Tìm kiếm báo cáo theo nhân viên, nội dung...", [
              {
                value: filterOption1,
                onChange: setFilterOption1,
                options: [
                  { value: '', label: 'Tất cả trạng thái' },
                  { value: 'pending', label: 'Chờ duyệt' },
                  { value: 'completed', label: 'Đã hoàn thành' }
                ]
              }
            ])}

            <div className="data-table-container">
              {reportsLoading ? (
                <div className="p-8 text-center text-slate-400">Đang tải danh sách báo cáo...</div>
              ) : adminReports.length === 0 ? (
                <div className="p-8 text-center text-slate-400">Chưa có báo cáo nào.</div>
              ) : (() => {
                const filtered = adminReports.filter(r => {
                  const name = r.staffName || 'Staff';
                  const matchesSearch = !searchTerm ||
                    name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    r.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    (r.adminReply && r.adminReply.toLowerCase().includes(searchTerm.toLowerCase()));

                  const isCompleted = r.status === 'Đã hoàn thành' || Boolean(r.adminReply);
                  const matchesStatus = !filterOption1 ||
                    (filterOption1 === 'pending' && !isCompleted) ||
                    (filterOption1 === 'completed' && isCompleted);

                  return matchesSearch && matchesStatus;
                });

                const sorted = sortData(filtered);
                const paginated = sorted.slice((currentPage - 1) * 10, currentPage * 10);

                if (filtered.length === 0) {
                  return <div className="p-8 text-center text-slate-400">Không tìm thấy báo cáo phù hợp.</div>;
                }

                return (
                  <>
                    <table className="cyber-table">
                      <thead>
                        <tr>
                          {renderSortableHeader("Staff", "staffName")}
                          {renderSortableHeader("Ngày gửi", "createdAt")}
                          {renderSortableHeader("Nội dung", "content")}
                          {renderSortableHeader("Trạng thái", "status")}
                          <th>Reply</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginated.map((r) => {
                          const isCompleted = r.status === 'Đã hoàn thành' || Boolean(r.adminReply);
                          return (
                            <tr key={r.id}>
                              <td className="font-semibold text-slate-200">{r.staffName || 'Staff'}</td>
                              <td className="text-zinc-500 text-xs whitespace-nowrap">
                                {formatDate(r.createdAt)}
                              </td>
                              <td className="max-w-[260px]">{r.content}</td>
                              <td>
                                {isCompleted ? (
                                  <span className="status-badge badge-done">Đã hoàn thành</span>
                                ) : (
                                  <span className="status-badge badge-pending">Chờ duyệt</span>
                                )}
                              </td>
                              <td>
                                <div className="flex flex-col gap-2">
                                  <textarea
                                    rows={2}
                                    value={adminReplies[r.id] !== undefined ? adminReplies[r.id] : r.adminReply || ''}
                                    onChange={(e) => setAdminReplies(prev => ({ ...prev, [r.id]: e.target.value }))}
                                    disabled={isCompleted}
                                    className="reply-textarea reply-textarea-compact"
                                    placeholder="Nhập phản hồi..."
                                  />
                                  {!isCompleted && (
                                    <button
                                      type="button"
                                      className="self-end btn-table-action btn-table-action-success"
                                      onClick={() => handleReplyReport(r.id)}
                                    >
                                      Phản hồi
                                    </button>
                                  )}
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

        {/* Payments Section */}
        {activeTab === 'payments' && (
          <section className="dashboard-fade-in space-y-6">
            <div className="section-header">
              <h2 className="section-title">Lịch sử thanh toán</h2>
              <p className="section-subtitle">Toàn bộ các giao dịch nạp tiền qua cổng thanh toán.</p>
            </div>

            {renderSearchFilterBar("Tìm kiếm mã giao dịch, email...")}

            <div className="data-table-container">
              {paymentsLoading ? (
                <div className="p-8 text-center text-slate-400">Đang tải lịch sử thanh toán...</div>
              ) : payments.length === 0 ? (
                <div className="p-8 text-center text-slate-400">Chưa có giao dịch nào.</div>
              ) : (() => {
                const filtered = payments.filter(p => {
                  return !searchTerm ||
                    p.transactionCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    p.userEmail?.toLowerCase().includes(searchTerm.toLowerCase());
                });

                const sorted = sortData(filtered);
                const paginated = sorted.slice((currentPage - 1) * 10, currentPage * 10);

                if (filtered.length === 0) {
                  return <div className="p-8 text-center text-slate-400">Không tìm thấy giao dịch phù hợp.</div>;
                }

                return (
                  <>
                    <table className="cyber-table">
                      <thead>
                        <tr>
                          {renderSortableHeader("Mã GD", "transactionCode")}
                          {renderSortableHeader("Email khách", "userEmail")}
                          {renderSortableHeader("Số tiền", "amount")}
                          <th>Trạng thái</th>
                          {renderSortableHeader("Ngày nạp", "createdAt")}
                        </tr>
                      </thead>
                      <tbody>
                        {paginated.map((p) => (
                          <tr key={p.id}>
                            <td className="monospace-id font-bold text-amber-400">
                              {p.transactionCode}
                            </td>
                            <td className="font-semibold">{p.userEmail}</td>
                            <td className="font-bold text-emerald-400">{formatVnd(p.amount)}</td>
                            <td>
                              <span className="status-badge badge-done">Hoàn tất</span>
                            </td>
                            <td className="text-zinc-500 text-xs">{formatDate(p.createdAt)}</td>
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

        {/* Revenue Stats Section */}
        {activeTab === 'revenue' && (
          <section className="dashboard-fade-in space-y-6">
            <div className="section-header">
              <h2 className="section-title">Biểu đồ doanh thu</h2>
              <p className="section-subtitle">Phân tích thống kê kết quả doanh thu nhận được.</p>
            </div>

            {revenueLoading ? (
              <div className="stat-card p-12 text-center text-zinc-400">Đang tải biểu đồ...</div>
            ) : (
              <div className="stat-card space-y-6">
                {revenueStats && (
                  <div className="flex flex-wrap items-center justify-between border-b border-slate-800 pb-4 gap-4">
                    <div>
                      <p className="text-xs text-slate-500 uppercase font-semibold">Tổng doanh thu</p>
                      <h3 className="text-xl font-bold text-emerald-400 mt-0.5 revenue-total-amount">
                        {formatVnd(revenueStats.totalRevenue)}
                      </h3>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-500 uppercase font-semibold">Tổng số giao dịch</p>
                      <h4 className="text-lg font-bold text-white mt-0.5">
                        {revenueStats.transactionCount} giao dịch
                      </h4>
                    </div>
                  </div>
                )}
                {renderRevenueChart()}
              </div>
            )}
          </section>
        )}

        {/* Staff Management Section */}
        {activeTab === 'staff' && (
          <section className="dashboard-fade-in space-y-6">
            <div className="section-header flex flex-wrap justify-between items-start gap-4">
              <div>
                <h2 className="section-title">Quản lý Nhân viên (Staff)</h2>
                <p className="section-subtitle">Xem danh sách nhân viên và quản lý tài khoản.</p>
              </div>
              <button
                type="button"
                className="cyber-btn-primary px-4 py-2 rounded-xl font-bold text-white text-sm transition"
                onClick={() => setIsStaffModalOpen(true)}
              >
                + Thêm Staff
              </button>
            </div>

            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-title">Tổng số nhân viên</div>
                <div className="stat-value">{staffs.length}</div>
              </div>
              <div className="stat-card">
                <div className="stat-title">Đang Online 🟢</div>
                <div className="stat-value green">0</div>
              </div>
              <div className="stat-card">
                <div className="stat-title">Offline ⚪</div>
                <div className="stat-value">{Math.max(0, offlineStaffs - blockedStaffs)}</div>
              </div>
            </div>

            {renderSearchFilterBar("Tìm kiếm nhân viên theo tên, email...", [
              {
                value: filterOption1,
                onChange: setFilterOption1,
                options: [
                  { value: '', label: 'Tất cả trạng thái' },
                  { value: 'active', label: 'Hoạt động (Active)' },
                  { value: 'blocked', label: 'Bị khóa (Blocked)' }
                ]
              }
            ])}

            <div className="data-table-container">
              {staffsLoading ? (
                <div className="p-8 text-center text-slate-400">Đang tải danh sách nhân viên...</div>
              ) : staffs.length === 0 ? (
                <div className="p-8 text-center text-slate-400">
                  Chưa có nhân viên nào. Nhấn nút "Thêm Staff" để tạo mới.
                </div>
              ) : (() => {
                const filtered = staffs.filter(s => {
                  const matchesSearch = !searchTerm ||
                    s.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    s.email?.toLowerCase().includes(searchTerm.toLowerCase());

                  const isBlocked = s.accountStatus?.toLowerCase() === 'blocked';
                  const matchesStatus = !filterOption1 ||
                    (filterOption1 === 'active' && !isBlocked) ||
                    (filterOption1 === 'blocked' && isBlocked);

                  return matchesSearch && matchesStatus;
                });

                const sorted = sortData(filtered);
                const paginated = sorted.slice((currentPage - 1) * 10, currentPage * 10);

                if (filtered.length === 0) {
                  return <div className="p-8 text-center text-slate-400">Không tìm thấy nhân viên phù hợp.</div>;
                }

                return (
                  <>
                    <table className="cyber-table">
                      <thead>
                        <tr>
                          {renderSortableHeader("ID", "id")}
                          {renderSortableHeader("Tên nhân viên", "fullName")}
                          {renderSortableHeader("Email", "email")}
                          {renderSortableHeader("Vai trò", "role")}
                          {renderSortableHeader("Trạng thái", "accountStatus")}
                          {renderSortableHeader("Ngày tham gia", "createdAt")}
                          <th>Thao tác</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginated.map((s) => {
                          const isBlocked = s.accountStatus?.toLowerCase() === 'blocked';
                          return (
                            <tr key={s.id}>
                              <td className="monospace-id">{s.id}</td>
                              <td className="font-semibold text-slate-200">{s.fullName}</td>
                              <td>{s.email}</td>
                              <td className="font-semibold text-indigo-400">{s.role}</td>
                              <td>
                                {isBlocked ? (
                                  <span className="status-badge badge-blocked">Blocked</span>
                                ) : (
                                  <span className="status-badge badge-offline">Offline</span>
                                )}
                              </td>
                              <td className="text-zinc-500 text-xs">{formatDate(s.createdAt)}</td>
                              <td>
                                <div className="flex gap-2">
                                  <button 
                                    type="button"
                                    className="btn-table-action btn-table-action-warning"
                                    onClick={() => handleToggleBlockStaff(s.id, isBlocked)}
                                  >
                                    {isBlocked ? "Mở khóa" : "Khóa"}
                                  </button>
                                  <button 
                                    type="button"
                                    className="btn-table-action btn-table-action-danger"
                                    onClick={() => handleDeleteStaff(s.id)}
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
      </main>

      {/* --- MODALS & NOTIFICATIONS --- */}

      {/* Global Toast Alerts */}
      {toast && (
        <div id="toast-container" className="fixed top-5 right-5 z-[9999]">
          <div className={`toast-item ${toast.type === 'error' ? 'error' : 'success'}`}>
            {toast.message}
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmModal?.show && (
        <div className="modal-overlay">
          <div className="modal-panel animate-in fade-in zoom-in-95 duration-200">
            <div className="modal-title">{confirmModal.title}</div>
            <div className="modal-desc">{confirmModal.message}</div>
            <div className="flex justify-end gap-3 mt-5">
              <button 
                type="button" 
                className="btn-secondary"
                onClick={() => setConfirmModal(null)}
              >
                Hủy
              </button>
              <button 
                type="button" 
                className="btn-danger"
                onClick={confirmModal.onConfirm}
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Staff Modal */}
      {isStaffModalOpen && (
        <div className="modal-overlay" onClick={() => setIsStaffModalOpen(false)}>
          <div className="modal-panel animate-in fade-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">Thêm Staff mới</div>
            <div className="modal-desc">Tạo tài khoản nhân viên mới trên hệ thống Supabase Auth.</div>
            
            <form onSubmit={handleCreateStaffSubmit} className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 uppercase tracking-wider block mb-1">Tên nhân viên</label>
                <input 
                  type="text" 
                  value={newStaffName} 
                  onChange={(e) => setNewStaffName(e.target.value)} 
                  className="modal-input" 
                  placeholder="Nguyễn Văn A" 
                  required
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 uppercase tracking-wider block mb-1">Email</label>
                <input 
                  type="email" 
                  value={newStaffEmail} 
                  onChange={(e) => setNewStaffEmail(e.target.value)} 
                  className="modal-input" 
                  placeholder="staff@company.com" 
                  required
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 uppercase tracking-wider block mb-1">Mật khẩu</label>
                <input 
                  type="password" 
                  value={newStaffPassword} 
                  onChange={(e) => setNewStaffPassword(e.target.value)} 
                  className="modal-input" 
                  placeholder="Tối thiểu 6 ký tự" 
                  minLength={6}
                  required
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button 
                  type="button" 
                  className="btn-secondary"
                  onClick={() => setIsStaffModalOpen(false)}
                >
                  Hủy
                </button>
                <button 
                  type="submit" 
                  disabled={creatingStaff}
                  className="btn-primary"
                >
                  {creatingStaff ? "Đang tạo..." : "Tạo Staff"}
                </button>
              </div>
            </form>
          </div>
        </div>
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

      {/* Gmail Compose Trigger Button (FAB) */}
      {activeTab === 'support' && !isComposeOpen && (
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
          <svg fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
        </button>
      )}

      {/* Gmail-style Compose Box */}
      {isComposeOpen && (
        <div className={`gmail-compose-box ${isComposeMinimized ? 'minimized' : ''}`}>
          <div 
            className="gmail-compose-header"
            onClick={() => setIsComposeMinimized(!isComposeMinimized)}
          >
            <span>
              {selectedCskhTicketId ? `Trả lời Ticket #${selectedCskhTicketId}` : 'Thư mới'}
            </span>
            <div className="gmail-compose-header-actions" onClick={(e) => e.stopPropagation()}>
              <button 
                type="button" 
                className="gmail-compose-header-btn" 
                title={isComposeMinimized ? "Phóng to" : "Thu nhỏ"}
                onClick={() => setIsComposeMinimized(!isComposeMinimized)}
              >
                {isComposeMinimized ? (
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
                  </svg>
                ) : (
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                  </svg>
                )}
              </button>
              <button 
                type="button" 
                className="gmail-compose-header-btn" 
                title="Đóng"
                onClick={handleCancelCskhReply}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
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
                  title="Hủy bỏ"
                  disabled={isSendingCskhEmail}
                  onClick={handleCancelCskhReply}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                  </svg>
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
