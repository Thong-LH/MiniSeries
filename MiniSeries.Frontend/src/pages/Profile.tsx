export default function Profile() {
  return (
    <div style={{ padding: '60px 20px', textAlign: 'center', minHeight: '80vh', color: '#fff' }}>
      <h1 style={{ color: '#06b6d4', marginBottom: '20px' }}>Hồ sơ cá nhân</h1>
      <p>Trang hồ sơ cá nhân đang được nâng cấp lên React...</p>
      
      <div style={{ 
        marginTop: '40px', 
        padding: '30px', 
        background: 'rgba(255,255,255,0.05)', 
        borderRadius: '16px', 
        display: 'inline-block',
        border: '1px solid rgba(6, 182, 212, 0.3)',
        textAlign: 'left'
      }}>
        <h3 style={{ marginBottom: '20px', color: '#86efac' }}>Thông tin tài khoản</h3>
        <p style={{ marginBottom: '10px' }}><strong>Tên:</strong> Nguyễn Văn A</p>
        <p style={{ marginBottom: '10px' }}><strong>Email:</strong> nguyenvana@example.com</p>
        <p style={{ marginBottom: '10px' }}><strong>Token hiện có:</strong> 1500</p>
        <p style={{ marginBottom: '20px' }}><strong>Vai trò:</strong> Khách hàng</p>
        
        <button style={{ 
          padding: '10px 20px', 
          background: 'transparent', 
          border: '1px solid #06b6d4', 
          color: '#06b6d4', 
          borderRadius: '8px',
          cursor: 'pointer'
        }}>Chỉnh sửa thông tin</button>
      </div>
    </div>
  );
}
