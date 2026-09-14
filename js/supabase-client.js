/**
 * SIKSHASAATHI — Supabase Client SDK Bridge
 * Initializes official Supabase JS client and handles real-time cloud auth and telemetry.
 */
(function () {
  'use strict';

  window.SikshaSupabase = {
    client: null,
    isReady: false,

    init: async function () {
      try {
        const configUrl = (window.SIKSHA_CONFIG && window.SIKSHA_CONFIG.getApiUrl)
          ? window.SIKSHA_CONFIG.getApiUrl('/api/supabase/config')
          : '/api/supabase/config';
        const res = await fetch(configUrl);
        const data = await res.json();
        if (data.status === 'success' && data.is_configured && window.supabase) {
          this.client = window.supabase.createClient(data.supabase_url, data.supabase_anon_key);
          this.isReady = true;
          console.log('⚡ [Supabase] Cloud initialized successfully:', data.supabase_url);

          // Listen for real-time auth state changes
          this.client.auth.onAuthStateChange((event, session) => {
            if (session && session.access_token) {
              localStorage.setItem('supabase_access_token', session.access_token);
              if (window.SikshaSession && window.SikshaSession.saveSession) {
                const u = session.user;
                const meta = (u && u.user_metadata) || {};
                window.SikshaSession.saveSession(session.access_token, {
                  id: u.id,
                  email: u.email,
                  full_name: meta.full_name || u.email.split('@')[0],
                  role: meta.role || 'student',
                  class_grade: meta.class_grade || 'Class 12 • Senior Secondary',
                  target_goal: meta.target_goal || 'JEE / NEET'
                });
              }

              if (event === 'SIGNED_IN' && window.location.pathname.includes('auth.html')) {
                setTimeout(() => {
                  window.location.replace('/student.html');
                }, 300);
              }
            }
          });
        }
      } catch (err) {
        console.warn('[Supabase] Client init warning:', err);
      }
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => window.SikshaSupabase.init());
  } else {
    window.SikshaSupabase.init();
  }
})();
