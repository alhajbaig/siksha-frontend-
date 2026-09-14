/**
 * SIKHSAATHI — Centralized Frontend Environment & API Configuration
 * Supports decoupled deployment (Vercel/Netlify Frontend + Render/Fly Backend)
 */
(function (window) {
  'use strict';

  // Check if explicit meta tag exists in <head>
  const metaApiEl = document.querySelector('meta[name="siksha-api-url"]');
  const metaApiUrl = metaApiEl ? metaApiEl.getAttribute('content') : null;

  // Determine API base URL
  function resolveApiBase() {
    // 1. Explicit window override
    if (window.SIKSHA_API_BASE) {
      return window.SIKSHA_API_BASE.replace(/\/+$/, '');
    }

    // 2. LocalStorage override (allows manual switching/testing in dev or preview)
    const storedApi = localStorage.getItem('SIKSHA_API_URL');
    if (storedApi && storedApi.trim()) {
      return storedApi.trim().replace(/\/+$/, '');
    }

    // 3. Meta tag override
    if (metaApiUrl && metaApiUrl.trim()) {
      return metaApiUrl.trim().replace(/\/+$/, '');
    }

    // 4. Local development detection
    const hostname = window.location.hostname;
    const port = window.location.port;

    // If served from FastAPI directly on same port or reverse-proxied
    if (port === '8000' || (!port && (hostname === 'localhost' || hostname === '127.0.0.1'))) {
      return '';
    }

    // If served via live-server / vite / npm on another port (e.g. 5500, 3000, 5173)
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:8000';
    }

    // 5. Production:
    // Defaults to live Render backend API
    return 'https://siksha-backend-g8jh.onrender.com';
  }

  const SIKSHA_CONFIG = {
    version: '3.5.0',
    getApiBase: resolveApiBase,

    /**
     * Resolves an API endpoint path to a full URL
     * @param {string} path - e.g. '/api/auth/me' or 'api/student/classes'
     * @returns {string} - e.g. 'https://backend.onrender.com/api/auth/me' or '/api/auth/me'
     */
    getApiUrl: function (path) {
      if (!path) return '';
      if (path.startsWith('http://') || path.startsWith('https://')) {
        return path;
      }
      const base = resolveApiBase();
      const normalizedPath = path.startsWith('/') ? path : '/' + path;
      return base ? `${base}${normalizedPath}` : normalizedPath;
    },

    /**
     * Helper to switch backend API URL dynamically at runtime
     * @param {string} url - Base backend URL (e.g. 'https://siksha-api.onrender.com')
     */
    setApiUrl: function (url) {
      if (!url) {
        localStorage.removeItem('SIKSHA_API_URL');
      } else {
        localStorage.setItem('SIKSHA_API_URL', url.trim().replace(/\/+$/, ''));
      }
      console.log('[SIKSHA_CONFIG] API base set to:', resolveApiBase());
    }
  };

  window.SIKSHA_CONFIG = SIKSHA_CONFIG;
})(window);
