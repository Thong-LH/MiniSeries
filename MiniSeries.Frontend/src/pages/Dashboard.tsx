import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import CustomerTab from './Dashboard/components/CustomerTab';
import SupportTab from './Dashboard/components/SupportTab';
import RevenueTab from './Dashboard/components/RevenueTab';
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
}

interface StaffReport {
  id: string;
  staffName: string;
  content: string;
  status: string;
  adminReply?: string;
  createdAt: string;
}

export default function Dashboard() {
  const navigate = useNavigate();

  // Auth info
  const [userRole, setUserRole] = useState<string>('');
  const [userName, setUserName] = useState<string>('');
  const [authChecked, setAuthChecked] = useState<boolean>(false);

  // UI States
  const [activeTab, setActiveTab] = useState<string>('customers');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    show: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  // Staff Reports and Accounts states
  const [staffReports, setStaffReports] = useState<StaffReport[]>([]);
  const [staffReportContent, setStaffReportContent] = useState<string>('');
  const [reportsLoading, setReportsLoading] = useState<boolean>(false);

  const [adminReports, setAdminReports] = useState<StaffReport[]>([]);
  const [adminReplies, setAdminReplies] = useState<Record<string, string>>({});

  const [staffs, setStaffs] = useState<CustomerProfile[]>([]);
  const [staffsLoading, setStaffsLoading] = useState<boolean>(false);
  const [isStaffModalOpen, setIsStaffModalOpen] = useState<boolean>(false);
  const [newStaffName, setNewStaffName] = useState<string>('');
  const [newStaffEmail, setNewStaffEmail] = useState<string>('');
  const [newStaffPassword, setNewStaffPassword] = useState<string>('');
  const [creatingStaff, setCreatingStaff] = useState<boolean>(false);

  // Search & Pagination & Sorting
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
  }, [activeTab]);

  // Auth checking
  useEffect(() => {
    const role = localStorage.getItem("userRole") || localStorage.getItem("user_role");
    const name = localStorage.getItem("user_name") || "User";
    const token = localStorage.getItem("token") || "";

    if (!token || !role || (role !== "Admin" && role !== "Staff")) {
      navigate('/login?unauthorized=true', { replace: true });
      return;
    }

    setUserRole(role);
    setUserName(name);
    setAuthChecked(true);
  }, [navigate]);

  // Load tab data
  useEffect(() => {
    if (!authChecked) return;

    if (activeTab === 'reports-staff') loadStaffReports();
    else if (activeTab === 'reports-admin') loadAdminReports();
    else if (activeTab === 'staff') loadStaffs();
  }, [activeTab, authChecked]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

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

  // Staff Reports and Staff Accounts API loaders
  const loadStaffReports = async () => {
    setReportsLoading(true);
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
    setReportsLoading(true);
    try {
      const data = await api.reportGetList();
      setAdminReports(Array.isArray(data) ? data : []);
    } catch (err: any) {
      showToast(err.message || 'Không thể tải danh sách báo cáo nhân viên', 'error');
    } finally {
      setReportsLoading(false);
    }
  };

  const loadStaffs = async () => {
    setStaffsLoading(true);
    try {
      const data = await api.adminGetStaffs();
      setStaffs(Array.isArray(data) ? data : []);
    } catch (err: any) {
      showToast(err.message || 'Không thể tải danh sách nhân viên', 'error');
    } finally {
      setStaffsLoading(false);
    }
  };

  const handleLogout = () => {
    showConfirm("Bạn có chắc chắn muốn đăng xuất không?", () => {
      localStorage.clear();
      navigate('/login', { replace: true });
    }, "Đăng xuất");
  };

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

      if (sortColumn === 'createdAt') {
        valA = a.createdAt ?? a.created_at;
        valB = b.createdAt ?? b.created_at;
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

  if (!authChecked) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0b0f19] text-slate-300 font-bold">
        Đang kiểm tra quyền truy cập...
      </div>
    );
  }

  const blockedStaffs = staffs.filter(s => s.accountStatus?.toLowerCase() === 'blocked').length;

  return (
    <div className="dashboard-container">
      <div className="mobile-header-bar">
        <button 
          type="button" 
          className="menu-toggle-btn" 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          aria-label="Toggle sidebar menu"
        >
          <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <div className="mobile-logo" onClick={() => window.location.reload()}>
          <span>Mini Series</span> <span className="brand-accent">Learning</span>
        </div>
        <div style={{ width: 36 }} />
      </div>

      {isSidebarOpen && (
        <div className="sidebar-backdrop" onClick={() => setIsSidebarOpen(false)} />
      )}

      <aside className={`dashboard-sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header" onClick={() => window.location.reload()}>
          <div className="brand-logo">
            <span>Mini Series</span> <span className="brand-accent">Learning</span>
          </div>
        </div>

        <div className="sidebar-menu-wrapper">
          <div className="nav-section-title">Quản lý chung</div>
          <nav className="sidebar-nav">
            <div 
              className={`sidebar-item ${activeTab === 'customers' ? 'active' : ''}`}
              onClick={() => { setActiveTab('customers'); setIsSidebarOpen(false); }}
            >
              <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>
              Quản lý Khách hàng
            </div>
            <div 
              className={`sidebar-item ${activeTab === 'tokens' ? 'active' : ''}`}
              onClick={() => { setActiveTab('tokens'); setIsSidebarOpen(false); }}
            >
              <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694 4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 5.625c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" /></svg>
              Quản lý Hạn ngạch
            </div>
            <div 
              className={`sidebar-item ${activeTab === 'support' ? 'active' : ''}`}
              onClick={() => { setActiveTab('support'); setIsSidebarOpen(false); }}
            >
              <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.084.29.125.597.125.911v5.777c0 2.002-1.63 3.63-3.63 3.63H9.122a18.14 18.14 0 01-3.622-.361 4.003 4.003 0 00-2.51 2.037L2.25 21v-3.75a4.002 4.002 0 014-4h10.25A4.002 4.002 0 0120.25 9.25V8.51zM10.5 8.25h5.25m-5.25 3.5h7.5m-7.5 3.5h7.5" /></svg>
              Hỗ trợ khách hàng
            </div>
            <div 
              className={`sidebar-item ${activeTab === 'feedback' ? 'active' : ''}`}
              onClick={() => { setActiveTab('feedback'); setIsSidebarOpen(false); }}
            >
              <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499c.15-.427.77-.427.92 0l1.97 5.517c.06.18.22.3.4.3l5.803.05c.45.004.63.57.27.844l-4.76 3.6c-.14.1-.2.29-.15.464l1.83 5.4c.14.42-.33.77-.69.5l-4.72-3.4c-.16-.12-.38-.12-.54 0l-4.72 3.4c-.36.27-.83-.08-.69-.5l1.83-5.4c.05-.17-.01-.36-.15-.464l-4.76-3.6c-.36-.27-.18-.84.27-.844l5.803-.05c.18-.01.34-.12.4-.3l1.97-5.517z" /></svg>
              Quản lý Đánh giá
            </div>
            {userRole === 'Staff' && (
              <div 
                className={`sidebar-item ${activeTab === 'reports-staff' ? 'active' : ''}`}
                onClick={() => { setActiveTab('reports-staff'); setIsSidebarOpen(false); }}
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
                  onClick={() => { setActiveTab('payments'); setIsSidebarOpen(false); }}
                >
                  <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-5.25-9h16.5a1.5 1.5 0 011.5 1.5v9a1.5 1.5 0 01-1.5 1.5H3.75A1.5 1.5 0 012.25 18v-9a1.5 1.5 0 011.5-1.5z" /></svg>
                  Lịch sử thanh toán
                </div>
                <div 
                  className={`sidebar-item ${activeTab === 'revenue' ? 'active' : ''}`}
                  onClick={() => { setActiveTab('revenue'); setIsSidebarOpen(false); }}
                >
                  <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.281m5.94 2.28-2.28 5.941" /></svg>
                  Biểu đồ doanh thu
                </div>
                <div 
                  className={`sidebar-item ${activeTab === 'traffic' ? 'active' : ''}`}
                  onClick={() => { setActiveTab('traffic'); setIsSidebarOpen(false); }}
                >
                  <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v5.25c0 .621-.504 1.125-1.125 1.125h-2.25A1.125 1.125 0 013 18.375v-5.25zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125v-9.75zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v14.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg>
                  Lượt truy cập (Traffic)
                </div>
                <div 
                  className={`sidebar-item ${activeTab === 'staff' ? 'active' : ''}`}
                  onClick={() => { setActiveTab('staff'); setIsSidebarOpen(false); }}
                >
                  <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" /></svg>
                  Quản lý Nhân viên
                </div>
                <div 
                  className={`sidebar-item ${activeTab === 'reports-admin' ? 'active' : ''}`}
                  onClick={() => { setActiveTab('reports-admin'); setIsSidebarOpen(false); }}
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

        {/* Modularized Customer/Tokens Tab */}
        {(activeTab === 'customers' || activeTab === 'tokens') && (
          <CustomerTab
            activeSubTab={activeTab === 'customers' ? 'customers' : 'tokens'}
            showToast={showToast}
            showConfirm={showConfirm}
          />
        )}

        {/* Modularized Support/Feedback Tab */}
        {(activeTab === 'support' || activeTab === 'feedback') && (
          <SupportTab
            activeSubTab={activeTab === 'support' ? 'support' : 'feedback'}
            showToast={showToast}
          />
        )}

        {/* Modularized Revenue/Payments/Traffic Tab */}
        {(activeTab === 'payments' || activeTab === 'revenue' || activeTab === 'traffic') && (
          <RevenueTab
            activeSubTab={activeTab === 'payments' ? 'payments' : activeTab === 'revenue' ? 'revenue' : 'traffic'}
            showToast={showToast}
          />
        )}

        {/* Staff Reports section */}
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
                <button type="submit" className="cyber-btn-primary">
                  Gửi báo cáo
                </button>
              </div>
            </form>

            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Lịch sử báo cáo đã gửi</h3>
              <div className="data-table-container">
                {reportsLoading ? (
                  renderLoadingState("Đang tải danh sách báo cáo...")
                ) : staffReports.length === 0 ? (
                  renderEmptyState("Bạn chưa gửi báo cáo nào.")
                ) : (() => {
                  const filtered = staffReports.filter(r => {
                    return !searchTerm || r.content?.toLowerCase().includes(searchTerm.toLowerCase());
                  });
                  const sorted = sortData(filtered);
                  const paginated = sorted.slice((currentPage - 1) * 10, currentPage * 10);

                  if (filtered.length === 0) return renderEmptyState("Không tìm thấy báo cáo phù hợp.");

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
                renderLoadingState("Đang tải danh sách báo cáo...")
              ) : adminReports.length === 0 ? (
                renderEmptyState("Chưa có báo cáo nào.")
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

                if (filtered.length === 0) return renderEmptyState("Không tìm thấy báo cáo phù hợp.");

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

        {/* Staff accounts management Section */}
        {activeTab === 'staff' && (
          <section className="dashboard-fade-in space-y-6">
            <div className="section-header flex flex-wrap justify-between items-start gap-4">
              <div>
                <h2 className="section-title">Quản lý Nhân viên</h2>
                <p className="section-subtitle">Tạo và phân quyền tài khoản cho nhân viên chăm sóc khách hàng.</p>
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
                <div className="stat-title">Tổng nhân viên</div>
                <div className="stat-value">{staffs.length}</div>
              </div>
              <div className="stat-card">
                <div className="stat-title">Đang Online 🟢</div>
                <div className="stat-value green">0</div>
              </div>
              <div className="stat-card">
                <div className="stat-title">Offline ⚪</div>
                <div className="stat-value">{Math.max(0, staffs.length - blockedStaffs)}</div>
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
                renderLoadingState("Đang tải danh sách nhân viên...")
              ) : staffs.length === 0 ? (
                renderEmptyState("Chưa có nhân viên nào. Nhấn nút \"Thêm Staff\" để tạo mới.")
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

                if (filtered.length === 0) return renderEmptyState("Không tìm thấy nhân viên phù hợp.");

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
                                  <span className="status-badge badge-done">Active</span>
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

      {/* Global Alerts & Modals */}
      {toast && (
        <div id="toast-container" className="fixed top-5 right-5 z-[9999]">
          <div className={`toast-item ${toast.type === 'error' ? 'error' : 'success'}`}>
            {toast.message}
          </div>
        </div>
      )}

      {confirmModal?.show && (
        <div className="modal-overlay">
          <div className="modal-panel animate-in fade-in zoom-in-95 duration-200">
            <div className="modal-title">{confirmModal.title}</div>
            <div className="modal-desc">{confirmModal.message}</div>
            <div className="flex justify-end gap-3 mt-5">
              <button type="button" className="btn-secondary" onClick={() => setConfirmModal(null)}>Hủy</button>
              <button type="button" className="btn-danger" onClick={confirmModal.onConfirm}>Xác nhận</button>
            </div>
          </div>
        </div>
      )}

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
                <button type="button" className="btn-secondary" onClick={() => setIsStaffModalOpen(false)}>Hủy</button>
                <button type="submit" disabled={creatingStaff} className="btn-primary">
                  {creatingStaff ? "Đang tạo..." : "Tạo Staff"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
