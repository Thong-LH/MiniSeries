import { useEffect } from 'react';
import gsap from 'gsap';
import './FlyingPages.css';

const subjects = ['Math', 'Physics', 'Science', 'History', 'English', 'Biology', 'Quiz', 'Manga', 'Script', 'Stats'];
const grades = ['A+', 'A', 'A-', 'B+', 'B', '10/10', '9.5/10', '9/10', '8.5/10', '8/10', '7/10', 'F-'];

export default function FlyingPages() {
  useEffect(() => {
    let accumulatedTime = 0;
    const activeTweens: (gsap.core.Tween | gsap.core.Timeline)[] = [];
    const spawnedPages: HTMLDivElement[] = [];

    function spawnPage(initialProgress = 0) {
      const page = document.createElement('div');
      page.className = 'flying-page';

      // Pick a random template variant from 0 to 7
      const variant = Math.floor(Math.random() * 8);
      const subject = subjects[Math.floor(Math.random() * subjects.length)];
      const grade = grades[Math.floor(Math.random() * grades.length)];
      const badgeClass = grade.length > 2 ? 'mini-grade-badge-red wide' : 'mini-grade-badge-red';
      let contentHtml = '';

      if (variant === 0) {
        // Variant 0: Formula Page (Graph Paper, E=mc² and math graph)
        contentHtml = `
          <div class="mini-page-grid">
            <div class="mini-formula-title">${subject.toLowerCase()} formulas</div>
            <div class="mini-formula-body">
              <div class="formula-text">E = mc²</div>
              <svg viewBox="0 0 40 30" class="mini-formula-graph" fill="none" stroke="currentColor">
                <path d="M5 25h30M5 5v20M5 20c5-5 10-12 20-12" stroke-width="1.5" stroke-linecap="round"/>
              </svg>
            </div>
          </div>
        `;
      } else if (variant === 1) {
        // Variant 1: Manga Panel Draft Page (Comic panels with 3 stick figures, speech bubble)
        contentHtml = `
          <div class="mini-page-manga">
            <div class="manga-panel panel-top">
              <svg viewBox="0 0 40 30" fill="none" stroke="currentColor" stroke-width="1.2" style="width: 30px; height: 22px; color: #475569;">
                <!-- Stick Figure 1 (Left) -->
                <circle cx="10" cy="8" r="3.5"/>
                <path d="M10 11.5v8M6 14h8M10 19.5l-3.5 5.5M10 19.5l3.5 5.5" stroke-linecap="round"/>
                
                <!-- Stick Figure 2 (Middle, waving arm) -->
                <circle cx="20" cy="8" r="3.5"/>
                <path d="M20 11.5v8M15 14h5l3.5-3.5M20 19.5l-3.5 5.5M20 19.5l3.5 5.5" stroke-linecap="round"/>
                
                <!-- Stick Figure 3 (Right) -->
                <circle cx="30" cy="10" r="2.8"/>
                <path d="M30 12.8v6.5M26.5 15h7M30 19.3l-2.5 5.2M30 19.3l2.5 5.2" stroke-linecap="round"/>
              </svg>
            </div>
            <div class="manga-panel-row">
              <div class="manga-panel panel-left">
                <div class="speech-bubble">?!</div>
              </div>
              <div class="manga-panel panel-right"></div>
            </div>
          </div>
        `;
      } else if (variant === 2) {
        // Variant 2: Graded Lined Notebook Page (With Grade, blue lines, and teacher checks)
        contentHtml = `
          <div class="mini-page-lined">
            <div class="mini-margin-red"></div>
            <div class="${badgeClass}">${grade}</div>
            <div class="mini-title-handwritten">${subject.toLowerCase()} quiz</div>
            <div class="mini-lined-content-lines">
              <div class="mini-notebook-line-checked">
                <span class="mini-check">✓</span>
                <div class="mini-notebook-line"></div>
              </div>
              <div class="mini-notebook-line-checked">
                <span class="mini-check">✓</span>
                <div class="mini-notebook-line"></div>
              </div>
              <div class="mini-notebook-line-checked">
                <span class="mini-check red">✗</span>
                <div class="mini-notebook-line short"></div>
              </div>
              <div class="mini-notebook-line-checked">
                <span class="mini-check">✓</span>
                <div class="mini-notebook-line"></div>
              </div>
            </div>
          </div>
        `;
      } else if (variant === 3) {
        // Variant 3: Concept Map / Idea Page (No Grade, grid lines, concept connection)
        contentHtml = `
          <div class="mini-page-grid">
            <div class="mini-title-handwritten">ideas:</div>
            <div class="mini-grid-content">
              <div style="display: flex; align-items: center; justify-content: center; margin: 2px 0;">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="width: 14px; height: 14px; color: #fb923c;">
                  <path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-6 6c0 2.2 1.2 4.1 3 5.2v2.8h6v-2.8c1.8-1.1 3-3 3-5.2a6 6 0 0 0-6-6z" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
              <div style="font-size: 5px; text-align: center; font-weight: bold; color: #475569;">
                Concept <span class="mini-arrow">→</span> Story
              </div>
            </div>
          </div>
        `;
      } else if (variant === 4) {
        // Variant 4: Graded Storyboard Draft (With Grade, typewriter text, and landscape sketch)
        contentHtml = `
          <div class="mini-page-script-graded">
            <div class="${badgeClass}">${grade}</div>
            <div class="mini-script-header">STORYBOARD</div>
            <div class="mini-storyboard-box">
              <svg viewBox="0 0 40 20" fill="none" stroke="currentColor" stroke-width="1" class="doodle-svg-storyboard">
                <path d="M3 17l8-9 6 6 10-11 10 12M5 5a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <div class="mini-script-action">PANEL 3 - CUT TO:</div>
          </div>
        `;
      } else if (variant === 5) {
        // Variant 5: Bar Chart Page (Grid Paper, Math stats, hand-drawn columns)
        contentHtml = `
          <div class="mini-page-grid">
            <div class="mini-formula-title">${subject.toLowerCase()} stats</div>
            <div class="mini-formula-body">
              <svg viewBox="0 0 40 30" class="mini-bar-chart" fill="none" stroke="currentColor" stroke-width="1.2">
                <path d="M5 5v20h30" stroke-linecap="round" stroke-linejoin="round"/>
                <rect x="9" y="15" width="5" height="10" fill="rgba(56, 189, 248, 0.2)" stroke-linecap="round" stroke-linejoin="round"/>
                <rect x="18" y="9" width="5" height="16" fill="rgba(251, 146, 60, 0.2)" stroke-linecap="round" stroke-linejoin="round"/>
                <rect x="27" y="17" width="5" height="8" fill="rgba(34, 211, 250, 0.2)" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
          </div>
        `;
      } else if (variant === 6) {
        // Variant 6: Pie Chart Page (Grid Paper, Data pie chart with slices)
        contentHtml = `
          <div class="mini-page-grid">
            <div class="mini-formula-title">${subject.toLowerCase()} data</div>
            <div class="mini-formula-body">
              <svg viewBox="0 0 30 30" class="mini-pie-chart" fill="none" stroke="currentColor" stroke-width="1.2">
                <circle cx="15" cy="15" r="10" stroke-linecap="round"/>
                <path d="M15 15l7-7M15 15v-10M15 15l-9 5" stroke-linecap="round"/>
                <path d="M15 15l7-7A10 10 0 0 0 15 5v10" fill="rgba(251, 146, 60, 0.25)"/>
                <path d="M15 15v-10A10 10 0 0 0 6 20l9-5" fill="rgba(56, 189, 248, 0.25)"/>
              </svg>
            </div>
          </div>
        `;
      } else {
        // Variant 7: Pure Lined Note Page (Notebook lines/stripes with a simple title 'notes', no grade)
        contentHtml = `
          <div class="mini-page-lined">
            <div class="mini-margin-red"></div>
            <div class="mini-title-handwritten">notes</div>
            <div class="mini-lined-content-lines">
              <div class="mini-notebook-line"></div>
              <div class="mini-notebook-line"></div>
              <div class="mini-notebook-line"></div>
              <div class="mini-notebook-line"></div>
              <div class="mini-notebook-line"></div>
              <div class="mini-notebook-line"></div>
            </div>
          </div>
        `;
      }

      page.innerHTML = contentHtml;

      if (Math.random() > 0.5) {
        page.classList.add('flipped');
      }

      const orbitContainer = document.querySelector('.orbit-container');
      if (orbitContainer) {
        orbitContainer.appendChild(page);
      } else {
        document.body.appendChild(page);
      }
      spawnedPages.push(page);

      const wrapper = document.querySelector('.css-book-wrapper');
      if (!wrapper) return;
      const rect = wrapper.getBoundingClientRect();

      const initialOffset = (Math.random() - 0.5) * 120;
      let spawnX = rect.left + rect.width / 2 + initialOffset;
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
      const driftZ = (Math.random() - 0.5) * 300;

      gsap.set(page, {
        left: 0,
        top: 0,
        margin: 0,
        x: spawnX,
        y: spawnY,
        z: driftZ,
        xPercent: -50,
        yPercent: -50,
        rotationY: (Math.random() - 0.5) * 45,
        rotationZ: (Math.random() - 0.5) * 30,
        scale: 0.25
      });

      let targetY = -200;
      if (orbitContainer) {
        const orbitRect = orbitContainer.getBoundingClientRect();
        targetY = -(orbitRect.top + window.scrollY) - 200;
      }

      const rotXEnd = (Math.random() - 0.5) * 1440;
      const rotYEnd = (Math.random() - 0.5) * 1440;
      const rotZEnd = (Math.random() - 0.5) * 180;
      const scaleEnd = 1.1 + Math.random() * 0.4;

      const distance = spawnY - targetY;
      const speed = 90 + Math.random() * 130; // Faster speed range (90 to 220 px/s)
      const flyDuration = distance / speed; // Constant speed duration for this specific page
      const baseDuration = flyDuration; // Synchronize baseDuration exactly

      const flyTimeline = gsap.timeline();

      flyTimeline.to(page, {
        y: targetY,
        rotationX: rotXEnd * (flyDuration / baseDuration),
        rotationY: rotYEnd * (flyDuration / baseDuration),
        rotationZ: rotZEnd * (flyDuration / baseDuration),
        duration: flyDuration,
        ease: 'none', // Strict linear speed
        onComplete: () => {
          if (page.parentNode) page.parentNode.removeChild(page);
          const index = spawnedPages.indexOf(page);
          if (index > -1) spawnedPages.splice(index, 1);
        }
      }, 0);

      flyTimeline.fromTo(page, { scale: 0.25 }, {
        scale: scaleEnd,
        duration: 1.2,
        ease: 'back.out(1.5)'
      }, 0);

      flyTimeline.to(page, {
        scale: scaleEnd * 0.65, // Scale down to 65% at the top to counteract perspective scaling
        duration: flyDuration - 1.2,
        ease: 'none'
      }, 1.2);

      const xTween = gsap.to(page, {
        x: spawnX + driftX,
        duration: flyDuration, // Keep the synchronized horizontal duration!
        ease: 'none' // Keep the linear ease!
      });

      const opacityTween = gsap.fromTo(page, { opacity: 0 }, {
        opacity: 1,
        duration: 1.5,
        ease: 'power1.inOut'
      });

      activeTweens.push(flyTimeline, xTween, opacityTween);

      if (initialProgress > 0) {
        const visibleRatio = baseDuration / flyDuration;
        flyTimeline.progress(initialProgress * visibleRatio);
        xTween.progress(initialProgress);
        opacityTween.progress(1);
      }

      page.addEventListener('mouseenter', () => {
        flyTimeline.pause();
        xTween.pause();
        gsap.to(page, { scale: scaleEnd * 1.5, zIndex: 2000, duration: 0.3 });
      });
      page.addEventListener('mouseleave', () => {
        flyTimeline.play();
        xTween.play();
        gsap.to(page, { scale: scaleEnd, zIndex: 1000, duration: 0.3 });
      });
    }

    for (let i = 0; i < 20; i++) {
      spawnPage(Math.random());
    }

    const tickHandler = (_time: number, deltaTime: number) => {
      accumulatedTime += deltaTime;
      if (accumulatedTime >= 350) {
        spawnPage();
        accumulatedTime = 0;
      }
    };

    gsap.ticker.add(tickHandler);

    return () => {
      gsap.ticker.remove(tickHandler);
      activeTweens.forEach(t => t.kill());
      spawnedPages.forEach(el => {
        if (el.parentNode) el.parentNode.removeChild(el);
      });
    };
  }, []);

  return null;
}
