import { useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';
import FlyingPages from '../components/FlyingPages';

// Import Manga Assets
import new_chap1 from '../assets/manga_home/new_chap1.png';
import new_chap2 from '../assets/manga_home/new_chap2.png';
import new_chap3 from '../assets/manga_home/new_chap3.png';

// Import Video Assets
import video1 from '../assets/video_home/Nam_and_Minh_painting_together_202606101916.mp4';

gsap.registerPlugin(ScrollTrigger);

const reviews = [
  { text: "I never knew learning history could feel like being inside my favorite anime story!", author: "Kenji, 12", badge: "STUDENT FEEDBACK", badgeBg: "var(--sky-blue)", badgeColor: "var(--ink-black)" },
  { text: "The AI actually understood my weird dragon biology ideas and turned them into gorgeous storyboards.", author: "Sarah, 14", badge: "STUDENT FEEDBACK", badgeBg: "var(--sky-blue)", badgeColor: "var(--ink-black)" },
  { text: "This is the first time I actually wanted to do my science homework. It's absolute magic!", author: "Leo, 10", badge: "STUDENT FEEDBACK", badgeBg: "var(--sky-blue)", badgeColor: "var(--ink-black)" },
  { text: "Tạo ra một series hoạt hình ngắn về hệ mặt trời chưa bao giờ dễ dàng và trực quan đến thế!", author: "Minh, 15", badge: "STUDENT FEEDBACK", badgeBg: "var(--sky-blue)", badgeColor: "var(--ink-black)" },
  { text: "My students are absolutely obsessed with turning their essays into interactive visual novels.", author: "Ms. Clara", badge: "TEACHER REVIEW", badgeBg: "rgba(167, 139, 250, 0.2)", badgeColor: "#a78bfa" },
  { text: "The rendering speed is incredible. I generated a full 10-page manga in just minutes!", author: "Alex, 16", badge: "STUDENT FEEDBACK", badgeBg: "var(--sky-blue)", badgeColor: "var(--ink-black)" },
  { text: "Từ kịch bản văn bản khô khan trở thành những thước phim sống động. Khó tin nổi đây là AI.", author: "Hùng, 17", badge: "STUDENT FEEDBACK", badgeBg: "var(--sky-blue)", badgeColor: "var(--ink-black)" },
  { text: "The best tool for project-based learning. My kids love creating their own universes.", author: "David S.", badge: "PARENT REVIEW", badgeBg: "rgba(167, 139, 250, 0.2)", badgeColor: "#a78bfa" }
];

export default function Home() {
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const comparisonContainerRef = useRef<HTMLDivElement>(null);

  // (SelectedOption state removed to enable automatic simulation loop)

  const handleProtectedNavigation = (e: React.MouseEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (token && token.trim() !== '') {
      navigate('/studio');
    } else {
      navigate('/login');
    }
  };

  useEffect(() => {
    let ctx = gsap.context(() => {
      // 1. Hero Character Cards
      const cards = gsap.utils.toArray('.char-card');
      cards.forEach((card: any, i: number) => {
        gsap.from(card, {
          opacity: 0, scale: 0.5, duration: 1.2, delay: 0.2 + (i * 0.2), ease: "back.out(1.5)"
        });
        gsap.to(card, {
          yPercent: -20, duration: 2 + Math.random(), yoyo: true, repeat: -1, ease: "sine.inOut", delay: Math.random()
        });
        gsap.to(card, {
          scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: 1 },
          y: 80 * (i % 2 === 0 ? 1 : -1),
          rotation: (Math.random() - 0.5) * 20
        });
      });

      // 2. Flow Pages
      const flowPages = gsap.utils.toArray('.flow-page');
      flowPages.forEach((page: any) => {
        const line = page.querySelector('.branch-line');
        const content = page.querySelectorAll('h3, p');
        if (line) gsap.set(line, { opacity: 0 });
        gsap.set(content, { opacity: 0, y: 15 });
      });

      const tl = gsap.timeline({
        scrollTrigger: { trigger: ".flow-section", start: "top 60%", toggleActions: "play none none none" }
      });

      flowPages.forEach((page: any, i: number) => {
        const content = page.querySelectorAll('h3, p');
        const line = page.querySelector('.branch-line');
        tl.from(page, {
          x: () => {
            const rect = page.getBoundingClientRect();
            return (window.innerWidth / 2) - (rect.left + rect.width / 2);
          },
          y: 300, scale: 0.1, rotationY: 180, rotationZ: (i - 1) * 30, opacity: 0, duration: 1.0, ease: "back.out(1.2)"
        }, i * 0.4);
        tl.to(content, { opacity: 1, y: 0, duration: 0.5, stagger: 0.15 }, "-=0.3");
        if (line) tl.to(line, { opacity: 0.6, duration: 0.4 }, "<");
      });

      // 3. Duplicate Marquee Content
      const t1 = document.getElementById('track1-1');
      const t12 = document.getElementById('track1-2');
      if (t1 && t12 && t12.innerHTML === "") t12.innerHTML = t1.innerHTML;
      const t2 = document.getElementById('track2-1');
      const t22 = document.getElementById('track2-2');
      if (t2 && t22 && t22.innerHTML === "") t22.innerHTML = t2.innerHTML;

      // 4. Book emerge animation
      gsap.from(".css-book-wrapper", {
        scrollTrigger: { trigger: ".final-section", start: "top bottom", end: "bottom bottom", scrub: true },
        y: 150, scale: 0.95
      });

      // 4.5. Comparison Section Scroll Animation
      gsap.from(".comparison-info", {
        scrollTrigger: {
          trigger: ".comparison-section",
          start: "top 75%",
          toggleActions: "play none none none"
        },
        opacity: 0,
        x: -50,
        duration: 1,
        ease: "power2.out"
      });

      gsap.from(".comparison-container", {
        scrollTrigger: {
          trigger: ".comparison-section",
          start: "top 75%",
          toggleActions: "play none none none"
        },
        opacity: 0,
        x: 50,
        duration: 1,
        ease: "power2.out"
      });

      // 5. 3D Book gentle tilt loop
      gsap.to(".css-book", {
        rotateX: 55, rotateZ: -10, y: -10, duration: 3, repeat: -1, yoyo: true, ease: "sine.inOut"
      });

      function createFireflies() {
        const wrapper = document.querySelector(".css-book-wrapper");
        if (!wrapper) return;
        const colors = ['rgba(56, 189, 248, 0.8)', 'rgba(251, 146, 60, 0.8)', 'rgba(255, 255, 255, 0.8)'];
        for (let i = 0; i < 15; i++) {
          const firefly = document.createElement("div");
          firefly.className = "firefly";
          const color = colors[Math.floor(Math.random() * colors.length)];
          firefly.style.boxShadow = `0 0 12px 3px ${color}`;
          firefly.style.background = color.replace('0.8', '1');
          wrapper.appendChild(firefly);

          const startX = (Math.random() - 0.5) * 700;
          const startY = (Math.random() - 0.5) * 450;
          gsap.set(firefly, { x: startX, y: startY, opacity: 0, scale: Math.random() * 0.6 + 0.2 });
          gsap.to(firefly, { x: startX + (Math.random() - 0.5) * 120, y: startY + (Math.random() - 0.5) * 120, duration: 3 + Math.random() * 5, repeat: -1, yoyo: true, ease: "sine.inOut" });
          gsap.to(firefly, { opacity: Math.random() * 0.7 + 0.3, duration: 0.8 + Math.random() * 2, repeat: -1, yoyo: true, ease: "power1.inOut", delay: Math.random() * 2 });
        }
      }
      createFireflies();

    }, containerRef); // Scope GSAP to this component

    return () => {
      ctx.revert(); // Clean up GSAP animations
    };
  }, []);

  return (
    <div className="home-container content-wrapper" ref={containerRef}>
      {/* SECTION 1: HERO */}
      <section className="hero" id="hero">
        <h1 className="hero-title">MINI SERIES</h1>
        <p className="hero-subtitle">Turn Learning Into <span className="highlight-subtitle">Animated Stories</span>.</p>

        {/* Floating Character Cards */}
        <div className="char-card" style={{ top: '15%', left: '100px' }}>
          <div style={{ width: '40px', height: '40px', background: 'rgba(56,189,248,0.2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>🎨</div>
          <div style={{ flex: 1 }}>
            <div style={{ width: '80px', height: '6px', background: 'rgba(255,255,255,0.2)', borderRadius: '3px', marginBottom: '8px' }}></div>
            <div style={{ width: '50px', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px' }}></div>
          </div>
        </div>
        <div className="char-card" style={{ top: '25%', right: '100px' }}>
          <div style={{ width: '40px', height: '40px', background: 'rgba(251,146,60,0.2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>⚔️</div>
          <div style={{ flex: 1 }}>
            <div style={{ width: '90px', height: '6px', background: 'rgba(255,255,255,0.2)', borderRadius: '3px', marginBottom: '8px' }}></div>
            <div style={{ width: '40px', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px' }}></div>
          </div>
        </div>
        <div className="char-card" style={{ bottom: '15%', left: '140px' }}>
          <div style={{ width: '40px', height: '40px', background: 'rgba(167,139,250,0.2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>🐉</div>
          <div style={{ flex: 1 }}>
            <div style={{ width: '70px', height: '6px', background: 'rgba(255,255,255,0.2)', borderRadius: '3px', marginBottom: '8px' }}></div>
            <div style={{ width: '60px', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px' }}></div>
          </div>
        </div>
        <div className="char-card" style={{ bottom: '25%', right: '140px' }}>
          <div style={{ width: '40px', height: '40px', background: 'rgba(52,211,153,0.2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>✨</div>
          <div style={{ flex: 1 }}>
            <div style={{ width: '85px', height: '6px', background: 'rgba(255,255,255,0.2)', borderRadius: '3px', marginBottom: '8px' }}></div>
            <div style={{ width: '30px', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px' }}></div>
          </div>
        </div>
      </section>

      {/* SECTION 2: FLOW */}
      <section className="flow-section" id="flow">
        <div className="flow-page">
          <div className="branch-line"></div>
          <div className="visual-box">
            <div className="doc-icon">
              <div className="doc-line"></div>
              <div className="doc-line"></div>
              <div className="doc-line"></div>
              <div className="doc-line"></div>
            </div>
          </div>
          <h3>Ý tưởng → Kịch bản</h3>
          <p>Nhập bài học của bạn, AI sẽ tự động chuyển hóa thành một kịch bản lôi cuốn.</p>
        </div>

        <div className="flow-page">
          <div className="branch-line"></div>
          <div className="visual-box">
            <div className="story-grid">
              <div className="story-frame">
                <div className="story-shape-1"></div>
                <div className="story-shape-2"></div>
              </div>
              <div className="story-frame">
                <div className="story-shape-1"></div>
                <div className="story-shape-2"></div>
              </div>
              <div className="story-frame">
                <div className="story-shape-1"></div>
                <div className="story-shape-2"></div>
              </div>
            </div>
          </div>
          <h3>Kịch bản → Phân cảnh</h3>
          <p>Phác thảo câu chuyện dưới dạng khung tranh truyện tranh sinh động.</p>
        </div>

        <div className="flow-page">
          <div className="visual-box">
            <div className="anim-screen">
              <div className="anim-ball"></div>
              <div className="play-btn-pulse"></div>
            </div>
          </div>
          <h3>Phân cảnh → Hoạt hình</h3>
          <p>Thêm chuyển động và âm thanh để tạo nên thước phim Mini Series hoàn chỉnh.</p>
        </div>
      </section>

      {/* SECTION: INTERACTIVE COMPARISON */}
      <section className="comparison-section" id="comparison">
        <div className="comparison-grid">
          {/* Left Column: Styled Text Details (from screenshot) */}
          <div className="comparison-info">
            <span className="comparison-tag">TRỰC QUAN HÓA BÀI HỌC</span>
            <div className="comparison-cmd">/miniseries</div>
            <h2 className="comparison-display-title">Thổi hồn vào con chữ</h2>
            <p className="comparison-description">
              Biến lý thuyết khô khan thành truyện tranh, hoạt hình sống động, với quiz tương tác.
            </p>
            <div className="comparison-combines">
              <span className="combine-label">+ kết hợp với</span>
              <span className="pill">/manga</span>
              <span className="pill">/animation</span>
              <span className="pill">/soundtrack</span>
              <span className="pill">/quiz</span>
            </div>
          </div>

          {/* Right Column: Comparison Slider */}
          <div
            className="comparison-container"
            ref={comparisonContainerRef}
            style={{ '--split-percent': '50%' } as React.CSSProperties}
            onMouseMove={(e) => {
              const container = comparisonContainerRef.current;
              if (!container) return;
              container.classList.remove('returning');
              const rect = container.getBoundingClientRect();
              const x = e.clientX - rect.left;
              const percent = Math.max(0, Math.min(100, (x / rect.width) * 100));
              container.style.setProperty('--split-percent', `${percent}%`);
            }}
            onMouseLeave={() => {
              const container = comparisonContainerRef.current;
              if (!container) return;
              container.classList.add('returning');
              container.style.setProperty('--split-percent', '50%');
            }}
            onTouchMove={(e) => {
              const container = comparisonContainerRef.current;
              if (!container || e.touches.length === 0) return;
              container.classList.remove('returning');
              const rect = container.getBoundingClientRect();
              const x = e.touches[0].clientX - rect.left;
              const percent = Math.max(0, Math.min(100, (x / rect.width) * 100));
              container.style.setProperty('--split-percent', `${percent}%`);
            }}
            onTouchEnd={() => {
              const container = comparisonContainerRef.current;
              if (!container) return;
              container.classList.add('returning');
              container.style.setProperty('--split-percent', '50%');
            }}
          >
            {/* Script Layer (Background / Underlay) */}
            <div className="comparison-layer script-layer">
              <div className="script-content-plain">
                Lòng vị tha là phẩm chất đạo đức thể hiện sự bao dung, biết cảm thông và sẵn sàng tha thứ cho những lỗi lầm của người khác khi họ thực sự nhận ra sai sót và mong muốn sửa đổi. Người có lòng vị tha không chỉ giúp hàn gắn các mối quan hệ mà còn góp phần xây dựng môi trường sống nhân văn, đoàn kết và tích cực hơn.
              </div>
            </div>

            {/* Visual Layer (Foreground / Overlay) - clipped from left based on split-percent */}
            <div className="comparison-layer visual-layer">
              <div className="manga-page-wrapper">
                <div className="manga-grid">
                  {/* Left Cell: Automatic Simulation Animation Quiz */}
                  <div className="manga-cell quiz-cell">
                    <div className="quiz-container">
                      <div className="quiz-question">
                        Lòng vị tha mang lại giá trị gì cho cuộc sống?
                      </div>

                      <div className="quiz-options">
                        <div className="quiz-option-sim correct-option-sim">
                          <span className="quiz-option-text">A. Gắn kết & thấu hiểu nhau</span>
                        </div>
                        <div className="quiz-option-sim wrong-option-sim-1">
                          <span className="quiz-option-text">B. Dung túng hành vi sai trái</span>
                        </div>
                        <div className="quiz-option-sim wrong-option-sim-2">
                          <span className="quiz-option-text">C. Gây thêm nhiều mâu thuẫn</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Cell: Alternating Slideshow Loop (Manga & Video) */}
                  <div className="manga-cell slide-loop-cell">
                    <div className="slideshow-container">
                      {/* Slide 1: Manga 1 */}
                      <div className="slideshow-item manga-slide-item" style={{ animationDelay: '0s' }}>
                        <img src={new_chap1} className="slide-media manga-img" alt="Manga Page 1" />
                      </div>

                      {/* Slide 2: Manga 2 */}
                      <div className="slideshow-item manga-slide-item" style={{ animationDelay: '-12s' }}>
                        <img src={new_chap2} className="slide-media manga-img" alt="Manga Page 2" />
                      </div>

                      {/* Slide 3: Manga 3 */}
                      <div className="slideshow-item manga-slide-item" style={{ animationDelay: '-8s' }}>
                        <img src={new_chap3} className="slide-media manga-img" alt="Manga Page 3" />
                      </div>

                      {/* Slide 4: Video 1 */}
                      <div className="slideshow-item video-slide-item" style={{ animationDelay: '-4s' }}>
                        <div className="video-player-wrapper">
                          <video src={video1} autoPlay muted loop playsInline className="slide-media video-player" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>


            {/* Slider bar line */}
            <div className="slider-bar">
              <div className="slider-handle">
                <span className="slider-arrow-left">◀</span>
                <span className="slider-arrow-right">▶</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: FEEDBACK */}
      <section className="feedback-section" id="feedback" style={{ padding: '50px 0' }}>
        <div className="orbit-container">
          <div className="orbit-ring">
            {reviews.map((r, i) => (
              <div className="review-orbit-slot" style={{ transform: `rotateY(${i * 45}deg) translateZ(400px)` }} key={i}>
                <div className="review-card">
                  <div className="quote-icon">❝</div>
                  <p>"{r.text}"</p>
                  <div className="review-author">
                    <span className="review-badge" style={{ background: r.badgeBg, color: r.badgeColor }}>{r.badge}</span>
                    <span className="review-name">— {r.author}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 4: THE FINAL BOOK */}
      <section className="final-section">
        <div className="final-content">
          <h2 className="final-title">Bạn đã sẵn sàng?</h2>
          <Link to="/studio" onClick={handleProtectedNavigation} className="cta-btn">Tạo Mini Series của riêng bạn</Link>
        </div>
        <div className="book-container">
          <div className="css-book-wrapper">
            <div className="spawn-glow"></div>
            <div className="css-book">
              <div className="css-page left-page">
                <div className="book-bottom"></div>
                <div className="book-edge-top book-edge"></div>
                <div className="book-edge-bottom book-edge"></div>
                <div className="book-edge-side book-edge"></div>
                <div className="book-top" style={{ justifyContent: 'space-between', padding: '40px 30px' }}>
                  <div style={{ opacity: 0.4 }}>
                    <div style={{ height: '12px', background: 'rgba(0,0,0,0.1)', width: '85%', borderRadius: '6px', marginBottom: '20px' }}></div>
                    <div style={{ height: '12px', background: 'rgba(0,0,0,0.1)', width: '100%', borderRadius: '6px', marginBottom: '20px' }}></div>
                    <div style={{ height: '12px', background: 'rgba(0,0,0,0.1)', width: '90%', borderRadius: '6px', marginBottom: '20px' }}></div>
                    <div style={{ height: '12px', background: 'rgba(0,0,0,0.1)', width: '70%', borderRadius: '6px', marginBottom: '20px' }}></div>
                  </div>
                  <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 'bold', fontSize: '1.1rem', color: 'var(--sky-blue)' }}>
                    Mini Series
                  </div>
                </div>
              </div>
              <div className="css-page right-page">
                <div className="book-bottom"></div>
                <div className="book-edge-top book-edge"></div>
                <div className="book-edge-bottom book-edge"></div>
                <div className="book-edge-side book-edge"></div>
                <div className="book-top" style={{ padding: '40px 30px', justifyContent: 'center', alignItems: 'center' }}>
                  <div style={{ width: '80px', height: '80px', background: 'rgba(251, 146, 60, 0.15)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'inset 0 0 15px rgba(0,0,0,0.05)', marginBottom: '20px' }}>
                    <span style={{ fontSize: '32px' }}>✨</span>
                  </div>
                  <div style={{ width: '40px', height: '2px', background: 'rgba(0,0,0,0.1)' }}></div>
                </div>
              </div>
              <div className="css-spine" id="spine">
                <div className="css-spine-glow"></div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <FlyingPages />
    </div>
  );
}
