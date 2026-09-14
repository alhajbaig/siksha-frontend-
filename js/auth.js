/* ==========================================================================
   SIKSHA SAATHI — EDITORIAL AUTHENTICATION CONTROLLER (js/auth.js)
   Typography-First Entry Staggers • Smooth Transitions • Frontend Simulation
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  'use strict';

  // --- 1. Lenis Smooth Scroll ---
  if (typeof Lenis !== 'undefined') {
    const lenis = new Lenis({ duration: 1.0, smoothWheel: true });
    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
  }

  // --- 2. State & Data ---
  let currentRole = 'student'; // 'student' | 'teacher'
  let currentMode = 'login';   // 'login' | 'signup'

  // Read URL query parameters (?role=teacher, ?mode=signup)
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const roleParam = urlParams.get('role');
    const modeParam = urlParams.get('mode');
    if (roleParam && roleParam.toLowerCase() === 'teacher') {
      currentRole = 'teacher';
    } else {
      currentRole = 'student';
    }
    if (modeParam && modeParam.toLowerCase() === 'signup') {
      currentMode = 'signup';
    }
  } catch (e) {
    console.warn('[Auth] URL param parse warning:', e);
  }

  // DOM Elements
  const roleBtnStudent = document.getElementById('role-btn-student');
  const roleBtnTeacher = document.getElementById('role-btn-teacher');
  const tabLogin = document.getElementById('tab-login');
  const tabSignup = document.getElementById('tab-signup');
  const tabsSlider = document.getElementById('auth-tabs-slider');

  const eyebrowEl = document.getElementById('auth-eyebrow');
  const headlineL1 = document.getElementById('headline-l1');
  const headlineL2 = document.getElementById('headline-l2');
  const leadCopyEl = document.getElementById('auth-supporting-lead');

  const formHeading = document.getElementById('form-heading');
  const formSubheading = document.getElementById('form-subheading');
  const btnSubmitLabel = document.getElementById('btn-submit-label');
  const btnAuthSubmit = document.getElementById('btn-auth-submit');
  const footerPromptText = document.getElementById('footer-prompt-text');
  const btnFooterToggle = document.getElementById('btn-footer-toggle');

  // Input Wrappers
  const fieldWrapName = document.getElementById('field-wrap-name');
  const fieldWrapGrade = document.getElementById('field-wrap-grade');
  const fieldWrapInstitution = document.getElementById('field-wrap-institution');
  const fieldWrapSubject = document.getElementById('field-wrap-subject');
  const fieldWrapEmail = document.getElementById('field-wrap-email');
  const fieldWrapPassword = document.getElementById('field-wrap-password');
  const fieldWrapConfirm = document.getElementById('field-wrap-confirm');

  // Inputs
  const inputName = document.getElementById('input-name');
  const inputEmail = document.getElementById('input-email');
  const inputPassword = document.getElementById('input-password');
  const inputConfirm = document.getElementById('input-confirm');
  const inputInstitution = document.getElementById('input-institution');
  const btnForgotPassword = document.getElementById('btn-forgot-password');

  const mainForm = document.getElementById('auth-main-form');
  const successModal = document.getElementById('auth-success-modal');
  const modalTitle = document.getElementById('modal-title');
  const modalDesc = document.getElementById('modal-desc');

  // Texts Mapping Dictionary
  const editorialCopy = {
    student: {
      eyebrow: 'SIKSHA SAATHI • YOUR LEARNING JOURNEY',
      headline1: 'Your learning,',
      headline2: 'your path.',
      lead: 'SikshaSaathi adapts to what you know,<br>where you struggle, and what comes next.',
      login: {
        heading: 'Welcome back to SikshaSaathi.',
        subheading: 'Continue your learning journey.',
        ctaText: 'CONTINUE →',
        footerPrompt: 'New to SikshaSaathi?',
        footerBtn: 'Create an account →'
      },
      signup: {
        heading: 'Start your SikshaSaathi journey.',
        subheading: 'Your personalized learning starts here.',
        ctaText: 'CREATE ACCOUNT →',
        footerPrompt: 'Already have an account?',
        footerBtn: 'Log in →'
      }
    },
    teacher: {
      eyebrow: 'SIKSHA SAATHI • TEACHER SUITE',
      headline1: 'Your classroom,',
      headline2: 'understood.',
      lead: 'Detect aggregate knowledge gaps and guide student learning with surgical clarity.',
      login: {
        heading: 'Welcome back to SikshaSaathi.',
        subheading: 'See beyond the marks.',
        ctaText: 'CONTINUE →',
        footerPrompt: 'New to SikshaSaathi?',
        footerBtn: 'Create educator account →'
      },
      signup: {
        heading: 'Join SikshaSaathi for Teachers.',
        subheading: 'Help students guide learning with greater clarity.',
        ctaText: 'CREATE TEACHER ACCOUNT →',
        footerPrompt: 'Already have an account?',
        footerBtn: 'Log in →'
      }
    }
  };

  // --- 3. STAGGERED PAGE ENTRY ANIMATION ---
  function runEntrySequence() {
    if (typeof gsap === 'undefined') return;

    gsap.fromTo('.auth-top-bar', { opacity: 0, y: -10 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' });
    gsap.fromTo(eyebrowEl, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.4, delay: 0.1, ease: 'power3.out' });
    gsap.fromTo(headlineL1, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.5, delay: 0.15, ease: 'power3.out' });
    gsap.fromTo(headlineL2, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.5, delay: 0.25, ease: 'power3.out' });
    gsap.fromTo(leadCopyEl, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.4, delay: 0.35, ease: 'power3.out' });
    gsap.fromTo('.auth-learning-path-module', { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.4, delay: 0.4, ease: 'power3.out' });
    gsap.fromTo('.auth-form-embedded', { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.5, delay: 0.2, ease: 'power3.out' });
  }

  runEntrySequence();

  // --- 4. ROLE SWITCHING (STUDENT <-> TEACHER) ---
  if (roleBtnStudent && roleBtnTeacher) {
    roleBtnStudent.addEventListener('click', (e) => {
      e.preventDefault();
      setRole('student');
    });

    roleBtnTeacher.addEventListener('click', (e) => {
      e.preventDefault();
      setRole('teacher');
    });
  }

  function setRole(role) {
    currentRole = (role || 'student').toLowerCase();
    if (currentRole === 'student') {
      if (roleBtnStudent) {
        roleBtnStudent.classList.add('active');
        roleBtnStudent.setAttribute('aria-selected', 'true');
      }
      if (roleBtnTeacher) {
        roleBtnTeacher.classList.remove('active');
        roleBtnTeacher.setAttribute('aria-selected', 'false');
      }
      try {
        const u = new URL(window.location.href);
        if (u.searchParams.get('role') === 'teacher') {
          u.searchParams.delete('role');
          window.history.replaceState({}, '', u.pathname + (u.search ? u.search : ''));
        }
        sessionStorage.removeItem('post_login_redirect');
      } catch (e) {}
    } else {
      if (roleBtnTeacher) {
        roleBtnTeacher.classList.add('active');
        roleBtnTeacher.setAttribute('aria-selected', 'true');
      }
      if (roleBtnStudent) {
        roleBtnStudent.classList.remove('active');
        roleBtnStudent.setAttribute('aria-selected', 'false');
      }
      try {
        const u = new URL(window.location.href);
        u.searchParams.set('role', 'teacher');
        window.history.replaceState({}, '', u.pathname + u.search);
      } catch (e) {}
    }

    updateUI(true);
  }

  // --- 5. MODE SWITCHING (LOG IN <-> CREATE ACCOUNT) ---
  if (tabLogin && tabSignup && tabsSlider) {
    tabLogin.addEventListener('click', (e) => {
      e.preventDefault();
      if (currentMode === 'login') return;
      setMode('login');
    });

    tabSignup.addEventListener('click', (e) => {
      e.preventDefault();
      if (currentMode === 'signup') return;
      setMode('signup');
    });
  }

  if (btnFooterToggle) {
    btnFooterToggle.addEventListener('click', (e) => {
      e.preventDefault();
      setMode(currentMode === 'login' ? 'signup' : 'login');
    });
  }

  function setMode(mode) {
    currentMode = mode;
    if (mode === 'login') {
      if (tabLogin) {
        tabLogin.classList.add('active');
        tabLogin.setAttribute('aria-selected', 'true');
      }
      if (tabSignup) {
        tabSignup.classList.remove('active');
        tabSignup.setAttribute('aria-selected', 'false');
      }
      if (tabsSlider) tabsSlider.style.transform = 'translateX(0%)';
    } else {
      if (tabSignup) {
        tabSignup.classList.add('active');
        tabSignup.setAttribute('aria-selected', 'true');
      }
      if (tabLogin) {
        tabLogin.classList.remove('active');
        tabLogin.setAttribute('aria-selected', 'false');
      }
      if (tabsSlider) tabsSlider.style.transform = 'translateX(100%)';
    }

    updateUI(true);
  }

  // Immediate initial synchronization
  setRole(currentRole);
  setMode(currentMode);

  // --- 6. UPDATE EDITORIAL & FORM UI ---
  function updateUI(animate = false) {
    clearErrors();
    const config = editorialCopy[currentRole][currentMode];

    // Left Editorial Story Content
    if (eyebrowEl) eyebrowEl.textContent = editorialCopy[currentRole].eyebrow;
    if (headlineL1) headlineL1.textContent = editorialCopy[currentRole].headline1;
    if (headlineL2) headlineL2.textContent = editorialCopy[currentRole].headline2;
    if (leadCopyEl) leadCopyEl.innerHTML = editorialCopy[currentRole].lead;

    // Right Form Content
    if (formHeading) formHeading.textContent = config.heading;
    if (formSubheading) formSubheading.textContent = config.subheading;
    if (btnSubmitLabel) btnSubmitLabel.textContent = config.ctaText;
    if (footerPromptText) footerPromptText.textContent = config.footerPrompt;
    if (btnFooterToggle) btnFooterToggle.textContent = config.footerBtn;

    // Toggle Field Visibility
    if (currentMode === 'signup') {
      fieldWrapName.style.display = 'flex';
      fieldWrapConfirm.style.display = 'flex';
      if (btnForgotPassword) btnForgotPassword.style.display = 'none';

      if (currentRole === 'student') {
        fieldWrapGrade.style.display = 'flex';
        fieldWrapInstitution.style.display = 'none';
        fieldWrapSubject.style.display = 'none';
      } else {
        fieldWrapGrade.style.display = 'none';
        fieldWrapInstitution.style.display = 'flex';
        fieldWrapSubject.style.display = 'flex';
      }
    } else {
      // Login Mode
      fieldWrapName.style.display = 'none';
      fieldWrapConfirm.style.display = 'none';
      fieldWrapGrade.style.display = 'none';
      fieldWrapInstitution.style.display = 'none';
      fieldWrapSubject.style.display = 'none';
      if (btnForgotPassword) btnForgotPassword.style.display = 'inline-block';
    }

    if (animate && typeof gsap !== 'undefined') {
      gsap.fromTo([formHeading, formSubheading], 
        { opacity: 0, y: -6 }, 
        { opacity: 1, y: 0, duration: 0.25, ease: 'power2.out' }
      );
    }
  }

  // --- 7. PASSWORD REVEAL TOGGLE ---
  document.querySelectorAll('.field-reveal-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-target');
      const input = document.getElementById(targetId);
      if (input) {
        const isPass = input.type === 'password';
        input.type = isPass ? 'text' : 'password';
        btn.innerHTML = isPass
          ? `<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`
          : `<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`;
      }
    });
  });

  // --- 8. FORGOT PASSWORD SIMULATION ---
  if (btnForgotPassword) {
    btnForgotPassword.addEventListener('click', (e) => {
      e.preventDefault();
      const email = inputEmail.value.trim();
      if (!email) {
        showError('email', 'Please enter your email address first.');
        inputEmail.focus();
        return;
      }
      alert(`Password recovery instructions sent to ${email} (simulated).`);
    });
  }

  // --- 9. CLIENT-SIDE VALIDATION ---
  function clearErrors() {
    document.querySelectorAll('.field-control-input').forEach(inp => inp.classList.remove('has-error'));
    document.querySelectorAll('.field-error-feedback').forEach(msg => msg.classList.remove('show'));
  }

  function showError(fieldKey, message) {
    const input = document.getElementById(`input-${fieldKey}`);
    const errorEl = document.getElementById(`error-${fieldKey}`);
    if (input) input.classList.add('has-error');
    if (errorEl) {
      if (message) errorEl.textContent = message;
      errorEl.classList.add('show');
    }
  }

  ['name', 'email', 'password', 'confirm', 'institution'].forEach(key => {
    const input = document.getElementById(`input-${key}`);
    if (input) {
      input.addEventListener('input', () => {
        input.classList.remove('has-error');
        const err = document.getElementById(`error-${key}`);
        if (err) err.classList.remove('show');
      });
    }
  });

  // --- 10. REAL BACKEND AUTHENTICATION SUBMISSION & TRANSITION ---
  if (mainForm) {
    mainForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      clearErrors();

      let hasError = false;

      // Validate Email
      const emailVal = inputEmail.value.trim();
      if (!emailVal || !emailVal.includes('@')) {
        showError('email', 'Please enter a valid email address.');
        hasError = true;
      }

      // Validate Password
      const passVal = inputPassword.value;
      if (!passVal || passVal.length < 4) {
        showError('password', 'Password is required (min 4 characters).');
        hasError = true;
      }

      // Validate Signup Specifics
      const selectGrade = document.getElementById('select-grade');
      const selectSubject = document.getElementById('select-subject');

      if (currentMode === 'signup') {
        if (!inputName.value.trim()) {
          showError('name', 'Please enter your full name.');
          hasError = true;
        }

        if (inputConfirm.value !== passVal) {
          showError('confirm', "Passwords do not match.");
          hasError = true;
        }

        if (currentRole === 'teacher' && !inputInstitution.value.trim()) {
          showError('institution', 'Please enter your institution.');
          hasError = true;
        }
      }

      if (hasError) return;

      // Loading State
      btnAuthSubmit.disabled = true;
      const prevLabel = btnSubmitLabel.textContent;
      btnSubmitLabel.textContent = 'CONNECTING...';

      try {
        let rawEndpoint = currentMode === 'signup' ? '/api/auth/signup' : '/api/auth/login';
        let endpoint = (window.SIKSHA_CONFIG && window.SIKSHA_CONFIG.getApiUrl)
          ? window.SIKSHA_CONFIG.getApiUrl(rawEndpoint)
          : rawEndpoint;
        let payload = {};

        if (currentMode === 'signup') {
          payload = {
            email: emailVal,
            password: passVal,
            full_name: inputName.value.trim(),
            role: currentRole,
            class_grade: selectGrade ? selectGrade.value : 'Class 12 • Senior Secondary',
            institution: inputInstitution ? inputInstitution.value.trim() : '',
            subject: selectSubject ? selectSubject.value : ''
          };
        } else {
          payload = {
            email: emailVal,
            password: passVal,
            role: currentRole
          };
        }

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.detail || 'Authentication failed. Please try again.');
        }

        // Save session persistently
        if (window.SikshaSession) {
          window.SikshaSession.saveSession(data.access_token, data.user);
        } else {
          localStorage.setItem('siksha_token', data.access_token);
          localStorage.setItem('siksha_user', JSON.stringify(data.user));
          localStorage.setItem('siksha_user_id', data.user.id);
          localStorage.setItem('siksha_student_name', data.user.full_name);
        }

        // Show Success Modal
        if (successModal) {
          if (modalTitle && modalDesc) {
            if (data.user.role === 'student') {
              modalTitle.textContent = currentMode === 'login' ? `Welcome back, ${data.user.full_name}.` : `Welcome to SikshaSaathi, ${data.user.full_name}!`;
              modalDesc.textContent = 'Opening your personalized learning space...';
            } else {
              modalTitle.textContent = currentMode === 'login' ? `Welcome back, ${data.user.full_name}.` : 'Educator Access Initialized.';
              modalDesc.textContent = 'Opening educator portal...';
            }
          }
          successModal.classList.add('show');
        }

        // Strict Role-Aware Navigation
        setTimeout(() => {
          let postRedirect = null;
          try {
            postRedirect = sessionStorage.getItem('post_login_redirect');
            sessionStorage.removeItem('post_login_redirect');
          } catch (e) {}

          const role = (data.user.role || currentRole || 'student').toLowerCase();
          if (role === 'teacher') {
            if (postRedirect && postRedirect.startsWith('/teacher') && !postRedirect.includes('auth.html')) {
              window.location.replace(postRedirect);
            } else {
              window.location.replace('/teacher/index.html');
            }
          } else {
            // Student role - ALWAYS go to student workspace!
            if (postRedirect && !postRedirect.startsWith('/teacher') && !postRedirect.includes('auth.html')) {
              window.location.replace(postRedirect);
            } else {
              window.location.replace('/student.html');
            }
          }
        }, 400);

      } catch (err) {
        console.error('[Auth Error]', err);
        showError('email', err.message || 'Authentication error. Please check your credentials.');
        btnAuthSubmit.disabled = false;
        btnSubmitLabel.textContent = prevLabel;
      }
    });
  }

  // --- 11. Demo Exploration Bypass Handler ---
  const btnExploreDemo = document.getElementById('btn-explore-demo');
  if (btnExploreDemo) {
    btnExploreDemo.addEventListener('click', async () => {
      btnExploreDemo.disabled = true;
      btnExploreDemo.innerHTML = '<span>⚡ Loading Demo Sandbox...</span>';
      try {
        const demoUrl = (window.SIKSHA_CONFIG && window.SIKSHA_CONFIG.getApiUrl)
          ? window.SIKSHA_CONFIG.getApiUrl('/api/auth/demo-session')
          : '/api/auth/demo-session';
        const res = await fetch(demoUrl, { method: 'POST' });
        const data = await res.json();
        if (window.SikshaSession) {
          window.SikshaSession.saveSession(data.access_token, data.user);
        } else {
          localStorage.setItem('siksha_token', data.access_token);
          localStorage.setItem('siksha_user', JSON.stringify(data.user));
          localStorage.setItem('siksha_user_id', data.user.id);
          localStorage.setItem('siksha_student_name', data.user.full_name);
        }

        if (successModal) {
          if (modalTitle && modalDesc) {
            modalTitle.textContent = 'Welcome to SikshaSaathi Sandbox.';
            modalDesc.textContent = 'Exploring in guest demo mode. Progress will not be saved permanently.';
          }
          successModal.classList.add('show');
        }

        setTimeout(() => {
          window.location.replace('/student.html');
        }, 500);
      } catch (err) {
        console.warn('Demo session error, using client fallback:', err);
        const demoUser = {
          id: 'usr_demo_sandbox',
          full_name: 'Guest Learner (Demo)',
          email: 'demo@sikshasaathi.sandbox',
          role: 'student',
          class_grade: 'Class 12 • Science (Demo Sandbox)',
          is_demo: true
        };
        if (window.SikshaSession) {
          window.SikshaSession.saveSession('token_demo_sandbox_session', demoUser);
        } else {
          localStorage.setItem('siksha_token', 'token_demo_sandbox_session');
          localStorage.setItem('siksha_user', JSON.stringify(demoUser));
        }
        window.location.replace('/student.html');
      }
    });
  }

  // --- 12. Social Authentication (Google & Apple) ---
  const btnSocialGoogle = document.getElementById('btn-social-google');
  const btnSocialApple = document.getElementById('btn-social-apple');

  if (btnSocialGoogle) {
    btnSocialGoogle.addEventListener('click', async () => {
      btnSocialGoogle.disabled = true;
      const prevHtml = btnSocialGoogle.innerHTML;
      btnSocialGoogle.innerHTML = '<span>Connecting to Google...</span>';

      try {
        if (window.SikshaSupabase && window.SikshaSupabase.signInWithOAuth) {
          const redirectTo = window.location.origin + (currentRole === 'teacher' ? '/teacher/index.html' : '/student.html');
          await window.SikshaSupabase.signInWithOAuth('google', redirectTo);
        } else {
          throw new Error('Supabase client not loaded');
        }
      } catch (err) {
        console.warn('OAuth redirect failed, using fallback:', err);
        setTimeout(() => {
          btnSocialGoogle.disabled = false;
          btnSocialGoogle.innerHTML = prevHtml;
          showError('email', 'Social authentication unavailable. Please use email & password.');
        }, 800);
      }
    });
  }

  if (btnSocialApple) {
    btnSocialApple.addEventListener('click', async () => {
      btnSocialApple.disabled = true;
      const prevHtml = btnSocialApple.innerHTML;
      btnSocialApple.innerHTML = '<span>Connecting to Apple...</span>';

      try {
        if (window.SikshaSupabase && window.SikshaSupabase.signInWithOAuth) {
          const redirectTo = window.location.origin + (currentRole === 'teacher' ? '/teacher/index.html' : '/student.html');
          await window.SikshaSupabase.signInWithOAuth('apple', redirectTo);
        } else {
          throw new Error('Supabase client not loaded');
        }
      } catch (err) {
        console.warn('Apple OAuth failed:', err);
        setTimeout(() => {
          btnSocialApple.disabled = false;
          btnSocialApple.innerHTML = prevHtml;
          showError('email', 'Apple Sign-In unavailable. Please use email & password.');
        }, 800);
      }
    });
  }
});
