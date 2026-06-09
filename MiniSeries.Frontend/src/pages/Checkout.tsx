export default function Checkout() {
  return (
    <div style={{ padding: '60px 20px', textAlign: 'center', minHeight: '80vh', color: '#fff' }}>
      <h1 style={{ color: '#c084fc', marginBottom: '20px' }}>Thanh toán</h1>
      <p>Trang thanh toán đang được nâng cấp lên React...</p>
      <div style={{ marginTop: '40px', padding: '20px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', display: 'inline-block' }}>
        <h3 style={{ marginBottom: '10px' }}>Thông tin đơn hàng</h3>
        <p>Gói: Basic</p>
        <p>Giá: 150.000đ</p>
        <button style={{ 
          marginTop: '20px', 
          padding: '10px 20px', 
          background: '#a855f7', 
          border: 'none', 
          color: 'white', 
          borderRadius: '8px',
          cursor: 'pointer'
        }}>Xác nhận thanh toán</button>
      </div>
    </div>
  );
}
