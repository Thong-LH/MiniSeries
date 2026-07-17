import { useState, useEffect } from 'react';
import { api } from '../../../services/api';

interface PaymentHistory {
  id: string;
  userEmail: string;
  amount: number;
  paymentCode: string;
  planName: string;
  tokensReceived: number;
  content: string;
  createdAt: string;
}

interface RevenueStats {
  totalRevenue: number;
  transactionCount: number;
  labels: string[];
  amounts: number[];
}

interface TrafficStats {
  labels: string[];
  pageViews: number[];
  uniqueVisitors: number[];
  totalViews?: number;
  totalUnique?: number;
}

interface RevenueTabProps {
  showToast: (msg: string, type?: 'success' | 'error') => void;
  activeSubTab: 'payments' | 'revenue' | 'traffic';
}

export default function RevenueTab({ showToast, activeSubTab }: RevenueTabProps) {
  const [payments, setPayments] = useState<PaymentHistory[]>([]);
  const [paymentsLoading, setPaymentsLoading] = useState<boolean>(false);
  const [expandedPayments, setExpandedPayments] = useState<Record<string, boolean>>({});

  const [revenueStats, setRevenueStats] = useState<RevenueStats | null>(null);
  const [revenueLoading, setRevenueLoading] = useState<boolean>(false);

  const [trafficStats, setTrafficStats] = useState<TrafficStats | null>(null);
  const [trafficLoading, setTrafficLoading] = useState<boolean>(false);
  const [trafficGroupBy, setTrafficGroupBy] = useState<string>('day');
  const [hoveredPoint, setHoveredPoint] = useState<{
    x: number;
    y: number;
    label: string;
    value: number | string;
    type: 'revenue' | 'views' | 'visitors';
  } | null>(null);

  // Search & Pagination
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [sortColumn, setSortColumn] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const togglePaymentExpand = (id: string) => {
    setExpandedPayments(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  useEffect(() => {
    setSearchTerm('');
    setCurrentPage(1);
    setSortColumn('');
    setSortDirection('desc');
  }, [activeSubTab]);

  useEffect(() => {
    if (activeSubTab === 'payments') {
      loadPaymentHistory();
    } else if (activeSubTab === 'revenue') {
      loadRevenueStats();
    } else if (activeSubTab === 'traffic') {
      loadTrafficStats(trafficGroupBy);
    }
  }, [activeSubTab, trafficGroupBy]);

  const loadPaymentHistory = async () => {
    setPaymentsLoading(true);
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
    setRevenueLoading(true);
    try {
      const data = await api.adminGetPaymentStats('month');
      setRevenueStats(data);
    } catch (err: any) {
      showToast(err.message || 'Không thể tải thống kê doanh thu', 'error');
    } finally {
      setRevenueLoading(false);
    }
  };

  const loadTrafficStats = async (groupBy: string) => {
    setTrafficLoading(true);
    try {
      const data = await api.adminGetTrafficStats(groupBy);
      setTrafficStats(data);
    } catch (err: any) {
      showToast(err.message || 'Không thể tải thống kê truy cập', 'error');
    } finally {
      setTrafficLoading(false);
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

  const formatVnd = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0
    }).format(amount || 0);
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

  const renderSearchFilterBar = (placeholder: string) => {
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
      </div>
    );
  };

  const renderPagination = (totalItems: number, itemsPerPage: number = 10) => {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
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

  const renderRevenueChart = () => {
    if (!revenueStats || !revenueStats.amounts || revenueStats.amounts.length === 0) {
      return <div className="flex h-64 items-center justify-center text-slate-400">Chưa có dữ liệu biểu đồ doanh thu.</div>;
    }

    const { labels, amounts } = revenueStats;
    const maxVal = Math.max(...amounts, 100000);
    const width = 800;
    const height = 300;
    const paddingLeft = 90;
    const paddingRight = 30;
    const paddingTop = 30;
    const paddingBottom = 40;

    const plotWidth = width - paddingLeft - paddingRight;
    const plotHeight = height - paddingTop - paddingBottom;

    const points = amounts.map((val, i) => {
      const x = paddingLeft + (i * plotWidth) / Math.max(1, labels.length - 1);
      const y = paddingTop + plotHeight - (val / maxVal) * plotHeight;
      return { x, y, value: val, label: labels[i] };
    });

    const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    const areaPath = points.length > 0 ? `${linePath} L ${points[points.length - 1].x} ${paddingTop + plotHeight} L ${points[0].x} ${paddingTop + plotHeight} Z` : '';

    const yTicks = Array.from({ length: 5 }, (_, i) => {
      const val = (maxVal * i) / 4;
      const y = paddingTop + plotHeight - (val / maxVal) * plotHeight;
      return { val, y };
    });

    return (
      <div className="relative overflow-visible">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto max-w-4xl mx-auto block">
          <defs>
            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
            </linearGradient>
          </defs>
          {yTicks.map((tick, idx) => (
            <g key={idx}>
              <line x1={paddingLeft} y1={tick.y} x2={width - paddingRight} y2={tick.y} stroke="#1e293b" strokeDasharray="4 4" />
              <text x={paddingLeft - 15} y={tick.y + 4} fill="#94a3b8" fontSize="11" textAnchor="end" className="font-medium">{formatVnd(tick.val)}</text>
            </g>
          ))}
          {areaPath && <path d={areaPath} fill="url(#chartGradient)" />}
          {linePath && <path d={linePath} fill="none" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />}
          {points.map((p, idx) => (
            <circle 
              key={idx} 
              cx={p.x} 
              cy={p.y} 
              r="5" 
              fill="#0f172a" 
              stroke="#6366f1" 
              strokeWidth="2" 
              className="cursor-pointer transition-all duration-200 hover:scale-125" 
              style={{ transformOrigin: `${p.x}px ${p.y}px` }}
              onMouseEnter={() => setHoveredPoint({ x: p.x, y: p.y, label: p.label, value: p.value, type: 'revenue' })}
              onMouseLeave={() => setHoveredPoint(null)}
            />
          ))}
          {points.map((p, idx) => {
            const skipFactor = Math.ceil(points.length / 6);
            if (idx % skipFactor !== 0 && idx !== points.length - 1) return null;
            
            let formattedLabel = p.label;
            if (p.label && p.label.includes('-')) {
              const parts = p.label.split('-');
              if (parts.length === 3) {
                formattedLabel = `${parts[2]}/${parts[1]}`;
              }
            }
            return (
              <text key={idx} x={p.x} y={height - 10} fill="#94a3b8" fontSize="11" textAnchor="middle" className="font-medium">
                {formattedLabel}
              </text>
            );
          })}
          <line x1={paddingLeft} y1={paddingTop + plotHeight} x2={width - paddingRight} y2={paddingTop + plotHeight} stroke="#475569" strokeWidth="1.5" />
        </svg>
        {hoveredPoint && hoveredPoint.type === 'revenue' && (
          <div 
            className="absolute z-50 bg-[#0f172a]/95 border border-slate-800 rounded-lg p-2.5 shadow-xl text-xs backdrop-blur-md pointer-events-none transition-all duration-100"
            style={{ 
              left: `${(hoveredPoint.x / width) * 100}%`, 
              top: `${(hoveredPoint.y / height) * 100 - 12}%`,
              transform: 'translate(-50%, -100%)',
            }}
          >
            <div className="font-bold text-slate-300 mb-0.5">{hoveredPoint.label}</div>
            <div className="flex items-center gap-1.5 font-semibold">
              <span className="w-2 h-2 rounded-full bg-[#6366f1]"></span>
              <span className="text-slate-400">Doanh thu:</span>
              <span className="text-white">{formatVnd(hoveredPoint.value as number)}</span>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderTrafficChart = () => {
    if (!trafficStats || !trafficStats.pageViews || trafficStats.pageViews.length === 0) {
      return <div className="flex h-64 items-center justify-center text-slate-400">Chưa có dữ liệu biểu đồ truy cập.</div>;
    }

    const { labels, pageViews, uniqueVisitors } = trafficStats;
    const maxVal = Math.max(...pageViews, ...uniqueVisitors, 10);
    const width = 800;
    const height = 300;
    const paddingLeft = 60;
    const paddingRight = 30;
    const paddingTop = 30;
    const paddingBottom = 40;

    const plotWidth = width - paddingLeft - paddingRight;
    const plotHeight = height - paddingTop - paddingBottom;

    const pointsViews = pageViews.map((val, i) => {
      const x = paddingLeft + (i * plotWidth) / Math.max(1, labels.length - 1);
      const y = paddingTop + plotHeight - (val / maxVal) * plotHeight;
      return { x, y, value: val, label: labels[i] };
    });

    const pointsVisitors = uniqueVisitors.map((val, i) => {
      const x = paddingLeft + (i * plotWidth) / Math.max(1, labels.length - 1);
      const y = paddingTop + plotHeight - (val / maxVal) * plotHeight;
      return { x, y, value: val, label: labels[i] };
    });

    const pathViews = pointsViews.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    const pathVisitors = pointsVisitors.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    const areaViews = pointsViews.length > 0 ? `${pathViews} L ${pointsViews[pointsViews.length - 1].x} ${paddingTop + plotHeight} L ${pointsViews[0].x} ${paddingTop + plotHeight} Z` : '';

    const yTicks = Array.from({ length: 5 }, (_, i) => {
      const val = Math.round((maxVal * i) / 4);
      const y = paddingTop + plotHeight - (val / maxVal) * plotHeight;
      return { val, y };
    });

    return (
      <div className="relative overflow-visible">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto max-w-4xl mx-auto block">
          <defs>
            <linearGradient id="viewsGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="visitorsGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
            </linearGradient>
          </defs>
          {yTicks.map((tick, idx) => (
            <g key={idx}>
              <line x1={paddingLeft} y1={tick.y} x2={width - paddingRight} y2={tick.y} stroke="#1e293b" strokeDasharray="4 4" />
              <text x={paddingLeft - 15} y={tick.y + 4} fill="#94a3b8" fontSize="11" textAnchor="end" className="font-medium">{tick.val}</text>
            </g>
          ))}
          {areaViews && <path d={areaViews} fill="url(#viewsGradient)" />}
          {pathViews && <path d={pathViews} fill="none" stroke="#f43f5e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />}
          {pathVisitors && <path d={pathVisitors} fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />}
          {pointsViews.map((p, idx) => (
            <circle 
              key={`v-${idx}`} 
              cx={p.x} 
              cy={p.y} 
              r="4" 
              fill="#0b0f19" 
              stroke="#f43f5e" 
              strokeWidth="2" 
              className="cursor-pointer transition-all duration-200 hover:scale-125" 
              style={{ transformOrigin: `${p.x}px ${p.y}px` }}
              onMouseEnter={() => setHoveredPoint({ x: p.x, y: p.y, label: p.label, value: p.value, type: 'views' })}
              onMouseLeave={() => setHoveredPoint(null)}
            />
          ))}
          {pointsVisitors.map((p, idx) => (
            <circle 
              key={`u-${idx}`} 
              cx={p.x} 
              cy={p.y} 
              r="4" 
              fill="#0b0f19" 
              stroke="#10b981" 
              strokeWidth="2" 
              className="cursor-pointer transition-all duration-200 hover:scale-125" 
              style={{ transformOrigin: `${p.x}px ${p.y}px` }}
              onMouseEnter={() => setHoveredPoint({ x: p.x, y: p.y, label: p.label, value: p.value, type: 'visitors' })}
              onMouseLeave={() => setHoveredPoint(null)}
            />
          ))}
          {pointsViews.map((p, idx) => {
            const skipFactor = Math.ceil(pointsViews.length / 6);
            if (idx % skipFactor !== 0 && idx !== pointsViews.length - 1) return null;
            
            let formattedLabel = p.label;
            if (p.label && p.label.includes('-')) {
              const parts = p.label.split('-');
              if (parts.length === 3) {
                formattedLabel = `${parts[2]}/${parts[1]}`;
              }
            }
            return (
              <text key={idx} x={p.x} y={height - 10} fill="#94a3b8" fontSize="10" textAnchor="middle" className="font-medium">
                {formattedLabel}
              </text>
            );
          })}
          <line x1={paddingLeft} y1={paddingTop + plotHeight} x2={width - paddingRight} y2={paddingTop + plotHeight} stroke="#475569" strokeWidth="1.5" />
        </svg>
        {hoveredPoint && (hoveredPoint.type === 'views' || hoveredPoint.type === 'visitors') && (
          <div 
            className="absolute z-50 bg-[#0f172a]/95 border border-slate-800 rounded-lg p-2.5 shadow-xl text-xs backdrop-blur-md pointer-events-none transition-all duration-100"
            style={{ 
              left: `${(hoveredPoint.x / width) * 100}%`, 
              top: `${(hoveredPoint.y / height) * 100 - 12}%`,
              transform: 'translate(-50%, -100%)',
            }}
          >
            <div className="font-bold text-slate-300 mb-0.5">{hoveredPoint.label}</div>
            <div className="flex items-center gap-1.5 font-semibold">
              <span className={`w-2 h-2 rounded-full ${hoveredPoint.type === 'views' ? 'bg-rose-500' : 'bg-emerald-500'}`}></span>
              <span className="text-slate-400">
                {hoveredPoint.type === 'views' ? 'Lượt xem:' : 'Khách duy nhất:'}
              </span>
              <span className="text-white">{hoveredPoint.value}</span>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {activeSubTab === 'payments' && (
        <section className="dashboard-fade-in space-y-6">
          <div className="section-header">
            <h2 className="section-title">Lịch sử thanh toán</h2>
            <p className="section-subtitle">Toàn bộ các giao dịch nạp tiền qua cổng thanh toán.</p>
          </div>

          {paymentsLoading ? (
            renderLoadingState("Đang tải lịch sử thanh toán...")
          ) : payments.length === 0 ? (
            renderEmptyState("Chưa có giao dịch nào.")
          ) : (() => {
            const filtered = payments.filter(p => {
              return !searchTerm ||
                p.paymentCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.userEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.planName?.toLowerCase().includes(searchTerm.toLowerCase());
            });

            const sorted = sortData(filtered);
            const paginated = sorted.slice((currentPage - 1) * 20, currentPage * 20);

            // Calculate overall stats for payments
            const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0);
            const txCount = payments.length;
            const avgAmount = txCount > 0 ? Math.round(totalAmount / txCount) : 0;

            return (
              <>
                {/* Premium Stats Grid for Quick Overview */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div className="stat-card">
                    <div className="stat-title text-zinc-400">Tổng doanh thu nạp</div>
                    <div className="stat-value text-amber-400">{formatVnd(totalAmount)}</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-title text-zinc-400">Tổng số giao dịch</div>
                    <div className="stat-value text-sky-400">{txCount} lượt</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-title text-zinc-400">Giá trị nạp trung bình</div>
                    <div className="stat-value text-emerald-400">{formatVnd(avgAmount)}</div>
                  </div>
                </div>

                {renderSearchFilterBar("Tìm kiếm mã giao dịch, email, nội dung, gói...")}

                <div className="data-table-container mt-4">
                  {filtered.length === 0 ? (
                    renderEmptyState("Không tìm thấy giao dịch phù hợp.")
                  ) : (
                    <>
                      <table className="cyber-table">
                        <thead>
                          <tr>
                            {renderSortableHeader("Mã GD", "paymentCode")}
                            {renderSortableHeader("Email khách", "userEmail")}
                            {renderSortableHeader("Gói cước", "planName")}
                            {renderSortableHeader("Số tiền", "amount")}
                            <th>Nội dung chuyển khoản</th>
                            <th>Trạng thái</th>
                            {renderSortableHeader("Ngày nạp", "createdAt")}
                          </tr>
                        </thead>
                        <tbody>
                          {paginated.map((p) => (
                            <tr key={p.id}>
                              <td className="monospace-id font-bold text-amber-400">{p.paymentCode}</td>
                              <td className="font-semibold">{p.userEmail}</td>
                              <td>
                                <div className="flex flex-col">
                                  <span className="font-semibold text-sky-400">{p.planName || 'Basic'}</span>
                                  <span className="text-[10px] text-zinc-500">+{p.tokensReceived ?? 0} tokens</span>
                                </div>
                              </td>
                              <td className="font-bold text-emerald-400">{formatVnd(p.amount)}</td>
                              <td className="text-zinc-300 text-xs max-w-[200px]">
                                {(() => {
                                  const content = p.content || '—';
                                  const isLong = content.length > 20;
                                  const isExpanded = !!expandedPayments[p.id];
                                  
                                  if (!isLong) return <span className="italic">{content}</span>;
                                  
                                  return (
                                    <div className="flex flex-col gap-1">
                                      <span className="italic leading-normal break-all">
                                        {isExpanded ? content : `${content.substring(0, 18)}...`}
                                      </span>
                                      <button 
                                        type="button" 
                                        onClick={() => togglePaymentExpand(p.id)}
                                        className="text-[10px] text-sky-400 hover:text-sky-300 font-bold self-start cursor-pointer hover:underline focus:outline-none"
                                      >
                                        {isExpanded ? "Thu gọn ▲" : "Xem thêm ▼"}
                                      </button>
                                    </div>
                                  );
                                })()}
                              </td>
                              <td><span className="status-badge badge-done">Hoàn tất</span></td>
                              <td className="text-zinc-500 text-xs whitespace-nowrap min-w-[140px]">{formatDate(p.createdAt)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {renderPagination(filtered.length, 20)}
                    </>
                  )}
                </div>
              </>
            );
          })()}
        </section>
      )}

      {activeSubTab === 'revenue' && (
        <section className="dashboard-fade-in space-y-6">
          <div className="section-header flex flex-wrap justify-between items-start gap-4">
            <div>
              <h2 className="section-title">Biểu đồ doanh thu</h2>
              <p className="section-subtitle">Phân tích thống kê kết quả doanh thu nhận được.</p>
            </div>
          </div>

          {revenueLoading ? (
            <div className="stat-card p-12 text-center text-zinc-400">Đang tải biểu đồ...</div>
          ) : (
            <div className="stat-card space-y-6">
              {revenueStats && (
                <div className="flex flex-wrap items-center justify-between border-b border-slate-800 pb-4 gap-4">
                  <div>
                    <p className="text-xs text-slate-500 uppercase font-semibold">Tổng doanh thu</p>
                    <h3 className="text-xl font-bold text-emerald-400 mt-0.5">
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

      {activeSubTab === 'traffic' && (
        <section className="dashboard-fade-in space-y-6">
          <div className="section-header flex flex-wrap justify-between items-start gap-4">
            <div>
              <h2 className="section-title">Lượt truy cập (Traffic)</h2>
              <p className="section-subtitle">Xem thống kê lượt truy cập hệ thống và số lượng khách truy cập duy nhất.</p>
            </div>
            <div className="flex gap-2 items-center">
              <button
                type="button"
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border border-slate-800 ${
                  trafficGroupBy === 'day' ? 'bg-[#3b82f6] text-white' : 'bg-[#0f172a] text-slate-400'
                }`}
                onClick={() => setTrafficGroupBy('day')}
              >
                Theo ngày
              </button>
              <button
                type="button"
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border border-slate-800 ${
                  trafficGroupBy === 'month' ? 'bg-[#3b82f6] text-white' : 'bg-[#0f172a] text-slate-400'
                }`}
                onClick={() => setTrafficGroupBy('month')}
              >
                Theo tháng
              </button>
            </div>
          </div>

          {trafficLoading ? (
            <div className="stat-card p-12 text-center text-zinc-400">Đang tải biểu đồ...</div>
          ) : (
            <div className="space-y-6">
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-title text-zinc-400">Tổng số lượt xem trang (Page Views)</div>
                  <div className="stat-value text-rose-400">{trafficStats?.totalViews ?? 0}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-title text-zinc-400">Số khách truy cập duy nhất (Unique Visitors)</div>
                  <div className="stat-value text-emerald-400">{trafficStats?.totalUnique ?? 0}</div>
                </div>
              </div>

              <div className="stat-card space-y-6">
                <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                  <span className="text-xs text-slate-500 uppercase font-semibold">Biểu đồ lượt truy cập ({trafficGroupBy === 'day' ? 'Hàng ngày' : 'Hàng tháng'})</span>
                  <div className="flex gap-4 text-xs">
                    <span className="flex items-center gap-1.5 text-rose-400">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> Page Views
                    </span>
                    <span className="flex items-center gap-1.5 text-emerald-400">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Unique Visitors
                    </span>
                  </div>
                </div>
                {renderTrafficChart()}
              </div>
            </div>
          )}
        </section>
      )}
    </>
  );
}
