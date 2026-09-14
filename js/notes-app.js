/**
 * SIKHSAATHI — Notes Study Library Application
 * SPA logic for the Notes page: Library view, Chapter view, Study modes,
 * Flashcards, Flowcharts, Mind Maps, Ask AI, Downloads.
 */

(function () {
  'use strict';

  const API_BASE = '/api/notes';

  // ---- State ----
  let currentView = 'library'; // 'library' | 'chapter'
  let libraryData = null;
  let currentChapter = null;
  let currentMode = 'detailed';
  let flashcardState = { index: 0, flipped: false, cards: [] };
  let mindmapScale = 1;
  let searchTimeout = null;

  // ---- DOM Cache ----
  const $libraryView = () => document.getElementById('notes-library-view');
  const $chapterView = () => document.getElementById('notes-chapter-view');

  // ============================================================
  // INIT
  // ============================================================
  function init() {
    bindTopbarNav();
    bindHashNavigation();
    loadLibrary();
    bindSearch();
  }

  function bindTopbarNav() {
    const topbarBackBtn = document.getElementById('topbar-back-btn');
    if (topbarBackBtn) {
      topbarBackBtn.addEventListener('click', () => {
        showView('library');
        currentChapter = null;
        if (window.location.hash) {
          history.pushState('', document.title, window.location.pathname + window.location.search);
        }
      });
    }
  }

  function bindHashNavigation() {
    window.addEventListener('hashchange', () => {
      const hash = window.location.hash.replace('#', '');
      if (hash && (!currentChapter || currentChapter.id !== hash)) {
        openChapter(hash);
      } else if (!hash && currentView === 'chapter') {
        showView('library');
        currentChapter = null;
      }
    });
  }

  // ============================================================
  // API HELPERS
  // ============================================================
  async function apiFetch(path, options = {}) {
    try {
      const authHeaders = window.SikshaSession ? window.SikshaSession.getAuthHeaders() : {};
      const mergedHeaders = {
        ...authHeaders,
        ...(options.headers || {})
      };
      const fullUrl = (window.SIKSHA_CONFIG && window.SIKSHA_CONFIG.getApiUrl)
        ? window.SIKSHA_CONFIG.getApiUrl(`${API_BASE}${path}`)
        : `${API_BASE}${path}`;
      const resp = await fetch(fullUrl, {
        ...options,
        headers: mergedHeaders
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      return await resp.json();
    } catch (err) {
      console.error('API Error:', err);
      return null;
    }
  }

  // ============================================================
  // LIBRARY VIEW
  // ============================================================
  async function loadLibrary(subjectFilter, searchQuery) {
    const libraryEl = $libraryView();
    if (!libraryEl) return;

    const contentArea = document.getElementById('notes-library-content');
    if (contentArea) contentArea.innerHTML = '<div class="notes-loading">Loading notes...</div>';

    let url = '/library';
    const params = [];
    if (subjectFilter && subjectFilter !== 'all') params.push(`subject=${subjectFilter}`);
    if (searchQuery) params.push(`search=${encodeURIComponent(searchQuery)}`);
    if (params.length) url += '?' + params.join('&');

    const data = await apiFetch(url);
    if (!data) {
      if (contentArea) contentArea.innerHTML = '<div class="notes-empty">Couldn\'t load notes. Try again.</div>';
      return;
    }

    libraryData = data;
    renderSubjectPills(data.counts, subjectFilter || 'all');
    renderChapters(data.chapters);

    if (window.location.hash) {
      const initialTopicId = window.location.hash.replace('#', '');
      if (initialTopicId) {
        openChapter(initialTopicId);
      }
    }
  }

  function renderSubjectPills(counts, activeFilter) {
    const container = document.getElementById('notes-subject-pills');
    if (!container) return;

    const subjectLabels = {
      all: 'All',
      phys: 'Physics',
      chem: 'Chemistry',
      bio: 'Biology',
      math: 'Maths',
      cs: 'CS'
    };

    container.innerHTML = Object.entries(subjectLabels).map(([key, label]) => {
      const count = counts[key] || 0;
      const isActive = key === activeFilter;
      return `<button class="notes-pill${isActive ? ' active' : ''}" data-subject="${key}" aria-label="Filter by ${label}">${label} (${count})</button>`;
    }).join('');

    container.querySelectorAll('.notes-pill').forEach(btn => {
      btn.addEventListener('click', () => {
        const subject = btn.dataset.subject;
        loadLibrary(subject);
        closeSearchResults();
      });
    });
  }

  // ============================================================
  // SUBJECT TOPICS REVEAL / COLLAPSE SYSTEM
  // ============================================================
  const expandedSubjectGroups = new Set();

  function toggleSubjectGroup(groupKey) {
    const isCurrentlyExpanded = expandedSubjectGroups.has(groupKey);
    const wrapper = document.getElementById(`reveal-wrapper-${groupKey}`);
    const groupEl = document.querySelector(`.notes-subject-group[data-subject-group="${groupKey}"]`);
    const revealBtn = groupEl ? groupEl.querySelector(`.notes-reveal-btn[data-group-key="${groupKey}"]`) : null;
    const dropdownBtn = groupEl ? groupEl.querySelector(`.notes-subject-dropdown-btn[data-group-key="${groupKey}"]`) : null;

    if (!wrapper || !groupEl) return;

    if (isCurrentlyExpanded) {
      // Collapse smoothly
      expandedSubjectGroups.delete(groupKey);
      wrapper.classList.remove('is-expanded');

      if (revealBtn) {
        revealBtn.classList.remove('expanded');
        revealBtn.setAttribute('aria-expanded', 'false');
        const count = parseInt(revealBtn.dataset.totalCount, 10) || 0;
        const remaining = Math.max(count - 3, 0);
        const labelEl = revealBtn.querySelector('.reveal-btn-label');
        if (labelEl) labelEl.textContent = `Show all ${count} topics (${remaining} more)`;
        const svg = revealBtn.querySelector('.reveal-arrow-svg');
        if (svg) svg.classList.remove('rotated');
      }

      if (dropdownBtn) {
        dropdownBtn.classList.remove('is-expanded');
        dropdownBtn.setAttribute('aria-expanded', 'false');
        const count = parseInt(dropdownBtn.dataset.totalCount, 10) || 0;
        const textEl = dropdownBtn.querySelector('.dropdown-btn-label');
        if (textEl) textEl.textContent = 'Dropdown Topics';
        const badgeEl = dropdownBtn.querySelector('.dropdown-count-badge');
        if (badgeEl) badgeEl.textContent = 'All ' + count;
        const svg = dropdownBtn.querySelector('.dropdown-chevron-icon');
        if (svg) svg.classList.remove('rotated');
      }

      // Smooth scroll back up if user scrolled past the top of this group
      const rect = groupEl.getBoundingClientRect();
      if (rect.top < 80) {
        groupEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    } else {
      // Expand smoothly
      expandedSubjectGroups.add(groupKey);
      wrapper.classList.add('is-expanded');

      if (revealBtn) {
        revealBtn.classList.add('expanded');
        revealBtn.setAttribute('aria-expanded', 'true');
        const labelEl = revealBtn.querySelector('.reveal-btn-label');
        if (labelEl) labelEl.textContent = 'Show less (collapse to 3)';
        const svg = revealBtn.querySelector('.reveal-arrow-svg');
        if (svg) svg.classList.add('rotated');
      }

      if (dropdownBtn) {
        dropdownBtn.classList.add('is-expanded');
        dropdownBtn.setAttribute('aria-expanded', 'true');
        const textEl = dropdownBtn.querySelector('.dropdown-btn-label');
        if (textEl) textEl.textContent = 'Close Dropdown';
        const badgeEl = dropdownBtn.querySelector('.dropdown-count-badge');
        if (badgeEl) badgeEl.textContent = 'Show less';
        const svg = dropdownBtn.querySelector('.dropdown-chevron-icon');
        if (svg) svg.classList.add('rotated');
      }
    }
  }

  function renderChapters(chapters) {
    const contentArea = document.getElementById('notes-library-content');
    if (!contentArea) return;

    if (!chapters || chapters.length === 0) {
      contentArea.innerHTML = '<div class="notes-empty">No notes available.</div>';
      return;
    }

    // Group by subject in standard curriculum order
    const groups = {};
    const subjectOrder = { phys: 'Physics', chem: 'Chemistry', bio: 'Biology', math: 'Mathematics', cs: 'Computer Science' };
    const preferredOrder = ['Physics', 'Chemistry', 'Biology', 'Mathematics', 'Computer Science'];

    chapters.forEach(ch => {
      const label = subjectOrder[ch.subject] || ch.subject_title || ch.subject;
      if (!groups[label]) groups[label] = [];
      groups[label].push(ch);
    });

    // Sort entries according to preferredOrder
    const sortedGroups = Object.entries(groups).sort(([a], [b]) => {
      const ia = preferredOrder.indexOf(a);
      const ib = preferredOrder.indexOf(b);
      if (ia !== -1 && ib !== -1) return ia - ib;
      if (ia !== -1) return -1;
      if (ib !== -1) return 1;
      return a.localeCompare(b);
    });

    const renderCard = (ch, extraIdx = null) => {
      const animDelay = extraIdx !== null ? ` style="--reveal-delay: ${Math.min(extraIdx * 35, 350)}ms;"` : '';
      return `<div class="notes-chapter-card" data-chapter-id="${ch.id}" role="button" tabindex="0" aria-label="Open ${escapeHtml(ch.title)}"${animDelay}>
        <span class="card-subject">${escapeHtml(ch.subject_title)}</span>
        <span class="card-title">${escapeHtml(ch.title)}</span>
        <div class="card-meta">
          <span class="card-reading">${ch.reading_time_min} min read</span>
          <span class="card-open">Open →</span>
        </div>
      </div>`;
    };

    let html = '';
    sortedGroups.forEach(([subjectLabel, chs]) => {
      const groupKey = subjectLabel.toLowerCase().replace(/[^a-z0-9]/g, '-');
      const hasMore = chs.length > 3;
      const isExpanded = expandedSubjectGroups.has(groupKey);
      const initialChs = hasMore ? chs.slice(0, 3) : chs;
      const extraChs = hasMore ? chs.slice(3) : [];
      const remainingCount = chs.length - 3;

      const subjectIcons = {
        'Physics': '⚡',
        'Chemistry': '🧪',
        'Biology': '🧬',
        'Mathematics': '📐',
        'Computer Science': '💻'
      };
      const icon = subjectIcons[subjectLabel] || '📚';

      html += `<div class="notes-subject-group" data-subject-group="${groupKey}">
        <div class="notes-subject-header">
          <div class="notes-subject-title-area">
            <span class="notes-subject-icon">${icon}</span>
            <h3 class="notes-subject-heading">${escapeHtml(subjectLabel)}</h3>
            <span class="notes-subject-count-badge">${chs.length} Topics</span>
          </div>
          ${hasMore ? `
            <button class="notes-subject-dropdown-btn ${isExpanded ? 'is-expanded' : ''}" data-group-key="${groupKey}" data-total-count="${chs.length}" aria-expanded="${isExpanded}" title="Dropdown: Click to reveal all ${chs.length} topics">
              <span class="dropdown-btn-label">${isExpanded ? 'Close Dropdown' : 'Dropdown Topics'}</span>
              <span class="dropdown-count-badge">${isExpanded ? 'Show less' : 'All ' + chs.length}</span>
              <svg class="dropdown-chevron-icon ${isExpanded ? 'rotated' : ''}" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>
          ` : `
            <span class="notes-subject-count-pill" style="opacity: 0.85;">All ${chs.length} Visible</span>
          `}
        </div>

        <!-- Initial 3 topics -->
        <div class="notes-chapters-grid">
          ${initialChs.map(ch => renderCard(ch)).join('')}
        </div>

        ${hasMore ? `
          <!-- Smooth expandable wrapper for remaining topics -->
          <div class="notes-reveal-wrapper ${isExpanded ? 'is-expanded' : ''}" id="reveal-wrapper-${groupKey}">
            <div class="notes-reveal-inner">
              <div class="notes-chapters-grid notes-chapters-grid-revealed">
                ${extraChs.map((ch, idx) => renderCard(ch, idx)).join('')}
              </div>
            </div>
          </div>

          <!-- Bottom reveal arrow button -->
          <div class="notes-reveal-actions">
            <button class="notes-reveal-btn ${isExpanded ? 'expanded' : ''}" data-group-key="${groupKey}" data-total-count="${chs.length}" aria-expanded="${isExpanded}">
              <span class="reveal-btn-label">${isExpanded ? 'Show less (collapse to 3)' : `Show all ${chs.length} topics (${remainingCount} more)`}</span>
              <svg class="reveal-arrow-svg ${isExpanded ? 'rotated' : ''}" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>
          </div>
        ` : ''}
      </div>`;
    });

    contentArea.innerHTML = html;

    // Bind card clicks
    contentArea.querySelectorAll('.notes-chapter-card').forEach(card => {
      const handler = () => openChapter(card.dataset.chapterId);
      card.addEventListener('click', handler);
      card.addEventListener('keydown', e => { if (e.key === 'Enter') handler(); });
    });

    // Bind reveal toggle buttons
    contentArea.querySelectorAll('.notes-reveal-btn, .notes-subject-dropdown-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const key = btn.dataset.groupKey;
        if (key) toggleSubjectGroup(key);
      });
    });
  }

  // ============================================================
  // SEARCH
  // ============================================================
  function bindSearch() {
    const searchInput = document.getElementById('notes-search-input');
    if (!searchInput) return;

    searchInput.addEventListener('input', () => {
      clearTimeout(searchTimeout);
      const q = searchInput.value.trim();

      if (q.length < 2) {
        closeSearchResults();
        return;
      }

      searchTimeout = setTimeout(() => performSearch(q), 300);
    });

    searchInput.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        closeSearchResults();
        searchInput.blur();
      }
    });

    // Close when clicking outside
    document.addEventListener('click', e => {
      const searchWrap = document.querySelector('.notes-search-wrap');
      if (searchWrap && !searchWrap.contains(e.target)) {
        closeSearchResults();
      }
    });
  }

  async function performSearch(query) {
    const data = await apiFetch(`/search?q=${encodeURIComponent(query)}`);
    const dropdown = document.getElementById('notes-search-results');
    if (!dropdown) return;

    if (!data || !data.results || data.results.length === 0) {
      dropdown.innerHTML = '<div class="search-result-item"><span class="search-result-meta">No results found</span></div>';
      dropdown.classList.add('open');
      return;
    }

    dropdown.innerHTML = data.results.map(r => `
      <div class="search-result-item" data-chapter-id="${r.chapter_id}">
        <div class="search-result-title">${escapeHtml(r.title)}</div>
        <div class="search-result-meta">${escapeHtml(r.subject)} · ${escapeHtml(r.section)}</div>
        ${r.excerpt ? `<div class="search-result-excerpt">${escapeHtml(r.excerpt)}</div>` : ''}
      </div>
    `).join('');

    dropdown.classList.add('open');

    dropdown.querySelectorAll('.search-result-item[data-chapter-id]').forEach(item => {
      item.addEventListener('click', () => {
        openChapter(item.dataset.chapterId);
        closeSearchResults();
        document.getElementById('notes-search-input').value = '';
      });
    });
  }

  function closeSearchResults() {
    const dropdown = document.getElementById('notes-search-results');
    if (dropdown) dropdown.classList.remove('open');
  }

  // ============================================================
  // CHAPTER VIEW
  // ============================================================
  async function openChapter(chapterId) {
    showView('chapter');
    if (window.location.hash !== '#' + chapterId) {
      window.location.hash = chapterId;
    }

    const chapterArea = document.getElementById('notes-chapter-content');
    if (chapterArea) chapterArea.innerHTML = '<div class="notes-loading">Loading chapter...</div>';

    const data = await apiFetch(`/chapter/${chapterId}`);
    if (!data || !data.chapter) {
      if (chapterArea) chapterArea.innerHTML = '<div class="notes-empty">Couldn\'t load this chapter. Try again.</div>';
      return;
    }

    currentChapter = data.chapter;
    currentMode = 'detailed';
    flashcardState = { index: 0, flipped: false, cards: currentChapter.flashcards || [] };
    mindmapScale = 1;

    renderChapterView();
  }

  function renderChapterView() {
    const chapterArea = document.getElementById('notes-chapter-content');
    if (!chapterArea || !currentChapter) return;

    const ch = currentChapter;

    // Build study tabs
    const modes = [
      { id: 'detailed', label: 'Detailed Notes' },
      { id: 'revision', label: 'Revision' },
      { id: 'flashcards', label: 'Flashcards' },
      { id: 'flow', label: 'Flow Chart' },
      { id: 'mindmap', label: 'Mind Map' },
    ];

    if (ch.has_handwritten) {
      modes.push({ id: 'handwritten', label: 'Handwritten' });
    }

    const tabsHtml = modes.map(m =>
      `<button class="study-tab${m.id === currentMode ? ' active' : ''}" data-mode="${m.id}" aria-label="${m.label}">${m.label}</button>`
    ).join('');

    // Update topbar breadcrumb navigation
    const topbarSubject = document.getElementById('topbar-chapter-subject');
    const topbarTitle = document.getElementById('topbar-chapter-title');
    if (topbarSubject) {
      topbarSubject.textContent = ch.subject_title || 'Notes';
      if (ch.subject === 'bio') {
        topbarSubject.classList.add('is-bio');
      } else {
        topbarSubject.classList.remove('is-bio');
      }
    }
    if (topbarTitle) topbarTitle.textContent = ch.title || '';

    const html = `
      <button class="notes-back-btn" id="notes-back-btn" aria-label="Back to library">
        <svg viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>
        <span>Back to ${escapeHtml(ch.subject_title || 'Notes')}</span>
      </button>

      <div class="chapter-header">
        <div class="chapter-subject-label">${escapeHtml(ch.subject_title)}</div>
        <h1 class="chapter-title">${escapeHtml(ch.title)}</h1>
      </div>

      <div class="study-tabs" id="study-tabs" role="tablist">${tabsHtml}</div>

      <div class="chapter-content-layout">
        <div class="chapter-main-content">
          <div id="study-content-area"></div>

          <!-- Ask AI Panel -->
          <div class="ai-panel" id="ai-panel">
            <div class="ai-panel-header">
              <svg viewBox="0 0 24 24"><path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z"/></svg>
              <span class="ai-panel-title">Ask AI</span>
            </div>
            <div class="ai-quick-chips" id="ai-quick-chips">
              <button class="ai-chip" data-type="summary">Summary</button>
              <button class="ai-chip" data-type="formulas">Formulas</button>
              <button class="ai-chip" data-type="quiz">Quiz Me</button>
              <button class="ai-chip" data-type="traps">Exam Traps</button>
              <button class="ai-chip" data-type="example">Example</button>
            </div>
            <form class="ai-input-row" id="ai-form">
              <input type="text" class="ai-input" id="ai-input" placeholder="Ask anything about this chapter..." aria-label="Ask AI about this chapter">
              <button type="submit" class="ai-send-btn" aria-label="Send question">
                <svg viewBox="0 0 24 24"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
              </button>
            </form>
            <div class="ai-thinking" id="ai-thinking">Thinking...</div>
            <div class="ai-response" id="ai-response"></div>
          </div>

          <!-- Download Bar -->
          <div class="download-bar" id="download-bar">
            <button class="download-btn" data-download="detailed" aria-label="Download detailed notes">
              <svg viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              <span>Detailed Notes</span>
            </button>
            <button class="download-btn" data-download="revision" aria-label="Download revision sheet">
              <svg viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              <span>Revision Sheet</span>
            </button>
            <button class="download-btn" data-download="handwritten" aria-label="Download original PDF">
              <svg viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              <span>Original PDF</span>
            </button>
          </div>
        </div>

        <!-- TOC Sidebar (shown for detailed/revision) -->
        <div class="chapter-toc" id="chapter-toc" style="display: none;"></div>
      </div>
    `;

    chapterArea.innerHTML = html;

    // Bind back button
    document.getElementById('notes-back-btn').addEventListener('click', () => {
      showView('library');
      currentChapter = null;
      if (window.location.hash) {
        history.pushState('', document.title, window.location.pathname + window.location.search);
      }
    });

    // Bind study tabs
    document.querySelectorAll('.study-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        currentMode = tab.dataset.mode;
        document.querySelectorAll('.study-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        renderStudyContent();
      });
    });

    // Bind AI
    bindAI();

    // Bind downloads
    bindDownloads();

    // Render default mode content
    renderStudyContent();
  }

  // ============================================================
  // STUDY CONTENT RENDERING
  // ============================================================
  function renderStudyContent() {
    const area = document.getElementById('study-content-area');
    const tocEl = document.getElementById('chapter-toc');
    if (!area || !currentChapter) return;

    const ch = currentChapter;

    switch (currentMode) {
      case 'detailed':
        area.innerHTML = `<div class="study-content">${ch.detailed_html}</div>`;
        renderTOC(ch.toc, tocEl);
        renderTopicNav(area);
        break;
      case 'revision':
        area.innerHTML = `<div class="study-content">${ch.revision_html}</div>`;
        if (tocEl) tocEl.style.display = 'none';
        renderTopicNav(area);
        break;
      case 'flashcards':
        renderFlashcards(area);
        if (tocEl) tocEl.style.display = 'none';
        break;
      case 'flow':
        renderFlowChart(area, ch.flow_data, ch);
        if (tocEl) tocEl.style.display = 'none';
        break;
      case 'mindmap':
        renderMindMap(area, ch.mindmap_data, ch);
        if (tocEl) tocEl.style.display = 'none';
        break;
      case 'handwritten':
        renderHandwritten(area, ch);
        if (tocEl) tocEl.style.display = 'none';
        break;
      default:
        area.innerHTML = `<div class="study-content">${ch.detailed_html}</div>`;
        renderTOC(ch.toc, tocEl);
    }

    // Render KaTeX if available
    try {
      if (typeof renderMathInElement === 'function') {
        renderMathInElement(area, {
          delimiters: [
            { left: '$$', right: '$$', display: true },
            { left: '$', right: '$', display: false }
          ],
          throwOnError: false
        });
      }
    } catch (e) { /* KaTeX not loaded */ }
  }

  // ============================================================
  // TABLE OF CONTENTS
  // ============================================================
  function renderTOC(toc, tocEl) {
    if (!tocEl || !toc || toc.length === 0) {
      if (tocEl) tocEl.style.display = 'none';
      return;
    }

    tocEl.style.display = '';
    tocEl.innerHTML = `
      <div class="toc-title">Contents</div>
      ${toc.map(item => `
        <button class="toc-link" data-target="${item.id}" aria-label="Go to ${escapeHtml(item.title)}">${escapeHtml(item.title)}</button>
      `).join('')}
    `;

    const links = tocEl.querySelectorAll('.toc-link');
    links.forEach(link => {
      link.addEventListener('click', () => {
        const target = document.getElementById(link.dataset.target);
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
          links.forEach(l => l.classList.remove('active'));
          link.classList.add('active');
        }
      });
    });

    // Auto-highlight active topic link on scroll
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            links.forEach(l => {
              if (l.dataset.target === entry.target.id) {
                l.classList.add('active');
              } else {
                l.classList.remove('active');
              }
            });
          }
        });
      }, { rootMargin: '-10% 0px -60% 0px' });

      toc.forEach(item => {
        const el = document.getElementById(item.id);
        if (el) observer.observe(el);
      });
    }
  }

  // ============================================================
  // TOPIC NAVIGATION (NEXT / PREVIOUS)
  // ============================================================
  function renderTopicNav(container) {
    if (!currentChapter || !libraryData || !libraryData.chapters) return;

    const isChemSol = currentChapter.id.startsWith('chem-sol-');
    const seriesChapters = isChemSol
      ? libraryData.chapters.filter(c => c.id.startsWith('chem-sol-'))
      : libraryData.chapters.filter(c => c.subject === currentChapter.subject);

    if (seriesChapters.length <= 1) return;

    const currentIndex = seriesChapters.findIndex(c => c.id === currentChapter.id);
    if (currentIndex === -1) return;

    const prevChapter = currentIndex > 0 ? seriesChapters[currentIndex - 1] : null;
    const nextChapter = currentIndex < seriesChapters.length - 1 ? seriesChapters[currentIndex + 1] : null;

    const navHtml = document.createElement('div');
    navHtml.className = 'topic-bottom-nav';
    navHtml.innerHTML = `
      <div class="topic-nav-col prev-col">
        ${prevChapter ? `
          <button class="topic-nav-btn prev-btn" data-target-id="${prevChapter.id}" aria-label="Previous Topic: ${escapeHtml(prevChapter.title)}">
            <span class="topic-nav-dir">← Previous Topic</span>
            <span class="topic-nav-title">${escapeHtml(prevChapter.title)}</span>
          </button>
        ` : '<div></div>'}
      </div>
      <div class="topic-nav-center">
        <span class="topic-counter">Topic ${currentIndex + 1} of ${seriesChapters.length}</span>
      </div>
      <div class="topic-nav-col next-col">
        ${nextChapter ? `
          <button class="topic-nav-btn next-btn" data-target-id="${nextChapter.id}" aria-label="Next Topic: ${escapeHtml(nextChapter.title)}">
            <span class="topic-nav-dir">Next Topic →</span>
            <span class="topic-nav-title">${escapeHtml(nextChapter.title)}</span>
          </button>
        ` : '<div></div>'}
      </div>
    `;

    navHtml.querySelectorAll('.topic-nav-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        openChapter(btn.dataset.targetId);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    });

    const studyContentEl = container.querySelector('.study-content');
    if (studyContentEl) {
      studyContentEl.appendChild(navHtml);
    }
  }

  // ============================================================
  // FLASHCARDS
  // ============================================================
  function renderFlashcards(container) {
    const cards = flashcardState.cards;
    if (!cards || cards.length === 0) {
      container.innerHTML = '<div class="notes-empty">No flashcards available for this chapter.</div>';
      return;
    }

    flashcardState.flipped = false;
    const idx = flashcardState.index;
    const card = cards[idx];

    container.innerHTML = `
      <div class="flashcard-container">
        <div class="flashcard-wrapper">
          <div class="flashcard" id="flashcard" role="button" tabindex="0" aria-label="Click to flip">
            <div class="flashcard-face flashcard-front">
              <div class="flashcard-label">Question</div>
              <div class="flashcard-text">${escapeHtml(card.q)}</div>
              <div class="flashcard-hint">Click to reveal answer</div>
            </div>
            <div class="flashcard-face flashcard-back">
              <div class="flashcard-label">Answer</div>
              <div class="flashcard-text">${escapeHtml(card.a)}</div>
            </div>
          </div>
        </div>

        <div class="flashcard-controls">
          <button class="flashcard-nav-btn" id="fc-prev" aria-label="Previous card" ${idx === 0 ? 'disabled' : ''}>
            <svg viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>
          </button>

          <span class="flashcard-progress">${idx + 1} / ${cards.length}</span>

          <button class="flashcard-nav-btn" id="fc-next" aria-label="Next card" ${idx === cards.length - 1 ? 'disabled' : ''}>
            <svg viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg>
          </button>

          <button class="flashcard-shuffle-btn" id="fc-shuffle" aria-label="Shuffle cards">Shuffle</button>
        </div>
      </div>
    `;

    // Bind flip
    const flashcardEl = document.getElementById('flashcard');
    flashcardEl.addEventListener('click', () => {
      flashcardEl.classList.toggle('flipped');
      flashcardState.flipped = !flashcardState.flipped;
    });
    flashcardEl.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        flashcardEl.classList.toggle('flipped');
        flashcardState.flipped = !flashcardState.flipped;
      }
    });

    // Bind prev/next
    document.getElementById('fc-prev').addEventListener('click', () => {
      if (flashcardState.index > 0) {
        flashcardState.index--;
        renderFlashcards(container);
      }
    });

    document.getElementById('fc-next').addEventListener('click', () => {
      if (flashcardState.index < flashcardState.cards.length - 1) {
        flashcardState.index++;
        renderFlashcards(container);
      }
    });

    // Bind shuffle
    document.getElementById('fc-shuffle').addEventListener('click', () => {
      flashcardState.cards = shuffleArray([...flashcardState.cards]);
      flashcardState.index = 0;
      renderFlashcards(container);
    });
  }

  // ============================================================
  // FLOW CHART STUDIO (INTERACTIVE & MULTI-LAYOUT)
  // ============================================================
  let flowchartLayout = 'timeline'; // 'timeline' | 'cards'

  function normalizeFlowData(flowData, chapter) {
    if (!flowData) return null;
    let title = '';
    let rawSteps = [];

    if (Array.isArray(flowData)) {
      rawSteps = flowData;
      title = (chapter ? chapter.title : 'Chapter') + ' — Biological Process Flow';
    } else if (typeof flowData === 'object') {
      title = flowData.title || (chapter ? chapter.title : 'Process Flow');
      rawSteps = flowData.steps || flowData.pipeline || flowData.stages || [];
    }

    if (!rawSteps || rawSteps.length === 0) return null;

    const steps = rawSteps.map((s, idx) => {
      const stepName = s.step || s.title || s.name || `Stage ${idx + 1}`;
      const badge = s.badge || `Stage ${idx + 1}`;
      const desc = s.desc || s.description || s.summary || '';
      const tags = Array.isArray(s.tags) ? s.tags : (s.conditions ? [s.conditions] : []);
      const icon = s.icon || (idx === 0 ? '🏁' : (idx === rawSteps.length - 1 ? '🎯' : '⚡'));
      return { id: s.id || `step-${idx}`, step: stepName, badge, desc, tags, icon };
    });

    return { title, steps };
  }

  function renderFlowChart(container, rawFlowData, chapter) {
    const data = normalizeFlowData(rawFlowData, chapter);
    if (!data || data.steps.length === 0) {
      container.innerHTML = `
        <div class="notes-empty">
          <div style="font-size: 2rem; margin-bottom: 0.5rem;">🌱</div>
          <div style="font-weight: 600;">No process flowchart available for this chapter yet.</div>
          <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 0.25rem;">Check back soon or explore Detailed Notes.</div>
        </div>
      `;
      return;
    }

    const isBio = chapter && (chapter.subject === 'bio' || chapter.id.startsWith('bio-'));
    const isPhys = chapter && (chapter.subject === 'phys' || chapter.id.startsWith('phys-'));
    const isMath = chapter && (chapter.subject === 'math' || chapter.id.startsWith('math-'));
    const accentClass = isBio ? 'flow-accent-bio' : (isPhys ? 'flow-accent-phys' : (isMath ? 'flow-accent-math' : 'flow-accent-default'));

    container.innerHTML = `
      <div class="flowchart-studio ${accentClass}">
        <!-- STUDIO HEADER -->
        <div class="flow-studio-header">
          <div class="flow-header-left">
            <div class="flow-badge-pill">
              <span class="flow-pulse-dot"></span>
              <span>Interactive Flowchart</span>
            </div>
            <h3 class="flow-studio-title">${escapeHtml(data.title)}</h3>
            <div class="flow-studio-meta">
              <span class="flow-step-count">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                ${data.steps.length} Key Stages in Sequential Order
              </span>
              <span class="flow-meta-dot">•</span>
              <span class="flow-meta-hint">Click any stage to highlight & focus</span>
            </div>
          </div>

          <div class="flow-header-actions">
            <div class="flow-view-switcher" role="group" aria-label="Flowchart View Modes">
              <button class="flow-view-btn ${flowchartLayout === 'timeline' ? 'active' : ''}" id="flow-view-timeline" title="Timeline Sequence View">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="2" x2="12" y2="22"></line><circle cx="12" cy="7" r="3"></circle><circle cx="12" cy="17" r="3"></circle></svg>
                Timeline
              </button>
              <button class="flow-view-btn ${flowchartLayout === 'cards' ? 'active' : ''}" id="flow-view-cards" title="Process Pipeline View">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
                Cards
              </button>
            </div>

            <button class="flow-copy-btn" id="flow-copy-btn" title="Copy flowchart outline to clipboard">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
              <span>Copy Outline</span>
            </button>
          </div>
        </div>

        <!-- FLOW CONTENT CONTAINER -->
        <div class="flow-content-area ${flowchartLayout === 'cards' ? 'flow-layout-cards' : 'flow-layout-timeline'}" id="flow-content-area">
          ${renderFlowchartBody(data.steps, flowchartLayout)}
        </div>
      </div>
    `;

    // Event listeners
    const btnTimeline = document.getElementById('flow-view-timeline');
    const btnCards = document.getElementById('flow-view-cards');
    const contentArea = document.getElementById('flow-content-area');

    if (btnTimeline && btnCards && contentArea) {
      btnTimeline.addEventListener('click', () => {
        flowchartLayout = 'timeline';
        btnTimeline.classList.add('active');
        btnCards.classList.remove('active');
        contentArea.className = 'flow-content-area flow-layout-timeline';
        contentArea.innerHTML = renderFlowchartBody(data.steps, 'timeline');
        bindFlowStepInteractions();
      });

      btnCards.addEventListener('click', () => {
        flowchartLayout = 'cards';
        btnCards.classList.add('active');
        btnTimeline.classList.remove('active');
        contentArea.className = 'flow-content-area flow-layout-cards';
        contentArea.innerHTML = renderFlowchartBody(data.steps, 'cards');
        bindFlowStepInteractions();
      });
    }

    const copyBtn = document.getElementById('flow-copy-btn');
    if (copyBtn) {
      copyBtn.addEventListener('click', () => {
        const text = `${data.title}\n` + '='.repeat(data.title.length) + '\n\n' +
          data.steps.map((s, idx) => `${idx + 1}. [${s.badge}] ${s.step}\n   ${s.desc.replace(/<[^>]+>/g, '')}`).join('\n\n');
        navigator.clipboard.writeText(text).then(() => {
          copyBtn.innerHTML = `
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
            <span>Copied!</span>
          `;
          setTimeout(() => {
            copyBtn.innerHTML = `
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
              <span>Copy Outline</span>
            `;
          }, 2000);
        });
      });
    }

    bindFlowStepInteractions();

    // Render KaTeX in flow steps if present
    try {
      if (typeof renderMathInElement === 'function') {
        renderMathInElement(container, {
          delimiters: [
            { left: '$$', right: '$$', display: true },
            { left: '$', right: '$', display: false }
          ],
          throwOnError: false
        });
      }
    } catch (e) { /* ignore */ }
  }

  function renderFlowchartBody(steps, layout) {
    if (layout === 'cards') {
      return `
        <div class="flow-cards-grid">
          ${steps.map((step, idx) => `
            <div class="flow-card-col">
              <div class="flow-pipeline-card" data-step-id="${step.id}" tabindex="0">
                <div class="flow-card-head">
                  <div class="flow-step-pill">${escapeHtml(step.badge)}</div>
                  <div class="flow-step-num-bubble">${idx + 1}</div>
                </div>
                <h4 class="flow-card-title">${escapeHtml(step.step)}</h4>
                <p class="flow-card-desc">${step.desc}</p>
                ${step.tags && step.tags.length > 0 ? `
                  <div class="flow-card-tags">
                    ${step.tags.map(t => `<span class="flow-tag-pill">${escapeHtml(t)}</span>`).join('')}
                  </div>
                ` : ''}
              </div>
              ${idx < steps.length - 1 ? `
                <div class="flow-pipeline-arrow">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg>
                </div>
              ` : ''}
            </div>
          `).join('')}
        </div>
      `;
    }

    // Default: Timeline View
    return `
      <div class="flow-timeline-stream">
        ${steps.map((step, idx) => `
          <div class="flow-timeline-row" data-step-id="${step.id}">
            <!-- TIMELINE RAIL -->
            <div class="flow-rail-col">
              <div class="flow-node-marker">
                <span class="flow-node-index">${idx + 1}</span>
              </div>
              ${idx < steps.length - 1 ? '<div class="flow-rail-line"></div>' : ''}
            </div>

            <!-- STEP CONTENT CARD -->
            <div class="flow-step-card" tabindex="0">
              <div class="flow-step-header">
                <div class="flow-step-title-wrap">
                  <span class="flow-step-tag">${escapeHtml(step.badge)}</span>
                  <h4 class="flow-step-title">${escapeHtml(step.step)}</h4>
                </div>
                <div class="flow-step-action-badge">
                  <span>Stage ${idx + 1} of ${steps.length}</span>
                </div>
              </div>
              <div class="flow-step-body">
                <div class="flow-step-desc">${step.desc}</div>
                ${step.tags && step.tags.length > 0 ? `
                  <div class="flow-tags-row">
                    ${step.tags.map(t => `<span class="flow-tag-pill">${escapeHtml(t)}</span>`).join('')}
                  </div>
                ` : ''}
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  function bindFlowStepInteractions() {
    const cards = document.querySelectorAll('.flow-step-card, .flow-pipeline-card');
    cards.forEach(card => {
      card.addEventListener('click', () => {
        const wasActive = card.classList.contains('active-focus');
        cards.forEach(c => c.classList.remove('active-focus'));
        if (!wasActive) card.classList.add('active-focus');
      });
    });
  }

  // ============================================================
  // MIND MAP STUDIO (DYNAMIC SVG & INTERACTIVE TREE EXPLORER)
  // ============================================================
  let mindmapViewMode = 'svg'; // 'svg' | 'tree'
  let mindmapSearchQuery = '';
  let mindmapDataCache = null;
  let mindmapChapterCache = null;

  const MM_THEMES = [
    { stroke: '#10B981', fill: '#ECFDF5', text: '#065F46', border: '#A7F3D0', accent: '#059669', badge: 'Botany / Living World' },
    { stroke: '#6366F1', fill: '#EEF2FF', text: '#3730A3', border: '#C7D2FE', accent: '#4F46E5', badge: 'Genetics / Core' },
    { stroke: '#F59E0B', fill: '#FFFBEB', text: '#92400E', border: '#FDE68A', accent: '#D97706', badge: 'Physiology' },
    { stroke: '#06B6D4', fill: '#ECFEFF', text: '#155E75', border: '#A5F3FC', accent: '#0891B2', badge: 'Biotech & Ecology' },
    { stroke: '#EC4899', fill: '#FDF2F8', text: '#9D174D', border: '#FBCFE8', accent: '#DB2777', badge: 'Reproduction' },
    { stroke: '#8B5CF6', fill: '#F5F3FF', text: '#5B21B6', border: '#DDD6FE', accent: '#7C3AED', badge: 'Evolution & Health' },
  ];

  function normalizeMindMap(rawData, chapter) {
    if (!rawData) return null;

    function cleanNode(node, defaultName) {
      if (!node) return null;
      const name = node.name || node.title || node.label || defaultName || 'Topic';
      const icon = node.icon || '';
      const tag = node.tag || node.badge || '';
      const rawChildren = node.children || node.subtopics || node.branches || [];
      const children = Array.isArray(rawChildren)
        ? rawChildren.map((c, i) => cleanNode(c, `Branch ${i + 1}`)).filter(Boolean)
        : [];
      return { name, icon, tag, children };
    }

    if (Array.isArray(rawData)) {
      return {
        name: (chapter ? chapter.title : 'Chapter Concepts'),
        icon: '🧠',
        tag: 'Core Concept Map',
        children: rawData.map((d, i) => cleanNode(d, `Branch ${i + 1}`)).filter(Boolean)
      };
    }

    return cleanNode(rawData, chapter ? chapter.title : 'Chapter Mind Map');
  }

  function renderMindMap(container, rawData, chapter) {
    const data = normalizeMindMap(rawData, chapter);
    mindmapDataCache = data;
    mindmapChapterCache = chapter;

    if (!data || !data.name) {
      container.innerHTML = `
        <div class="notes-empty">
          <div style="font-size: 2rem; margin-bottom: 0.5rem;">🧠</div>
          <div style="font-weight: 600;">No mind map available for this chapter yet.</div>
          <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 0.25rem;">Check back soon or explore Flowcharts and Detailed Notes.</div>
        </div>
      `;
      return;
    }

    const totalBranches = (data.children || []).length;
    const totalConcepts = (data.children || []).reduce((acc, c) => acc + 1 + (c.children || []).length, 1);

    container.innerHTML = `
      <div class="mindmap-studio" id="mindmap-studio">
        <!-- STUDIO TOOLBAR -->
        <div class="mindmap-toolbar">
          <div class="mindmap-toolbar-left">
            <div class="mindmap-title-wrap">
              <span class="mindmap-icon">🧠</span>
              <h3 class="mindmap-title">${escapeHtml(data.name)}</h3>
            </div>
            <div class="mindmap-stats-badge">
              <span>${totalBranches} Major Branches • ${totalConcepts} Concepts</span>
            </div>
          </div>

          <div class="mindmap-toolbar-center">
            <div class="mindmap-search-wrap">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              <input type="text" id="mm-search-input" class="mm-search-input" placeholder="Search concepts (e.g. tapetum, meiosis)..." value="${escapeHtml(mindmapSearchQuery)}">
              <span class="mm-search-count" id="mm-search-count" style="display: none;">0 matches</span>
            </div>
          </div>

          <div class="mindmap-toolbar-right">
            <!-- VIEW TOGGLE -->
            <div class="mindmap-view-toggle">
              <button class="mm-view-btn ${mindmapViewMode === 'svg' ? 'active' : ''}" id="mm-view-svg" title="Visual SVG Diagram">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"></circle><path d="M3 12h6m6 0h6M12 3v6m0 6v6"></path></svg>
                Diagram
              </button>
              <button class="mm-view-btn ${mindmapViewMode === 'tree' ? 'active' : ''}" id="mm-view-tree" title="Collapsible Tree Explorer">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                Explorer
              </button>
            </div>

            <!-- ZOOM CONTROLS -->
            <div class="mindmap-zoom-group" id="mm-zoom-controls">
              <button class="mindmap-zoom-btn" id="mm-zoom-out" title="Zoom out">−</button>
              <span class="mindmap-zoom-level" id="mm-zoom-level">100%</span>
              <button class="mindmap-zoom-btn" id="mm-zoom-in" title="Zoom in">+</button>
              <button class="mindmap-zoom-btn" id="mm-zoom-reset" title="Reset view">⟲</button>
            </div>

            <!-- FULLSCREEN TOGGLE -->
            <button class="mindmap-fullscreen-btn" id="mm-fullscreen-btn" title="Toggle Fullscreen Mind Map">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path></svg>
            </button>
          </div>
        </div>

        <!-- MAIN VIEWPORT -->
        <div class="mindmap-viewport" id="mindmap-viewport">
          <div class="mindmap-svg-canvas" id="mindmap-svg-canvas" style="${mindmapViewMode === 'svg' ? '' : 'display: none;'}">
            <svg class="mindmap-svg" id="mindmap-svg"></svg>
          </div>
          <div class="mindmap-tree-explorer" id="mindmap-tree-explorer" style="${mindmapViewMode === 'tree' ? '' : 'display: none;'}">
            ${renderMindMapTreeHtml(data, mindmapSearchQuery)}
          </div>
        </div>
      </div>
    `;

    // Initialize SVG diagram
    if (mindmapViewMode === 'svg') {
      drawMindMapSVG(data, mindmapSearchQuery);
      applyMindmapZoom();
    }

    // Bind Event Listeners
    setupMindMapEvents(data);
  }

  function setupMindMapEvents(data) {
    const searchInput = document.getElementById('mm-search-input');
    const searchCount = document.getElementById('mm-search-count');
    const btnSvg = document.getElementById('mm-view-svg');
    const btnTree = document.getElementById('mm-view-tree');
    const zoomControls = document.getElementById('mm-zoom-controls');
    const svgCanvas = document.getElementById('mindmap-svg-canvas');
    const treeExplorer = document.getElementById('mindmap-tree-explorer');
    const studio = document.getElementById('mindmap-studio');
    const fullscreenBtn = document.getElementById('mm-fullscreen-btn');

    if (btnSvg && btnTree) {
      btnSvg.addEventListener('click', () => {
        mindmapViewMode = 'svg';
        btnSvg.classList.add('active');
        btnTree.classList.remove('active');
        if (svgCanvas) svgCanvas.style.display = '';
        if (treeExplorer) treeExplorer.style.display = 'none';
        if (zoomControls) zoomControls.style.display = '';
        drawMindMapSVG(data, mindmapSearchQuery);
        applyMindmapZoom();
      });

      btnTree.addEventListener('click', () => {
        mindmapViewMode = 'tree';
        btnTree.classList.add('active');
        btnSvg.classList.remove('active');
        if (svgCanvas) svgCanvas.style.display = 'none';
        if (treeExplorer) {
          treeExplorer.style.display = '';
          treeExplorer.innerHTML = renderMindMapTreeHtml(data, mindmapSearchQuery);
          bindTreeExplorerToggles();
        }
        if (zoomControls) zoomControls.style.display = 'none';
      });
    }

    // Search Input
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        mindmapSearchQuery = e.target.value.trim().toLowerCase();
        if (mindmapViewMode === 'svg') {
          const matchCount = drawMindMapSVG(data, mindmapSearchQuery);
          if (searchCount) {
            if (mindmapSearchQuery) {
              searchCount.textContent = `${matchCount} found`;
              searchCount.style.display = '';
            } else {
              searchCount.style.display = 'none';
            }
          }
        } else {
          if (treeExplorer) {
            treeExplorer.innerHTML = renderMindMapTreeHtml(data, mindmapSearchQuery);
            bindTreeExplorerToggles();
          }
        }
      });
    }

    // Zoom Controls
    const btnZoomIn = document.getElementById('mm-zoom-in');
    const btnZoomOut = document.getElementById('mm-zoom-out');
    const btnZoomReset = document.getElementById('mm-zoom-reset');

    if (btnZoomIn) {
      btnZoomIn.addEventListener('click', () => {
        mindmapScale = Math.min(2.2, mindmapScale + 0.15);
        applyMindmapZoom();
      });
    }
    if (btnZoomOut) {
      btnZoomOut.addEventListener('click', () => {
        mindmapScale = Math.max(0.4, mindmapScale - 0.15);
        applyMindmapZoom();
      });
    }
    if (btnZoomReset) {
      btnZoomReset.addEventListener('click', () => {
        mindmapScale = 1;
        applyMindmapZoom();
      });
    }

    // Fullscreen Toggle
    if (fullscreenBtn && studio) {
      fullscreenBtn.addEventListener('click', () => {
        studio.classList.toggle('mindmap-fullscreen-active');
        const isFs = studio.classList.contains('mindmap-fullscreen-active');
        fullscreenBtn.innerHTML = isFs
          ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>'
          : '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path></svg>';
        if (mindmapViewMode === 'svg') {
          setTimeout(() => drawMindMapSVG(data, mindmapSearchQuery), 50);
        }
      });
    }

    bindTreeExplorerToggles();
  }

  function applyMindmapZoom() {
    const svg = document.getElementById('mindmap-svg');
    const zoomLabel = document.getElementById('mm-zoom-level');
    if (svg) {
      svg.style.transform = `scale(${mindmapScale})`;
      svg.style.transformOrigin = '0 50%';
    }
    if (zoomLabel) {
      zoomLabel.textContent = `${Math.round(mindmapScale * 100)}%`;
    }
  }

  function drawMindMapSVG(data, query = '') {
    const svg = document.getElementById('mindmap-svg');
    if (!svg) return 0;

    const children = data.children || [];
    let matchCount = 0;

    // Node sizing constants
    const nodeH = 38;
    const hGap = 65;
    const vGap = 16;
    const rootW = Math.min(260, Math.max(180, (data.name.length * 8) + 40));

    // Calculate layout metrics
    let totalLeaves = 0;
    children.forEach(c => {
      const leaves = c.children || [];
      totalLeaves += Math.max(1, leaves.length);
    });

    const height = Math.max(480, totalLeaves * (nodeH + vGap) + 100);
    const width = Math.max(900, rootW + hGap + 240 + hGap + 280 + 80);

    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    svg.setAttribute('width', width);
    svg.setAttribute('height', height);
    svg.innerHTML = '';

    const rootX = 40;
    const rootY = height / 2;

    // Check root match
    const rootMatches = query && data.name.toLowerCase().includes(query);
    if (rootMatches) matchCount++;

    // Draw Root Node
    drawNodeBox({
      svg, x: rootX, y: rootY - nodeH / 2, w: rootW, h: nodeH + 6,
      text: (data.icon ? data.icon + ' ' : '') + data.name,
      fill: 'url(#rootGradient)',
      stroke: rootMatches ? '#F59E0B' : '#4F46E5',
      strokeWidth: rootMatches ? '3' : '2',
      textColor: '#FFFFFF',
      isRoot: true,
      highlight: rootMatches
    });

    // Create defs for gradients and glow filters
    const ns = 'http://www.w3.org/2000/svg';
    const defs = document.createElementNS(ns, 'defs');
    defs.innerHTML = `
      <linearGradient id="rootGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#4F46E5" />
        <stop offset="100%" stop-color="#3730A3" />
      </linearGradient>
      <filter id="nodeGlow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="2" stdDeviation="4" flood-color="#4F46E5" flood-opacity="0.18" />
      </filter>
      <filter id="searchGlow" x="-30%" y="-30%" width="160%" height="160%">
        <feDropShadow dx="0" dy="0" stdDeviation="5" flood-color="#F59E0B" flood-opacity="0.6" />
      </filter>
    `;
    svg.insertBefore(defs, svg.firstChild);

    if (children.length === 0) return matchCount;

    // Layout Branches
    let currentY = 40;
    const l1X = rootX + rootW + hGap;

    children.forEach((child, ci) => {
      const theme = MM_THEMES[ci % MM_THEMES.length];
      const leaves = child.children || [];
      const branchHeight = Math.max(1, leaves.length) * (nodeH + vGap) - vGap;
      const childY = currentY + (branchHeight / 2) - (nodeH / 2);

      const childText = (child.icon ? child.icon + ' ' : '') + child.name;
      const childW = Math.min(260, Math.max(170, (childText.length * 7.5) + 30));

      const childMatches = query && child.name.toLowerCase().includes(query);
      if (childMatches) matchCount++;

      // Connector from root to L1 branch
      drawBezierLink(svg, rootX + rootW, rootY, l1X, childY + nodeH / 2, theme.stroke);

      // Draw L1 Branch Node
      drawNodeBox({
        svg, x: l1X, y: childY, w: childW, h: nodeH,
        text: childText,
        fill: theme.fill,
        stroke: childMatches ? '#F59E0B' : theme.stroke,
        strokeWidth: childMatches ? '3' : '1.5',
        textColor: theme.text,
        isRoot: false,
        highlight: childMatches,
        badgeText: leaves.length > 0 ? `${leaves.length}` : ''
      });

      // Layout L2 Leaf Nodes
      const l2X = l1X + childW + hGap;
      if (leaves.length > 0) {
        let leafY = currentY;
        leaves.forEach((leaf) => {
          const leafText = (leaf.icon ? leaf.icon + ' ' : '') + leaf.name;
          const leafW = Math.min(290, Math.max(160, (leafText.length * 7.2) + 24));
          const leafMatches = query && leaf.name.toLowerCase().includes(query);
          if (leafMatches) matchCount++;

          // Connector from L1 to L2
          drawBezierLink(svg, l1X + childW, childY + nodeH / 2, l2X, leafY + nodeH / 2, theme.border);

          // Draw Leaf Node
          drawNodeBox({
            svg, x: l2X, y: leafY, w: leafW, h: nodeH - 4,
            text: leafText,
            fill: '#FFFFFF',
            stroke: leafMatches ? '#F59E0B' : '#E2E8F0',
            strokeWidth: leafMatches ? '2.5' : '1',
            textColor: '#1E293B',
            isRoot: false,
            highlight: leafMatches,
            accentDot: theme.stroke
          });

          leafY += nodeH + vGap;
        });
      }

      currentY += branchHeight + vGap + 14;
    });

    return matchCount;
  }

  function drawNodeBox({ svg, x, y, w, h, text, fill, stroke, strokeWidth, textColor, isRoot, highlight, badgeText, accentDot }) {
    const ns = 'http://www.w3.org/2000/svg';
    const g = document.createElementNS(ns, 'g');
    g.setAttribute('class', 'mm-node-g' + (highlight ? ' mm-node-highlight' : ''));
    if (highlight) {
      g.setAttribute('filter', 'url(#searchGlow)');
    } else {
      g.setAttribute('filter', 'url(#nodeGlow)');
    }

    // Background rectangle
    const rect = document.createElementNS(ns, 'rect');
    rect.setAttribute('x', x);
    rect.setAttribute('y', y);
    rect.setAttribute('width', w);
    rect.setAttribute('height', h);
    rect.setAttribute('rx', isRoot ? 12 : 9);
    rect.setAttribute('fill', fill);
    rect.setAttribute('stroke', stroke);
    rect.setAttribute('stroke-width', strokeWidth);
    g.appendChild(rect);

    // Accent dot if leaf
    let textOffsetX = 0;
    if (accentDot) {
      const dot = document.createElementNS(ns, 'circle');
      dot.setAttribute('cx', x + 12);
      dot.setAttribute('cy', y + h / 2);
      dot.setAttribute('r', 3);
      dot.setAttribute('fill', accentDot);
      g.appendChild(dot);
      textOffsetX = 6;
    }

    // Text label
    const txt = document.createElementNS(ns, 'text');
    txt.setAttribute('x', accentDot ? x + 20 : x + w / 2);
    txt.setAttribute('y', y + h / 2 + 1);
    txt.setAttribute('text-anchor', accentDot ? 'start' : 'middle');
    txt.setAttribute('dominant-baseline', 'middle');
    txt.setAttribute('fill', textColor);
    txt.setAttribute('font-size', isRoot ? '13' : '11.5');
    txt.setAttribute('font-weight', isRoot ? '700' : '600');
    txt.setAttribute('font-family', "'Geist', -apple-system, BlinkMacSystemFont, sans-serif");

    // Smart max length truncate
    const maxChars = Math.floor(w / 7.2);
    const displayText = text.length > maxChars ? text.substring(0, maxChars - 1) + '…' : text;
    txt.textContent = displayText;
    g.appendChild(txt);

    // Optional badge for subtopics count
    if (badgeText) {
      const bw = 18;
      const bx = x + w - 12;
      const by = y + h / 2;
      const bCircle = document.createElementNS(ns, 'circle');
      bCircle.setAttribute('cx', bx);
      bCircle.setAttribute('cy', by);
      bCircle.setAttribute('r', 8);
      bCircle.setAttribute('fill', stroke);
      g.appendChild(bCircle);

      const bTxt = document.createElementNS(ns, 'text');
      bTxt.setAttribute('x', bx);
      bTxt.setAttribute('y', by + 0.5);
      bTxt.setAttribute('text-anchor', 'middle');
      bTxt.setAttribute('dominant-baseline', 'middle');
      bTxt.setAttribute('fill', '#FFFFFF');
      bTxt.setAttribute('font-size', '9');
      bTxt.setAttribute('font-weight', '700');
      bTxt.textContent = badgeText;
      g.appendChild(bTxt);
    }

    svg.appendChild(g);
  }

  function drawBezierLink(svg, x1, y1, x2, y2, strokeColor) {
    const ns = 'http://www.w3.org/2000/svg';
    const path = document.createElementNS(ns, 'path');
    const dx = x2 - x1;
    const cx1 = x1 + dx * 0.45;
    const cx2 = x2 - dx * 0.45;
    path.setAttribute('d', `M${x1},${y1} C${cx1},${y1} ${cx2},${y2} ${x2},${y2}`);
    path.setAttribute('stroke', strokeColor);
    path.setAttribute('stroke-width', '2');
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke-linecap', 'round');
    path.setAttribute('opacity', '0.85');
    svg.appendChild(path);
  }

  function renderMindMapTreeHtml(data, query = '') {
    const children = data.children || [];
    return `
      <div class="mm-tree-container">
        <div class="mm-tree-root-card">
          <div class="mm-tree-root-head">
            <span class="mm-tree-icon">${data.icon || '🧠'}</span>
            <div class="mm-tree-root-info">
              <span class="mm-tree-tag">Core Syllabus Node</span>
              <h3 class="mm-tree-title">${escapeHtml(data.name)}</h3>
            </div>
          </div>
        </div>

        <div class="mm-tree-branches-list">
          ${children.map((branch, bi) => {
            const theme = MM_THEMES[bi % MM_THEMES.length];
            const leaves = branch.children || [];
            const branchMatches = query && branch.name.toLowerCase().includes(query);
            return `
              <div class="mm-branch-card" style="border-left: 4px solid ${theme.stroke};">
                <div class="mm-branch-header" data-branch-index="${bi}">
                  <div class="mm-branch-title-wrap">
                    <span class="mm-branch-dot" style="background: ${theme.stroke};"></span>
                    <h4 class="mm-branch-title ${branchMatches ? 'mm-match' : ''}">
                      ${branch.icon ? branch.icon + ' ' : ''}${escapeHtml(branch.name)}
                    </h4>
                  </div>
                  <div class="mm-branch-actions">
                    <span class="mm-branch-count-badge" style="color: ${theme.accent}; background: ${theme.fill};">
                      ${leaves.length} Concepts
                    </span>
                    <button class="mm-branch-toggle-btn" aria-label="Toggle branch">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"></polyline></svg>
                    </button>
                  </div>
                </div>

                <div class="mm-branch-leaves-grid">
                  ${leaves.map(leaf => {
                    const leafMatches = query && leaf.name.toLowerCase().includes(query);
                    return `
                      <div class="mm-leaf-item ${leafMatches ? 'mm-match' : ''}">
                        <span class="mm-leaf-bullet" style="background: ${theme.stroke};"></span>
                        <span class="mm-leaf-text">${leaf.icon ? leaf.icon + ' ' : ''}${escapeHtml(leaf.name)}</span>
                      </div>
                    `;
                  }).join('')}
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }

  function bindTreeExplorerToggles() {
    const branchHeaders = document.querySelectorAll('.mm-branch-header');
    branchHeaders.forEach(header => {
      header.addEventListener('click', () => {
        const card = header.closest('.mm-branch-card');
        if (card) {
          card.classList.toggle('collapsed');
        }
      });
    });
  }

  // ============================================================
  // HANDWRITTEN NOTES
  // ============================================================
  function renderHandwritten(container, chapter) {
    if (!chapter.has_handwritten) {
      container.innerHTML = '<div class="notes-empty">No handwritten notes available for this chapter.</div>';
      return;
    }

    container.innerHTML = `
      <div class="handwritten-container">
        <div class="handwritten-icon">📝</div>
        <div class="handwritten-title">Original Study Material</div>
        <div class="handwritten-desc">${escapeHtml(chapter.source_file)}</div>
        <div class="handwritten-actions">
          <a href="${API_BASE}/handwritten/${chapter.id}" target="_blank" class="handwritten-btn primary" download>
            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Download PDF
          </a>
          <button class="handwritten-btn secondary" onclick="window.open('${API_BASE}/handwritten/${chapter.id}', '_blank')">
            View in Browser
          </button>
        </div>
      </div>
    `;
  }

  // ============================================================
  // ASK AI (CHAPTER-AWARE GROUNDED RAG WITH MULTI-TURN CHAT)
  // ============================================================
  function formatMarkdownToHtml(text) {
    if (!text) return '';
    let out = text;
    // If it already looks like HTML formatted response
    if (out.includes('<div') || out.includes('<strong') || out.includes('<ul>')) {
      return out;
    }
    // Code blocks
    out = out.replace(/```([\s\S]*?)```/g, (m, code) => `<pre style="background: rgba(0,0,0,0.06); padding: 0.75rem; border-radius: 8px; font-family: var(--font-mono, monospace); font-size: 0.82rem; overflow-x: auto;"><code>${escapeHtml(code.trim())}</code></pre>`);
    // Inline code
    out = out.replace(/`([^`]+)`/g, (m, code) => `<code style="background: rgba(91,92,226,0.1); color: var(--indigo-primary, #4F46E5); padding: 2px 6px; border-radius: 4px; font-size: 0.85em;">${escapeHtml(code)}</code>`);
    // Bold
    out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    // Italic
    out = out.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    // Bullet points
    out = out.replace(/^\s*[\-\•\*]\s+(.+)$/gm, '<li style="margin-bottom: 0.25rem;">$1</li>');
    out = out.replace(/(<li.*<\/li>)/gs, '<ul style="padding-left: 1.25rem; margin: 0.5rem 0;">$1</ul>');
    // Line breaks
    out = out.replace(/\n\n+/g, '<br><br>');
    return out;
  }

  function bindAI() {
    const form = document.getElementById('ai-form');
    const input = document.getElementById('ai-input');
    if (!form || !input) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const query = input.value.trim();
      if (!query) return;
      await askAI(query, 'custom');
      input.value = '';
    });

    // Quick chips
    document.querySelectorAll('.ai-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const type = chip.dataset.type;
        const text = chip.textContent.trim();
        askAI(text, type);
      });
    });
  }

  async function askAI(query, queryType) {
    const thinkingEl = document.getElementById('ai-thinking');
    const responseEl = document.getElementById('ai-response');
    if (!thinkingEl || !responseEl) return;

    thinkingEl.classList.add('visible');
    thinkingEl.innerHTML = '<span style="display: inline-block; animation: spin 1s linear infinite; margin-right: 6px;">✦</span> SikshaSaathi AI is reading note context...';

    // Show conversation thread container if not already initialized
    let thread = responseEl.querySelector('.ai-chat-thread');
    if (!thread) {
      responseEl.innerHTML = '<div class="ai-chat-thread" style="display: flex; flex-direction: column; gap: 0.85rem;"></div>';
      thread = responseEl.querySelector('.ai-chat-thread');
    }
    responseEl.classList.add('visible');

    // Append User Message Bubble
    const userMsg = document.createElement('div');
    userMsg.className = 'ai-msg-user';
    userMsg.style.cssText = 'align-self: flex-end; background: var(--indigo-primary, #4F46E5); color: #FFFFFF; padding: 0.65rem 1rem; border-radius: 14px 14px 2px 14px; font-size: 0.88rem; max-width: 85%; line-height: 1.45;';
    userMsg.textContent = query;
    thread.appendChild(userMsg);

    // Placeholder for Assistant reply
    const assistantMsg = document.createElement('div');
    assistantMsg.className = 'ai-msg-assistant';
    assistantMsg.style.cssText = 'align-self: flex-start; background: var(--bg-card, #FFFFFF); border: 1px solid var(--border-subtle, rgba(0,0,0,0.08)); padding: 0.85rem 1.15rem; border-radius: 14px 14px 14px 2px; font-size: 0.88rem; line-height: 1.6; color: var(--text-main, #1A1C23); max-width: 95%; box-shadow: 0 4px 16px rgba(0,0,0,0.03);';
    assistantMsg.innerHTML = '<span style="color: var(--text-muted, #717684); font-style: italic;">Analyzing chapter excerpts...</span>';
    thread.appendChild(assistantMsg);

    const data = await apiFetch('/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: query,
        chapter_id: currentChapter ? currentChapter.id : null,
        query_type: queryType || 'custom'
      })
    });

    thinkingEl.classList.remove('visible');

    if (!data || !data.answer) {
      assistantMsg.innerHTML = "I couldn't retrieve an answer right now. Please try again or rephrase your question.";
      return;
    }

    let formattedAnswer = formatMarkdownToHtml(data.answer);
    if (data.source && data.source.display) {
      formattedAnswer += `
        <div class="ai-source" style="margin-top: 0.75rem; padding-top: 0.65rem; border-top: 1px dashed var(--border-subtle, rgba(0,0,0,0.08)); font-size: 0.76rem; color: var(--indigo-primary, #4F46E5); font-weight: 600; display: flex; align-items: center; gap: 4px;">
          <span>📖</span> <span>Based on: ${escapeHtml(data.source.display)}</span>
        </div>
      `;
    }

    assistantMsg.innerHTML = formattedAnswer;

    // Render KaTeX LaTeX formulas
    try {
      if (typeof renderMathInElement === 'function') {
        renderMathInElement(assistantMsg, {
          delimiters: [
            { left: '$$', right: '$$', display: true },
            { left: '$', right: '$', display: false }
          ],
          throwOnError: false
        });
      }
    } catch (e) { /* KaTeX optional */ }

    // Scroll to bottom smoothly
    responseEl.scrollTop = responseEl.scrollHeight;
  }

  // ============================================================
  // DOWNLOADS
  // ============================================================
  function bindDownloads() {
    document.querySelectorAll('.download-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        if (!currentChapter) return;
        const type = btn.dataset.download;

        if (type === 'handwritten') {
          window.open(`${API_BASE}/handwritten/${currentChapter.id}`, '_blank');
        } else {
          window.open(`${API_BASE}/download/${currentChapter.id}?type=${type}`, '_blank');
        }
      });
    });
  }

  // ============================================================
  // VIEW SWITCHING
  // ============================================================
  function showView(view) {
    currentView = view;
    const library = $libraryView();
    const chapter = $chapterView();
    const topbarGreeting = document.getElementById('topbar-greeting');
    const topbarChapterNav = document.getElementById('topbar-chapter-nav');
    const topbar = document.querySelector('.main-topbar');

    if (view === 'library') {
      if (library) library.style.display = '';
      if (chapter) chapter.style.display = 'none';
      if (topbarGreeting) topbarGreeting.style.display = '';
      if (topbarChapterNav) topbarChapterNav.style.display = 'none';
      if (topbar) topbar.classList.remove('in-chapter-mode');
      document.body.classList.remove('notes-topic-active');
    } else {
      if (library) library.style.display = 'none';
      if (chapter) chapter.style.display = '';
      if (topbarGreeting) topbarGreeting.style.display = 'none';
      if (topbarChapterNav) topbarChapterNav.style.display = 'flex';
      if (topbar) topbar.classList.add('in-chapter-mode');
      document.body.classList.add('notes-topic-active');

      const scrollEl = document.querySelector('.main-content-scroll');
      if (scrollEl) scrollEl.scrollTop = 0;
      window.scrollTo(0, 0);
    }
  }

  // ============================================================
  // UTILITIES
  // ============================================================
  function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  // ============================================================
  // START
  // ============================================================
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
