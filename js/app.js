/* ==========================================================================
   SIKHSAATHI — DIRECTIONAL TEXT ASSEMBLY & PINNED STORYTELLING SCRIPT
   Lenis Smooth Scroll + Opposite Direction Text Assembly + Scroll-Synced Folder
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  'use strict';

  // --- 1. LENIS SMOOTH SCROLL INITIALIZATION ---
  const lenis = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    orientation: 'vertical',
    gestureOrientation: 'vertical',
    smoothWheel: true,
    wheelMultiplier: 1.0,
    touchMultiplier: 2.0
  });

  window.lenis = lenis;

  function raf(time) {
    lenis.raf(time);
    requestAnimationFrame(raf);
  }
  requestAnimationFrame(raf);

  // Synchronize Lenis with GSAP ScrollTrigger
  if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);

    lenis.on('scroll', ScrollTrigger.update);

    gsap.ticker.add((time) => {
      lenis.raf(time * 1000);
    });

    gsap.ticker.lagSmoothing(0);
  }

  // --- 2. AMBIENT RADIAL CENTER COLOR MORPH ON SCROLL ---
  const ambientBg = document.getElementById('ambient-bg-glow');
  const slides = document.querySelectorAll('.story-pinned-slide');

  const slideGradients = {
    'hero-slide': 'radial-gradient(circle at 50% 50%, rgba(91, 92, 226, 0.05) 0%, rgba(255, 255, 255, 0) 70%)',
    'problem-slide': 'radial-gradient(circle at 50% 50%, rgba(100, 104, 118, 0.06) 0%, rgba(255, 255, 255, 0) 70%)',
    'marks-slide': 'radial-gradient(circle at 50% 50%, rgba(91, 92, 226, 0.08) 0%, rgba(255, 255, 255, 0) 70%)',
    'shift-slide': 'radial-gradient(circle at 50% 50%, rgba(91, 92, 226, 0.12) 0%, rgba(248, 248, 255, 0) 75%)',
    'how-slide': 'radial-gradient(circle at 50% 50%, rgba(25, 184, 107, 0.06) 0%, rgba(255, 255, 255, 0) 70%)',
    'mistakes-slide': 'radial-gradient(circle at 50% 50%, rgba(91, 92, 226, 0.10) 0%, rgba(255, 255, 255, 0) 70%)',
    'mentor-slide': 'radial-gradient(circle at 50% 50%, rgba(91, 92, 226, 0.15) 0%, rgba(13, 14, 20, 0) 80%)',
    'revision-slide': 'radial-gradient(circle at 50% 50%, rgba(25, 184, 107, 0.06) 0%, rgba(255, 255, 255, 0) 70%)',
    'stakeholders-slide': 'radial-gradient(circle at 50% 50%, rgba(91, 92, 226, 0.05) 0%, rgba(255, 255, 255, 0) 70%)',
    'promise-slide': 'radial-gradient(circle at 50% 50%, rgba(91, 92, 226, 0.12) 0%, rgba(255, 255, 255, 0) 75%)'
  };

  slides.forEach((slide) => {
    const id = slide.getAttribute('id');
    if (slideGradients[id] && ambientBg) {
      ScrollTrigger.create({
        trigger: slide,
        start: 'top 50%',
        end: 'bottom 50%',
        onEnter: () => { ambientBg.style.background = slideGradients[id]; },
        onEnterBack: () => { ambientBg.style.background = slideGradients[id]; }
      });
    }
  });

  // --- 3. AMBIENT MOUSE CURSOR GLOW ---
  const cursorGlow = document.createElement('div');
  cursorGlow.className = 'cursor-glow';
  document.body.appendChild(cursorGlow);

  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;
  let cursorX = mouseX;
  let cursorY = mouseY;

  window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });

  function animateCursor() {
    cursorX += (mouseX - cursorX) * 0.12;
    cursorY += (mouseY - cursorY) * 0.12;
    cursorGlow.style.left = `${cursorX}px`;
    cursorGlow.style.top = `${cursorY}px`;
    requestAnimationFrame(animateCursor);
  }
  animateCursor();

  // --- 4. GSAP PINNED DIRECTIONAL ASSEMBLY TIMELINES ---
  if (typeof gsap !== 'undefined') {

    // SLIDE 01: HERO (Intro reveal)
    const heroTl = gsap.timeline({ defaults: { ease: 'power4.out', duration: 1.2 } });
    heroTl
      .from('#hero-slide .eyebrow', { opacity: 0, y: -20, delay: 0.1 })
      .from('#hero-slide .from-left', { x: -200, opacity: 0, filter: 'blur(12px)' }, '-=0.9')
      .from('#hero-slide .from-right', { x: 200, opacity: 0, filter: 'blur(12px)' }, '-=1.0')
      .from('#hero-slide .lead-text', { opacity: 0, y: 25 }, '-=0.8')
      .from('#hero-slide .hero-cta-wrap', { opacity: 0, y: 20 }, '-=0.8');

    const isMobile = window.matchMedia('(max-width: 768px)').matches;

    // SLIDE 02: THE PROBLEM (Text from different directions -> Pinned -> 4 Statements Scrub)
    const problemTl = gsap.timeline({
      scrollTrigger: {
        trigger: '#problem-slide',
        start: 'top top',
        end: isMobile ? '+=100%' : '+=300%',
        pin: true,
        scrub: 1
      }
    });

    problemTl
      .from('#problem-slide .eyebrow', { opacity: 0, y: -15, duration: 0.4 }, 0)
      .from('#problem-slide .from-left', { x: isMobile ? -100 : -250, opacity: 0, filter: 'blur(14px)', duration: 0.8 }, 0)
      .from('#problem-slide .from-right', { x: isMobile ? 100 : 250, opacity: 0, filter: 'blur(14px)', duration: 0.8 }, 0)
      .from('#problem-slide .lead-text', { opacity: 0, y: 25, duration: 0.6 }, 0.4)
      .from('#problem-slide .slide-secondary-content', { opacity: 0, y: 40, duration: 0.6 }, 0.6);

    const problemCards = document.querySelectorAll('.problem-single-card');
    problemCards.forEach((card, i) => {
      if (i > 0) {
        problemTl
          .to(problemCards[i - 1], { opacity: 0, scale: 0.94, y: -30, duration: 0.6 })
          .to(card, { opacity: 1, scale: 1, y: 0, duration: 0.8 }, '-=0.2');
      } else {
        gsap.set(card, { opacity: 1, scale: 1, y: 0 });
      }
    });

    // SLIDE 03: WHY MARKS ARE NOT ENOUGH (Text Assembles -> Pinned -> Score Unpacks)
    const marksTl = gsap.timeline({
      scrollTrigger: {
        trigger: '#marks-slide',
        start: 'top top',
        end: isMobile ? '+=90%' : '+=200%',
        pin: true,
        scrub: 1
      }
    });

    marksTl
      .from('#marks-slide .eyebrow', { opacity: 0, y: -15, duration: 0.4 }, 0)
      .from('#marks-slide .from-left', { x: isMobile ? -100 : -250, opacity: 0, filter: 'blur(14px)', duration: 0.8 }, 0)
      .from('#marks-slide .from-right', { x: isMobile ? 100 : 250, opacity: 0, filter: 'blur(14px)', duration: 0.8 }, 0)
      .from('#marks-slide .from-bottom', { y: 60, scale: 0.8, opacity: 0, filter: 'blur(12px)', duration: 0.8 }, 0.2)
      .from('#marks-slide .slide-secondary-content', { opacity: 0, scale: 0.94, y: 50, duration: 1 }, 0.8)
      .from('#marks-slide .score-big-num', { scale: 0.8, opacity: 0, duration: 0.6 }, 1.0)
      .from('#marks-slide .score-topic-row', { opacity: 0, x: 30, stagger: 0.15, duration: 0.8 }, 1.2)
      .from('#marks-slide .score-topic-bar-fill', { width: '0%', duration: 1 }, 1.4);

    // SLIDE 04: THE SHIFT (Text Assembles -> Pinned -> Badges & narrative reveal)
    const shiftTl = gsap.timeline({
      scrollTrigger: {
        trigger: '#shift-slide',
        start: 'top top',
        end: isMobile ? '+=80%' : '+=150%',
        pin: true,
        scrub: 1
      }
    });

    shiftTl
      .from('#shift-slide .eyebrow', { opacity: 0, y: -15, duration: 0.4 }, 0)
      .from('#shift-slide .from-left', { x: isMobile ? -100 : -250, opacity: 0, filter: 'blur(14px)', duration: 0.8 }, 0)
      .from('#shift-slide .from-right', { x: isMobile ? 100 : 250, opacity: 0, filter: 'blur(14px)', duration: 0.8 }, 0)
      .from('#shift-slide .lead-text', { opacity: 0, y: 25, duration: 0.6 }, 0.4)
      .from('#shift-slide .slide-secondary-content', { opacity: 0, y: 30, duration: 0.8 }, 0.7);

    // SLIDE 05: HOW IT WORKS (Text Assembles -> Pinned -> 7 Steps Scrub)
    const howTl = gsap.timeline({
      scrollTrigger: {
        trigger: '#how-slide',
        start: 'top top',
        end: isMobile ? '+=120%' : '+=380%',
        pin: true,
        scrub: 1
      }
    });

    howTl
      .from('#how-slide .eyebrow', { opacity: 0, y: -15, duration: 0.4 }, 0)
      .from('#how-slide .from-left', { x: isMobile ? -100 : -250, opacity: 0, filter: 'blur(14px)', duration: 0.8 }, 0)
      .from('#how-slide .from-right', { x: isMobile ? 100 : 250, opacity: 0, filter: 'blur(14px)', duration: 0.8 }, 0)
      .from('#how-slide .slide-secondary-content', { opacity: 0, y: 40, duration: 0.6 }, 0.6);

    const stepCards = document.querySelectorAll('.step-story-card');
    stepCards.forEach((card, i) => {
      if (i > 0) {
        howTl
          .to(stepCards[i - 1], { opacity: 0, scale: 0.94, y: -30, duration: 0.5 })
          .to(card, { opacity: 1, scale: 1, y: 0, duration: 0.8 }, '-=0.2');
      } else {
        gsap.set(card, { opacity: 1, scale: 1, y: 0 });
      }
    });

    // SLIDE 06: MISTAKE SIGNALS (Directional Text Assembly -> Pinned -> Scroll-Synced 3D Folder & File Extraction)
    const frontFlap = document.querySelector('#mistakes-slide .folder__front');
    const paper1 = document.querySelector('#mistakes-slide .paper-1');
    const paper2 = document.querySelector('#mistakes-slide .paper-2');
    const paper3 = document.querySelector('#mistakes-slide .paper-3');

    // Initial state of papers inside closed folder
    gsap.set([paper1, paper2, paper3], { x: 0, y: 0, rotation: 0, opacity: 0, scale: 0.75 });

    const p1TargetX = isMobile ? -30 : -310;
    const p1TargetY = isMobile ? -65 : -130;
    const p2TargetY = isMobile ? -120 : -210;
    const p3TargetX = isMobile ? 30 : 310;
    const p3TargetY = isMobile ? -65 : -130;

    const mistakesTl = gsap.timeline({
      scrollTrigger: {
        trigger: '#mistakes-slide',
        start: 'top top',
        end: isMobile ? '+=100%' : '+=350%',
        pin: true,
        scrub: 1
      }
    });

    // 1. Text Assembles & closed folder rises into center
    mistakesTl
      .from('#mistakes-slide .eyebrow', { opacity: 0, y: -15, duration: 0.4 }, 0)
      .from('#mistakes-slide .from-left', { x: -250, opacity: 0, filter: 'blur(14px)', duration: 0.8 }, 0)
      .from('#mistakes-slide .from-right', { x: 250, opacity: 0, filter: 'blur(14px)', duration: 0.8 }, 0)
      .from('#mistakes-slide .lead-text', { opacity: 0, y: 25, duration: 0.6 }, 0.4)
      .from('#mistakes-slide .folder-interactive-wrap', { opacity: 0, y: 140, scale: 0.85, duration: 0.9 }, 0.4);

    // 2. Folder front flap opens
    if (frontFlap) {
      mistakesTl.to(frontFlap, { skewX: 16, scaleY: 0.42, duration: 0.6, ease: 'power2.inOut' }, 1.0);
    }

    // 3. File 1 emerges & glides to the left
    if (paper1) {
      mistakesTl.to(
        paper1,
        { x: p1TargetX, y: p1TargetY, rotation: -9, opacity: 1, scale: 1, duration: 0.9, ease: 'power3.out' },
        1.3
      );
    }

    // 4. File 2 emerges & glides to the center-top
    if (paper2) {
      mistakesTl.to(
        paper2,
        { x: 0, y: p2TargetY, rotation: 0, opacity: 1, scale: 1, duration: 0.9, ease: 'power3.out' },
        1.7
      );
    }

    // 5. File 3 emerges & glides to the right
    if (paper3) {
      mistakesTl.to(
        paper3,
        { x: p3TargetX, y: p3TargetY, rotation: 9, opacity: 1, scale: 1, duration: 0.9, ease: 'power3.out' },
        2.1
      );
    }

    // 6. Settle and hold for clean reading
    mistakesTl.to({}, { duration: 0.6 });

    // SLIDE 07: AI SOCRATIC MENTOR (Text Assembles -> Pinned -> Terminal Reveals)
    const mentorTl = gsap.timeline({
      scrollTrigger: {
        trigger: '#mentor-slide',
        start: 'top top',
        end: '+=180%',
        pin: true,
        scrub: 1
      }
    });

    mentorTl
      .from('#mentor-slide .eyebrow', { opacity: 0, y: -15, duration: 0.4 }, 0)
      .from('#mentor-slide .from-left', { x: -250, opacity: 0, filter: 'blur(14px)', duration: 0.8 }, 0)
      .from('#mentor-slide .from-right', { x: 250, opacity: 0, filter: 'blur(14px)', duration: 0.8 }, 0)
      .from('#mentor-slide .lead-text', { opacity: 0, y: 25, duration: 0.6 }, 0.4)
      .from('#mentor-slide .socratic-terminal', { opacity: 0, y: 50, scale: 0.94, duration: 0.9 }, 0.7);

    // SLIDE 08: SMART REVISION (Text Assembles -> Pinned -> Timeline Reveals)
    const revisionTl = gsap.timeline({
      scrollTrigger: {
        trigger: '#revision-slide',
        start: 'top top',
        end: '+=160%',
        pin: true,
        scrub: 1
      }
    });

    revisionTl
      .from('#revision-slide .eyebrow', { opacity: 0, y: -15, duration: 0.4 }, 0)
      .from('#revision-slide .from-left', { x: -250, opacity: 0, filter: 'blur(14px)', duration: 0.8 }, 0)
      .from('#revision-slide .from-right', { x: 250, opacity: 0, filter: 'blur(14px)', duration: 0.8 }, 0)
      .from('#revision-slide .slide-secondary-content', { opacity: 0, y: 40, duration: 0.8 }, 0.6);

    // SLIDE 09: STAKEHOLDERS (Text Assembles -> Pinned -> 2 Cards Cascade)
    const stakeholdersTl = gsap.timeline({
      scrollTrigger: {
        trigger: '#stakeholders-slide',
        start: 'top top',
        end: '+=160%',
        pin: true,
        scrub: 1
      }
    });

    stakeholdersTl
      .from('#stakeholders-slide .eyebrow', { opacity: 0, y: -15, duration: 0.4 }, 0)
      .from('#stakeholders-slide .from-left', { x: -250, opacity: 0, filter: 'blur(14px)', duration: 0.8 }, 0)
      .from('#stakeholders-slide .from-right', { x: 250, opacity: 0, filter: 'blur(14px)', duration: 0.8 }, 0)
      .from('#stakeholders-slide .stakeholder-story-card', {
        opacity: 0,
        y: 40,
        stagger: 0.2,
        duration: 0.8
      }, 0.6);

    // SLIDE 10: PROMISE & CTA (Text Assembles -> Pinned -> CTA Appears)
    const promiseTl = gsap.timeline({
      scrollTrigger: {
        trigger: '#promise-slide',
        start: 'top top',
        end: '+=150%',
        pin: true,
        scrub: 1
      }
    });

    promiseTl
      .from('#promise-slide .eyebrow', { opacity: 0, y: -15, duration: 0.4 }, 0)
      .from('#promise-slide .from-left', { x: -250, opacity: 0, filter: 'blur(14px)', duration: 0.8 }, 0)
      .from('#promise-slide .from-right', { x: 250, opacity: 0, filter: 'blur(14px)', duration: 0.8 }, 0)
      .from('#promise-slide .lead-text', { opacity: 0, y: 25, duration: 0.6 }, 0.4)
      .from('#promise-slide .slide-secondary-content', { opacity: 0, y: 30, duration: 0.8 }, 0.7);
  }

  // --- 5. AI SOCRATIC MENTOR INTERACTIVE LOGIC ---
  const modeBtns = document.querySelectorAll('.socratic-mode-btn');
  const aiTextEl = document.getElementById('socratic-ai-msg');
  const modeLabelEl = document.getElementById('socratic-mode-badge');

  let currentMode = 'socratic';

  const socraticResponses = {
    socratic: 'Where do you think a plant gets the raw energy to construct complex sugar molecules, and what happens to the oxygen atom left behind?',
    normal: 'Photosynthesis is the biochemical process converting light energy, carbon dioxide, and water into glucose and oxygen in chloroplasts.',
    multimodal: 'Analyzing diagram: Chloroplast thylakoids harvest photons for ATP; Calvin Cycle in the stroma synthesizes hexose sugars.'
  };

  let typeInterval = null;
  function typeWriter(el, text, speed = 10) {
    if (typeInterval) clearInterval(typeInterval);
    el.textContent = '';
    let i = 0;
    typeInterval = setInterval(() => {
      if (i < text.length) {
        el.textContent += text.charAt(i);
        i++;
      } else {
        clearInterval(typeInterval);
      }
    }, speed);
  }

  modeBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      modeBtns.forEach((b) => (b.style.backgroundColor = 'transparent'));
      btn.style.backgroundColor = 'var(--indigo-primary)';
      btn.style.color = '#FFFFFF';

      currentMode = btn.getAttribute('data-mode');
      if (modeLabelEl) modeLabelEl.textContent = currentMode.toUpperCase() + ' MODE';
      if (aiTextEl && socraticResponses[currentMode]) {
        typeWriter(aiTextEl, socraticResponses[currentMode]);
      }
    });
  });

  // --- 6. SMOOTH ANCHOR NAVIGATION VIA LENIS ---
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', function (e) {
      const href = this.getAttribute('href');
      if (href !== '#' && href.startsWith('#')) {
        e.preventDefault();
        const target = document.querySelector(href);
        if (target) {
          lenis.scrollTo(target, { duration: 1.2 });
        }
      }
    });
  });

});
