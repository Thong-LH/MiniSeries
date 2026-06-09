import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('content');
  const navigate = useNavigate();

  const handleLogout = () => {
    if (confirm("Bạn có chắc chắn muốn đăng xuất không?")) {
      navigate('/login');
    }
  };

  return (
    <div className="dashboard-container">
      <aside className="dashboard-sidebar">
        <div>
          <div className="sidebar-logo" onClick={() => navigate('/')}>
            <span className="cyan">M</span>ini <span className="cyan">S</span>eries<br/>
            <span className="purple"><span className="cyan">L</span>earning</span>
          </div>
          
          <div className="nav-section-title">Chung</div>
          <nav className="sidebar-nav">
            <div 
              className={`sidebar-item ${activeTab === 'content' ? 'active' : ''}`}
              onClick={() => setActiveTab('content')}
            >
              <span>📚</span> Quản lý nội dung
            </div>
            <div 
              className={`sidebar-item ${activeTab === 'customers' ? 'active' : ''}`}
              onClick={() => setActiveTab('customers')}
            >
              <span>👥</span> Quản lý Khách hàng
            </div>
            <div 
              className={`sidebar-item ${activeTab === 'tokens' ? 'active' : ''}`}
              onClick={() => setActiveTab('tokens')}
            >
              <span>🪙</span> Quản lý Token
            </div>
          </nav>

          <div className="nav-section-title">Quản trị hệ thống</div>
          <nav className="sidebar-nav">
            <div 
              className={`sidebar-item ${activeTab === 'payments' ? 'active' : ''}`}
              onClick={() => setActiveTab('payments')}
            >
              <span>💳</span> Lịch sử thanh toán
            </div>
            <div 
              className={`sidebar-item ${activeTab === 'staff' ? 'active' : ''}`}
              onClick={() => setActiveTab('staff')}
            >
              <span>🛡️</span> Quản lý Nhân viên
            </div>
          </nav>
        </div>

        <div className="sidebar-footer">
          <div className="user-info">
            <span className="role-badge">Admin</span>
            <div className="user-name">Xin chào, <span>Nguyễn Văn A</span></div>
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            Đăng xuất
          </button>
        </div>
      </aside>

      <main className="dashboard-main">
        {activeTab === 'content' && (
          <section>
            <div className="section-header">
              <h2 className="section-title">Quản lý nội dung</h2>
              <p className="section-subtitle">Duyệt bài học, truyền Manga và MiniSeries do người dùng tạo.</p>
            </div>
            <div className="stat-card">
              <p style={{ fontSize: '0.875rem', color: '#cbd5e1' }}>
                Danh sách nội dung đang chờ duyệt: <strong style={{ color: '#c084fc' }}>8</strong> mục
              </p>
            </div>
          </section>
        )}

        {activeTab === 'customers' && (
          <section>
            <div className="section-header">
              <h2 className="section-title">Quản lý Khách hàng</h2>
              <p className="section-subtitle">Danh sách Customer và trạng thái Online/Offline.</p>
            </div>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-title">Tổng số khách hàng</div>
                <div className="stat-value">1,245</div>
              </div>
              <div className="stat-card">
                <div className="stat-title">Đang Online 🟢</div>
                <div className="stat-value green">142</div>
              </div>
            </div>
            <div className="data-table-container">
              <table className="cyber-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Tên khách hàng</th>
                    <th>Email</th>
                    <th>Token</th>
                    <th>Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>#CUS001</td>
                    <td>Trần Văn B</td>
                    <td>tranb@example.com</td>
                    <td>1,500</td>
                    <td><span style={{ color: '#86efac' }}>Online</span></td>
                  </tr>
                  <tr>
                    <td>#CUS002</td>
                    <td>Lê Thị C</td>
                    <td>letc@example.com</td>
                    <td>200</td>
                    <td><span style={{ color: '#94a3b8' }}>Offline</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        )}

        {activeTab === 'tokens' && (
          <section>
            <div className="section-header">
              <h2 className="section-title">Quản lý Token</h2>
              <p className="section-subtitle">Theo dõi số dư Token và gói nạp của khách hàng.</p>
            </div>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-title">Token đã phát hành</div>
                <div className="stat-value">2.4M</div>
              </div>
              <div className="stat-card">
                <div className="stat-title">Gói Plus (150K)</div>
                <div className="stat-value purple">124</div>
              </div>
            </div>
          </section>
        )}
        
        {activeTab === 'payments' && (
           <section>
             <div className="section-header">
               <h2 className="section-title">Lịch sử thanh toán</h2>
               <p className="section-subtitle">Toàn bộ giao dịch nạp Token qua cổng thanh toán.</p>
             </div>
             <div className="data-table-container">
               <table className="cyber-table">
                 <thead>
                   <tr>
                     <th>Mã GD</th>
                     <th>Email</th>
                     <th>Số tiền</th>
                     <th>Trạng thái</th>
                   </tr>
                 </thead>
                 <tbody>
                   <tr>
                     <td>#TXN8829</td>
                     <td>tranb@example.com</td>
                     <td>150,000đ</td>
                     <td>Thành công</td>
                   </tr>
                 </tbody>
               </table>
             </div>
           </section>
        )}

        {activeTab === 'staff' && (
           <section>
             <div className="section-header">
               <h2 className="section-title">Quản lý Nhân viên</h2>
               <p className="section-subtitle">Danh sách Staff, trạng thái Online/Offline.</p>
             </div>
             <div className="data-table-container">
               <table className="cyber-table">
                 <thead>
                   <tr>
                     <th>ID</th>
                     <th>Tên nhân viên</th>
                     <th>Email</th>
                     <th>Vai trò</th>
                     <th>Trạng thái</th>
                   </tr>
                 </thead>
                 <tbody>
                   <tr>
                     <td>#STF001</td>
                     <td>Nguyễn Văn A</td>
                     <td>admin@miniseries.com</td>
                     <td>Admin</td>
                     <td><span style={{ color: '#86efac' }}>Online</span></td>
                   </tr>
                 </tbody>
               </table>
             </div>
           </section>
        )}
      </main>
    </div>
  );
}
