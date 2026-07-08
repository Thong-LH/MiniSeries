import "./FlyingPages.css";

export default function BookPortalBackground() {
  // Helper to render stars in background for deep space feeling
  const renderBackgroundStars = () => {
    const stars = [];
    for (let i = 0; i < 40; i++) {
      const style = {
        top: `${Math.random() * 100}%`,
        left: `${Math.random() * 100}%`,
        animationDelay: `${Math.random() * 8}s`,
        animationDuration: `${5 + Math.random() * 10}s`
      };
      stars.push(
        <div 
          key={i} 
          className="absolute w-[2px] h-[2px] bg-white rounded-full animate-pulse opacity-20" 
          style={style}
        />
      );
    }
    return stars;
  };

  // Helper to render magic sparks drifting slowly up the screen
  const renderFloatingSparks = () => {
    const sparks = [];
    const colors = [
      "rgba(251, 146, 60, 0.4)", // amber orange
      "rgba(56, 189, 248, 0.4)", // sky blue
      "rgba(253, 224, 71, 0.4)", // yellow gold
    ];
    const glows = [
      "rgba(251, 146, 60, 0.6)",
      "rgba(56, 189, 248, 0.6)",
      "rgba(253, 224, 71, 0.6)",
    ];
    for (let i = 0; i < 20; i++) {
      const size = 2 + Math.floor(Math.random() * 3); // 2px to 4px
      const colorIdx = Math.floor(Math.random() * colors.length);
      const style = {
        left: `${Math.random() * 100}%`,
        width: `${size}px`,
        height: `${size}px`,
        backgroundColor: colors[colorIdx],
        "--spark-opacity": 0.2 + Math.random() * 0.4,
        "--spark-drift-x": `${-30 + Math.random() * 60}px`,
        "--spark-glow": glows[colorIdx],
        animationDelay: `${Math.random() * 12}s`,
        animationDuration: `${12 + Math.random() * 10}s`
      } as React.CSSProperties;
      sparks.push(
        <div 
          key={`spark-${i}`} 
          className="floating-spark" 
          style={style}
        />
      );
    }
    return sparks;
  };

  return (
    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none scene-3d">
      {/* Background Nebulas */}
      <div className="absolute top-[25%] left-[20%] w-[600px] h-[600px] rounded-full bg-indigo-950/15 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[20%] right-[10%] w-[550px] h-[550px] rounded-full bg-purple-950/10 blur-[160px] pointer-events-none" />
      <div className="absolute top-[10%] left-[60%] w-[500px] h-[500px] rounded-full bg-sky-950/10 blur-[140px] pointer-events-none" />

      {renderBackgroundStars()}
      {renderFloatingSparks()}

      {/* Dynamic Faint Orbit Lines connecting Portals */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-80 z-0" viewBox="0 0 1920 1080" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
        {/* Orbit line 1 (Orange flow) */}
        <path 
          d="M 150 900 C 600 800, 300 300, 960 540 C 1620 780, 1320 200, 1770 180" 
          fill="none" 
          stroke="rgba(242, 125, 38, 0.85)" 
          strokeWidth="1.6" 
          strokeDasharray="6,12" 
          className="animate-orbit-dash-slow" 
        />
        {/* Orbit line 2 (Blue flow) */}
        <path 
          d="M 120 930 C 500 850, 450 250, 960 540 C 1470 830, 1420 230, 1800 150" 
          fill="none" 
          stroke="rgba(59, 130, 246, 0.8)" 
          strokeWidth="1.4" 
          strokeDasharray="4,8" 
          className="animate-orbit-dash-fast" 
        />
        {/* Additional faint orbital rings around center card */}
        <ellipse 
          cx="960" 
          cy="540" 
          rx="600" 
          ry="320" 
          fill="none" 
          stroke="rgba(255, 255, 255, 0.16)" 
          strokeWidth="0.8" 
          strokeDasharray="2,6" 
          transform="rotate(-15 960 540)"
        />
        <ellipse 
          cx="960" 
          cy="540" 
          rx="750" 
          ry="400" 
          fill="none" 
          stroke="rgba(255, 255, 255, 0.12)" 
          strokeWidth="0.8" 
          strokeDasharray="5,15" 
          transform="rotate(10 960 540)"
        />
      </svg>

      {/* Left Wing Decorative Constellation / Orbit Circle */}
      <div className="absolute left-[4vw] md:left-[6vw] top-[30vh] md:top-[38vh] w-[180px] h-[180px] pointer-events-none opacity-[0.4] md:opacity-[0.55] z-0 select-none">
        <svg viewBox="0 0 100 100" className="w-full h-full text-orange-400 animate-spin-slow">
          <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" strokeWidth="0.6" strokeDasharray="3,4" />
          <circle cx="50" cy="50" r="32" fill="none" stroke="currentColor" strokeWidth="0.4" />
          <circle cx="50" cy="50" r="18" fill="none" stroke="currentColor" strokeWidth="0.5" strokeDasharray="1,2" />
          <line x1="50" y1="4" x2="50" y2="96" stroke="currentColor" strokeWidth="0.3" strokeDasharray="2,2" />
          <line x1="4" y1="50" x2="96" y2="50" stroke="currentColor" strokeWidth="0.3" strokeDasharray="2,2" />
          <circle cx="18" cy="32" r="2.5" fill="currentColor" />
          <circle cx="82" cy="68" r="1.5" fill="currentColor" />
          <circle cx="50" cy="18" r="2" fill="currentColor" />
        </svg>
      </div>

      {/* Right Wing Decorative Constellation Map */}
      <div className="absolute right-[4vw] md:right-[6vw] top-[25vh] md:top-[32vh] w-[200px] h-[200px] pointer-events-none opacity-[0.38] md:opacity-[0.52] z-0 select-none">
        <svg viewBox="0 0 100 100" className="w-full h-full text-blue-400 animate-spin-reverse-slow">
          <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="0.5" strokeDasharray="4,6" />
          <path d="M 22 22 L 50 50 L 78 28 M 50 50 L 38 78 L 78 78" fill="none" stroke="currentColor" strokeWidth="0.4" strokeDasharray="2,3" />
          <circle cx="22" cy="22" r="2.5" fill="currentColor" className="animate-pulse" />
          <circle cx="50" cy="50" r="1.5" fill="currentColor" />
          <circle cx="78" cy="28" r="2" fill="currentColor" className="animate-pulse" style={{ animationDelay: '1s' }} />
          <circle cx="38" cy="78" r="3" fill="currentColor" className="animate-pulse" style={{ animationDelay: '2s' }} />
          <circle cx="78" cy="78" r="1.8" fill="currentColor" className="animate-pulse" style={{ animationDelay: '1.5s' }} />
        </svg>
      </div>

      {/* GLOWING OPEN BOOK (Bottom-Left - Orange Theme) */}
      <div className="absolute bottom-[-35px] md:bottom-[30px] left-[-120px] w-[450px] h-[450px] rounded-full bg-[#f27d26]/20 blur-[120px] animate-portal-pulse-orange pointer-events-none" />
      <div className="absolute bottom-[140px] left-6 md:bottom-[200px] md:left-12 z-10 select-none animate-float-gentle pointer-events-auto opacity-90 hover:opacity-100 transition-opacity duration-300">
        <div className="portal-book-container portal-book-orange">
          <div className="portal-book">
            {/* Spine */}
            <div className="portal-book-spine" />
            
            {/* Cover / Bìa dưới */}
            <div className="portal-book-bottom">
              <div className="portal-book-cover left" />
              <div className="portal-book-cover right" />
            </div>
            
            {/* Thickness / Mép giấy dày */}
            <div className="portal-book-edge">
              <div className="portal-book-edge-block left" />
              <div className="portal-book-edge-block right" />
            </div>
            
            {/* Pages / Trang giấy trên cùng */}
            <div className="portal-book-top">
              <div className="portal-book-left-page">
                <div className="portal-book-page-lines">
                  <div className="portal-book-page-line w-5/6" />
                  <div className="portal-book-page-line w-full" />
                  <div className="portal-book-page-line w-4/5" />
                  <div className="portal-book-page-line-accent w-2/3" />
                </div>
                <span className="text-[6px] font-mono text-orange-800/40 select-none">P. 12</span>
              </div>
              <div className="portal-book-right-page">
                <div className="portal-book-page-lines">
                  <div className="portal-book-page-line-accent w-11/12" />
                  <div className="portal-book-page-line w-4/5" />
                  <div className="portal-book-page-line w-full" />
                  <div className="portal-book-page-line w-3/4" />
                </div>
                <span className="text-[6px] font-mono text-orange-800/40 text-right select-none block">P. 13</span>
              </div>
            </div>
            
            {/* Magical glowing particle */}
            <div className="portal-book-magic-glow animate-pulse" />
          </div>
        </div>
      </div>

      {/* GLOWING OPEN BOOK (Top-Right - Blue Theme) */}
      <div className="absolute top-[-120px] right-[-120px] w-[450px] h-[450px] rounded-full bg-[#3b82f6]/20 blur-[120px] animate-portal-pulse-blue pointer-events-none" />
      <div className="absolute top-6 right-6 md:top-12 md:right-12 z-10 select-none animate-float-gentle pointer-events-auto opacity-90 hover:opacity-100 transition-opacity duration-300">
        <div className="portal-book-container portal-book-blue">
          <div className="portal-book">
            {/* Spine */}
            <div className="portal-book-spine" />
            
            {/* Cover / Bìa dưới */}
            <div className="portal-book-bottom">
              <div className="portal-book-cover left" />
              <div className="portal-book-cover right" />
            </div>
            
            {/* Thickness / Mép giấy dày */}
            <div className="portal-book-edge">
              <div className="portal-book-edge-block left" />
              <div className="portal-book-edge-block right" />
            </div>
            
            {/* Pages / Trang giấy trên cùng */}
            <div className="portal-book-top">
              <div className="portal-book-left-page">
                <div className="portal-book-page-lines">
                  <div className="portal-book-page-line w-5/6" />
                  <div className="portal-book-page-line w-full" />
                  <div className="portal-book-page-line w-4/5" />
                  <div className="portal-book-page-line-accent w-2/3" />
                </div>
                <span className="text-[6px] font-mono text-blue-800/40 select-none">P. 98</span>
              </div>
              <div className="portal-book-right-page">
                <div className="portal-book-page-lines">
                  <div className="portal-book-page-line-accent w-11/12" />
                  <div className="portal-book-page-line w-4/5" />
                  <div className="portal-book-page-line w-full" />
                  <div className="portal-book-page-line w-3/4" />
                </div>
                <span className="text-[6px] font-mono text-blue-800/40 text-right select-none block">P. 99</span>
              </div>
            </div>
            
            {/* Magical glowing particle */}
            <div className="portal-book-magic-glow animate-pulse" />
          </div>
        </div>
      </div>

      {/* Moving Interactive floating sheets */}
      <div className="absolute sheet-3d-1 pointer-events-auto hover:pause-animation opacity-75 hover:opacity-100 transition-opacity duration-300">
        <div className="flying-page">
          <div className="mini-page-lined">
            <div className="mini-margin-red"></div>
            <div className="mini-grade-badge-red">A+</div>
            <div className="mini-title-handwritten">physics quiz</div>
            <div className="mini-lined-content-lines">
              <div className="mini-notebook-line-checked">
                <span className="mini-check">✓</span>
                <div className="mini-notebook-line"></div>
              </div>
              <div className="mini-notebook-line-checked">
                <span className="mini-check">✓</span>
                <div className="mini-notebook-line"></div>
              </div>
              <div className="mini-notebook-line-checked">
                <span className="mini-check red">✗</span>
                <div className="mini-notebook-line short"></div>
              </div>
              <div className="mini-notebook-line-checked">
                <span className="mini-check">✓</span>
                <div className="mini-notebook-line"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute sheet-3d-2 pointer-events-auto opacity-75 hover:opacity-100 transition-opacity duration-300">
        <div className="flying-page">
          <div className="mini-page-grid">
            <div className="mini-formula-title">math formulas</div>
            <div className="mini-formula-body">
              <div className="formula-text">E = mc²</div>
              <svg viewBox="0 0 40 30" className="mini-formula-graph" fill="none" stroke="currentColor">
                <path d="M5 25h30M5 5v20M5 20c5-5 10-12 20-12" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute sheet-3d-3 pointer-events-auto opacity-75 hover:opacity-100 transition-opacity duration-300">
        <div className="flying-page">
          <div className="mini-page-script-graded">
            <div className="mini-grade-badge-red">10/10</div>
            <div className="mini-script-header">STORYBOARD</div>
            <div className="mini-storyboard-box">
              <svg viewBox="0 0 40 20" fill="none" stroke="currentColor" strokeWidth="1" className="doodle-svg-storyboard">
                <path d="M3 17l8-9 6 6 10-11 10 12M5 5a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="mini-script-action">PANEL 3 - CUT TO:</div>
          </div>
        </div>
      </div>

      {/* sheet-3d-4 (Chemistry Doodle) */}
      <div className="absolute sheet-3d-4 pointer-events-auto opacity-75 hover:opacity-100 transition-opacity duration-300">
        <div className="flying-page">
          <div className="mini-page-chemistry">
            <div className="mini-chem-title">organic chem</div>
            <div className="mini-chem-body">
              <div className="mini-chem-formula">C₆H₁₂O₆</div>
              <svg viewBox="0 0 30 30" className="mini-chem-doodle" fill="none" stroke="currentColor" strokeWidth="1.5">
                <polygon points="15,2 27,9 27,21 15,28 3,21 3,9" />
                <line x1="15" y1="2" x2="15" y2="8" />
                <line x1="27" y1="21" x2="21" y2="18.5" />
                <line x1="3" y1="21" x2="9" y2="18.5" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* sheet-3d-5 (Geography / Astronomy Doodle) */}
      <div className="absolute sheet-3d-5 pointer-events-auto opacity-75 hover:opacity-100 transition-opacity duration-300">
        <div className="flying-page">
          <div className="mini-page-geo">
            <div className="mini-geo-title">astronomy</div>
            <div className="mini-geo-body">
              <svg viewBox="0 0 30 30" className="mini-geo-doodle" fill="none" stroke="currentColor" strokeWidth="1.2">
                <circle cx="15" cy="15" r="10" strokeDasharray="3,3" />
                <circle cx="15" cy="15" r="4" fill="currentColor" />
                <circle cx="23" cy="9" r="2.5" fill="currentColor" />
                <circle cx="6" cy="19" r="1.5" fill="currentColor" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
