import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';

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
  const intervalRef = useRef<number | null>(null);

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

      // 5. 3D Book gentle tilt loop
      gsap.to(".css-book", {
        rotateX: 55, rotateZ: -10, y: -10, duration: 3, repeat: -1, yoyo: true, ease: "sine.inOut"
      });

      // 6. Flying pages spawner
      const symbols = ["✨", "💡", "🌱", "⚛️", "📚", "🎨", "🌟"];
      function spawnPage(initialProgress = 0) {
        const page = document.createElement("div");
        page.className = "flying-page";
        const sym = symbols[Math.floor(Math.random() * symbols.length)];
        page.innerHTML = `
            <div style="width:100%; height:4px; background:rgba(0,0,0,0.1); border-radius:2px;"></div>
            <div style="text-align:center; font-size:18px; color:#f59e0b; font-weight:bold;">${sym}</div>
            <div style="width:12px; height:2px; background:rgba(0,0,0,0.1);"></div>
        `;
        if (Math.random() > 0.5) page.classList.add("flipped");
        
        const orbitContainer = document.querySelector('.orbit-container');
        if (orbitContainer) {
            orbitContainer.appendChild(page);
        } else {
            document.body.appendChild(page);
        }

        const wrapper = document.querySelector(".css-book-wrapper");
        if (!wrapper) return;
        const rect = wrapper.getBoundingClientRect();
        
        let spawnX = rect.left + rect.width / 2;
        let spawnY = rect.top + 155;

        if (orbitContainer) {
            const orbitRect = orbitContainer.getBoundingClientRect();
            spawnX -= orbitRect.left;
            spawnY -= orbitRect.top;
        } else {
            spawnX += window.scrollX;
            spawnY += window.scrollY;
        }

        const driftX = (Math.random() - 0.5) * 300;
        const driftZ = (Math.random() - 0.5) * 300; // Z-depth for 3D intersection!

        gsap.set(page, {
            left: 0, top: 0, margin: 0, x: spawnX, y: spawnY, z: driftZ, xPercent: -50, yPercent: -50,
            rotationY: (Math.random() - 0.5) * 45, rotationZ: (Math.random() - 0.5) * 30, scale: 0.25
        });

        let targetY = -200;
        if (orbitContainer) {
            const orbitRect = orbitContainer.getBoundingClientRect();
            targetY = - (orbitRect.top + window.scrollY) - 200;
        }

        const rotXEnd = (Math.random() - 0.5) * 1440;
        const rotYEnd = (Math.random() - 0.5) * 1440;
        const rotZEnd = (Math.random() - 0.5) * 180;
        const scaleEnd = 0.8 + Math.random() * 0.5;
        
        const distance = spawnY - targetY; 
        const baseDuration = 15 + Math.random() * 10;
        const flyDuration = distance / (80 + Math.random() * 100);

        const flyTween = gsap.to(page, {
            y: targetY, rotationX: rotXEnd * (flyDuration / baseDuration), rotationY: rotYEnd * (flyDuration / baseDuration), rotationZ: rotZEnd * (flyDuration / baseDuration),
            duration: flyDuration, ease: "power1.out",
            onComplete: () => { if (page.parentNode) page.parentNode.removeChild(page); }
        });

        const xTween = gsap.to(page, { x: spawnX + driftX, duration: baseDuration, ease: "power2.out" });
        const scaleTween = gsap.fromTo(page, { scale: 0.25 }, { scale: scaleEnd, duration: 1.2, ease: "back.out(1.5)" });
        const opacityTween = gsap.fromTo(page, { opacity: 0 }, { opacity: 1, duration: 1.5, ease: "power1.inOut" });

        if (initialProgress > 0) {
            const visibleRatio = baseDuration / flyDuration;
            flyTween.progress(initialProgress * visibleRatio);
            xTween.progress(initialProgress);
            scaleTween.progress(1);
            opacityTween.progress(1);
        }

        page.addEventListener('mouseenter', () => {
            flyTween.pause(); xTween.pause();
            gsap.to(page, { scale: scaleEnd * 1.5, zIndex: 2000, duration: 0.3 });
        });
        page.addEventListener('mouseleave', () => {
            flyTween.play(); xTween.play();
            gsap.to(page, { scale: scaleEnd, zIndex: 1000, duration: 0.3 });
        });
      }

      for (let i = 0; i < 20; i++) spawnPage(Math.random());

      intervalRef.current = window.setInterval(() => {
          if (document.hidden) return;
          spawnPage();
      }, 350);

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
        if (intervalRef.current) window.clearInterval(intervalRef.current);
        document.querySelectorAll('.flying-page').forEach(el => el.remove());
    };
  }, []);

  return (
    <div className="home-container content-wrapper" ref={containerRef}>
      {/* Impeccable Side Accents */}
      <div className="side-accent side-left">
        <span className="accent-text">MINI SERIES // ENGINE</span>
        <div style={{ width: '1px', flex: 1, background: 'linear-gradient(to bottom, transparent, rgba(255,255,255,0.2), transparent)', margin: '20px 0' }}></div>
        <span className="accent-text" style={{ color: 'var(--sky-blue)' }}>V2.4.1</span>
      </div>
      <div className="side-accent side-right">
        <span className="accent-text" style={{ color: 'var(--soft-orange)' }}>ONLINE</span>
        <div style={{ width: '1px', flex: 1, background: 'linear-gradient(to bottom, transparent, rgba(255,255,255,0.2), transparent)', margin: '20px 0' }}></div>
        <span className="accent-text">GENERATIVE WORKFLOW</span>
      </div>

      {/* SECTION 1: HERO */}
      <section className="hero" id="hero">
        <h1 className="hero-title">MINI SERIES</h1>
        <p className="hero-subtitle">Turn Learning Into Animated Stories.</p>

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
          <h3>Idea → Script</h3>
          <p>Mọi câu chuyện vĩ đại đều bắt đầu từ một ý tưởng nhỏ bé. Nhập nội dung bài học của bạn vào dòng sông tri thức, AI sẽ chắp bút biến chúng thành một kịch bản lôi cuốn.</p>
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
          <h3>Script → Storyboard</h3>
          <p>Từng khung hình được phác thảo. Dòng chảy thị giác bắt đầu hình thành với bố cục truyện tranh chuyên nghiệp, nhân vật được định hình rõ nét.</p>
        </div>

        <div className="flow-page">
          <div className="visual-box">
            <div className="anim-screen">
              <div className="anim-ball"></div>
              <div className="play-btn-pulse"></div>
            </div>
          </div>
          <h3>Storyboard → Animation</h3>
          <p>Trang giấy không còn tĩnh lặng. Hiệu ứng động, âm thanh và voice over đưa câu chuyện bước ra đời thực, tạo thành một Mini Series hoàn chỉnh.</p>
        </div>
      </section>

      {/* SECTION 3: FEEDBACK */}
      <section className="feedback-section" id="feedback" style={{ padding: '50px 0' }}>
        <div className="orbit-container">
          <div className="orbit-ring">
            {reviews.map((r, i) => (
              <div className="review-card" style={{ transform: `rotateY(${i * 45}deg) translateZ(400px)` }} key={i}>
                <div className="quote-icon">❝</div>
                <p>"{r.text}"</p>
                <div className="review-author">
                  <span className="review-badge" style={{ background: r.badgeBg, color: r.badgeColor }}>{r.badge}</span>
                  <span className="review-name">— {r.author}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 4: THE FINAL BOOK */}
      <section className="final-section">
        <div className="final-content">
          <h2 className="final-title">Every Great Story<br/>Starts With One Page.</h2>
          <a href="/login" className="cta-btn">Create Your Own Mini Series</a>
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
    </div>
  );
}
