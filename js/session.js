/* ==========================================================================
   SIKHSAATHI — UNIVERSAL SESSION & AUTHENTICATION MANAGER (js/session.js)
   Cross-page session persistence • SQLite DB synchronization • Real-time UI updates
   ========================================================================== */

(function (window) {
  'use strict';

  const TOKEN_KEY = 'siksha_token';
  const USER_KEY = 'siksha_user';

  const Session = {
    /**
     * Retrieves stored session token
     */
    getToken: function () {
      return localStorage.getItem(TOKEN_KEY) || '';
    },

    /**
     * Retrieves stored user profile object
     */
    getUser: function () {
      try {
        const raw = localStorage.getItem(USER_KEY);
        return raw ? JSON.parse(raw) : null;
      } catch (err) {
        console.warn('[Session] Failed to parse stored user:', err);
        return null;
      }
    },

    /**
     * Returns active user ID or default student fallback
     */
    getUserId: function () {
      const u = this.getUser();
      return (u && u.id) ? u.id : (localStorage.getItem('siksha_user_id') || 'usr_student_default');
    },

    /**
     * Checks if active session exists
     */
    isLoggedIn: function () {
      return Boolean(this.getToken() && this.getUser());
    },

    /**
     * Returns the verified role of the current user ('student' | 'teacher' | null)
     */
    getRole: function () {
      const u = this.getUser();
      return (u && u.role) ? String(u.role).toLowerCase().trim() : null;
    },

    /**
     * Checks if active user is a student
     */
    isStudent: function () {
      return this.getRole() === 'student';
    },

    /**
     * Checks if active user is a teacher
     */
    isTeacher: function () {
      return this.getRole() === 'teacher';
    },

    /**
     * Checks if current session is an exploration sandbox demo
     */
    isDemo: function () {
      const u = this.getUser();
      return Boolean((u && (u.is_demo || u.id === 'usr_demo_sandbox')) || this.getToken() === 'token_demo_sandbox_session');
    },

    /**
     * Enforces strict role-based route guard.
     * Prevents any unauthorized user from viewing the page or flashing wrong UI.
     * @param {string} requiredRole - 'student' | 'teacher'
     * @returns {boolean} - true if authorized, false if redirected
     */
    checkRouteGuard: function (requiredRole) {
      if (!requiredRole) return true;

      const token = this.getToken();
      const user = this.getUser();

      // 1. Not logged in -> redirect to authentication
      if (!token || !user) {
        try {
          sessionStorage.setItem('post_login_redirect', window.location.pathname + window.location.search);
        } catch (e) {}
        const redirectUrl = requiredRole === 'teacher' ? '/auth.html?role=teacher' : '/auth.html';
        window.location.replace(redirectUrl);
        return false;
      }

      // 2. Logged in, but wrong role -> redirect to rightful dashboard immediately
      const currentRole = (user.role || '').toLowerCase().trim();
      if (requiredRole === 'student' && currentRole === 'teacher') {
        console.warn('[RouteGuard] Teacher attempted Student route. Redirecting to Educator Portal...');
        window.location.replace('/teacher/index.html');
        return false;
      }
      if (requiredRole === 'teacher' && currentRole === 'student') {
        console.warn('[RouteGuard] Student attempted Teacher route. Redirecting to Student Dashboard...');
        window.location.replace('/student.html');
        return false;
      }

      return true;
    },

    /**
     * Generates standard authorization headers for API fetch requests
     */
    getAuthHeaders: function (additionalHeaders = {}) {
      const headers = {
        'Content-Type': 'application/json',
        ...additionalHeaders
      };
      const token = this.getToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
        headers['X-Auth-Token'] = token;
      }
      const userId = this.getUserId();
      if (userId) {
        headers['X-User-Id'] = userId;
      }
      return headers;
    },

    /**
     * Persists authentication token and user profile to localStorage
     */
    saveSession: function (token, user) {
      if (token) {
        localStorage.setItem(TOKEN_KEY, token);
        localStorage.setItem('access_token', token);
      }
      if (user) {
        localStorage.setItem(USER_KEY, JSON.stringify(user));
        localStorage.setItem('siksha_user_id', user.id || '');
        if (user.role) {
          localStorage.setItem('siksha_user_role', String(user.role).toLowerCase());
        }
        if (user.full_name) {
          localStorage.setItem('siksha_student_name', user.full_name);
        }
        if (user.bio) {
          localStorage.setItem('siksha_student_bio', user.bio);
        }
        if (user.target_goal) {
          localStorage.setItem('siksha_student_goal', user.target_goal);
        }
        if (user.class_grade) {
          localStorage.setItem('siksha_student_grade', user.class_grade);
        }
      }
      this.updateUI();
    },

    /**
     * Clears all local authentication storage and calls backend logout
     */
    clearSession: function () {
      const token = this.getToken();
      if (token) {
        try {
          const logoutUrl = (window.SIKSHA_CONFIG && window.SIKSHA_CONFIG.getApiUrl)
            ? window.SIKSHA_CONFIG.getApiUrl('/api/auth/logout')
            : '/api/auth/logout';
          fetch(logoutUrl, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'X-Auth-Token': token
            }
          }).catch(() => {});
        } catch (e) {}
      }

      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem('access_token');
      localStorage.removeItem(USER_KEY);
      localStorage.removeItem('siksha_user_id');
      localStorage.removeItem('siksha_user_role');
      localStorage.removeItem('siksha_student_name');
      localStorage.removeItem('siksha_student_bio');
      localStorage.removeItem('siksha_student_goal');
      localStorage.removeItem('siksha_student_grade');
      try {
        sessionStorage.removeItem('post_login_redirect');
      } catch (e) {}
    },

    /**
     * Logout handler with page redirection
     */
    logout: function (e, redirectUrl = '/auth.html') {
      if (e && e.preventDefault) e.preventDefault();
      this.clearSession();
      window.location.replace(redirectUrl);
    },

    /**
     * Synchronizes current user data with SQLite DB and validates role
     */
    fetchCurrentUser: async function (requiredRole = null) {
      const token = this.getToken();
      if (!token) {
        if (requiredRole) {
          this.checkRouteGuard(requiredRole);
        }
        return null;
      }

      try {
        const meUrl = (window.SIKSHA_CONFIG && window.SIKSHA_CONFIG.getApiUrl)
          ? window.SIKSHA_CONFIG.getApiUrl('/api/auth/me')
          : '/api/auth/me';
        const res = await fetch(meUrl, {
          headers: this.getAuthHeaders()
        });
        if (res.ok) {
          const user = await res.json();
          this.saveSession(token, user);

          // Server truth role check
          if (requiredRole && user.role.toLowerCase() !== requiredRole) {
            console.warn('[Session] Server verified role mismatch:', user.role, 'expected:', requiredRole);
            if (user.role.toLowerCase() === 'teacher') {
              window.location.replace('/teacher/index.html');
            } else {
              window.location.replace('/student.html');
            }
            return null;
          }
          return user;
        } else if (res.status === 401 || res.status === 403) {
          console.warn('[Session] Server authentication check returned', res.status);
          if (requiredRole) {
            this.clearSession();
            window.location.replace(requiredRole === 'teacher' ? '/auth.html?role=teacher' : '/auth.html');
            return null;
          }
        }
      } catch (err) {
        console.warn('[Session] Background profile sync offline:', err);
      }
      return this.getUser();
    },

    /**
     * Updates user profile in SQLite DB and updates local session
     */
    updateProfile: async function (profileData) {
      try {
        const profUrl = (window.SIKSHA_CONFIG && window.SIKSHA_CONFIG.getApiUrl)
          ? window.SIKSHA_CONFIG.getApiUrl('/api/auth/profile')
          : '/api/auth/profile';
        const res = await fetch(profUrl, {
          method: 'PUT',
          headers: this.getAuthHeaders(),
          body: JSON.stringify(profileData)
        });
        if (res.ok) {
          const updatedUser = await res.json();
          this.saveSession(this.getToken(), updatedUser);
          return { success: true, user: updatedUser };
        } else {
          const err = await res.json();
          return { success: false, error: err.detail || 'Failed to update profile' };
        }
      } catch (err) {
        console.error('[Session] Error updating profile:', err);
        return { success: false, error: err.message };
      }
    },

    /**
     * Generates two-letter uppercase initials for avatar from name
     */
    getInitials: function (name) {
      if (!name) return 'SS';
      const parts = name.trim().split(/\s+/);
      if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    },

    /**
     * Injects or removes non-intrusive Demo Sandbox Banner
     */
    renderDemoBanner: function () {
      if (!this.isDemo()) {
        const existing = document.getElementById('siksha-demo-mode-banner');
        if (existing) existing.remove();
        return;
      }
      if (document.getElementById('siksha-demo-mode-banner')) return;

      const banner = document.createElement('div');
      banner.id = 'siksha-demo-mode-banner';
      banner.style.cssText = 'position: sticky; top: 0; z-index: 99999; background: linear-gradient(90deg, #4F46E5 0%, #6366F1 50%, #7C3AED 100%); color: #FFFFFF; padding: 0.45rem 1.25rem; font-size: 0.8rem; font-family: inherit; display: flex; align-items: center; justify-content: space-between; gap: 1rem; box-shadow: 0 2px 10px rgba(79, 70, 229, 0.25);';
      banner.innerHTML = `
        <div style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
          <span style="display: inline-flex; align-items: center; gap: 0.35rem; background: rgba(255,255,255,0.2); padding: 0.15rem 0.5rem; border-radius: 999px; font-weight: 800; font-size: 0.68rem; letter-spacing: 0.05em; text-transform: uppercase;">
            ⚡ SANDBOX DEMO
          </span>
          <span>You are exploring Siksha Saathi in a guest sandbox. Progress will not be permanently saved.</span>
        </div>
        <div style="display: flex; align-items: center; gap: 0.5rem;">
          <a href="/auth.html?mode=signup" style="background: #FFFFFF; color: #4F46E5; font-weight: 700; font-size: 0.76rem; padding: 0.3rem 0.75rem; border-radius: 6px; text-decoration: none; display: inline-flex; align-items: center; gap: 0.25rem; box-shadow: 0 2px 6px rgba(0,0,0,0.1);">
            <span>Create Real Account</span>
            <span>→</span>
          </a>
          <button id="close-demo-banner-btn" style="background: none; border: none; color: #FFFFFF; font-size: 1rem; cursor: pointer; padding: 0 0.25rem; opacity: 0.8;" title="Dismiss">✕</button>
        </div>
      `;
      document.body.prepend(banner);

      document.getElementById('close-demo-banner-btn')?.addEventListener('click', () => {
        banner.style.display = 'none';
      });
    },

    /**
     * Updates DOM elements according to session state
     */
    updateUI: function () {
      this.renderDemoBanner();
      const user = this.getUser();
      const loggedIn = this.isLoggedIn();

      // 1. Landing Page (index.html) Top Navbar CTA
      const navCtaBtn = document.querySelector('.card-nav-cta-wrap a.star-border-btn');
      if (navCtaBtn) {
        const innerTextSpan = navCtaBtn.querySelector('.star-border-inner span:first-child');
        if (loggedIn && user) {
          const targetHref = user.role === 'teacher' ? '/teacher/index.html' : '/student.html';
          navCtaBtn.setAttribute('href', targetHref);
          navCtaBtn.setAttribute('aria-label', 'Open Dashboard');
          if (innerTextSpan) {
            const isMobile = window.innerWidth <= 640;
            if (isMobile) {
              innerTextSpan.textContent = 'Dashboard';
            } else {
              const firstName = user.full_name ? user.full_name.split(' ')[0] : 'Dashboard';
              innerTextSpan.textContent = `Dashboard (${firstName})`;
            }
          }
        } else {
          navCtaBtn.setAttribute('href', 'auth.html');
          navCtaBtn.setAttribute('aria-label', 'Get Started');
          if (innerTextSpan) {
            innerTextSpan.textContent = 'Get Started';
          }
        }
      }

      // 1b. Landing Page Navigation Menu Card User Status
      const cardNavContent = document.querySelector('.card-nav-content');
      if (cardNavContent && loggedIn && user) {
        let userBanner = document.getElementById('card-nav-user-banner');
        if (!userBanner) {
          userBanner = document.createElement('div');
          userBanner.id = 'card-nav-user-banner';
          userBanner.className = 'nav-card';
          userBanner.style.backgroundColor = '#1F2033';
          userBanner.style.color = '#FFFFFF';
          userBanner.style.gridColumn = '1 / -1';
          userBanner.style.display = 'flex';
          userBanner.style.alignItems = 'center';
          userBanner.style.justifyContent = 'space-between';
          userBanner.style.padding = '0.9rem 1.25rem';
          userBanner.style.borderRadius = '12px';
          userBanner.style.marginBottom = '0.5rem';

          cardNavContent.insertBefore(userBanner, cardNavContent.firstChild);
        }

        const initials = this.getInitials(user.full_name);
        const dashboardUrl = user.role === 'teacher' ? '/teacher/index.html' : '/student.html';

        userBanner.innerHTML = `
          <div style="display: flex; align-items: center; gap: 0.75rem;">
            <div style="width: 32px; height: 32px; border-radius: 50%; background: var(--indigo-primary, #5B5CE2); color: #FFF; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.8rem;">
              ${initials}
            </div>
            <div>
              <div style="font-weight: 700; font-size: 0.9rem; color: #FFFFFF;">${user.full_name}</div>
              <div style="font-size: 0.75rem; color: #A5A6F6;">${user.role === 'teacher' ? (user.subject ? user.subject + ' • Educator' : 'Educator') : (user.class_grade || 'Student')}</div>
            </div>
          </div>
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <a href="${dashboardUrl}" class="btn btn-sm btn-primary" style="padding: 0.4rem 0.85rem; font-size: 0.78rem; text-decoration: none;">
              Open App →
            </a>
            <button id="card-nav-logout-btn" class="btn btn-sm btn-secondary" style="padding: 0.4rem 0.75rem; font-size: 0.78rem; color: var(--rose-accent, #FF4B6E); border-color: rgba(255,75,110,0.3); background: transparent; cursor: pointer;">
              Sign Out
            </button>
          </div>
        `;

        const navLogoutBtn = document.getElementById('card-nav-logout-btn');
        if (navLogoutBtn) {
          navLogoutBtn.addEventListener('click', (e) => this.logout(e));
        }
      }

      // 2. Profile bindings for both Student and Teacher dashboards
      if (user) {
        const initials = this.getInitials(user.full_name);

        // Sidebar avatar & profile info
        document.querySelectorAll('.profile-avatar, .flagship-avatar').forEach(el => {
          el.textContent = initials;
        });

        document.querySelectorAll('.profile-name, .profile-student-name').forEach(el => {
          el.textContent = user.full_name;
        });

        document.querySelectorAll('.profile-role').forEach(el => {
          if (user.role === 'teacher') {
            el.textContent = user.subject ? `${user.subject} • Educator` : (user.institution || 'Faculty • Educator');
          } else {
            el.textContent = user.class_grade || 'Class 12 • Science';
          }
        });

        document.querySelectorAll('.profile-bio-text').forEach(el => {
          if (user.bio) el.textContent = user.bio;
        });

        // Topbar Greeting update (Dashboard only)
        const greetingH2 = document.getElementById('dashboard-greeting');
        if (greetingH2 && user.full_name) {
          const firstName = user.full_name.trim().split(/\s+/)[0];
          const hour = new Date().getHours();
          const timeGreeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
          const isMobile = window.innerWidth <= 768;
          greetingH2.textContent = isMobile ? `Hi, ${firstName} 👋` : `${timeGreeting}, ${firstName}.`;
        }
      }

      // 3. Bind all Sign Out links / buttons across the app
      document.querySelectorAll('a[href*="index.html"].profile-menu-item, .sign-out-btn, [data-action="logout"], #teacher-signout-btn').forEach(btn => {
        if (!btn.dataset.logoutBound) {
          btn.dataset.logoutBound = 'true';
          btn.addEventListener('click', (e) => this.logout(e, '/auth.html'));
        }
      });
    },

    /**
     * Initializes session on page load
     */
    init: function () {
      this.updateUI();
      // Silently sync profile with server if logged in
      if (this.isLoggedIn()) {
        this.fetchCurrentUser().then(() => this.updateUI());
      }
    }
  };

  // Expose Session globally
  window.SikshaSession = Session;

  // Auto-init on DOMContentLoaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => Session.init());
  } else {
    Session.init();
  }

})(window);
