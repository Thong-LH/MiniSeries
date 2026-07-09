import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './Pricing.css';

export default function Pricing() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let stars: any[] = [];
    let planets: any[] = [];
    const sun = { x: 0, y: 0, radius: 28, color: '#ec4899', glow: '#a855f7' };

    const initBackground = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      stars = [];
      for (let i = 0; i < 150; i++) {
        stars.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          radius: Math.random() * 1.2,
          alpha: Math.random()
        });
      }

      const baseOrbit = Math.min(canvas.width, canvas.height) * 0.35;
      
      planets = [
        { radius: 7, orbitX: baseOrbit * 0.7, orbitY: baseOrbit * 0.22, speed: 0.009, angle: 0, color: '#60a5fa' },
        { radius: 11, orbitX: baseOrbit * 1.2, orbitY: baseOrbit * 0.38, speed: 0.005, angle: 2.3, color: '#a78bfa' },
        { radius: 9, orbitX: baseOrbit * 1.7, orbitY: baseOrbit * 0.52, speed: 0.003, angle: 4.1, color: '#fbbf24' }
      ];
    };

    const drawSystem = () => {
      ctx.fillStyle = '#0a0817';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const centerX = canvas.width / 2;
      const centerY = canvas.height * 0.45;

      stars.forEach(star => {
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${star.alpha})`;
        ctx.fill();
        
        star.alpha += (Math.random() - 0.5) * 0.04;
        if (star.alpha < 0.1) star.alpha = 0.1;
        if (star.alpha > 0.9) star.alpha = 0.9;
      });

      planets.forEach(planet => {
        ctx.beginPath();
        ctx.ellipse(centerX, centerY, planet.orbitX, planet.orbitY, 0, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(168, 85, 247, 0.07)';
        ctx.lineWidth = 1;
        ctx.stroke();
      });

      ctx.save();
      ctx.shadowBlur = 40;
      ctx.shadowColor = sun.glow;
      ctx.beginPath();
      ctx.arc(centerX, centerY, sun.radius, 0, Math.PI * 2);
      ctx.fillStyle = sun.color;
      ctx.fill();
      ctx.restore();

      planets.forEach(planet => {
        const posX = centerX + Math.cos(planet.angle) * planet.orbitX;
        const posY = centerY + Math.sin(planet.angle) * planet.orbitY;

        const factor = (Math.sin(planet.angle) + 1.5) / 2.5;
        const dynamicRadius = planet.radius * (0.7 + factor * 0.5);

        ctx.save();
        ctx.shadowBlur = 15;
        ctx.shadowColor = planet.color;
        ctx.beginPath();
        ctx.arc(posX, posY, dynamicRadius, 0, Math.PI * 2);
        ctx.fillStyle = planet.color;
        ctx.fill();
        ctx.restore();

        planet.angle += planet.speed;
      });

      animationFrameId = requestAnimationFrame(drawSystem);
    };

    window.addEventListener('resize', initBackground);
    initBackground();
    drawSystem();

    return () => {
      window.removeEventListener('resize', initBackground);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="pricing-page">
      <canvas id="solar-system-bg" ref={canvasRef}></canvas>

      <div className="pricing-header">
        <h1>Bảng giá Nạp Token</h1>
        <p>Hạn mức lượt tạo nội dung cộng dồn vĩnh viễn và không bao giờ hết hạn. Bạn có thể nạp thêm bất kỳ lúc nào để tiếp tục sử dụng!</p>
      </div>

      <div className="pricing-container">
        <div className="pricing-card">
          <div>
            <h3 className="plan-name" style={{ color: '#94a3b8' }}>Free</h3>
            <div className="price">0đ</div>
            <div className="quota">3 truyện & 1 video</div>
            <ul className="features">
              <li>Tặng sẵn ngay khi đăng ký tài khoản mới</li>
              <li>Trải nghiệm đầy đủ các tính năng tạo bài học</li>
              <li>Dùng thử không giới hạn thời gian</li>
            </ul>
          </div>
          <button className="btn-buy btn-free" disabled>Gói mặc định</button>
        </div>

        <div className="pricing-card popular">
          <span className="pricing-badge">Phổ biến</span>
          <div>
            <h3 className="plan-name" style={{ color: '#c084fc' }}>Basic Pack</h3>
            <div className="price">150.000đ</div>
            <div className="quota" style={{ color: '#c084fc' }}>+30 truyện & +10 video</div>
            <ul className="features">
              <li>Cộng thêm 30 lượt Manga và 10 lượt Video</li>
              <li>Token cộng dồn vĩnh viễn, không hết hạn</li>
              <li>Quy đổi siêu tiết kiệm cho nhu cầu học tập</li>
            </ul>
          </div>
          <button className="btn-buy btn-premium" onClick={() => navigate('/checkout?plan=Basic&price=150000')}>Nạp gói Basic</button>
        </div>

        <div className="pricing-card">
          <div>
            <h3 className="plan-name" style={{ color: '#fbbf24' }}>Premium Pack</h3>
            <div className="price">300.000đ</div>
            <div className="quota" style={{ color: '#fbbf24' }}>+100 truyện & +50 video</div>
            <ul className="features">
              <li>Cộng thêm 100 lượt Manga và 50 lượt Video</li>
              <li>Tiết kiệm hơn 30% so với gói Basic</li>
              <li>Token cộng dồn vĩnh viễn, không hết hạn</li>
            </ul>
          </div>
          <button className="btn-buy btn-premium" onClick={() => navigate('/checkout?plan=Premium&price=300000')} style={{ backgroundColor: '#eab308' }}>Nạp gói Premium</button>
        </div>
      </div>

      <h2 style={{ textAlign: 'center', marginTop: '64px', marginBottom: '16px', color: '#fafafa', fontSize: '1.6rem', fontWeight: 700 }}>
        Mua lẻ từng lượt tạo (Pay-As-You-Go)
      </h2>
      <p style={{ textAlign: 'center', color: 'rgba(250, 250, 250, 0.5)', maxWidth: '600px', margin: '0 auto 36px auto', fontSize: '0.88rem', lineHeight: '1.6', padding: '0 20px' }}>
        Nếu bạn chỉ thiếu một vài lượt tạo và chưa cần nạp cả gói lớn, hãy mua lẻ từng lượt. Token mua lẻ vẫn được cộng dồn vĩnh viễn.
      </p>

      <div className="pricing-container" style={{ gridTemplateColumns: 'repeat(2, 1fr)', maxWidth: '780px', margin: '0 auto' }}>
        <div className="pricing-card" style={{ border: '1px solid rgba(20, 184, 166, 0.25)', background: 'linear-gradient(180deg, rgba(20, 184, 166, 0.02) 0%, rgba(9, 9, 11, 0.3) 100%)' }}>
          <div>
            <h3 className="plan-name" style={{ color: '#14b8a6' }}>Manga lẻ</h3>
            <div className="price" style={{ fontSize: '2rem' }}>7.000đ <span style={{ fontSize: '0.8rem' }}>/ 1 lượt</span></div>
            <div className="quota" style={{ color: '#14b8a6' }}>+1 lượt tạo Truyện tranh</div>
            <ul className="features">
              <li>Cộng thêm 1 lượt tạo Manga & Quiz</li>
              <li>Không giới hạn thời gian sử dụng</li>
              <li>Tự động kích hoạt sau khi chuyển khoản</li>
            </ul>
          </div>
          <button className="btn-buy" onClick={() => navigate('/checkout?plan=addon_manga_1&price=7000')} style={{ background: 'linear-gradient(90deg, #14b8a6, #0d9488)', border: 'none', color: '#09090b', fontWeight: 700 }}>
            Mua 1 lượt Manga
          </button>
        </div>

        <div className="pricing-card" style={{ border: '1px solid rgba(56, 189, 248, 0.25)', background: 'linear-gradient(180deg, rgba(56, 189, 248, 0.02) 0%, rgba(9, 9, 11, 0.3) 100%)' }}>
          <div>
            <h3 className="plan-name" style={{ color: '#38bdf8' }}>Video lẻ</h3>
            <div className="price" style={{ fontSize: '2rem' }}>20.000đ <span style={{ fontSize: '0.8rem' }}>/ 1 lượt</span></div>
            <div className="quota" style={{ color: '#38bdf8' }}>+1 lượt tạo Video</div>
            <ul className="features">
              <li>Cộng thêm 1 lượt tạo Video & Quiz</li>
              <li>Sử dụng mô hình AI chất lượng cao</li>
              <li>Không giới hạn thời gian sử dụng</li>
            </ul>
          </div>
          <button className="btn-buy" onClick={() => navigate('/checkout?plan=addon_video_1&price=20000')} style={{ background: 'linear-gradient(90deg, #38bdf8, #0284c7)', border: 'none', color: '#09090b', fontWeight: 700 }}>
            Mua 1 lượt Video
          </button>
        </div>
      </div>
    </div>
  );
}
