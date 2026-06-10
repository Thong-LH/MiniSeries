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
        <h1>Chọn gói MiniSeries</h1>
        <p>Mỗi gói cấp số lượt generate trong 1 tháng. Một lượt được tính khi bạn phê duyệt script để hệ thống tạo media và quiz hoàn chỉnh.</p>
      </div>

      <div className="pricing-container">
        <div className="pricing-card">
          <div>
            <h3 className="plan-name" style={{ color: '#94a3b8' }}>Free</h3>
            <div className="price">0đ <span>/ tháng</span></div>
            <div className="quota">3 lượt generate / tháng</div>
            <ul className="features">
              <li>Trải nghiệm flow tạo MiniSeries cơ bản</li>
              <li>Tạo script, chapter, quiz và media</li>
              <li>Phù hợp để dùng thử</li>
            </ul>
          </div>
          <button className="btn-buy btn-free" disabled>Gói mặc định</button>
        </div>

        <div className="pricing-card popular">
          <span className="pricing-badge">Phổ biến</span>
          <div>
            <h3 className="plan-name" style={{ color: '#c084fc' }}>Basic</h3>
            <div className="price">150.000đ <span>/ tháng</span></div>
            <div className="quota">30 lượt generate / tháng</div>
            <ul className="features">
              <li>Phù hợp cho học sinh, sinh viên hoặc giáo viên dùng thường xuyên</li>
              <li>Ưu tiên cho nội dung manga và quiz</li>
              <li>Reset quota theo kỳ thanh toán</li>
            </ul>
          </div>
          <button className="btn-buy btn-premium" onClick={() => navigate('/checkout')}>Mua gói Basic</button>
        </div>

        <div className="pricing-card">
          <div>
            <h3 className="plan-name" style={{ color: '#fbbf24' }}>Premium</h3>
            <div className="price">300.000đ <span>/ tháng</span></div>
            <div className="quota">100 lượt generate / tháng</div>
            <ul className="features">
              <li>Dành cho người dùng tạo nhiều bài học</li>
              <li>Phù hợp cho video, manga và nội dung dài hơn</li>
              <li>Reset quota theo kỳ thanh toán</li>
            </ul>
          </div>
          <button className="btn-buy btn-premium" onClick={() => navigate('/checkout')} style={{ backgroundColor: '#eab308' }}>Mua gói Premium</button>
        </div>
      </div>
    </div>
  );
}
