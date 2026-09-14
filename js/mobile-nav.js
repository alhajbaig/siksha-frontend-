/**
 * SIKSHASAATHI — Universal Ultra-Mobile Navigation Controller
 * Provides native app-feel bottom bar, off-canvas drawer, touch swipe,
 * and responsive topbar controls across all viewports.
 * ZERO business logic touched.
 */

(function () {
  'use strict';

  // Identify portal type
  const isTeacher = window.location.pathname.includes('/teacher/') || 
                    window.location.pathname.includes('teacher_dashboard') ||
                    document.body.classList.contains('teacher-portal') ||
                    document.title.toLowerCase().includes('educator') ||
                    document.title.toLowerCase().includes('teacher') ||
                    !!document.querySelector('link[href*="teacher.css"]');

  function initMobileNav() {
    setupSidebarDrawer();
    setupMobileBottomBar();
  }

  // =========================================================================
  // 1. OFF-CANVAS SIDEBAR DRAWER & HAMBURGER
  // =========================================================================
  function setupSidebarDrawer() {
    const sidebar = document.querySelector('.app-sidebar');
    const topbar = document.querySelector('.main-topbar');
    if (!sidebar) return;

    // Create backdrop overlay if missing
    let backdrop = document.querySelector('.sidebar-backdrop');
    if (!backdrop) {
      backdrop = document.createElement('div');
      backdrop.className = 'sidebar-backdrop';
      backdrop.setAttribute('aria-hidden', 'true');
      if (sidebar.parentNode) {
        sidebar.parentNode.insertBefore(backdrop, sidebar);
      } else {
        document.body.appendChild(backdrop);
      }
    }

    function openDrawer() {
      sidebar.classList.add('mobile-open');
      backdrop.classList.add('active');
      document.body.style.overflow = 'hidden';
    }

    function closeDrawer() {
      sidebar.classList.remove('mobile-open');
      backdrop.classList.remove('active');
      document.body.style.overflow = '';
    }

    backdrop.addEventListener('click', closeDrawer);

    // Close drawer when any sidebar link is tapped
    sidebar.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        if (window.innerWidth <= 1024) {
          closeDrawer();
        }
      });
    });

    // Inject hamburger into topbar if not already present
    if (topbar && !topbar.querySelector('.mobile-menu-btn')) {
      const menuBtn = document.createElement('button');
      menuBtn.type = 'button';
      menuBtn.className = 'mobile-menu-btn';
      menuBtn.setAttribute('aria-label', 'Open Menu');
      menuBtn.innerHTML = `
        <svg viewBox="0 0 24 24" width="22" height="22" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
          <line x1="3" y1="12" x2="21" y2="12"></line>
          <line x1="3" y1="6" x2="21" y2="6"></line>
          <line x1="3" y1="18" x2="21" y2="18"></line>
        </svg>
      `;
      menuBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (sidebar.classList.contains('mobile-open')) {
          closeDrawer();
        } else {
          openDrawer();
        }
      });

      // Insert at the beginning of topbar
      topbar.insertBefore(menuBtn, topbar.firstChild);
    }

    // Touch Swipe Left to close drawer
    let touchStartX = 0;
    let touchStartY = 0;
    sidebar.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
      touchStartY = e.changedTouches[0].screenY;
    }, { passive: true });

    sidebar.addEventListener('touchend', (e) => {
      const touchEndX = e.changedTouches[0].screenX;
      const touchEndY = e.changedTouches[0].screenY;
      // If swiped left by more than 50px horizontally
      if (touchStartX - touchEndX > 50 && Math.abs(touchStartY - touchEndY) < 80) {
        closeDrawer();
      }
    }, { passive: true });

    // Expose drawer controls globally
    window.openMobileDrawer = openDrawer;
    window.closeMobileDrawer = closeDrawer;
  }

  // =========================================================================
  // 2. ULTRA-PREMIUM GLASSMORPHIC BOTTOM NAVIGATION BAR
  // =========================================================================
  function setupMobileBottomBar() {
    if (document.querySelector('.mobile-bottom-nav')) return;

    const nav = document.createElement('nav');
    nav.className = 'mobile-bottom-nav';
    nav.setAttribute('aria-label', 'Mobile Primary Navigation');

    const currentPath = window.location.pathname.toLowerCase();
    const currentHash = window.location.hash.toLowerCase();

    if (isTeacher) {
      // TEACHER BOTTOM NAVIGATION
      const items = [
        {
          id: 'teacher-nav-overview',
          label: 'Overview',
          href: 'index.html',
          active: currentPath.endsWith('index.html') || currentPath.endsWith('/teacher/'),
          icon: `<svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`
        },
        {
          id: 'teacher-nav-genome',
          label: 'Genome',
          href: 'students.html',
          active: currentPath.includes('students.html'),
          icon: `<svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`
        },
        {
          id: 'teacher-nav-guidance',
          label: 'Guidance',
          href: 'interventions.html',
          active: currentPath.includes('interventions.html'),
          icon: `<svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z"/></svg>`
        },
        {
          id: 'teacher-nav-assessments',
          label: 'Tests',
          href: 'assessments.html',
          active: currentPath.includes('assessments.html'),
          icon: `<svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>`
        },
        {
          id: 'teacher-nav-more',
          label: 'Menu',
          href: '#menu',
          action: 'drawer',
          icon: `<svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="12" x2="20" y2="12"></line><line x1="4" y1="6" x2="20" y2="6"></line><line x1="4" y1="18" x2="20" y2="18"></line></svg>`
        }
      ];
      renderNavItems(nav, items);
    } else {
      // STUDENT BOTTOM NAVIGATION
      const isProfile = currentPath.includes('student-profile.html');
      const isGuidanceTab = isProfile && currentHash.includes('tab-guidance');

      const items = [
        {
          id: 'nav-home',
          label: 'Home',
          href: 'student.html',
          active: currentPath.endsWith('student.html') || currentPath.endsWith('/student'),
          icon: `<svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`
        },
        {
          id: 'nav-mentor',
          label: 'AI Mentor',
          href: 'student-mentor.html',
          active: currentPath.includes('student-mentor.html'),
          icon: `<svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`
        },
        {
          id: 'nav-practice',
          label: 'Practice',
          href: 'student-practice.html',
          active: currentPath.includes('student-practice.html'),
          icon: `<svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>`
        },
        {
          id: 'nav-guidance',
          label: 'Guidance',
          href: 'student-profile.html#tab-guidance',
          active: isGuidanceTab,
          icon: `<svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`
        },
        {
          id: 'nav-profile',
          label: 'Profile',
          href: 'student-profile.html',
          active: isProfile && !isGuidanceTab,
          icon: `<svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`
        }
      ];
      renderNavItems(nav, items);
    }

    document.body.appendChild(nav);
  }

  function renderNavItems(container, items) {
    container.innerHTML = items.map(item => `
      <a href="${item.href}" class="mobile-nav-item ${item.active ? 'active' : ''}" id="${item.id}" ${item.action ? `data-action="${item.action}"` : ''}>
        <div class="mobile-nav-icon-wrap">
          ${item.icon}
        </div>
        <span class="mobile-nav-label">${item.label}</span>
      </a>
    `).join('');

    container.querySelectorAll('.mobile-nav-item').forEach(el => {
      if (el.dataset.action === 'drawer') {
        el.addEventListener('click', (e) => {
          e.preventDefault();
          if (window.openMobileDrawer) window.openMobileDrawer();
        });
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMobileNav);
  } else {
    initMobileNav();
  }
})();
