/* ==========================================================================
   CARD NAV — REACT BITS EXPANDING CARD NAVIGATION CONTROLLER
   GSAP Height Expansion • Interactive Feature Buttons • Smooth Lenis Anchors
   ========================================================================== */

(function () {
  'use strict';

  function initCardNav() {
    const navContainer = document.querySelector('.card-nav-container');
    const navEl = document.querySelector('.card-nav');
    const hamburgerBtn = document.querySelector('.hamburger-menu');
    const cards = document.querySelectorAll('.nav-card');
    const navButtons = document.querySelectorAll('.nav-feature-btn, .nav-add-feature-btn');

    if (!navEl || !hamburgerBtn || typeof gsap === 'undefined') return;

    let isExpanded = false;
    let tl = null;

    const calculateHeight = () => {
      const isMobile = window.matchMedia('(max-width: 768px)').matches;
      const contentEl = navEl.querySelector('.card-nav-content');
      if (contentEl) {
        const wasVisible = contentEl.style.visibility;
        const wasPointerEvents = contentEl.style.pointerEvents;
        const wasPosition = contentEl.style.position;
        const wasHeight = contentEl.style.height;

        contentEl.style.visibility = 'visible';
        contentEl.style.pointerEvents = 'auto';
        contentEl.style.position = 'static';
        contentEl.style.height = 'auto';

        const topBar = 62;
        const padding = 16;
        const contentHeight = contentEl.scrollHeight;

        contentEl.style.visibility = wasVisible;
        contentEl.style.pointerEvents = wasPointerEvents;
        contentEl.style.position = wasPosition;
        contentEl.style.height = wasHeight;

        if (isMobile) {
          const maxHeight = Math.min(window.innerHeight * 0.82, 560);
          return Math.min(topBar + contentHeight + padding, maxHeight);
        }
        return 350;
      }
      return 350;
    };

    const createTimeline = () => {
      gsap.set(navEl, { height: 62, overflow: 'hidden' });
      gsap.set(cards, { y: 35, opacity: 0 });

      const newTl = gsap.timeline({ paused: true });

      newTl.to(navEl, {
        height: calculateHeight,
        duration: 0.42,
        ease: 'power3.out'
      });

      newTl.to(
        cards,
        {
          y: 0,
          opacity: 1,
          duration: 0.38,
          ease: 'power3.out',
          stagger: 0.07
        },
        '-=0.22'
      );

      return newTl;
    };

    tl = createTimeline();

    const toggleMenu = () => {
      if (!tl) return;
      if (!isExpanded) {
        isExpanded = true;
        hamburgerBtn.classList.add('open');
        navEl.classList.add('open');
        tl.play(0);
      } else {
        isExpanded = false;
        hamburgerBtn.classList.remove('open');
        tl.eventCallback('onReverseComplete', () => {
          navEl.classList.remove('open');
        });
        tl.reverse();
      }
    };

    hamburgerBtn.addEventListener('click', toggleMenu);
    hamburgerBtn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggleMenu();
      }
    });

    // Close when clicking outside
    document.addEventListener('click', (e) => {
      if (isExpanded && navContainer && !navContainer.contains(e.target)) {
        toggleMenu();
      }
    });

    // Close & Smooth Scroll on feature button click
    navButtons.forEach((btn) => {
      btn.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (href && href.startsWith('#') && href !== '#') {
          e.preventDefault();
          if (isExpanded) {
            toggleMenu();
          }
          const target = document.querySelector(href);
          if (target && window.lenis) {
            window.lenis.scrollTo(target, { duration: 1.2 });
          } else if (target) {
            target.scrollIntoView({ behavior: 'smooth' });
          }
        }
      });
    });

    // Handle Window Resize
    window.addEventListener('resize', () => {
      if (!tl) return;
      if (isExpanded) {
        const newHeight = calculateHeight();
        gsap.set(navEl, { height: newHeight });
        tl.kill();
        tl = createTimeline();
        if (tl) tl.progress(1);
      } else {
        tl.kill();
        tl = createTimeline();
      }
    });
  }

  document.addEventListener('DOMContentLoaded', initCardNav);
})();
