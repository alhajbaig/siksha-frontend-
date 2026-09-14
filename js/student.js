/* ==========================================================================
   SIKHSAATHI — UNIFIED STUDENT APPLICATION ENGINE
   Dashboard • AI Mentor • Notes • Flashcards • Practice • Assessments • Revision • Profile
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  'use strict';

  function getApiUrl(path) {
    return (window.SIKSHA_CONFIG && window.SIKSHA_CONFIG.getApiUrl)
      ? window.SIKSHA_CONFIG.getApiUrl(path)
      : path;
  }

  // =========================================================================
  // 1. SCROLL ENGINE — NATIVE RESPONSIVE SCROLL
  // =========================================================================
  // Lenis window hijack removed to ensure buttery smooth native scrolling
  // and instantaneous tab switching without layout freezing.

  // =========================================================================
  // KATEX AUTO-RENDER HELPER
  // =========================================================================
  function triggerMathRender(el) {
    if (typeof renderMathInElement !== 'undefined') {
      try {
        renderMathInElement(el || document.body, {
          delimiters: [
            { left: '$$', right: '$$', display: true },
            { left: '$', right: '$', display: false },
            { left: '\\(', right: '\\)', display: false },
            { left: '\\[', right: '\\]', display: true }
          ],
          throwOnError: false
        });
      } catch (err) {
        console.warn('KaTeX render error:', err);
      }
    }
  }

  // Initial KaTeX render on page load
  setTimeout(() => triggerMathRender(), 80);

  // =========================================================================
  // 1B. FAST PROFILE HYDRATION FROM SESSION (Zero Lag & No Mock Names)
  // =========================================================================
  function hydrateUserProfileFromSession() {
    const user = window.SikshaSession ? window.SikshaSession.getUser() : null;
    if (!user) return;

    const name = user.full_name || user.name || (user.email ? user.email.split('@')[0] : 'Scholar');
    if (name) {
      document.querySelectorAll('.profile-name, .profile-student-name').forEach(el => {
        el.textContent = name;
      });
      const initials = window.SikshaSession ? window.SikshaSession.getInitials(name) : name.substring(0, 2).toUpperCase();
      const flagshipAv = document.getElementById('profile-flagship-avatar');
      if (flagshipAv) flagshipAv.textContent = initials;
      document.querySelectorAll('.profile-avatar').forEach(el => {
        el.textContent = initials;
      });
      if (document.title) {
        document.title = `${name} — Learning Portal | SikshaSaathi`;
      }
    }
    if (user.class_grade) {
      document.querySelectorAll('.profile-role').forEach(el => {
        el.textContent = user.class_grade;
      });
      const classBadge = document.getElementById('profile-class-badge');
      if (classBadge) classBadge.textContent = user.class_grade.toUpperCase();
    }
    if (user.target_goal) {
      const goalBadge = document.getElementById('profile-goal-badge');
      if (goalBadge) goalBadge.textContent = user.target_goal.toUpperCase();
    }
    if (user.institution) {
      const instBadge = document.getElementById('profile-institution-badge');
      if (instBadge) instBadge.textContent = `📍 ${user.institution}`;
    }
    if (user.bio) {
      document.querySelectorAll('.profile-bio-text').forEach(el => {
        el.textContent = user.bio;
      });
    }
    const editNameInput = document.getElementById('edit-name-input');
    if (editNameInput && name) {
      editNameInput.value = name;
    }
  }

  // Immediately hydrate profile on DOM ready
  hydrateUserProfileFromSession();

  // =========================================================================
  // 2. PROFILE MENU POPUP TOGGLE (SIDEBAR)
  // =========================================================================
  const profileBtn = document.getElementById('profile-menu-btn');
  const profileMenu = document.getElementById('profile-menu-popup');
  if (profileBtn && profileMenu) {
    profileBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      profileMenu.classList.toggle('open');
    });
    document.addEventListener('click', (e) => {
      if (profileMenu.classList.contains('open') && !profileBtn.contains(e.target) && !profileMenu.contains(e.target)) {
        profileMenu.classList.remove('open');
      }
    });
  }

  // =========================================================================
  // 3. WHY AM I SEEING THIS? (DASHBOARD)
  // =========================================================================
  const whyBtn = document.getElementById('why-seeing-btn');
  const whyBox = document.getElementById('why-seeing-box');
  if (whyBtn && whyBox) {
    whyBtn.addEventListener('click', (e) => {
      e.preventDefault();
      whyBox.classList.toggle('open');
      whyBtn.textContent = whyBox.classList.contains('open') ? 'Hide explanation ✕' : 'Why am I seeing this? ↗';
    });
  }

  // =========================================================================
  // 4. AI MENTOR STUDIO (student-mentor.html)
  // =========================================================================
  const mentorForm = document.getElementById('mentor-chat-form');
  const mentorInput = document.getElementById('mentor-user-input');
  const mentorStream = document.getElementById('mentor-chat-stream');
  const modePills = document.querySelectorAll('.mentor-mode-pill');
  let currentMentorMode = 'SOCRATIC';

  if (modePills.length > 0) {
    modePills.forEach(pill => {
      pill.addEventListener('click', () => {
        modePills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        currentMentorMode = pill.getAttribute('data-mode') || 'SOCRATIC';
      });
    });
  }

  if (mentorForm && mentorInput && mentorStream && !document.getElementById('btn-new-conversation')) {
    mentorForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const text = mentorInput.value.trim();
      if (!text) return;

      // Add user bubble
      appendMessage('user', text);
      mentorInput.value = '';

      // Scroll to bottom
      mentorStream.scrollTop = mentorStream.scrollHeight;

      // Simulate mentor thinking
      setTimeout(() => {
        let reply = '';
        if (currentMentorMode === 'SOCRATIC') {
          reply = `That is a perceptive question. Before applying the equation directly, what physical quantity remains constant throughout this interval? Think about energy conservation versus momentum.`;
        } else if (currentMentorMode === 'DEEP') {
          reply = `Let's derive this from first principles. By integrating the differential equation $\\frac{dv}{dt} = -kv^2$, we separate variables: $\\int \\frac{dv}{v^2} = -\\int k\\,dt$. This yields $v(t) = \\frac{v_0}{1 + kv_0 t}$.`;
        } else {
          reply = `<strong>Exam Shortcut Method:</strong> Apply $v^2 = u^2 + 2as$. Substitute $u = 0, a = 9.8\\text{ m/s}^2, s = 20\\text{ m}$. Result: $v = \\sqrt{2 \\times 9.8 \\times 20} = 19.8\\text{ m/s}$.`;
        }
        appendMessage('mentor', reply, true);
        mentorStream.scrollTop = mentorStream.scrollHeight;
      }, 700);
    });
  }

  // Quick Prompt Chips
  const promptChips = document.querySelectorAll('.prompt-chip');
  if (promptChips.length > 0 && mentorInput && mentorForm) {
    promptChips.forEach(chip => {
      chip.addEventListener('click', () => {
        mentorInput.value = chip.textContent.trim();
        mentorForm.dispatchEvent(new Event('submit'));
      });
    });
  }

  function appendMessage(sender, htmlContent, hasHint = false) {
    if (!mentorStream) return;
    const bubble = document.createElement('div');
    bubble.className = sender === 'user' ? 'chat-bubble chat-bubble-user' : 'chat-bubble chat-bubble-mentor';

    const meta = document.createElement('div');
    meta.className = 'chat-bubble-meta';
    meta.innerHTML = sender === 'user'
      ? `<span>YOU</span> • <span>Just now</span>`
      : `<span>AI ${currentMentorMode} MENTOR</span> • <span>Verified Concept</span>`;

    bubble.appendChild(meta);

    const body = document.createElement('div');
    body.innerHTML = htmlContent;
    bubble.appendChild(body);

    if (hasHint && sender === 'mentor') {
      const hintWrap = document.createElement('div');
      hintWrap.className = 'hint-accordion-wrap';
      hintWrap.innerHTML = `
        <button class="hint-toggle-btn" type="button">💡 Need a Socratic Hint?</button>
        <div class="hint-content-box">
          Hint: Look at the boundary condition at $t = 0$. How does initial velocity relate to the resistive damping coefficient?
        </div>
      `;
      const btn = hintWrap.querySelector('.hint-toggle-btn');
      const box = hintWrap.querySelector('.hint-content-box');
      btn.addEventListener('click', () => {
        box.classList.toggle('open');
        btn.textContent = box.classList.contains('open') ? 'Hide Hint ✕' : '💡 Need a Socratic Hint?';
      });
      bubble.appendChild(hintWrap);
    }

    mentorStream.appendChild(bubble);
    triggerMathRender(bubble);
  }

  // Existing hint buttons in initial HTML
  document.querySelectorAll('.hint-toggle-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const box = btn.nextElementSibling;
      if (box && box.classList.contains('hint-content-box')) {
        box.classList.toggle('open');
        btn.textContent = box.classList.contains('open') ? 'Hide Hint ✕' : '💡 Need a Socratic Hint?';
      }
    });
  });

  // =========================================================================
  // 5. SMART NOTES & RAG KNOWLEDGE ENGINE (student-notes.html)
  // =========================================================================
  const ragDocsList = document.getElementById('rag-docs-list');
  const ragActiveTitle = document.getElementById('rag-active-title');
  const ragActiveSubject = document.getElementById('rag-active-subject-badge');
  const ragDocumentBody = document.getElementById('rag-document-body');
  const ragSearchInput = document.getElementById('rag-search-input');
  const ragTagChips = document.querySelectorAll('.rag-tag-chip');
  const ragChatForm = document.getElementById('rag-chat-form');
  const ragUserQuery = document.getElementById('rag-user-query');
  const ragStream = document.getElementById('rag-conversation-stream');
  const totalDocsBadge = document.getElementById('rag-total-docs-badge');

  // Quick Prompt Chips
  const chipSummary = document.getElementById('rag-chip-summary');
  const chipFormulas = document.getElementById('rag-chip-formulas');
  const chipQuiz = document.getElementById('rag-chip-quiz');
  const chipTraps = document.getElementById('rag-chip-traps');

  // Upload Modal elements
  const openUploadBtn = document.getElementById('open-upload-modal-btn');
  const quickUploadTrigger = document.getElementById('quick-upload-trigger');
  const uploadModal = document.getElementById('rag-upload-modal');
  const closeUploadModalBtn = document.getElementById('close-upload-modal-btn');
  const ragUploadForm = document.getElementById('rag-upload-form');
  const dropzone = document.getElementById('rag-dropzone');
  const fileInput = document.getElementById('rag-file-input');

  let activeNoteId = null;
  let currentSubjectFilter = 'all';
  let isQueryRunning = false;
  let searchDebounceTimer = null;

  function getAuthHeaders() {
    const token = localStorage.getItem('siksha_token') || localStorage.getItem('access_token') || '';
    const userId = localStorage.getItem('siksha_user_id') || 'usr_student_default';
    return {
      'Authorization': token ? `Bearer ${token}` : 'Bearer dev_session',
      'X-User-Id': userId
    };
  }

  function getSubjectBadgeClass(badgeName) {
    const b = (badgeName || '').toUpperCase();
    if (b.includes('CHEM')) return 'badge-emerald';
    if (b.includes('PHYS')) return 'badge-indigo';
    if (b.includes('MATH')) return 'badge-amber';
    if (b.includes('COMP') || b.includes('CS')) return 'badge-blue';
    if (b.includes('BIO')) return 'badge-emerald';
    return 'badge-indigo';
  }

  // Update Dynamic Counts on Subject Pills
  function updateSubjectCounts(counts) {
    if (!counts) return;
    ragTagChips.forEach(chip => {
      const tag = chip.getAttribute('data-tag');
      if (tag === 'all') chip.textContent = `All (${counts.all || 0})`;
      else if (tag === 'chem') chip.textContent = `Chem (${counts.chem || 0})`;
      else if (tag === 'phys') chip.textContent = `Phys (${counts.phys || 0})`;
      else if (tag === 'math') chip.textContent = `Math (${counts.math || 0})`;
      else if (tag === 'cs') chip.textContent = `CS (${counts.cs || 0})`;
      else if (tag === 'bio') chip.textContent = `Bio (${counts.bio || 0})`;
    });

    if (totalDocsBadge) {
      totalDocsBadge.textContent = `${counts.all || 0} INDEXED`;
    }
  }

  // Fetch Notes from Backend API
  async function fetchNotes(subject = null, searchQuery = null, selectNoteId = null) {
    if (!ragDocsList) return;

    try {
      let url = '/api/rag/notes';
      const params = new URLSearchParams();
      if (subject && subject !== 'all') params.append('subject', subject);
      if (searchQuery && searchQuery.trim()) params.append('search', searchQuery.trim());
      if (params.toString()) url += `?${params.toString()}`;

      const res = await fetch(getApiUrl(url), { headers: getAuthHeaders() });
      if (!res.ok) throw new Error(`Failed to load notes (${res.status})`);

      const data = await res.json();
      renderNotesList(data.notes, selectNoteId);
      updateSubjectCounts(data.subject_counts);
    } catch (err) {
      console.error('Error fetching notes library:', err);
    }
  }

  // Render Note Cards in Library
  function renderNotesList(notes, preferredSelectId = null) {
    if (!ragDocsList) return;
    ragDocsList.innerHTML = '';

    if (!notes || notes.length === 0) {
      ragDocsList.innerHTML = `
        <div style="padding: 1.5rem 1rem; text-align: center; color: var(--text-muted); font-size: 0.82rem;">
          No notes found. Click "Upload & Index Note" to add your first note.
        </div>
      `;
      return;
    }

    let targetSelectedId = preferredSelectId || activeNoteId || notes[0].id;
    let foundActive = false;

    notes.forEach((note) => {
      const isSelected = note.id === targetSelectedId;
      if (isSelected) foundActive = true;

      const badgeClass = getSubjectBadgeClass(note.badge);
      const card = document.createElement('div');
      card.className = `rag-doc-card ${isSelected ? 'active' : ''}`;
      card.setAttribute('data-note-id', note.id);
      card.setAttribute('data-tag', note.subject);

      let statusHtml = '<span style="color: var(--emerald-primary);">● Indexed</span>';
      if (note.status === 'processing' || note.status === 'chunking') {
        statusHtml = '<span style="color: var(--amber-primary);">● Indexing</span>';
      } else if (note.status === 'failed') {
        statusHtml = '<span style="color: var(--rose-primary);">● Failed</span>';
      }

      card.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span class="badge ${badgeClass}" style="font-size: 0.65rem;">${note.badge}</span>
          <span class="badge badge-indigo" style="font-size: 0.62rem;">${note.format}</span>
        </div>
        <div class="rag-doc-title">${note.title}</div>
        <div class="rag-doc-meta">
          <span>${note.updated_at || 'Updated Today'}</span>
          ${statusHtml}
        </div>
      `;

      card.addEventListener('click', () => {
        document.querySelectorAll('.rag-doc-card').forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        loadActiveNote(note.id);
      });

      ragDocsList.appendChild(card);
    });

    const activeIdToLoad = foundActive ? targetSelectedId : notes[0].id;
    loadActiveNote(activeIdToLoad);
  }

  // Load Single Note Details into Reader & Copilot
  async function loadActiveNote(noteId) {
    if (!noteId) return;
    activeNoteId = noteId;

    try {
      const res = await fetch(getApiUrl(`/api/rag/notes/${noteId}`), { headers: getAuthHeaders() });
      if (!res.ok) throw new Error('Note detail load failed');
      const note = await res.json();

      if (ragActiveTitle) ragActiveTitle.textContent = note.title;
      if (ragActiveSubject) ragActiveSubject.textContent = note.subject;

      // Update Reader stats
      const statsContainer = document.querySelector('.rag-reader-stats');
      if (statsContainer) {
        statsContainer.innerHTML = `
          <span>📖 ${note.reading_time_min || 3} min read</span>
          <span>🧩 ${note.chunk_count || note.chunks.length || 4} vector chunks</span>
          <span style="color: var(--emerald-primary); font-weight: 600;">✓ RAG Indexed</span>
        `;
      }

      if (ragDocumentBody) {
        ragDocumentBody.innerHTML = note.body;
        triggerMathRender(ragDocumentBody);
      }

      // Refresh Copilot Conversation Header
      if (ragStream) {
        ragStream.innerHTML = `
          <div class="rag-msg-ai">
            <div style="font-family: var(--font-mono); font-size: 0.72rem; font-weight: 700; color: var(--indigo-primary); display: flex; align-items: center; gap: 0.35rem;">
              <svg class="svg-icon-sm" viewBox="0 0 24 24" style="stroke: var(--indigo-primary);"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              <span>DOCUMENT RAG LOADED</span>
            </div>
            <div>
              I've indexed <strong>${note.title}</strong> (${note.chunks ? note.chunks.length : note.chunk_count} semantic chunks). Ask any question or click a quick analysis chip!
            </div>
          </div>
        `;
      }
    } catch (err) {
      console.error('Error loading active note:', err);
    }
  }

  // Subject Tag Filter Pills
  if (ragTagChips.length > 0) {
    ragTagChips.forEach(chip => {
      chip.addEventListener('click', () => {
        ragTagChips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        const tag = chip.getAttribute('data-tag');
        currentSubjectFilter = tag;
        fetchNotes(tag, ragSearchInput ? ragSearchInput.value : '');
      });
    });
  }

  // Debounced Search Filter
  if (ragSearchInput) {
    ragSearchInput.addEventListener('input', (e) => {
      clearTimeout(searchDebounceTimer);
      const query = e.target.value;
      searchDebounceTimer = setTimeout(() => {
        fetchNotes(currentSubjectFilter, query);
      }, 250);
    });
  }

  // Append User Message to Copilot Stream
  function appendRagUserMessage(text) {
    if (!ragStream) return;
    const msg = document.createElement('div');
    msg.className = 'rag-msg-user';
    msg.textContent = text;
    ragStream.appendChild(msg);
    ragStream.scrollTop = ragStream.scrollHeight;
  }

  // Execute RAG Query via Backend
  async function executeBackendRagQuery(query, queryType = 'custom') {
    if (!ragStream || isQueryRunning) return;
    isQueryRunning = true;

    const thinkingMsg = document.createElement('div');
    thinkingMsg.className = 'rag-msg-ai';
    thinkingMsg.innerHTML = `<span style="color: var(--text-muted); font-size: 0.8rem;">⚡ Searching vector embeddings & retrieving grounded citations...</span>`;
    ragStream.appendChild(thinkingMsg);
    ragStream.scrollTop = ragStream.scrollHeight;

    try {
      const res = await fetch(getApiUrl('/api/rag/query'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({
          note_id: activeNoteId,
          query: query,
          query_type: queryType
        })
      });

      if (!res.ok) throw new Error(`Query failed (${res.status})`);
      const data = await res.json();

      thinkingMsg.remove();
      const responseCard = document.createElement('div');
      responseCard.className = 'rag-msg-ai';

      let citationHtml = '';
      if (data.citations && data.citations.length > 0) {
        const topCitation = data.citations[0];
        citationHtml = `
          <div class="rag-citation-card">
            <strong>🎯 Grounded Source Citation (Chunk #${topCitation.chunk_id} • Similarity: ${Math.round(topCitation.similarity_score * 100)}%):</strong>
            <em>"${topCitation.text}"</em>
            <div style="margin-top: 4px; font-size: 0.7rem; color: var(--emerald-primary); font-weight: 600;">
              ✓ ${topCitation.grounded_confidence || '98% Grounded in Active Note'} (Page ${topCitation.page_number || 1})
            </div>
          </div>
        `;
      }

      responseCard.innerHTML = `
        <div>${data.answer}</div>
        ${citationHtml}
      `;

      ragStream.appendChild(responseCard);
      triggerMathRender(responseCard);
      ragStream.scrollTop = ragStream.scrollHeight;

    } catch (err) {
      console.error('RAG Query Error:', err);
      thinkingMsg.remove();
      const errorCard = document.createElement('div');
      errorCard.className = 'rag-msg-ai';
      errorCard.innerHTML = `
        <div style="color: var(--rose-primary);">
          ⚠️ Error communicating with RAG Neural Engine. Please try asking again.
        </div>
      `;
      ragStream.appendChild(errorCard);
      ragStream.scrollTop = ragStream.scrollHeight;
    } finally {
      isQueryRunning = false;
    }
  }

  // Q&A Chat Submission
  if (ragChatForm && ragUserQuery) {
    ragChatForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const q = ragUserQuery.value.trim();
      if (!q || isQueryRunning) return;

      appendRagUserMessage(q);
      ragUserQuery.value = '';
      executeBackendRagQuery(q, 'custom');
    });
  }

  // Quick prompt chip triggers
  if (chipSummary) chipSummary.addEventListener('click', () => { appendRagUserMessage('⚡ 30s Executive Summary'); executeBackendRagQuery('30s Summary', 'summary'); });
  if (chipFormulas) chipFormulas.addEventListener('click', () => { appendRagUserMessage('🔍 Extract Formulas'); executeBackendRagQuery('Extract Formulas', 'formulas'); });
  if (chipQuiz) chipQuiz.addEventListener('click', () => { appendRagUserMessage('🎯 Generate 3-Question Drill'); executeBackendRagQuery('Quiz Me', 'quiz'); });
  if (chipTraps) chipTraps.addEventListener('click', () => { appendRagUserMessage('⚠️ What are common exam traps?'); executeBackendRagQuery('Common Exam Traps', 'traps'); });

  // Upload Modal Open / Close
  if (openUploadBtn && uploadModal) openUploadBtn.addEventListener('click', () => uploadModal.classList.add('open'));
  if (quickUploadTrigger && uploadModal) quickUploadTrigger.addEventListener('click', () => uploadModal.classList.add('open'));
  if (closeUploadModalBtn && uploadModal) closeUploadModalBtn.addEventListener('click', () => uploadModal.classList.remove('open'));

  // Dropzone click opens file input & drag-and-drop
  if (dropzone && fileInput) {
    dropzone.addEventListener('click', () => fileInput.click());

    ['dragenter', 'dragover'].forEach(eventName => {
      dropzone.addEventListener(eventName, (e) => {
        e.preventDefault();
        dropzone.style.borderColor = 'var(--indigo-primary)';
      });
    });

    ['dragleave', 'drop'].forEach(eventName => {
      dropzone.addEventListener(eventName, (e) => {
        e.preventDefault();
        dropzone.style.borderColor = 'var(--border-card)';
      });
    });

    dropzone.addEventListener('drop', (e) => {
      if (e.dataTransfer.files.length > 0) {
        fileInput.files = e.dataTransfer.files;
        handleSelectedFile(e.dataTransfer.files[0]);
      }
    });

    fileInput.addEventListener('change', (e) => {
      if (e.target.files.length > 0) {
        handleSelectedFile(e.target.files[0]);
      }
    });
  }

  function handleSelectedFile(file) {
    const titleInput = document.getElementById('upload-note-title');
    if (titleInput && !titleInput.value) {
      titleInput.value = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
    }
  }

  // Upload & Index Pipeline Form Submission with Live Animations
  if (ragUploadForm) {
    ragUploadForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const titleInput = document.getElementById('upload-note-title');
      const subjectSelect = document.getElementById('upload-note-subject');
      const textInput = document.getElementById('upload-note-text');
      const statusBox = document.getElementById('rag-pipeline-status-box');
      const startIndexingBtn = document.getElementById('start-indexing-btn');

      if (!titleInput || !titleInput.value.trim()) return;

      const title = titleInput.value.trim();
      const subjectVal = subjectSelect ? subjectSelect.value : 'phys';
      const textContent = textInput ? textInput.value.trim() : '';
      const selectedFile = (fileInput && fileInput.files.length > 0) ? fileInput.files[0] : null;

      // Show pipeline animation box
      if (statusBox && startIndexingBtn) {
        statusBox.style.display = 'flex';
        startIndexingBtn.disabled = true;

        const s1 = document.getElementById('step-ocr');
        const s2 = document.getElementById('step-chunk');
        const s3 = document.getElementById('step-embed');
        const s4 = document.getElementById('step-store');

        // Reset step classes
        [s1, s2, s3, s4].forEach(s => {
          if (s) s.classList.remove('completed');
        });

        // Stage 1 animation
        setTimeout(() => { if (s1) s1.classList.add('completed'); }, 300);
        setTimeout(() => { if (s2) s2.classList.add('completed'); }, 700);

        try {
          const formData = new FormData();
          formData.append('title', title);
          formData.append('subject', subjectVal);
          if (textContent) formData.append('text_content', textContent);
          if (selectedFile) formData.append('file', selectedFile);

          const res = await fetch(getApiUrl('/api/rag/upload'), {
            method: 'POST',
            headers: getAuthHeaders(),
            body: formData
          });

          if (!res.ok) throw new Error(`Upload failed (${res.status})`);
          const uploadResult = await res.json();

          // Stage 3 & 4 animation
          if (s3) s3.classList.add('completed');
          setTimeout(async () => {
            if (s4) s4.classList.add('completed');

            // Refetch notes and select the new note
            await fetchNotes(currentSubjectFilter, null, uploadResult.note.id);

            setTimeout(() => {
              if (uploadModal) uploadModal.classList.remove('open');
              startIndexingBtn.disabled = false;
              statusBox.style.display = 'none';
              ragUploadForm.reset();
            }, 600);
          }, 600);

        } catch (uploadErr) {
          console.error('Ingestion error:', uploadErr);
          alert('Failed to index document: ' + uploadErr.message);
          startIndexingBtn.disabled = false;
          statusBox.style.display = 'none';
        }
      }
    });
  }

  // Delete & Reindex Note Actions
  const deleteNoteBtn = document.getElementById('rag-btn-delete');
  const reindexNoteBtn = document.getElementById('rag-btn-reindex');

  if (deleteNoteBtn) {
    deleteNoteBtn.addEventListener('click', async () => {
      if (!activeNoteId) return;
      if (!confirm('Are you sure you want to delete this note and its vector chunks?')) return;

      try {
        const res = await fetch(getApiUrl(`/api/rag/notes/${activeNoteId}`), {
          method: 'DELETE',
          headers: getAuthHeaders()
        });
        if (!res.ok) throw new Error('Delete failed');
        activeNoteId = null;
        await fetchNotes(currentSubjectFilter);
      } catch (err) {
        console.error('Delete error:', err);
        alert('Could not delete note: ' + err.message);
      }
    });
  }

  if (reindexNoteBtn) {
    reindexNoteBtn.addEventListener('click', async () => {
      if (!activeNoteId) return;
      try {
        reindexNoteBtn.style.opacity = '0.5';
        const res = await fetch(getApiUrl(`/api/rag/notes/${activeNoteId}/reindex`), {
          method: 'POST',
          headers: getAuthHeaders()
        });
        if (!res.ok) throw new Error('Reindexing failed');
        await loadActiveNote(activeNoteId);
        alert('Note chunks successfully reindexed into vector store!');
      } catch (err) {
        console.error('Reindex error:', err);
        alert('Could not reindex note: ' + err.message);
      } finally {
        reindexNoteBtn.style.opacity = '1';
      }
    });
  }

  // Initial Notes Library Load on Page Visit
  if (ragDocsList) {
    fetchNotes();
  }

  // =========================================================================
  // 6. 3D ACTIVE RECALL FLASHCARDS (student-flashcards.html)
  // =========================================================================
  const cardStage = document.getElementById('flashcard-stage');
  const flashcardFront = document.getElementById('full-card-front-content');
  const flashcardBack = document.getElementById('full-card-back-content');
  const cardIndexLabel = document.getElementById('card-index-label');
  const ratingButtons = document.querySelectorAll('.rating-btn');
  const deckChips = document.querySelectorAll('.deck-chip-card');

  const flashcardsDeck = [
    {
      subject: 'PHYSICS • MECHANICS',
      question: 'What is Newton\'s Second Law of Motion in calculus notation?',
      formula: 'F = dp/dt = m(dv/dt) = ma',
      explanation: 'Net force equals the time derivative of momentum.'
    },
    {
      subject: 'CHEMISTRY • ORGANIC',
      question: 'What stereochemical consequence occurs in an SN2 reaction?',
      formula: '100% Walden Inversion',
      explanation: 'Backside nucleophilic attack flips the chiral configuration.'
    },
    {
      subject: 'MATHEMATICS • ALGEBRA',
      question: 'What is the quadratic formula discriminant and its nature?',
      formula: 'Δ = b² - 4ac',
      explanation: 'Δ > 0: 2 Real Roots | Δ = 0: 1 Repeated Root | Δ < 0: Complex Conjugates'
    },
    {
      subject: 'PHYSICS • ELECTRODYNAMICS',
      question: 'State Gauss\'s Law for electric fields.',
      formula: '∮ E · dA = Q_enclosed / ε₀',
      explanation: 'Total electric flux through a closed surface is proportional to enclosed charge.'
    }
  ];

  let currentCardIdx = 0;

  function loadFlashcard(idx) {
    if (!flashcardFront || !flashcardBack) return;
    const item = flashcardsDeck[idx];
    if (cardStage) cardStage.classList.remove('flipped');

    flashcardFront.innerHTML = `
      <span class="badge badge-indigo" style="margin-bottom: 1rem;">${item.subject}</span>
      <h2 style="font-size: 1.45rem; font-weight: 700; color: var(--text-main); line-height: 1.4;">${item.question}</h2>
      <span style="font-size: 0.8rem; color: var(--text-muted); margin-top: 1.5rem;">(Click card or press <kbd style="background: var(--bg-secondary); padding: 2px 6px; border-radius: 4px; border: 1px solid var(--border-subtle);">Space</kbd> to flip)</span>
    `;

    flashcardBack.innerHTML = `
      <span class="badge badge-emerald" style="margin-bottom: 1rem;">ANSWER FORMULA</span>
      <div style="font-family: var(--font-mono); font-size: 2rem; font-weight: 800; color: #FFFFFF; letter-spacing: 0.04em;">${item.formula}</div>
      <p style="font-size: 0.88rem; color: #A5AAB8; margin-top: 0.85rem; max-width: 480px;">${item.explanation}</p>
    `;

    if (cardIndexLabel) {
      cardIndexLabel.textContent = `Card ${idx + 1} of ${flashcardsDeck.length}`;
    }
  }

  if (cardStage) {
    loadFlashcard(currentCardIdx);

    cardStage.addEventListener('click', () => {
      cardStage.classList.toggle('flipped');
    });

    // Rating buttons
    if (ratingButtons.length > 0) {
      ratingButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          currentCardIdx = (currentCardIdx + 1) % flashcardsDeck.length;
          loadFlashcard(currentCardIdx);
        });
      });
    }

    // Keyboard controls
    document.addEventListener('keydown', (e) => {
      if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA') return;
      if (e.code === 'Space') {
        e.preventDefault();
        cardStage.classList.toggle('flipped');
      } else if (['Digit1', 'Digit2', 'Digit3', 'Digit4'].includes(e.code)) {
        e.preventDefault();
        currentCardIdx = (currentCardIdx + 1) % flashcardsDeck.length;
        loadFlashcard(currentCardIdx);
      }
    });
  }

  if (deckChips.length > 0) {
    deckChips.forEach(chip => {
      chip.addEventListener('click', () => {
        deckChips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        currentCardIdx = 0;
        loadFlashcard(currentCardIdx);
      });
    });
  }

  // =========================================================================
  // 7. PRACTICE ARENA (student-practice.html)
  // =========================================================================
  const optionItems = document.querySelectorAll('.option-item');
  const checkAnswerBtn = document.getElementById('check-answer-btn');
  const practiceFeedback = document.getElementById('practice-feedback-box');
  const practiceHintBtn = document.getElementById('practice-hint-btn');
  const practiceHintBox = document.getElementById('practice-hint-box');

  if (optionItems.length > 0) {
    optionItems.forEach(item => {
      item.addEventListener('click', () => {
        optionItems.forEach(opt => opt.classList.remove('selected'));
        item.classList.add('selected');
      });
    });
  }

  if (checkAnswerBtn && practiceFeedback && !document.getElementById('practice-levels-grid')) {
    checkAnswerBtn.addEventListener('click', () => {
      const selected = document.querySelector('.option-item.selected');
      if (!selected) {
        alert('Please select an option first!');
        return;
      }
      const isCorrect = selected.getAttribute('data-correct') === 'true';
      optionItems.forEach(opt => {
        if (opt.getAttribute('data-correct') === 'true') {
          opt.classList.add('correct');
        } else if (opt.classList.contains('selected')) {
          opt.classList.add('wrong');
        }
      });

      practiceFeedback.classList.add('show');
      if (isCorrect) {
        practiceFeedback.style.background = 'rgba(25, 184, 107, 0.08)';
        practiceFeedback.style.border = '1px solid rgba(25, 184, 107, 0.3)';
        practiceFeedback.style.color = '#0F5132';
        practiceFeedback.innerHTML = `
          <strong>✓ Excellent Work! Correct Answer.</strong><br>
          By substituting $x = 3$ into $2x^2 - 5x - 3 = 0$: $2(9) - 5(3) - 3 = 18 - 15 - 3 = 0$. The roots are indeed $x = 3$ and $x = -1/2$.
        `;
      } else {
        practiceFeedback.style.background = 'rgba(235, 87, 87, 0.08)';
        practiceFeedback.style.border = '1px solid rgba(235, 87, 87, 0.3)';
        practiceFeedback.style.color = '#842029';
        practiceFeedback.innerHTML = `
          <strong>✕ Not quite. Look out for the sign in the middle term.</strong><br>
          Factoring $2x^2 - 5x - 3 = (2x + 1)(x - 3) = 0$. Hence $x = 3$ or $x = -1/2$.
        `;
      }
      triggerMathRender(practiceFeedback);
    });
  }

  if (practiceHintBtn && practiceHintBox) {
    practiceHintBtn.addEventListener('click', () => {
      practiceHintBox.classList.toggle('open');
      practiceHintBtn.textContent = practiceHintBox.classList.contains('open') ? 'Hide Hint ✕' : '💡 Socratic Hint';
    });
  }

  // =========================================================================
  // 8. FLAGSHIP STUDENT PROFILE & SETTINGS (student-profile.html)
  // =========================================================================
  const profileTabs = document.querySelectorAll('.profile-nav-tab');
  const profileTabSections = document.querySelectorAll('.profile-tab-content');
  const editProfileBtn = document.getElementById('edit-profile-btn');
  const editProfileModal = document.getElementById('edit-profile-modal');
  const closeEditModalBtn = document.getElementById('close-edit-modal-btn');
  const editProfileForm = document.getElementById('edit-profile-form');

  const tabLoadStatus = {
    'tab-overview': false,
    'tab-classes': false,
    'tab-roadmap': false,
    'tab-activity': false,
    'tab-subjects': false
  };

  function triggerTabLazyLoad(targetId) {
    if (targetId === 'tab-overview' || targetId === 'tab-genome') {
      if (!tabLoadStatus['tab-overview']) {
        tabLoadStatus['tab-overview'] = true;
        loadStudentProgress();
        loadLearningGenome();
      }
    } else if (targetId === 'tab-classes') {
      if (!tabLoadStatus['tab-classes']) {
        tabLoadStatus['tab-classes'] = true;
        loadStudentClasses();
      }
    } else if (targetId === 'tab-roadmap') {
      if (!tabLoadStatus['tab-roadmap']) {
        tabLoadStatus['tab-roadmap'] = true;
        loadStudentRoadmap();
      }
    } else if (targetId === 'tab-activity') {
      if (!tabLoadStatus['tab-activity']) {
        tabLoadStatus['tab-activity'] = true;
        loadStudentQuizHistory();
      }
    } else if (targetId === 'tab-subjects') {
      if (!tabLoadStatus['tab-subjects']) {
        tabLoadStatus['tab-subjects'] = true;
        loadStudentSubjectsBreakdown();
      }
    }
  }

  if (profileTabs.length > 0) {
    profileTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const targetId = tab.getAttribute('data-tab-target');
        profileTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        profileTabSections.forEach(section => {
          if (section.id === targetId) {
            section.style.display = 'block';
          } else {
            section.style.display = 'none';
          }
        });

        // Trigger on-demand lazy load for tab content
        triggerTabLazyLoad(targetId);

        // Sync hash and left sidebar active state
        if (targetId === 'tab-achievements') {
          if (window.location.hash !== '#tab-achievements') history.replaceState(null, '', '#tab-achievements');
        } else if (targetId === 'tab-overview') {
          if (window.location.hash !== '#tab-genome' && window.location.hash !== '#tab-overview') history.replaceState(null, '', '#tab-genome');
        } else {
          history.replaceState(null, '', `#${targetId}`);
        }
        syncSidebarActiveState();
      });
    });
  }

  // Edit Profile Modal
  if (editProfileBtn && editProfileModal) {
    editProfileBtn.addEventListener('click', () => {
      const user = window.SikshaSession ? window.SikshaSession.getUser() : null;
      const nameInput = document.getElementById('edit-name-input');
      const gradeInput = document.getElementById('edit-grade-input');
      const instInput = document.getElementById('edit-institution-input');
      const bioInput = document.getElementById('edit-bio-input');
      const goalInput = document.getElementById('edit-goal-input');

      if (user) {
        if (nameInput) nameInput.value = user.full_name || '';
        if (gradeInput) gradeInput.value = user.class_grade || 'Class 12 • Science';
        if (instInput) instInput.value = user.institution || 'Delhi Public School, R.K. Puram';
        if (bioInput) bioInput.value = user.bio || '';
        if (goalInput) goalInput.value = user.target_goal || 'JEE Advanced & CBSE Class 12';
      }
      editProfileModal.classList.add('open');
    });
  }

  if (closeEditModalBtn && editProfileModal) {
    closeEditModalBtn.addEventListener('click', () => {
      editProfileModal.classList.remove('open');
    });
  }

  if (editProfileForm) {
    editProfileForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const nameInput = document.getElementById('edit-name-input');
      const gradeInput = document.getElementById('edit-grade-input');
      const instInput = document.getElementById('edit-institution-input');
      const bioInput = document.getElementById('edit-bio-input');
      const goalInput = document.getElementById('edit-goal-input');
      const submitBtn = editProfileForm.querySelector('button[type="submit"]');
      const originalText = submitBtn ? submitBtn.textContent : 'Save';

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Saving to Database...';
      }

      const payload = {
        full_name: nameInput ? nameInput.value.trim() : undefined,
        class_grade: gradeInput ? gradeInput.value.trim() : undefined,
        institution: instInput ? instInput.value.trim() : undefined,
        bio: bioInput ? bioInput.value.trim() : undefined,
        target_goal: goalInput ? goalInput.value.trim() : undefined
      };

      try {
        const headers = window.SikshaSession ? window.SikshaSession.getAuthHeaders() : { 'Content-Type': 'application/json' };
        await fetch(getApiUrl('/api/student/profile'), {
          method: 'PUT',
          headers,
          body: JSON.stringify(payload)
        });

        if (window.SikshaSession) {
          await window.SikshaSession.updateProfile(payload);
        }

        // Synchronize banner DOM immediately
        if (payload.full_name) {
          document.querySelectorAll('.profile-name, .profile-student-name').forEach(el => {
            el.textContent = payload.full_name;
          });
          const avatarEl = document.getElementById('profile-flagship-avatar');
          if (avatarEl && window.SikshaSession) {
            avatarEl.textContent = window.SikshaSession.getInitials(payload.full_name);
          }
        }
        if (payload.class_grade) {
          document.querySelectorAll('.profile-role').forEach(el => {
            el.textContent = payload.class_grade;
          });
          const classBadge = document.getElementById('profile-class-badge');
          if (classBadge) classBadge.textContent = payload.class_grade.toUpperCase();
        }
        if (payload.target_goal) {
          const goalBadge = document.getElementById('profile-goal-badge');
          if (goalBadge) goalBadge.textContent = payload.target_goal.toUpperCase();
        }
        if (payload.institution) {
          const instBadge = document.getElementById('profile-institution-badge');
          if (instBadge) instBadge.textContent = `📍 ${payload.institution}`;
        }
        if (payload.bio) {
          document.querySelectorAll('.profile-bio-text').forEach(el => {
            el.textContent = payload.bio;
          });
        }

        // Live refresh Genome & telemetry
        await loadStudentTelemetry();
        await loadLearningGenome();
      } catch (err) {
        console.warn('[Profile Edit] Sync warning:', err);
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = originalText;
        }
        if (editProfileModal) editProfileModal.classList.remove('open');
      }
    });
  }

  // =========================================================================
  // 8A-1. REAL QUIZ ATTEMPT HISTORY (Single Source of Truth from DB)
  // =========================================================================
  async function loadStudentQuizHistory() {
    const listEl = document.getElementById('profile-quiz-history-list');
    if (!listEl) return;

    listEl.innerHTML = `
      <div style="text-align: center; padding: 2.5rem 1rem; color: var(--text-muted); font-size: 0.88rem;">
        <div style="font-size: 1.5rem; margin-bottom: 0.5rem;">📜</div>
        Loading completed quiz attempts from database...
      </div>
    `;

    try {
      const headers = window.SikshaSession ? window.SikshaSession.getAuthHeaders() : {};
      const res = await fetch(getApiUrl('/api/practice/history?limit=25'), { headers });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      const history = data.history || [];

      if (history.length === 0) {
        listEl.innerHTML = `
          <div style="text-align: center; padding: 3rem 1.5rem; border: 1px dashed var(--border-subtle); border-radius: var(--radius-md); color: var(--text-muted);">
            <div style="font-size: 2.2rem; margin-bottom: 0.5rem;">🎯</div>
            <h4 style="font-size: 1.05rem; font-weight: 700; color: var(--text-main); margin-bottom: 0.35rem;">No Quiz Attempts Recorded Yet</h4>
            <p style="font-size: 0.85rem; max-width: 440px; margin: 0 auto 1.25rem auto;">
              Take your first 10-question diagnostic practice quiz to start calibrating your Learning Genome.
            </p>
            <a href="student-practice.html" class="btn btn-primary" style="display: inline-flex; align-items: center; gap: 0.4rem;">
              <span>🚀 Start Practice Quiz</span>
            </a>
          </div>
        `;
        return;
      }

      listEl.innerHTML = history.map(att => {
        const isPass = att.accuracy_percent >= 60;
        const badgeClass = isPass ? 'badge-emerald' : 'badge-rose';
        const dateStr = att.completed_at ? new Date(att.completed_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : 'Recently';
        const subjName = att.subject_title || (att.subject_id ? att.subject_id.toUpperCase() : 'Practice Quiz');

        return `
          <div class="card" style="padding: 1.15rem 1.35rem; display: flex; align-items: center; justify-content: space-between; gap: 1rem; border: 1px solid var(--border-subtle); border-radius: 12px; background: var(--bg-card); transition: all 0.2s ease;">
            <div style="display: flex; align-items: center; gap: 1rem;">
              <div style="width: 42px; height: 42px; border-radius: 10px; background: var(--bg-secondary); display: flex; align-items: center; justify-content: center; font-size: 1.3rem;">
                ${isPass ? '🏆' : '📖'}
              </div>
              <div>
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                  <strong style="color: var(--text-main); font-size: 0.95rem;">${subjName} • Level ${att.level_number || 1}</strong>
                  <span class="badge ${badgeClass}">${isPass ? 'Passed' : 'Needs Review'}</span>
                </div>
                <div style="font-size: 0.78rem; color: var(--text-muted); margin-top: 0.2rem;">
                  Completed: ${dateStr} • Duration: ${att.time_spent_seconds ? `${att.time_spent_seconds}s` : 'Quick session'}
                </div>
              </div>
            </div>

            <div style="display: flex; align-items: center; gap: 1.5rem;">
              <div style="text-align: right;">
                <div style="font-size: 1.1rem; font-weight: 800; font-family: var(--font-mono); color: ${isPass ? 'var(--emerald-primary)' : 'var(--rose-accent)'};">
                  ${att.score} / ${att.total_questions}
                </div>
                <div style="font-size: 0.74rem; color: var(--text-muted); font-family: var(--font-mono);">
                  ${att.accuracy_percent}% Accuracy
                </div>
              </div>
              <a href="student-practice.html?subject=${encodeURIComponent(att.subject_id)}&level=${att.level_number}" class="btn btn-secondary btn-sm" style="font-size: 0.78rem;">
                Practice Again →
              </a>
            </div>
          </div>
        `;
      }).join('');

    } catch (err) {
      console.warn('Error loading quiz history:', err);
      listEl.innerHTML = `
        <div style="text-align: center; padding: 2rem; color: var(--rose-accent); font-size: 0.85rem;">
          Failed to load completed quiz attempts: ${err.message || 'Network error'}
        </div>
      `;
    }
  }

  // =========================================================================
  // 8A-2. REAL ACADEMIC SUBJECTS BREAKDOWN (Live Telemetry from DB)
  // =========================================================================
  async function loadStudentSubjectsBreakdown() {
    const subjectsContainer = document.querySelector('#tab-subjects .tracks-grid') || document.querySelector('#tab-subjects');
    if (!subjectsContainer) return;

    try {
      const headers = window.SikshaSession ? window.SikshaSession.getAuthHeaders() : {};
      const res = await fetch(getApiUrl('/api/student/progress-summary'), { headers });
      if (!res.ok) return;

      const data = await res.json();
      const subjects = data.subjects_progress || [];
      if (subjects.length === 0) return;

      subjectsContainer.innerHTML = subjects.map(s => {
        const mastery = s.mastery_percent || 0;
        const barColor = mastery >= 75 ? 'var(--emerald-primary)' : mastery >= 50 ? 'var(--indigo-primary)' : 'var(--amber-accent)';
        const statusBadge = s.status === 'Mastered' ? 'badge-emerald' : s.status === 'In Progress' ? 'badge-indigo' : 'badge-amber';

        return `
          <div class="card" style="padding: 1.5rem; border: 1px solid var(--border-subtle); border-radius: 14px; background: var(--bg-card); display: flex; flex-direction: column; justify-content: space-between;">
            <div>
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
                <span class="badge ${statusBadge}">${(s.title || 'SUBJECT').toUpperCase()}</span>
                <span style="font-size: 1.3rem;">${s.icon || '📚'}</span>
              </div>
              <h3 style="font-size: 1.15rem; font-weight: 700; color: var(--text-main); margin-bottom: 0.35rem;">${s.title}</h3>
              <p style="font-size: 0.8rem; color: var(--text-muted); line-height: 1.4; min-height: 2.2rem;">
                ${s.completed_levels || 0} of ${s.total_levels || 5} Progressive Diagnostic Levels Mastered
              </p>

              <div style="margin: 1.25rem 0 1rem 0;">
                <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.82rem; margin-bottom: 0.4rem;">
                  <span style="color: var(--text-secondary); font-weight: 500;">Mastery Progress</span>
                  <strong style="font-family: var(--font-mono); color: var(--text-main); font-weight: 700;">${mastery}%</strong>
                </div>
                <div style="width: 100%; height: 8px; background: var(--bg-tertiary); border-radius: 99px; overflow: hidden;">
                  <div style="width: ${Math.max(mastery, 4)}%; height: 100%; background: ${barColor}; border-radius: 99px; transition: width 0.5s ease;"></div>
                </div>
              </div>
            </div>

            <div style="display: flex; gap: 0.5rem; margin-top: 0.75rem; padding-top: 0.75rem; border-top: 1px solid var(--border-subtle);">
              <a href="student-practice.html?subject=${encodeURIComponent(s.id)}" class="btn btn-primary btn-sm" style="flex: 1; text-align: center; justify-content: center; font-size: 0.8rem;">
                Practice ${s.title} →
              </a>
              <a href="student-notes.html?subject=${encodeURIComponent(s.id)}" class="btn btn-secondary btn-sm" style="font-size: 0.8rem;" title="Study Notes">
                Notes
              </a>
            </div>
          </div>
        `;
      }).join('');

    } catch (err) {
      console.warn('Error loading subjects breakdown:', err);
    }
  }

  // =========================================================================
  // 8B. STUDENT CLASSROOM ECOSYSTEM (MY CLASSES & JOIN FLOW)
  // =========================================================================
  const openJoinClassModalBtn = document.getElementById('open-join-class-modal-btn');
  const closeJoinModalBtn = document.getElementById('close-join-modal-btn');
  const joinClassModal = document.getElementById('join-class-modal');
  const inputClassCode = document.getElementById('input-class-code');
  const btnValidateCode = document.getElementById('btn-validate-code');
  const btnConfirmJoin = document.getElementById('btn-confirm-join');
  const btnCancelPreview = document.getElementById('btn-cancel-preview');
  const joinCodeError = document.getElementById('join-code-error');
  const joinStepInput = document.getElementById('join-step-input');
  const joinStepPreview = document.getElementById('join-step-preview');
  const studentClassesGrid = document.getElementById('student-classes-grid');

  // Leave Class Modal Elements
  const leaveClassModal = document.getElementById('leave-class-modal');
  const closeLeaveModalBtn = document.getElementById('close-leave-modal-btn');
  const cancelLeaveModalBtn = document.getElementById('cancel-leave-modal-btn');
  const confirmLeaveClassBtn = document.getElementById('confirm-leave-class-btn');
  const leaveModalClassName = document.getElementById('leave-modal-class-name');
  const leaveModalTeacherName = document.getElementById('leave-modal-teacher-name');

  let currentPreviewClass = null;
  let currentLeavingClass = null;

  // HTML Escaping Helper for XSS Safety
  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Subject Badge Color Mapping
  function getSubjectBadgeClass(subject) {
    const s = (subject || '').toLowerCase();
    if (s.includes('phys')) return 'physics';
    if (s.includes('chem')) return 'chemistry';
    if (s.includes('bio')) return 'biology';
    if (s.includes('math')) return 'mathematics';
    return 'default';
  }

  // Unified Toast Notification System
  window.showStudentToast = function(message, type = 'success', duration = 3500) {
    let container = document.getElementById('student-toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'student-toast-container';
      container.className = 'student-toast-container';
      document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className = `student-toast student-toast-${type}`;

    let iconSvg = '';
    if (type === 'success') {
      iconSvg = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
    } else if (type === 'error') {
      iconSvg = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`;
    } else {
      iconSvg = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`;
    }

    toast.innerHTML = `
      <div class="student-toast-icon">${iconSvg}</div>
      <div style="flex: 1; line-height: 1.4;">${message}</div>
    `;
    container.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('toast-hiding');
      setTimeout(() => {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 250);
    }, duration);
  };

  // Copy Class Code to Clipboard
  window.copyStudentClassCode = function(code, btnEl) {
    if (!code) return;
    navigator.clipboard.writeText(code).then(() => {
      if (btnEl) {
        btnEl.classList.add('copied');
        const orig = btnEl.innerHTML;
        btnEl.innerHTML = `<span>COPIED</span> <span>✓</span>`;
        setTimeout(() => {
          btnEl.classList.remove('copied');
          btnEl.innerHTML = orig;
        }, 1800);
      }
      window.showStudentToast(`Class code <strong>${escapeHtml(code)}</strong> copied to clipboard!`, 'info');
    }).catch(() => {
      window.showStudentToast(`Class code: ${escapeHtml(code)}`, 'info');
    });
  };

  let activeClassId = null;
  let cachedHubData = null;

  async function loadStudentClasses(force = false) {
    const hubContainer = document.getElementById('student-classroom-hub-container') || document.getElementById('student-classes-grid');
    if (!hubContainer) return;

    // Show skeleton loading placeholders
    hubContainer.innerHTML = `
      <div class="card" style="margin-bottom: 1.5rem; padding: 1.5rem;">
        <div class="class-skeleton-box" style="height: 120px; width: 100%; border-radius: 16px; margin-bottom: 1.5rem;"></div>
        <div style="display: flex; gap: 1rem; margin-bottom: 1.5rem;">
          <div class="class-skeleton-box" style="height: 38px; width: 140px; border-radius: 8px;"></div>
          <div class="class-skeleton-box" style="height: 38px; width: 160px; border-radius: 8px;"></div>
          <div class="class-skeleton-box" style="height: 38px; width: 140px; border-radius: 8px;"></div>
        </div>
        <div class="class-skeleton-box" style="height: 220px; width: 100%; border-radius: 16px;"></div>
      </div>
    `;

    try {
      const headers = window.SikshaSession ? window.SikshaSession.getAuthHeaders() : {};
      const res = await fetch(getApiUrl('/api/student/classes'), { headers });
      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }

      const data = await res.json();
      if (data.is_demo) {
        hubContainer.innerHTML = `
          <div class="classes-empty-state">
            <div class="classes-empty-icon">💡</div>
            <h3 class="classes-empty-title">Demo Exploration Mode</h3>
            <p class="classes-empty-desc">
              You are currently viewing SikshaSaathi in sandbox mode. Create an account to join official classrooms, access educator notes, and sync diagnostic results.
            </p>
            <a href="index.html" class="btn btn-primary"><span>Sign Up for Official Access →</span></a>
          </div>
        `;
        return;
      }

      const classes = data.classes || [];
      if (classes.length === 0) {
        hubContainer.innerHTML = `
          <div class="card" style="margin-bottom: 1.5rem;">
            <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 1rem; margin-bottom: 1.25rem;">
              <div>
                <div class="eyebrow"><span class="eyebrow-dot" style="background: var(--brand-indigo, #5B5CE2);"></span><span>ENROLLED CLASSROOM</span></div>
                <h2 class="section-heading">My Classroom & Study Cohorts</h2>
                <p class="section-subtitle">Connect with your teachers, review shared lecture notes, complete assignments, and clear doubts.</p>
              </div>
              <button type="button" class="btn btn-primary btn-sm open-join-modal-trigger">
                <span>+ Join a Class</span>
              </button>
            </div>
            <div class="classes-empty-state">
              <div class="classes-empty-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"></path>
                  <path d="M6 6h10"></path>
                  <path d="M6 10h10"></path>
                </svg>
              </div>
              <h3 class="classes-empty-title">No Classrooms Joined Yet</h3>
              <p class="classes-empty-desc">
                Connect directly with your educator! Enter the 6-character class code shared by your teacher (e.g. <strong>PHYDYA</strong>, <strong>CHMZ85</strong>) to access lecture notes, study materials, and direct teacher guidance.
              </p>
              <button type="button" class="btn btn-primary open-join-modal-trigger" style="display: inline-flex; align-items: center; gap: 0.4rem;">
                <span>+ Join Your First Class</span>
              </button>
            </div>
          </div>
        `;
        hubContainer.querySelectorAll('.open-join-modal-trigger').forEach(b => b.addEventListener('click', openJoinModal));
        return;
      }

      // Default active class
      if (!activeClassId || !classes.some(c => c.id === activeClassId)) {
        activeClassId = classes[0].id;
      }

      // Fetch Full Classroom Hub Data from backend
      const hubRes = await fetch(getApiUrl(`/api/student/classes/${activeClassId}/hub`), { headers });
      let hubData = null;
      if (hubRes.ok) {
        hubData = await hubRes.json();
      }
      cachedHubData = hubData;

      const currentClass = classes.find(c => c.id === activeClassId) || classes[0];
      const clsInfo = (hubData && hubData.classroom) ? hubData.classroom : currentClass;
      const announcements = (hubData && hubData.announcements) ? hubData.announcements : [];
      const materials = (hubData && hubData.materials) ? hubData.materials : [];
      const assignments = (hubData && hubData.assignments) ? hubData.assignments : [];
      const doubts = (hubData && hubData.doubts) ? hubData.doubts : [];
      const pulse = (hubData && hubData.cohort_pulse) ? hubData.cohort_pulse : {
        syllabus_pace: "On Track • Chapter 4 Active",
        cohort_mastery: 78.5,
        completion_rate: 84,
        next_class_date: "Thursday, 4:30 PM"
      };

      const teacherInitials = (clsInfo.teacher_name || 'E').split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
      const badgeClass = getSubjectBadgeClass(clsInfo.subject);

      // Class switcher options if student has multiple classes
      let classSwitcherHtml = '';
      if (classes.length > 1) {
        classSwitcherHtml = `
          <select id="classroom-switcher-select" class="form-input" style="padding: 0.45rem 0.85rem; font-size: 0.85rem; font-weight: 700; width: auto; max-width: 220px; border-radius: 10px;">
            ${classes.map(c => `
              <option value="${escapeHtml(c.id)}" ${c.id === activeClassId ? 'selected' : ''}>
                ${escapeHtml(c.name)} (${escapeHtml(c.subject || 'Cohort')})
              </option>
            `).join('')}
          </select>
        `;
      }

      // Render the Flagship Classroom Hub UI
      hubContainer.innerHTML = `
        <!-- TOP COHORT HERO BANNER -->
        <div class="classroom-hero-card">
          <div class="classroom-hero-header">
            <div class="classroom-hero-title-area">
              <div style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 0.25rem;">
                <span class="class-subject-badge ${badgeClass}" style="font-size: 0.75rem; font-weight: 800; padding: 0.2rem 0.6rem; border-radius: 6px;">
                  ${escapeHtml(clsInfo.subject || 'Academics')} • ${escapeHtml(clsInfo.grade_level || 'Class 12')}
                </span>
                <span style="font-size: 0.75rem; color: var(--text-muted); font-family: var(--font-mono);">
                  ${clsInfo.student_count || 1} Enrolled Learners
                </span>
              </div>
              <h1 class="classroom-hero-title">
                <span>${escapeHtml(clsInfo.name)}</span>
                <button type="button" class="class-code-copy-chip" onclick="copyStudentClassCode('${escapeHtml(clsInfo.join_code)}', this)" title="Click to copy unique code">
                  <span>${escapeHtml(clsInfo.join_code)}</span>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                </button>
              </h1>
              ${clsInfo.description ? `<p class="classroom-hero-desc">${escapeHtml(clsInfo.description)}</p>` : ''}
              
              <div class="classroom-educator-card">
                <div class="classroom-educator-avatar">${escapeHtml(teacherInitials)}</div>
                <div>
                  <div class="classroom-educator-name">
                    <span>${escapeHtml(clsInfo.teacher_name || 'Educator')}</span>
                    <span title="Verified Educator" style="color: var(--brand-indigo, #5B5CE2); font-size: 0.88rem;">🛡️</span>
                  </div>
                  <div class="classroom-educator-inst">${escapeHtml(clsInfo.teacher_institution || 'SikshaSaathi Elite Faculty')}</div>
                </div>
              </div>
            </div>

            <!-- Header Action Controls -->
            <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 0.65rem;">
              ${classSwitcherHtml}
              <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                <button type="button" id="btn-join-another-class" class="btn btn-secondary btn-sm" style="display: inline-flex; align-items: center; gap: 0.35rem;">
                  <span>+ Join Another</span>
                </button>
                <button type="button" class="btn-leave-class leave-current-class-btn" data-class-id="${escapeHtml(clsInfo.id)}" data-class-name="${escapeHtml(clsInfo.name)}" data-teacher-name="${escapeHtml(clsInfo.teacher_name || 'Educator')}">
                  Leave Cohort
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- CLASSROOM SUB-TABS NAVIGATION -->
        <div class="classroom-subtabs-nav" role="tablist">
          <button class="classroom-subtab-btn active" data-subtab="announcements">
            <span>📢 Teacher Announcements</span>
            <span class="classroom-subtab-counter">${announcements.length}</span>
          </button>
          <button class="classroom-subtab-btn" data-subtab="materials">
            <span>📚 Lecture Notes & Uploads</span>
            <span class="classroom-subtab-counter">${materials.length}</span>
          </button>
          <button class="classroom-subtab-btn" data-subtab="assignments">
            <span>📝 Assignments & Drills</span>
            <span class="classroom-subtab-counter">${assignments.length}</span>
          </button>
          <button class="classroom-subtab-btn" data-subtab="doubts">
            <span>💬 Doubt Desk (Ask Teacher)</span>
            <span class="classroom-subtab-counter">${doubts.length}</span>
          </button>
          <button class="classroom-subtab-btn" data-subtab="pulse">
            <span>📊 Cohort Pulse & Mastery</span>
          </button>
        </div>

        <!-- SUBTAB 1: ANNOUNCEMENTS -->
        <div id="subtab-panel-announcements" class="classroom-subtab-panel" style="display: block;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem;">
            <div style="font-size: 0.82rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em;">
              WHAT TEACHER IS SAYING • DIRECT UPDATES
            </div>
            <span style="font-size: 0.78rem; color: var(--emerald-primary, #059669); font-weight: 600;">● Live Cohort Sync</span>
          </div>

          ${announcements.map(a => {
            const isPinned = a.is_pinned;
            const tag = a.priority || 'General';
            let tagClass = 'announcement-tag-general';
            if (tag.toLowerCase().includes('important')) tagClass = 'announcement-tag-important';
            else if (tag.toLowerCase().includes('note')) tagClass = 'announcement-tag-notes';

            return `
              <div class="announcement-card ${isPinned ? 'pinned' : ''}">
                <div class="announcement-card-header">
                  <div class="announcement-meta-left">
                    <span class="announcement-tag ${tagClass}">
                      ${isPinned ? '📌 ' : ''}${escapeHtml(tag)}
                    </span>
                    <span style="font-size: 0.78rem; color: var(--text-muted); font-family: var(--font-mono);">
                      ${escapeHtml(a.created_at || 'Recently')}
                    </span>
                  </div>
                  <div style="font-size: 0.78rem; font-weight: 600; color: var(--text-secondary);">
                    👨‍🏫 ${escapeHtml(clsInfo.teacher_name || 'Teacher')}
                  </div>
                </div>
                <h3 class="announcement-title">${escapeHtml(a.title)}</h3>
                <div class="announcement-body">${escapeHtml(a.content).replace(/\n/g, '<br>')}</div>
              </div>
            `;
          }).join('')}
        </div>

        <!-- SUBTAB 2: LECTURE NOTES & MATERIALS -->
        <div id="subtab-panel-materials" class="classroom-subtab-panel" style="display: none;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem;">
            <div style="font-size: 0.82rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em;">
              WHAT NOTES HE UPLOADED • FORMULAS & STUDY SHEETS
            </div>
            <span style="font-size: 0.78rem; color: var(--brand-indigo, #5B5CE2); font-weight: 600;">✦ KaTeX LaTeX Ready</span>
          </div>

          <div class="materials-grid">
            ${materials.map((m, idx) => `
              <div class="material-card">
                <div>
                  <div class="material-card-top">
                    <span class="class-subject-badge ${badgeClass}" style="font-size: 0.7rem; font-weight: 800; padding: 0.15rem 0.45rem; border-radius: 4px;">
                      ${escapeHtml(m.topic || m.subject || 'Notes')}
                    </span>
                    <span style="font-size: 0.75rem; color: var(--text-muted); font-family: var(--font-mono);">
                      ⏱️ ${escapeHtml(m.read_time || '10 mins')}
                    </span>
                  </div>
                  <h3 class="material-title">${escapeHtml(m.title)}</h3>
                  <p class="material-summary">${escapeHtml(m.summary || '')}</p>
                </div>
                <div class="material-footer">
                  <span style="font-size: 0.75rem; color: var(--text-muted); font-family: var(--font-mono);">
                    📄 ${escapeHtml(m.file_type || 'Formula Note')}
                  </span>
                  <div style="display: flex; gap: 0.45rem;">
                    <button type="button" class="btn-read-material read-note-btn" data-note-index="${idx}">
                      <span>Read Online</span> <span>📖</span>
                    </button>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- SUBTAB 3: ASSIGNMENTS & DRILLS -->
        <div id="subtab-panel-assignments" class="classroom-subtab-panel" style="display: none;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem;">
            <div style="font-size: 0.82rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em;">
              ACTIVE CLASS DIAGNOSTICS & RETRIEVAL DRILLS
            </div>
            <span style="font-size: 0.78rem; color: var(--amber-accent, #D97706); font-weight: 700;">● Mandatory Tasks</span>
          </div>

          <div class="assignments-list">
            ${assignments.map(asg => `
              <div class="assignment-card">
                <div class="assignment-info">
                  <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.25rem;">
                    <span class="assignment-due-tag">⏳ ${escapeHtml(asg.due_date || 'This Week')}</span>
                    <span style="font-size: 0.75rem; color: var(--text-muted);">• ${escapeHtml(asg.status || 'Active')}</span>
                  </div>
                  <h3 class="assignment-title">${escapeHtml(asg.title)}</h3>
                  <div class="assignment-meta-row">
                    <span>${asg.questions_count || 10} Questions</span>
                    <span>⏱️ Est. ${escapeHtml(asg.duration || '15 mins')}</span>
                    <span>Subject: ${escapeHtml(asg.subject || 'Science')}</span>
                  </div>
                </div>
                <a href="${escapeHtml(asg.practice_url || 'student-practice.html')}" class="btn btn-primary btn-sm" style="padding: 0.55rem 1.15rem; font-weight: 750;">
                  <span>Launch Assessment →</span>
                </a>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- SUBTAB 4: DOUBT DESK -->
        <div id="subtab-panel-doubts" class="classroom-subtab-panel" style="display: none;">
          <div class="doubt-composer-card">
            <div class="doubt-composer-header">
              <div>
                <h3 style="font-size: 1.1rem; font-weight: 800; color: var(--text-main); margin: 0 0 0.25rem 0;">
                  Ask Your Teacher a Question ✦
                </h3>
                <p style="font-size: 0.82rem; color: var(--text-secondary); margin: 0;">
                  Questions are delivered straight to your educator's desk. You also receive an instant AI Socratic Scaffold while waiting!
                </p>
              </div>
              <span style="font-size: 0.75rem; font-weight: 700; color: var(--brand-indigo, #5B5CE2); background: rgba(91,92,226,0.1); padding: 0.2rem 0.6rem; border-radius: 6px;">
                Doubt Desk 24/7
              </span>
            </div>

            <form id="post-doubt-form">
              <div style="margin-bottom: 0.75rem;">
                <input type="text" id="doubt-topic-input" class="form-input" placeholder="Topic name (e.g. Friction on Inclines, Integration by Parts)" maxlength="80" style="padding: 0.6rem 0.85rem; font-size: 0.85rem;">
              </div>
              <textarea id="doubt-question-input" class="doubt-input-textarea" placeholder="Describe the problem, equation, or specific point where you need clarification..." required></textarea>
              <div style="display: flex; justify-content: flex-end;">
                <button type="submit" id="btn-submit-doubt" class="btn btn-primary" style="padding: 0.65rem 1.35rem;">
                  <span>Post to Teacher Desk + Instant AI Hint ✦</span>
                </button>
              </div>
            </form>
          </div>

          <div style="font-size: 0.82rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.85rem;">
            CLASSROOM Q&A FEED (${doubts.length})
          </div>

          <div id="classroom-doubts-feed">
            ${doubts.map(d => `
              <div class="doubt-item-card">
                <div class="doubt-header-row">
                  <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <span style="font-weight: 750; font-size: 0.88rem; color: var(--text-main);">
                      ${escapeHtml(d.student_name || 'Student')}
                    </span>
                    <span style="font-size: 0.72rem; color: var(--text-muted); font-family: var(--font-mono);">
                      • ${escapeHtml(d.created_at || 'Recently')}
                    </span>
                  </div>
                  <span class="badge ${d.teacher_reply ? 'badge-emerald' : 'badge-indigo'}" style="font-size: 0.72rem;">
                    ${d.teacher_reply ? '✓ Teacher Answered' : '⏳ Teacher Review'}
                  </span>
                </div>
                ${d.topic ? `<div style="font-size: 0.75rem; font-weight: 700; color: var(--brand-indigo, #5B5CE2); margin-bottom: 0.35rem;">Topic: ${escapeHtml(d.topic)}</div>` : ''}
                <div class="doubt-question-text">${escapeHtml(d.question)}</div>

                ${d.ai_hint ? `
                  <div class="doubt-ai-hint-box">
                    <div style="font-weight: 750; font-size: 0.76rem; color: var(--brand-indigo, #5B5CE2); text-transform: uppercase; margin-bottom: 0.25rem;">
                      ✦ Instant Socratic Scaffold
                    </div>
                    <div>${escapeHtml(d.ai_hint)}</div>
                  </div>
                ` : ''}

                ${d.teacher_reply ? `
                  <div class="doubt-teacher-reply-box">
                    <div style="font-weight: 750; font-size: 0.76rem; color: var(--emerald-primary, #059669); text-transform: uppercase; margin-bottom: 0.25rem; display: flex; align-items: center; gap: 0.35rem;">
                      <span>👨‍🏫 ${escapeHtml(clsInfo.teacher_name || 'Teacher')} Guidance</span>
                      <span title="Verified">✓</span>
                    </div>
                    <div>${escapeHtml(d.teacher_reply)}</div>
                  </div>
                ` : ''}
              </div>
            `).join('')}
          </div>
        </div>

        <!-- SUBTAB 5: COHORT PULSE -->
        <div id="subtab-panel-pulse" class="classroom-subtab-panel" style="display: none;">
          <div style="font-size: 0.82rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 1rem;">
            COHORT HEALTH & SYLLABUS SYNC
          </div>

          <div class="cohort-pulse-grid">
            <div class="pulse-stat-card">
              <div class="pulse-stat-label">Syllabus Pace</div>
              <div class="pulse-stat-val" style="font-size: 1.15rem; color: var(--emerald-primary, #059669);">
                ${escapeHtml(pulse.syllabus_pace || 'On Track • Chapter 4')}
              </div>
              <div style="font-size: 0.78rem; color: var(--text-muted); margin-top: 0.35rem;">
                Based on educator roadmap schedule
              </div>
            </div>

            <div class="pulse-stat-card">
              <div class="pulse-stat-label">Cohort Average Mastery</div>
              <div class="pulse-stat-val" style="color: var(--brand-indigo, #5B5CE2);">
                ${pulse.cohort_mastery || 78.5}%
              </div>
              <div style="font-size: 0.78rem; color: var(--text-muted); margin-top: 0.35rem;">
                Class average across diagnostic drills
              </div>
            </div>

            <div class="pulse-stat-card">
              <div class="pulse-stat-label">Next Live Class / Q&A</div>
              <div class="pulse-stat-val" style="font-size: 1.15rem; color: var(--text-main);">
                ${escapeHtml(pulse.next_class_date || 'Thursday, 4:30 PM')}
              </div>
              <div style="font-size: 0.78rem; color: var(--text-muted); margin-top: 0.35rem;">
                Keep doubts and questions ready!
              </div>
            </div>
          </div>
        </div>
      `;

      // Trigger KaTeX render across the new content
      triggerMathRender(hubContainer);

      // Wire Sub-Tab Navigation
      const subtabBtns = hubContainer.querySelectorAll('.classroom-subtab-btn');
      const subtabPanels = hubContainer.querySelectorAll('.classroom-subtab-panel');
      subtabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          const target = btn.getAttribute('data-subtab');
          subtabBtns.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          subtabPanels.forEach(panel => {
            if (panel.id === `subtab-panel-${target}`) {
              panel.style.display = 'block';
              triggerMathRender(panel);
            } else {
              panel.style.display = 'none';
            }
          });
        });
      });

      // Wire Class Switcher Dropdown
      const switcherSelect = document.getElementById('classroom-switcher-select');
      if (switcherSelect) {
        switcherSelect.addEventListener('change', (e) => {
          activeClassId = e.target.value;
          loadStudentClasses(true);
        });
      }

      // Wire Join Another Button
      const joinAnotherBtn = document.getElementById('btn-join-another-class');
      if (joinAnotherBtn) {
        joinAnotherBtn.addEventListener('click', openJoinModal);
      }

      // Wire Leave Button
      const leaveBtn = hubContainer.querySelector('.leave-current-class-btn');
      if (leaveBtn) {
        leaveBtn.addEventListener('click', () => {
          const cId = leaveBtn.getAttribute('data-class-id');
          const cName = leaveBtn.getAttribute('data-class-name');
          const tName = leaveBtn.getAttribute('data-teacher-name');
          openLeaveModal(cId, cName, tName);
        });
      }

      // Wire Read Online Buttons (Note Reader Modal)
      hubContainer.querySelectorAll('.read-note-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const idx = parseInt(btn.getAttribute('data-note-index'), 10);
          const note = materials[idx];
          if (note) {
            openClassroomNoteModal(note, clsInfo);
          }
        });
      });

      // Wire Doubt Desk Submission Form
      const doubtForm = document.getElementById('post-doubt-form');
      if (doubtForm) {
        doubtForm.addEventListener('submit', async (e) => {
          e.preventDefault();
          const qInput = document.getElementById('doubt-question-input');
          const tInput = document.getElementById('doubt-topic-input');
          const submitBtn = document.getElementById('btn-submit-doubt');
          const questionText = qInput ? qInput.value.trim() : '';
          const topicText = tInput ? tInput.value.trim() : '';

          if (!questionText) return;
          if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span>Delivering to Teacher...</span>';
          }

          try {
            const res = await fetch(getApiUrl(`/api/student/classes/${activeClassId}/doubts`), {
              method: 'POST',
              headers: window.SikshaSession ? window.SikshaSession.getAuthHeaders() : { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                question: questionText,
                topic: topicText || undefined
              })
            });
            const dData = await res.json();
            if (!res.ok) throw new Error(dData.detail || 'Could not post doubt');

            // Clear inputs
            if (qInput) qInput.value = '';
            if (tInput) tInput.value = '';

            window.showStudentToast('✓ Your question was delivered to your teacher\'s desk!', 'success');

            // Prepend new doubt to feed
            const doubtsFeed = document.getElementById('classroom-doubts-feed');
            if (doubtsFeed && dData.doubt) {
              const d = dData.doubt;
              const newCard = document.createElement('div');
              newCard.className = 'doubt-item-card';
              newCard.style.animation = 'toastSlideIn 0.3s ease';
              newCard.innerHTML = `
                <div class="doubt-header-row">
                  <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <span style="font-weight: 750; font-size: 0.88rem; color: var(--text-main);">
                      ${escapeHtml(d.student_name || 'You')}
                    </span>
                    <span style="font-size: 0.72rem; color: var(--text-muted); font-family: var(--font-mono);">
                      • Just now
                    </span>
                  </div>
                  <span class="badge badge-indigo" style="font-size: 0.72rem;">
                    ⏳ Teacher Review
                  </span>
                </div>
                ${d.topic ? `<div style="font-size: 0.75rem; font-weight: 700; color: var(--brand-indigo, #5B5CE2); margin-bottom: 0.35rem;">Topic: ${escapeHtml(d.topic)}</div>` : ''}
                <div class="doubt-question-text">${escapeHtml(d.question)}</div>

                ${d.ai_hint ? `
                  <div class="doubt-ai-hint-box">
                    <div style="font-weight: 750; font-size: 0.76rem; color: var(--brand-indigo, #5B5CE2); text-transform: uppercase; margin-bottom: 0.25rem;">
                      ✦ Instant Socratic Scaffold
                    </div>
                    <div>${escapeHtml(d.ai_hint)}</div>
                  </div>
                ` : ''}
              `;
              doubtsFeed.insertBefore(newCard, doubtsFeed.firstChild);
              triggerMathRender(newCard);
            }
          } catch (dErr) {
            window.showStudentToast(dErr.message || 'Failed to submit question.', 'error');
          } finally {
            if (submitBtn) {
              submitBtn.disabled = false;
              submitBtn.innerHTML = '<span>Post to Teacher Desk + Instant AI Hint ✦</span>';
            }
          }
        });
      }

    } catch (err) {
      console.error('[Student Classes] Failed to load hub:', err);
      hubContainer.innerHTML = `
        <div class="classes-empty-state" style="border-color: rgba(225, 29, 72, 0.3);">
          <div class="classes-empty-icon" style="background: rgba(225, 29, 72, 0.08); color: var(--rose-accent);">⚠️</div>
          <h3 class="classes-empty-title">Unable to load classroom hub</h3>
          <p class="classes-empty-desc">There was a problem connecting to the server. Please verify your connection.</p>
          <button type="button" class="btn btn-secondary btn-sm" id="retry-classes-btn">
            <span>Try Again</span>
          </button>
        </div>
      `;
      const retryBtn = document.getElementById('retry-classes-btn');
      if (retryBtn) retryBtn.addEventListener('click', () => loadStudentClasses(true));
    }
  }

  function openJoinModal() {
    if (!joinClassModal) return;
    if (joinCodeError) joinCodeError.style.display = 'none';
    if (inputClassCode) inputClassCode.value = '';
    if (joinStepInput) joinStepInput.style.display = 'block';
    if (joinStepPreview) joinStepPreview.style.display = 'none';
    currentPreviewClass = null;
    joinClassModal.classList.add('open');
    if (inputClassCode) {
      setTimeout(() => inputClassCode.focus(), 60);
    }
  }

  function closeJoinModal() {
    if (joinClassModal) joinClassModal.classList.remove('open');
  }

  function openLeaveModal(classId, className, teacherName) {
    currentLeavingClass = { id: classId, name: className };
    if (leaveModalClassName) leaveModalClassName.textContent = className || 'Classroom';
    if (leaveModalTeacherName) leaveModalTeacherName.textContent = teacherName || 'Educator';
    if (leaveClassModal) leaveClassModal.classList.add('open');
  }

  function closeLeaveModal() {
    currentLeavingClass = null;
    if (leaveClassModal) leaveClassModal.classList.remove('open');
  }

  async function handleValidateCode() {
    const code = (inputClassCode ? inputClassCode.value : '').trim().toUpperCase();
    if (!code) {
      if (joinCodeError) {
        joinCodeError.textContent = 'Please enter a 6-character class code.';
        joinCodeError.style.display = 'block';
      }
      return;
    }

    if (btnValidateCode) {
      btnValidateCode.disabled = true;
      btnValidateCode.innerHTML = '<span>Verifying code...</span>';
    }
    if (joinCodeError) joinCodeError.style.display = 'none';

    try {
      const headers = window.SikshaSession ? window.SikshaSession.getAuthHeaders() : { 'Content-Type': 'application/json' };
      const res = await fetch(getApiUrl('/api/student/classes/preview'), {
        method: 'POST',
        headers,
        body: JSON.stringify({ join_code: code })
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || 'Invalid class code. Please check with your teacher.');
      }

      if (data.already_member) {
        if (joinCodeError) {
          joinCodeError.innerHTML = `⚠️ You are already an active member of <strong>${escapeHtml(data.classroom.name)}</strong>.`;
          joinCodeError.style.display = 'block';
        }
        return;
      }

      currentPreviewClass = data.classroom;
      const previewName = document.getElementById('preview-class-name');
      const previewSubj = document.getElementById('preview-class-subject');
      const previewGrade = document.getElementById('preview-class-grade');
      const previewTeacher = document.getElementById('preview-class-teacher');
      const previewInst = document.getElementById('preview-class-inst');

      if (previewName) previewName.textContent = currentPreviewClass.name;
      if (previewSubj) {
        previewSubj.textContent = currentPreviewClass.subject;
        previewSubj.className = `class-subject-badge ${getSubjectBadgeClass(currentPreviewClass.subject)}`;
      }
      if (previewGrade) previewGrade.textContent = currentPreviewClass.grade_level || 'Class 12';
      if (previewTeacher) previewTeacher.textContent = currentPreviewClass.teacher_name || 'Educator';
      if (previewInst) previewInst.textContent = currentPreviewClass.teacher_institution || 'Verified Faculty';

      if (joinStepInput) joinStepInput.style.display = 'none';
      if (joinStepPreview) joinStepPreview.style.display = 'block';

    } catch (err) {
      if (joinCodeError) {
        joinCodeError.textContent = err.message || 'Invalid class code. Please check with your teacher.';
        joinCodeError.style.display = 'block';
      }
    } finally {
      if (btnValidateCode) {
        btnValidateCode.disabled = false;
        btnValidateCode.innerHTML = '<span>Find Classroom →</span>';
      }
    }
  }

  async function handleConfirmJoin() {
    if (!currentPreviewClass) return;
    const code = currentPreviewClass.join_code;

    if (btnConfirmJoin) {
      btnConfirmJoin.disabled = true;
      btnConfirmJoin.innerHTML = '<span>Enrolling...</span>';
    }

    try {
      const headers = window.SikshaSession ? window.SikshaSession.getAuthHeaders() : { 'Content-Type': 'application/json' };
      const res = await fetch(getApiUrl('/api/student/classes/join'), {
        method: 'POST',
        headers,
        body: JSON.stringify({ join_code: code })
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || 'Could not join classroom');
      }

      closeJoinModal();
      window.showStudentToast(`Successfully joined <strong>${escapeHtml(currentPreviewClass.name)}</strong>!`, 'success');
      await loadStudentClasses(true);

    } catch (err) {
      window.showStudentToast(err.message || 'Error joining classroom.', 'error');
    } finally {
      if (btnConfirmJoin) {
        btnConfirmJoin.disabled = false;
        btnConfirmJoin.innerHTML = '<span>Confirm & Join Class ✓</span>';
      }
    }
  }

  async function handleConfirmLeave() {
    if (!currentLeavingClass || !currentLeavingClass.id) return;
    const classId = currentLeavingClass.id;
    const className = currentLeavingClass.name;

    if (confirmLeaveClassBtn) {
      confirmLeaveClassBtn.disabled = true;
      confirmLeaveClassBtn.innerHTML = '<span>Leaving...</span>';
    }

    try {
      const headers = window.SikshaSession ? window.SikshaSession.getAuthHeaders() : {};
      const res = await fetch(getApiUrl(`/api/student/classes/${classId}/leave`), {
        method: 'POST',
        headers
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Could not leave classroom');
      }
      closeLeaveModal();
      window.showStudentToast(`You have left "${escapeHtml(className)}". Your personal progress was preserved.`, 'info');
      await loadStudentClasses(true);
    } catch (err) {
      window.showStudentToast(err.message || 'Error leaving classroom.', 'error');
    } finally {
      if (confirmLeaveClassBtn) {
        confirmLeaveClassBtn.disabled = false;
        confirmLeaveClassBtn.innerHTML = '<span>Yes, Leave Class</span>';
      }
    }
  }

  // Note Reader Modal Opener
  function openClassroomNoteModal(note, clsInfo) {
    const modal = document.getElementById('classroom-note-modal');
    if (!modal) return;

    const sBadge = document.getElementById('note-modal-subject');
    const tBadge = document.getElementById('note-modal-type');
    const timeBadge = document.getElementById('note-modal-readtime');
    const titleEl = document.getElementById('note-modal-title');
    const authorEl = document.getElementById('note-modal-author');
    const contentEl = document.getElementById('note-modal-content');

    if (sBadge) sBadge.textContent = note.subject || (clsInfo ? clsInfo.subject : 'Notes');
    if (tBadge) tBadge.textContent = note.file_type || 'Formula Note';
    if (timeBadge) timeBadge.textContent = `⏱️ ${note.read_time || '12 mins'}`;
    if (titleEl) titleEl.textContent = note.title || 'Lecture Note';
    if (authorEl) authorEl.textContent = (clsInfo ? clsInfo.teacher_name : '') || 'Educator';

    if (contentEl) {
      // Clean markdown conversion for headers, lists, and math blocks
      let raw = note.content || note.summary || 'No additional content provided.';
      let html = raw
        .replace(/^### (.*$)/gim, '<h3>$1</h3>')
        .replace(/^#### (.*$)/gim, '<h4>$1</h4>')
        .replace(/^\- (.*$)/gim, '<li>$1</li>')
        .replace(/\n\n/g, '<p></p>');
      
      if (html.includes('<li>')) {
        html = html.replace(/(<li>[\s\S]*?<\/li>)/gim, '<ul>$1</ul>');
      }

      contentEl.innerHTML = html;
      triggerMathRender(contentEl);
    }

    modal.classList.add('open');
  }

  const closeNoteModalBtn = document.getElementById('close-note-modal-btn');
  const classroomNoteModal = document.getElementById('classroom-note-modal');
  if (closeNoteModalBtn && classroomNoteModal) {
    closeNoteModalBtn.addEventListener('click', () => classroomNoteModal.classList.remove('open'));
    classroomNoteModal.addEventListener('click', (e) => {
      if (e.target === classroomNoteModal) classroomNoteModal.classList.remove('open');
    });
  }

  // Event Listeners for Classroom Modals
  if (openJoinClassModalBtn) openJoinClassModalBtn.addEventListener('click', openJoinModal);
  if (closeJoinModalBtn) closeJoinModalBtn.addEventListener('click', closeJoinModal);
  if (btnValidateCode) btnValidateCode.addEventListener('click', handleValidateCode);
  if (btnConfirmJoin) btnConfirmJoin.addEventListener('click', handleConfirmJoin);
  if (btnCancelPreview) {
    btnCancelPreview.addEventListener('click', () => {
      if (joinStepPreview) joinStepPreview.style.display = 'none';
      if (joinStepInput) joinStepInput.style.display = 'block';
    });
  }

  // Sidebar Direct Classroom Link
  const sidebarClassesLink = document.getElementById('sidebar-classes-link');
  if (sidebarClassesLink) {
    sidebarClassesLink.addEventListener('click', (e) => {
      e.preventDefault();
      const tabBtn = document.getElementById('tab-classes-btn');
      if (tabBtn) {
        tabBtn.click();
        tabBtn.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  }

  // Automatic input normalization (auto-uppercase, alphanumeric filter)
  if (inputClassCode) {
    inputClassCode.addEventListener('input', () => {
      inputClassCode.value = inputClassCode.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10);
      if (joinCodeError) joinCodeError.style.display = 'none';
    });

    inputClassCode.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleValidateCode();
      }
    });
  }

  // Leave Class Modal Event Listeners
  if (closeLeaveModalBtn) closeLeaveModalBtn.addEventListener('click', closeLeaveModal);
  if (cancelLeaveModalBtn) cancelLeaveModalBtn.addEventListener('click', closeLeaveModal);
  if (confirmLeaveClassBtn) confirmLeaveClassBtn.addEventListener('click', handleConfirmLeave);

  // Close modals on Backdrop Click
  if (joinClassModal) {
    joinClassModal.addEventListener('click', (e) => {
      if (e.target === joinClassModal) closeJoinModal();
    });
  }
  if (leaveClassModal) {
    leaveClassModal.addEventListener('click', (e) => {
      if (e.target === leaveClassModal) closeLeaveModal();
    });
  }

  // Close modals on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (joinClassModal && joinClassModal.classList.contains('open')) closeJoinModal();
      if (leaveClassModal && leaveClassModal.classList.contains('open')) closeLeaveModal();
      if (classroomNoteModal && classroomNoteModal.classList.contains('open')) classroomNoteModal.classList.remove('open');
    }
  });

  // =========================================================================
  // UNIFIED PROGRESS ENGINE SYNC (SINGLE SOURCE OF TRUTH)
  // =========================================================================
  async function loadStudentProgress() {
    try {
      const headers = window.SikshaSession ? window.SikshaSession.getAuthHeaders() : {};
      const res = await fetch(getApiUrl('/api/student/progress'), { headers });
      if (!res.ok) return;

      const data = await res.json();
      if (data.status !== 'success' || !data.progress) return;

      const p = data.progress;

      // 1. Update Dashboard Progress Bars & Text
      const dbLevelsCompleted = document.getElementById('dashboard-levels-completed');
      if (dbLevelsCompleted) {
        dbLevelsCompleted.textContent = `${p.completed_levels_count} / 20 Levels Completed`;
      }

      const dbProgressPct = document.getElementById('dashboard-overall-progress');
      if (dbProgressPct) {
        dbProgressPct.textContent = `${p.overall_progress_percent}%`;
      }

      const dbProgressFill = document.getElementById('dashboard-progress-fill');
      if (dbProgressFill) {
        dbProgressFill.style.width = `${p.overall_progress_percent}%`;
      }

      // 2. Update Dashboard Metrics Strip
      const dbQuestionsSolved = document.getElementById('metric-questions-solved');
      if (dbQuestionsSolved) {
        dbQuestionsSolved.textContent = p.total_questions_solved;
      }

      const dbAccuracyRate = document.getElementById('metric-accuracy-rate');
      if (dbAccuracyRate) {
        dbAccuracyRate.textContent = `${p.overall_accuracy_percent}%`;
      }

      const metricCompletedLevels = document.getElementById('metric-completed-levels');
      if (metricCompletedLevels) {
        metricCompletedLevels.textContent = p.completed_levels_count;
      }

      // 2b. Update streak displays from telemetry (fetched once)
      try {
        const streakRes = await fetch(getApiUrl('/api/student/telemetry'), { headers });
        if (streakRes.ok) {
          const tel = await streakRes.json();
          const streakDays = tel.active_learning_streak_days || 0;
          const heroStreak = document.getElementById('dashboard-hero-streak');
          if (heroStreak) heroStreak.textContent = streakDays;
          const metricStreak = document.getElementById('metric-streak-days');
          if (metricStreak) metricStreak.textContent = streakDays;
          const profStreak = document.getElementById('profile-streak');
          if (profStreak) profStreak.textContent = streakDays;
          const streakBadge = document.getElementById('profile-streak-badge');
          if (streakBadge) streakBadge.textContent = `🔥 ${streakDays}-Day Active Streak`;
          const cogState = document.getElementById('dashboard-cognitive-state');
          if (cogState) {
            cogState.textContent = streakDays >= 14 ? 'Optimal' : streakDays >= 7 ? 'Active' : streakDays >= 3 ? 'Warming Up' : 'Getting Started';
          }
        }
      } catch (_) {}

      // 3. Update Profile Page Metrics Strip
      const profLevels = document.getElementById('profile-levels-completed');
      if (profLevels) profLevels.textContent = p.completed_levels_count;

      const profSolved = document.getElementById('profile-problems-solved');
      if (profSolved) profSolved.textContent = p.total_questions_solved;

      const profAcc = document.getElementById('profile-accuracy');
      if (profAcc) profAcc.textContent = p.overall_accuracy_percent;

      // 4. Helper to update genome bars on BOTH Dashboard and Profile pages
      function updateGenomeBar(subjectId, subj) {
        if (!subj) return;
        const colorMap = { math: 'var(--indigo-primary)', phys: 'var(--amber-accent)', chem: 'var(--emerald-primary)', cs: 'var(--soft-blue)', bio: '#10B981' };

        // Dashboard page genome bars (db-genome-*)
        const dbPct = document.getElementById(`db-genome-${subjectId}-pct`);
        const dbFill = document.getElementById(`db-genome-${subjectId}-fill`);
        if (dbPct) dbPct.textContent = `${subj.progress_percent}%`;
        if (dbFill) dbFill.style.width = `${subj.progress_percent}%`;

        // Profile page genome bars (genome-*)
        const prPct = document.getElementById(`genome-${subjectId}-pct`);
        const prFill = document.getElementById(`genome-${subjectId}-fill`);
        if (prPct) prPct.textContent = `${subj.progress_percent}% (${subj.completed_levels}/5)`;
        if (prFill) prFill.style.width = `${subj.progress_percent}%`;
      }

      if (p.subjects) {
        updateGenomeBar('math', p.subjects.find(s => s.id === 'math'));
        updateGenomeBar('phys', p.subjects.find(s => s.id === 'phys'));
        updateGenomeBar('chem', p.subjects.find(s => s.id === 'chem'));
        updateGenomeBar('cs', p.subjects.find(s => s.id === 'cs'));
        updateGenomeBar('bio', p.subjects.find(s => s.id === 'bio'));

        // Find strongest subject
        const strongest = [...p.subjects].sort((a, b) => b.progress_percent - a.progress_percent)[0];
        const dbStrength = document.getElementById('db-genome-strength');
        if (dbStrength) {
          dbStrength.textContent = strongest && strongest.progress_percent > 0 ? strongest.title : 'Start Practicing';
        }
        const profDominant = document.getElementById('genome-dominant-subject');
        if (profDominant) {
          profDominant.textContent = strongest && strongest.progress_percent > 0 ? strongest.title : 'Active Learning';
        }
      }

      // 4b. Populate Dashboard "Your Subjects" list dynamically
      const subjectsList = document.getElementById('db-subjects-list');
      if (subjectsList && p.subjects) {
        subjectsList.innerHTML = '';
        const colorMap = { math: 'var(--indigo-primary)', phys: 'var(--amber-accent)', chem: 'var(--emerald-primary)', cs: 'var(--soft-blue)', bio: '#10B981' };
        p.subjects.forEach((subj, idx) => {
          const row = document.createElement('div');
          row.style.cssText = `display: flex; justify-content: space-between; align-items: center; font-size: 0.88rem; padding: 0.4rem 0;${idx < p.subjects.length - 1 ? ' border-bottom: 1px solid var(--border-subtle);' : ''}`;
          row.innerHTML = `
            <div><strong>${subj.title}</strong><div style="font-size: 0.75rem; color: var(--text-muted);">${subj.completed_levels}/5 Levels Completed</div></div>
            <strong style="color: ${colorMap[subj.id] || 'var(--indigo-primary)'};">${subj.progress_percent}%</strong>
          `;
          subjectsList.appendChild(row);
        });
      }

      // 5. Update Subject Tracks Grid on Dashboard
      const tracksContainer = document.getElementById('dashboard-tracks-grid');
      if (tracksContainer && p.subjects) {
        tracksContainer.innerHTML = '';
        p.subjects.forEach(subj => {
          const card = document.createElement('div');
          card.className = 'track-card';
          
          let colorVar = 'var(--indigo-primary)';
          if (subj.id === 'phys') colorVar = 'var(--amber-accent)';
          if (subj.id === 'chem') colorVar = 'var(--emerald-primary)';
          if (subj.id === 'cs') colorVar = 'var(--soft-blue)';
          if (subj.id === 'bio') colorVar = '#10B981';

          card.innerHTML = `
            <span class="track-subject-badge" style="color: ${colorVar};">${subj.title.toUpperCase()}</span>
            <div class="track-title">${subj.completed_levels} of 5 Levels Completed</div>
            <div class="meta-progress-bar-wrap">
              <span style="font-size: 0.8rem; font-weight: 700; color: ${colorVar};">${subj.progress_percent}%</span>
              <div class="meta-progress-bar-bg"><div class="meta-progress-bar-fill" style="width: ${subj.progress_percent}%; background-color: ${colorVar};"></div></div>
            </div>
            <a href="student-practice.html" class="btn btn-secondary" style="margin-top: auto; justify-content: space-between;">
              <span>${subj.completed_levels === 5 ? 'Mastered ↺' : 'Practice Level ' + subj.unlocked_level}</span><span>→</span>
            </a>
          `;
          tracksContainer.appendChild(card);
        });
      }

      // 6. Update Recent Activity on Dashboard
      const recentList = document.getElementById('dashboard-recent-activity-list');
      if (recentList && p.recent_activity) {
        if (p.recent_activity.length === 0) {
          recentList.innerHTML = `
            <div style="padding: 1.5rem; color: var(--text-muted); font-size: 0.88rem; text-align: center;">
              <p style="margin-bottom: 0.75rem;">No quiz attempts recorded yet. Begin your practice journey to unlock your Learning Genome!</p>
              <a href="student-practice.html" class="btn btn-primary" style="font-size: 0.82rem; padding: 0.45rem 1.25rem;">Start First Quiz →</a>
            </div>
          `;
        } else {
          recentList.innerHTML = '';
          p.recent_activity.forEach(act => {
            const item = document.createElement('div');
            item.className = 'activity-item';
            item.style.padding = '0.85rem 0';
            item.style.borderBottom = '1px solid var(--border-subtle)';
            item.style.display = 'flex';
            item.style.justifyContent = 'space-between';
            item.style.alignItems = 'center';

            const dateObj = new Date(act.completed_at);
            const timeStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const dateStr = dateObj.toLocaleDateString([], { month: 'short', day: 'numeric' });

            item.innerHTML = `
              <div>
                <div style="font-weight: 700; font-size: 0.88rem; color: var(--text-main);">
                  ${act.subject_title} • Level ${act.level_number}
                </div>
                <div style="font-size: 0.75rem; color: var(--text-muted); font-family: var(--font-mono);">
                  ${dateStr} at ${timeStr} • ${act.total_questions} Questions
                </div>
              </div>
              <div style="display: flex; align-items: center; gap: 0.85rem;">
                <span class="badge ${act.score >= 8 ? 'badge-emerald' : 'badge-indigo'}">
                  ${act.score} / ${act.total_questions} (${act.accuracy_percent}%)
                </span>
                <a href="student-practice.html?review=${act.id}" class="btn btn-ghost" style="font-size: 0.75rem; padding: 0.25rem 0.55rem; color: var(--indigo-primary);" title="View 10-Question Solutions">
                  Review ↗
                </a>
              </div>
            `;
            recentList.appendChild(item);
          });
        }
      }

      // 7. Update Quiz History Feed on Profile Page
      const profHistoryList = document.getElementById('profile-quiz-history-list');
      if (profHistoryList) {
        try {
          const histRes = await fetch(getApiUrl('/api/practice/history'), { headers });
          if (histRes.ok) {
            const histData = await histRes.json();
            const history = histData.history || [];
            if (history.length === 0) {
              profHistoryList.innerHTML = `
                <div style="padding: 1.5rem; text-align: center; color: var(--text-muted); font-size: 0.88rem;">
                  No previous quiz attempts found. Start solving practice levels in the Adaptive Arena!
                </div>
              `;
            } else {
              profHistoryList.innerHTML = '';
              history.forEach(act => {
                const item = document.createElement('div');
                item.className = 'card';
                item.style.padding = '0.9rem 1.25rem';
                item.style.display = 'flex';
                item.style.justifyContent = 'space-between';
                item.style.alignItems = 'center';
                item.style.transition = 'border-color 0.2s ease';

                const dateObj = new Date(act.completed_at);
                const dateStr = dateObj.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
                const timeStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                item.innerHTML = `
                  <div>
                    <h4 style="font-size: 0.95rem; font-weight: 700; color: var(--text-main); margin-bottom: 0.15rem;">
                      ${act.subject_title} — Level ${act.level_number}
                    </h4>
                    <div style="font-size: 0.78rem; color: var(--text-muted); font-family: var(--font-mono);">
                      ${dateStr} at ${timeStr} • ${act.time_spent_seconds ? act.time_spent_seconds + 's' : 'Diagnostic'}
                    </div>
                  </div>
                  <div style="display: flex; align-items: center; gap: 1rem;">
                    <span class="badge ${act.score >= 8 ? 'badge-emerald' : 'badge-indigo'}" style="font-size: 0.82rem;">
                      Score: ${act.score} / ${act.total_questions} (${act.accuracy_percent}%)
                    </span>
                    <a href="student-practice.html?review=${act.id}" class="btn btn-secondary" style="font-size: 0.8rem; padding: 0.4rem 0.85rem;">
                      <span>View Answer Key</span>
                      <span>↗</span>
                    </a>
                  </div>
                `;
                profHistoryList.appendChild(item);
              });
            }
          }
        } catch (hErr) {
          console.warn('[Profile History] Fetch error:', hErr);
        }
      }

    } catch (err) {
      console.warn('[Progress Engine] Failed to load unified progress:', err);
    }
  }

  // Load Saved Profile & Telemetry Data
  async function loadStudentTelemetry() {
    try {
      const headers = window.SikshaSession ? window.SikshaSession.getAuthHeaders() : {};
      const res = await fetch(getApiUrl('/api/student/telemetry'), { headers });
      if (res.ok) {
        const telemetry = await res.json();
        if (telemetry.name) {
          document.querySelectorAll('.profile-name, .profile-student-name').forEach(el => {
            el.textContent = telemetry.name;
          });
          const initials = window.SikshaSession ? window.SikshaSession.getInitials(telemetry.name) : 'SS';
          const flagshipAv = document.getElementById('profile-flagship-avatar');
          if (flagshipAv) flagshipAv.textContent = initials;
          document.querySelectorAll('.profile-avatar').forEach(el => {
            el.textContent = initials;
          });
        }
        if (telemetry.class_grade) {
          document.querySelectorAll('.profile-role').forEach(el => {
            el.textContent = telemetry.class_grade;
          });
          const classBadge = document.getElementById('profile-class-badge');
          if (classBadge) classBadge.textContent = telemetry.class_grade.toUpperCase();
        }
        if (telemetry.target_goal) {
          const goalBadge = document.getElementById('profile-goal-badge');
          if (goalBadge) goalBadge.textContent = telemetry.target_goal.toUpperCase();
        }
        if (telemetry.institution) {
          const instBadge = document.getElementById('profile-institution-badge');
          if (instBadge) instBadge.textContent = `📍 ${telemetry.institution}`;
        }
        if (telemetry.bio) {
          document.querySelectorAll('.profile-bio-text').forEach(el => {
            el.textContent = telemetry.bio;
          });
        }
        if (telemetry.active_learning_streak_days !== undefined) {
          const streakDays = telemetry.active_learning_streak_days;
          const heroStreak = document.getElementById('dashboard-hero-streak');
          if (heroStreak) heroStreak.textContent = streakDays;
          const metricStreak = document.getElementById('metric-streak-days');
          if (metricStreak) metricStreak.textContent = streakDays;
          const profStreak = document.getElementById('profile-streak');
          if (profStreak) profStreak.textContent = streakDays;
          const streakBadge = document.getElementById('profile-streak-badge');
          if (streakBadge) streakBadge.textContent = `🔥 ${streakDays}-Day Active Streak`;
        }
      }
    } catch (err) {
      console.warn('[Student Telemetry] Telemetry fetch fallback:', err);
    }
  }

  // =========================================================================
  // 10. AI PERSONALIZED LEARNING ROADMAP (SINGLE SOURCE OF TRUTH)
  // =========================================================================
  // 11. INTERACTIVE LEARNING GENOME — COMPLETE ENGINE (REBUILT & DATA-SYNCED)
  // =========================================================================

  let _genomeData = null;
  let _selectedNode = null;
  let _activeSubjectFilter = null;

  // ---- Main Genome Loader ----
  async function loadLearningGenome() {
    const loadingState = document.getElementById('genome-loading-state');
    const mainContent = document.getElementById('genome-main-content');
    const emptyState = document.getElementById('genome-empty-state');
    const errorState = document.getElementById('genome-error-state');
    if (!mainContent && !emptyState) return;

    // Show loading skeleton if present
    if (loadingState) loadingState.style.display = 'block';
    if (mainContent) mainContent.style.display = 'none';
    if (emptyState) emptyState.style.display = 'none';
    if (errorState) errorState.style.display = 'none';

    try {
      const headers = window.SikshaSession ? window.SikshaSession.getAuthHeaders() : {};
      const res = await fetch(getApiUrl('/api/student/genome'), { headers });
      if (!res.ok) throw new Error('API returned ' + res.status);

      const data = await res.json();
      if (data.status !== 'success') throw new Error('Genome status: ' + data.status);

      _genomeData = data;

      const totalQuestions = (data.calibration && data.calibration.total_data_points)
        || (data.progress_summary && data.progress_summary.total_questions_solved)
        || 0;

      if (loadingState) loadingState.style.display = 'none';

      // Show empty state or main content
      if (totalQuestions === 0) {
        if (emptyState) emptyState.style.display = 'flex';
        if (mainContent) mainContent.style.display = 'none';
        return;
      }

      if (emptyState) emptyState.style.display = 'none';
      if (mainContent) mainContent.style.display = 'flex';

      // Defensive Panel Rendering Sequence
      try { updateGenomeHeaderIdentity(data); } catch (e) { console.warn('[Genome] Header sync error:', e); }
      try { renderBranchingGenomeSVG(data); } catch (e) { console.warn('[Genome] SVG render error:', e); }
      try { renderLearningPathway(data); } catch (e) { console.warn('[Genome] Pathway render error:', e); }
      try { renderConceptualGaps(data); } catch (e) { console.warn('[Genome] Gaps render error:', e); }
      try { renderFrequentMistakes(data); } catch (e) { console.warn('[Genome] Mistakes render error:', e); }
      try { renderNextAction(data); } catch (e) { console.warn('[Genome] Next action render error:', e); }
      try { renderPerformanceRadar(data); } catch (e) { console.warn('[Genome] Radar render error:', e); }
      try { renderForgettingCurve(data); } catch (e) { console.warn('[Genome] Retention curve render error:', e); }
      try { renderAIMentorConnection(data); } catch (e) { console.warn('[Genome] Mentor render error:', e); }
      try { setupGenomeControls(); } catch (e) { console.warn('[Genome] Controls error:', e); }
      try { populateBackwardCompatibleElements(data); } catch (e) { console.warn('[Genome] Backward compat error:', e); }

    } catch (err) {
      console.warn('[Learning Genome] Error loading genome:', err);
      if (loadingState) loadingState.style.display = 'none';
      if (mainContent) mainContent.style.display = 'none';
      if (emptyState) emptyState.style.display = 'none';
      if (errorState) errorState.style.display = 'flex';
    }
  }

  // Retry button handler
  const retryBtn = document.getElementById('genome-retry-btn');
  if (retryBtn) {
    retryBtn.addEventListener('click', () => loadLearningGenome());
  }

  // ---- Identity & Top Bar Synchronizer ----
  function updateGenomeHeaderIdentity(data) {
    const badge = document.getElementById('genome-identity-badge');
    if (badge) {
      const idLabel = data.narrative_identity || generateLearningIdentity(data);
      badge.textContent = idLabel.replace('✦ ', '').split('•')[0].trim();
    }
  }

  // ---- Generate Learning Identity Label ----
  function generateLearningIdentity(data) {
    if (!data.cognitive_vectors || data.cognitive_vectors.length === 0) {
      return 'Learning Profile Developing';
    }

    const vectors = data.cognitive_vectors;
    const scores = vectors.map(v => v.score);
    const maxScore = Math.max(...scores);
    const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;

    const conceptual = vectors.find(v => v.id === 'conceptual_depth');
    const analytical = vectors.find(v => v.id === 'analytical_rigor');
    const speed = vectors.find(v => v.id === 'decomposition_speed');
    const precision = vectors.find(v => v.id === 'calculative_precision');
    const consistency = vectors.find(v => v.id === 'consistency_retention');
    const applied = vectors.find(v => v.id === 'applied_reasoning');

    if (analytical && analytical.score >= 85 && analytical.score === maxScore) return '✦ Analytical Thinker';
    if (conceptual && conceptual.score >= 85 && conceptual.score === maxScore) return '✦ Concept-First Learner';
    if (speed && speed.score >= 85 && speed.score === maxScore) return '✦ Fast Problem Solver';
    if (precision && precision.score >= 85 && precision.score === maxScore) return '✦ Accuracy-Focused Learner';
    if (consistency && consistency.score >= 85 && consistency.score === maxScore) return '✦ Consistent Builder';
    if (applied && applied.score >= 85 && applied.score === maxScore) return '✦ Cross-Domain Thinker';

    if (avgScore >= 70) return '✦ Steady Builder';
    if (avgScore >= 50) return '✦ Developing Learner';
    return '✦ Foundation Stage';
  }

  // =========================================================================
  // HERO BRANCHING GENOME SVG ENGINE (Inspired by Reference Visual Architecture)
  // =========================================================================
  function renderBranchingGenomeSVG(data) {
    const svg = document.getElementById('genome-constellation-svg');
    if (!svg) return;

    const W = 880, H = 580;
    const cx = 440, cy = 290;

    // Student profile source of truth
    const user = window.SikshaSession ? window.SikshaSession.getUser() : null;
    const studentName = (user && user.full_name) ? user.full_name.split(' ')[0] : (data.student_name ? data.student_name.split(' ')[0] : 'Learner');
    const studentInitials = window.SikshaSession ? window.SikshaSession.getInitials(user ? user.full_name : '') : 'SS';

    // Dynamic subjects and trees
    const subjectTrees = data.subject_trees || [];
    const subjectGenomes = data.subject_genomes || [];

    const knownConfigs = {
      'phys': { color: '#D97706', bg: 'rgba(217, 119, 6, 0.12)', title: 'Physics', icon: '⚡' },
      'chem': { color: '#059669', bg: 'rgba(5, 150, 105, 0.12)', title: 'Chemistry', icon: '⚗️' },
      'math': { color: '#4F46E5', bg: 'rgba(79, 70, 229, 0.12)', title: 'Mathematics', icon: '📐' },
      'cs':   { color: '#0284C7', bg: 'rgba(2, 132, 199, 0.12)', title: 'Computer Science', icon: '💻' },
      'bio':  { color: '#10B981', bg: 'rgba(16, 185, 129, 0.12)', title: 'Biology', icon: '🧬' }
    };

    const defaultQuadrantPositions = {
      'phys': { x: 245, y: 165 },
      'chem': { x: 245, y: 415 },
      'math': { x: 635, y: 165 },
      'cs':   { x: 635, y: 415 }
    };

    // Elegant, symmetrical 5-node layout geometry on 880x580 canvas (Center: 440, 290)
    // Apex: Biology; Left: Physics & Chemistry; Right: Math & CS
    const defaultPositions5 = {
      'bio':  { x: 440, y: 110 },
      'phys': { x: 210, y: 220 },
      'math': { x: 670, y: 220 },
      'chem': { x: 280, y: 450 },
      'cs':   { x: 600, y: 450 }
    };

    const defaultTopicOffsets5 = {
      'bio': [
        { x: 305, y: 55 },
        { x: 375, y: 35 },
        { x: 440, y: 28 },
        { x: 505, y: 35 },
        { x: 575, y: 55 }
      ],
      'phys': [
        { x: 120, y: 110 },
        { x: 70, y: 170 },
        { x: 60, y: 240 },
        { x: 90, y: 305 },
        { x: 155, y: 320 }
      ],
      'math': [
        { x: 760, y: 110 },
        { x: 810, y: 170 },
        { x: 820, y: 240 },
        { x: 790, y: 305 },
        { x: 725, y: 320 }
      ],
      'chem': [
        { x: 140, y: 410 },
        { x: 150, y: 480 },
        { x: 210, y: 535 },
        { x: 280, y: 545 },
        { x: 345, y: 535 }
      ],
      'cs': [
        { x: 535, y: 535 },
        { x: 600, y: 545 },
        { x: 670, y: 535 },
        { x: 730, y: 480 },
        { x: 740, y: 410 }
      ]
    };

    const defaultTopicOffsets = {
      'phys': [
        { x: 75, y: 75 },
        { x: 70, y: 160 },
        { x: 80, y: 245 },
        { x: 165, y: 55 },
        { x: 170, y: 265 }
      ],
      'chem': [
        { x: 165, y: 340 },
        { x: 80, y: 360 },
        { x: 70, y: 440 },
        { x: 75, y: 520 },
        { x: 170, y: 535 }
      ],
      'math': [
        { x: 715, y: 55 },
        { x: 805, y: 75 },
        { x: 815, y: 160 },
        { x: 805, y: 245 },
        { x: 715, y: 265 }
      ],
      'cs': [
        { x: 715, y: 340 },
        { x: 805, y: 360 },
        { x: 815, y: 440 },
        { x: 805, y: 520 },
        { x: 715, y: 535 }
      ],
      'bio': [
        { x: 305, y: 55 },
        { x: 375, y: 35 },
        { x: 440, y: 28 },
        { x: 505, y: 35 },
        { x: 575, y: 55 }
      ]
    };

    // Determine unique subject keys
    let subjectIds = [];
    if (subjectGenomes.length > 0) {
      subjectIds = subjectGenomes.map(s => s.id);
    } else if (subjectTrees.length > 0) {
      subjectIds = subjectTrees.map(t => t.id);
    } else {
      subjectIds = ['phys', 'chem', 'math', 'cs', 'bio'];
    }

    let defsHTML = `
      <defs>
        <radialGradient id="genomeCenterAmbientGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#6366F1" stop-opacity="0.22"/>
          <stop offset="60%" stop-color="#6366F1" stop-opacity="0.06"/>
          <stop offset="100%" stop-color="#6366F1" stop-opacity="0"/>
        </radialGradient>
        <linearGradient id="coreKnowledgeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#6366F1"/>
          <stop offset="100%" stop-color="#4338CA"/>
        </linearGradient>
        <filter id="genomeSoftShadow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="3"/>
          <feOffset dx="0" dy="2" result="offsetblur"/>
          <feFlood flood-color="rgba(15,23,42,0.12)"/>
          <feComposite in2="offsetblur" operator="in"/>
          <feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="genomeCoreGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="6"/>
          <feOffset dx="0" dy="2" result="offsetblur"/>
          <feFlood flood-color="rgba(79,70,229,0.3)"/>
          <feComposite in2="offsetblur" operator="in"/>
          <feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>
    `;

    let pathsHTML = '';
    let subjectNodesHTML = '';
    let topicNodesHTML = '';

    // Center ambient glow ring
    let ambientHTML = `
      <circle cx="${cx}" cy="${cy}" r="140" fill="url(#genomeCenterAmbientGlow)" pointer-events="none" />
      <circle cx="${cx}" cy="${cy}" r="260" fill="none" stroke="rgba(99,102,241,0.04)" stroke-width="1" stroke-dasharray="6 8" pointer-events="none" />
    `;

    const circumference = 182.2; // 2 * PI * 29

    // Map each subject dynamically
    subjectIds.forEach((sId, idx) => {
      const tree = subjectTrees.find(t => t.id === sId) || { id: sId, title: sId.toUpperCase(), icon: '📚', topics: [] };
      const genome = subjectGenomes.find(g => g.id === sId) || {};
      const known = knownConfigs[sId] || { color: '#6366F1', bg: 'rgba(99, 102, 241, 0.12)', title: tree.title || sId.toUpperCase(), icon: tree.icon || '📚' };

      let confX, confY;
      if (subjectIds.length === 5 && defaultPositions5[sId]) {
        confX = defaultPositions5[sId].x;
        confY = defaultPositions5[sId].y;
      } else if (defaultQuadrantPositions[sId] && subjectIds.length === 4) {
        confX = defaultQuadrantPositions[sId].x;
        confY = defaultQuadrantPositions[sId].y;
      } else {
        const angle = -Math.PI / 2 + (idx * 2 * Math.PI / subjectIds.length);
        confX = Math.round(cx + 225 * Math.cos(angle));
        confY = Math.round(cy + 175 * Math.sin(angle));
      }

      const conf = {
        x: confX,
        y: confY,
        color: known.color,
        bg: known.bg,
        title: tree.title || genome.title || known.title,
        icon: tree.icon || known.icon
      };

      const topics = tree.topics || [];
      const accuracy = genome.accuracy_percent !== undefined ? genome.accuracy_percent : 0;
      const stage = genome.mastery_stage || (accuracy >= 80 ? 'Mastered' : accuracy > 0 ? 'Developing' : 'Not Started');
      const trendSymbol = genome.trend === 'up' ? '↑' : (genome.trend === 'down' ? '↓' : (genome.trend === 'stable' ? '→' : '○'));

      // Primary Bézier Curve: Center (cx, cy) to Subject (conf.x, conf.y)
      const midX = (cx + conf.x) / 2;
      const branchD = `M ${cx} ${cy} C ${midX} ${cy}, ${conf.x} ${(cy + conf.y) / 2}, ${conf.x} ${conf.y}`;
      const branchOpacity = (accuracy > 0) ? '0.7' : '0.25';
      const branchWidth = (accuracy > 0) ? '3.5' : '2.0';

      pathsHTML += `
        <path class="genome-branch-path" data-subject="${sId}"
              d="${branchD}"
              fill="none"
              stroke="${conf.color}"
              stroke-width="${branchWidth}"
              stroke-opacity="${branchOpacity}"
              stroke-linecap="round" />
      `;

      // Circular progress meter stroke-dashoffset
      const strokeDashoffset = (circumference * (1 - Math.min(100, Math.max(0, accuracy)) / 100)).toFixed(1);

      // Subject Node SVG with Progress Arc
      subjectNodesHTML += `
        <g class="genome-subject-node-group" data-subject="${sId}" id="subj-group-${sId}" cursor="pointer">
          <!-- Outer Ambient Glow -->
          <circle cx="${conf.x}" cy="${conf.y}" r="35" fill="${conf.color}" opacity="0.1" />

          <!-- Circular Progress Meter Background Track -->
          <circle cx="${conf.x}" cy="${conf.y}" r="29" class="genome-progress-meter-bg" stroke-width="3" />

          <!-- Circular Progress Meter Fill Ring -->
          <circle cx="${conf.x}" cy="${conf.y}" r="29" class="genome-progress-meter-fill"
                  stroke="${conf.color}" stroke-width="3"
                  stroke-dasharray="${circumference}"
                  stroke-dashoffset="${strokeDashoffset}"
                  transform="rotate(-90 ${conf.x} ${conf.y})" />

          <!-- Inner Core White Circle -->
          <circle id="subj-node-${sId}" cx="${conf.x}" cy="${conf.y}" r="25"
                  fill="#FFFFFF" filter="url(#genomeSoftShadow)" />

          <!-- Subject Icon -->
          <text x="${conf.x}" y="${conf.y + 1}" text-anchor="middle" dominant-baseline="central"
                font-size="16" pointer-events="none">${conf.icon}</text>
          
          <!-- Subject Label -->
          <text x="${conf.x}" y="${sId === 'bio' ? conf.y + 42 : (conf.y > cy ? conf.y + 44 : conf.y - 42)}"
                text-anchor="middle" font-family="var(--font-sans)" font-size="13" font-weight="700"
                fill="#1E293B">${conf.title}</text>
          
          <!-- Subject Accuracy/Stage & Trend Pill -->
          <text x="${conf.x}" y="${sId === 'bio' ? conf.y + 56 : (conf.y > cy ? conf.y + 58 : conf.y - 28)}"
                text-anchor="middle" font-family="var(--font-sans)" font-size="10.5" font-weight="600"
                fill="${conf.color}">${Math.round(accuracy)}% · ${trendSymbol} ${stage}</text>
        </g>
      `;

      // Render Topics for this subject
      const topicOffsets = (subjectIds.length === 5 && defaultTopicOffsets5[sId])
        ? defaultTopicOffsets5[sId]
        : (defaultTopicOffsets[sId] || null);

      topics.slice(0, 5).forEach((topic, idx) => {
        let tx, ty;
        if (topicOffsets && topicOffsets[idx]) {
          tx = topicOffsets[idx].x;
          ty = topicOffsets[idx].y;
        } else {
          const baseAngle = Math.atan2(conf.y - cy, conf.x - cx);
          const fanAngle = baseAngle + ((idx - 2) * 0.35);
          tx = Math.round(conf.x + 115 * Math.cos(fanAngle));
          ty = Math.round(conf.y + 115 * Math.sin(fanAngle));
        }

        // Bézier curve from Subject (conf.x, conf.y) to Topic (tx, ty)
        const c1x = conf.x + (tx - conf.x) * 0.45;
        const c1y = conf.y;
        const c2x = conf.x + (tx - conf.x) * 0.55;
        const c2y = ty;
        const topicD = `M ${conf.x} ${conf.y} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${tx} ${ty}`;

        const tAcc = topic.accuracy !== undefined ? topic.accuracy : 0;
        const tAttempts = topic.attempts || 0;
        const isMastered = tAcc >= 80 && tAttempts > 0;
        const isAttention = tAcc < 60 && tAttempts > 0;
        const isDeveloping = tAcc >= 60 && tAcc < 80 && tAttempts > 0;

        let nodeFill = '#F8FAFC';
        let nodeStroke = '#94A3B8';
        let badgeChar = '○';
        let badgeColor = '#64748B';

        if (isMastered) {
          nodeFill = '#ECFDF5';
          nodeStroke = '#059669';
          badgeChar = '✓';
          badgeColor = '#059669';
        } else if (isAttention) {
          nodeFill = '#FFFBEB';
          nodeStroke = '#D97706';
          badgeChar = '!';
          badgeColor = '#D97706';
        } else if (isDeveloping) {
          nodeFill = '#EEF2FF';
          nodeStroke = '#4F46E5';
          badgeChar = '●';
          badgeColor = '#4F46E5';
        }

        const tPathOpacity = tAttempts > 0 ? '0.45' : '0.2';
        pathsHTML += `
          <path class="genome-topic-path" data-subject="${sId}" data-topic-id="${topic.id}"
                d="${topicD}"
                fill="none"
                stroke="${nodeStroke}"
                stroke-width="1.6"
                stroke-opacity="${tPathOpacity}"
                stroke-linecap="round" />
        `;

        // Text alignment based on horizontal position
        let textAnchor = 'middle';
        let textOffsetX = 0;
        if (tx < 120) {
          textAnchor = 'start';
          textOffsetX = 16;
        } else if (tx > 760) {
          textAnchor = 'end';
          textOffsetX = -16;
        }

        const topicTitle = topic.name || topic.title || 'Topic';
        const shortName = topicTitle.length > 20 ? topicTitle.substring(0, 18) + '...' : topicTitle;

        topicNodesHTML += `
          <g class="genome-topic-node-group" data-subject="${sId}" data-topic-id="${topic.id}" id="topic-node-${topic.id}" cursor="pointer">
            <circle cx="${tx}" cy="${ty}" r="13" fill="${nodeFill}" stroke="${nodeStroke}" stroke-width="2" filter="url(#genomeSoftShadow)" />
            <text x="${tx}" y="${ty + 0.5}" text-anchor="middle" dominant-baseline="central"
                  font-family="var(--font-sans)" font-size="9.5" font-weight="800" fill="${badgeColor}" pointer-events="none">${badgeChar}</text>
            
            <!-- Topic Label -->
            <text x="${tx + textOffsetX}" y="${ty > conf.y ? ty + 22 : ty - 16}"
                  text-anchor="${textAnchor}" font-family="var(--font-sans)" font-size="10.5" font-weight="600"
                  fill="#334155">${shortName}</text>
          </g>
        `;
      });
    });

    // Center Node: Core Knowledge / Active Student Identity
    const coreR = 40;
    const centerNodeHTML = `
      <g id="genome-core-node-group" cursor="pointer">
        <circle cx="${cx}" cy="${cy}" r="${coreR + 8}" fill="#6366F1" opacity="0.15" />
        <circle cx="${cx}" cy="${cy}" r="${coreR}" fill="url(#coreKnowledgeGrad)" filter="url(#genomeCoreGlow)" />
        <text x="${cx}" y="${cy - 8}" text-anchor="middle" dominant-baseline="central"
              font-family="var(--font-sans)" font-size="16" font-weight="800" fill="#FFFFFF" letter-spacing="0.04em">${studentInitials}</text>
        <text x="${cx}" y="${cy + 12}" text-anchor="middle" dominant-baseline="central"
              font-family="var(--font-sans)" font-size="9" font-weight="700" fill="rgba(255,255,255,0.9)" letter-spacing="0.02em">${studentName}</text>
        <text x="${cx}" y="${cy + coreR + 18}" text-anchor="middle"
              font-family="var(--font-sans)" font-size="11" font-weight="700" fill="#4338CA" letter-spacing="0.05em">CORE KNOWLEDGE</text>
      </g>
    `;

    // Assemble Full SVG
    svg.innerHTML = defsHTML + ambientHTML + pathsHTML + subjectNodesHTML + topicNodesHTML + centerNodeHTML;

    // Attach Event Handlers (Hover Tooltips & Click Inspections)
    attachGenomeSVGInteractions(data, subjectIds);
  }

  // ---- Attach Interactions to SVG Elements ----
  function attachGenomeSVGInteractions(data, subjectIds) {
    const tooltip = document.getElementById('genome-hover-tooltip');
    const tooltipTitle = document.getElementById('tooltip-title');
    const tooltipMeta = document.getElementById('tooltip-meta');
    const svgViewport = document.getElementById('genome-svg-viewport');

    const subjectTrees = data.subject_trees || [];
    const subjectGenomes = data.subject_genomes || [];
    const subjectsToLoop = subjectIds || (subjectGenomes.length > 0 ? subjectGenomes.map(s => s.id) : ['phys', 'chem', 'math', 'cs']);

    // Helper to position tooltip
    function showTooltip(e, title, meta) {
      if (!tooltip) return;
      if (tooltipTitle) tooltipTitle.textContent = title;
      if (tooltipMeta) tooltipMeta.textContent = meta;

      const rect = svgViewport ? svgViewport.getBoundingClientRect() : { left: 0, top: 0 };
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      tooltip.style.left = `${Math.max(10, Math.min(rect.width - 240, x - 100))}px`;
      tooltip.style.top = `${Math.max(10, y - 60)}px`;
      tooltip.style.display = 'block';
    }

    function hideTooltip() {
      if (tooltip) tooltip.style.display = 'none';
    }

    // Dynamic subject node interactions
    subjectsToLoop.forEach(sId => {
      const gEl = document.getElementById(`subj-group-${sId}`);
      if (!gEl) return;

      const genome = subjectGenomes.find(g => g.id === sId) || {};
      const title = genome.title || sId.toUpperCase();
      const acc = Math.round(genome.accuracy_percent || 0);
      const stage = genome.mastery_stage || 'Not Started';
      const trendLabel = genome.trend_label || (genome.trend === 'up' ? 'Improving' : (genome.trend === 'down' ? 'Needs Attention' : 'Stable'));

      gEl.addEventListener('mouseenter', (e) => {
        showTooltip(e, `${title} Academic Branch`, `${acc}% Accuracy · ${trendLabel} · ${stage}`);
      });
      gEl.addEventListener('mousemove', (e) => {
        showTooltip(e, `${title} Academic Branch`, `${acc}% Accuracy · ${trendLabel} · ${stage}`);
      });
      gEl.addEventListener('mouseleave', hideTooltip);

      gEl.addEventListener('click', () => {
        focusSubjectBranch(sId, data);
      });
    });

    // Topic node interactions
    subjectTrees.forEach(tree => {
      (tree.topics || []).forEach(topic => {
        const el = document.getElementById(`topic-node-${topic.id}`);
        if (!el) return;

        const sTitle = tree.title;
        const acc = Math.round(topic.accuracy || 0);
        const attempts = topic.attempts || 0;
        const topicName = topic.name || topic.title || 'Topic';
        const metaText = attempts > 0
          ? `${acc}% Accuracy (${attempts} attempts) · ${topic.mastery_stage || 'Tested'}`
          : 'Untested in Diagnostic Quizzes · Click to inspect';

        el.addEventListener('mouseenter', (e) => {
          showTooltip(e, `${sTitle} → ${topicName}`, metaText);
        });
        el.addEventListener('mousemove', (e) => {
          showTooltip(e, `${sTitle} → ${topicName}`, metaText);
        });
        el.addEventListener('mouseleave', hideTooltip);

        el.addEventListener('click', () => {
          openTopicInspector(tree, topic);
        });
      });
    });

    // Center node click: reset focus
    const coreNode = document.getElementById('genome-core-node-group');
    if (coreNode) {
      coreNode.addEventListener('click', () => {
        resetBranchFocus();
      });
    }
  }

  // ---- Focus Subject Branch in SVG ----
  function focusSubjectBranch(subjectId, data) {
    _activeSubjectFilter = subjectId;
    const resetBtn = document.getElementById('genome-reset-focus-btn');
    if (resetBtn) resetBtn.style.display = 'inline-flex';

    // Highlight paths & nodes
    const paths = document.querySelectorAll('.genome-branch-path, .genome-topic-path');
    paths.forEach(p => {
      const pSubj = p.getAttribute('data-subject');
      if (pSubj === subjectId) {
        p.style.opacity = '0.9';
        p.style.strokeWidth = '3.5';
      } else {
        p.style.opacity = '0.12';
      }
    });

    const subjGroups = document.querySelectorAll('.genome-subject-node-group');
    subjGroups.forEach(sg => {
      const sSubj = sg.getAttribute('data-subject');
      sg.style.opacity = (sSubj === subjectId) ? '1.0' : '0.25';
    });

    const topicGroups = document.querySelectorAll('.genome-topic-node-group');
    topicGroups.forEach(tg => {
      const tSubj = tg.getAttribute('data-subject');
      tg.style.opacity = (tSubj === subjectId) ? '1.0' : '0.18';
    });

    // Open subject details in inspector
    const tree = (data.subject_trees || []).find(t => t.id === subjectId);
    const genome = (data.subject_genomes || []).find(g => g.id === subjectId);
    if (tree && genome) {
      openSubjectInspector(tree, genome);
    }
  }

  // ---- Reset Branch Focus ----
  function resetBranchFocus() {
    _activeSubjectFilter = null;
    const resetBtn = document.getElementById('genome-reset-focus-btn');
    if (resetBtn) resetBtn.style.display = 'none';

    // Restore paths & nodes
    const paths = document.querySelectorAll('.genome-branch-path, .genome-topic-path');
    paths.forEach(p => {
      p.style.opacity = '';
      p.style.strokeWidth = '';
    });

    const subjGroups = document.querySelectorAll('.genome-subject-node-group');
    subjGroups.forEach(sg => {
      sg.style.opacity = '1.0';
    });

    const topicGroups = document.querySelectorAll('.genome-topic-node-group');
    topicGroups.forEach(tg => {
      tg.style.opacity = '1.0';
    });

    // Hide inspector drawer
    const inspector = document.getElementById('genome-node-inspector');
    if (inspector) inspector.style.display = 'none';
  }

  // ---- Open Topic Inspector Drawer ----
  function openTopicInspector(subjectTree, topic) {
    const inspector = document.getElementById('genome-node-inspector');
    const content = document.getElementById('genome-inspector-content');
    if (!inspector || !content) return;

    const acc = Math.round(topic.accuracy || 0);
    const attempts = topic.attempts || 0;
    const correct = topic.correct || 0;

    let badgeClass = 'badge-untested';
    let badgeText = 'Untested';
    if (attempts > 0) {
      if (acc >= 80) { badgeClass = 'badge-mastered'; badgeText = 'Mastered'; }
      else if (acc >= 60) { badgeClass = 'badge-developing'; badgeText = 'Developing'; }
      else { badgeClass = 'badge-attention'; badgeText = 'Needs Attention'; }
    }

    const mistakeBlock = topic.common_mistake ? `
      <div class="inspector-mistake-callout">
        <span class="mistake-callout-icon">⚠️</span>
        <div class="mistake-callout-text">
          <strong>Identified Misconception:</strong> ${topic.common_mistake}
        </div>
      </div>
    ` : '';

    content.innerHTML = `
      <div class="inspector-header">
        <div class="inspector-meta-eyebrow">
          <span>${subjectTree.icon} ${subjectTree.title}</span>
          <span class="inspector-badge ${badgeClass}">${badgeText}</span>
        </div>
        <h4 class="inspector-title">${topic.name}</h4>
      </div>

      <div class="inspector-stats-row">
        <div class="inspector-stat">
          <span class="inspector-stat-num">${acc}%</span>
          <span class="inspector-stat-label">Accuracy</span>
        </div>
        <div class="inspector-stat">
          <span class="inspector-stat-num">${attempts}</span>
          <span class="inspector-stat-label">Questions Attempted</span>
        </div>
        <div class="inspector-stat">
          <span class="inspector-stat-num">${correct}</span>
          <span class="inspector-stat-label">Correct Answers</span>
        </div>
        <div class="inspector-stat">
          <span class="inspector-stat-num">${topic.difficulty || 'Medium'}</span>
          <span class="inspector-stat-label">Difficulty</span>
        </div>
      </div>

      ${mistakeBlock}

      <div class="inspector-actions">
        <a href="${topic.action_url || 'student-practice.html'}" class="btn-action-primary btn-sm">
          <span>🎯 Practice This Topic →</span>
        </a>
        <a href="${topic.notes_url || 'student-notes.html'}" class="btn-action-ghost btn-sm">
          <span>📖 Review Study Notes</span>
        </a>
      </div>
    `;

    inspector.style.display = 'block';
    inspector.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  // ---- Open Subject Inspector Drawer ----
  function openSubjectInspector(subjectTree, genome) {
    const inspector = document.getElementById('genome-node-inspector');
    const content = document.getElementById('genome-inspector-content');
    if (!inspector || !content) return;

    const acc = Math.round(genome.accuracy_percent || 0);
    const progress = Math.round(genome.progress_percent || 0);
    const strongest = genome.strongest_area || '—';
    const weak = genome.needs_attention || '—';

    content.innerHTML = `
      <div class="inspector-header">
        <div class="inspector-meta-eyebrow">
          <span>ACADEMIC BRANCH</span>
          <span class="inspector-badge badge-developing">${genome.mastery_stage || 'Active'}</span>
        </div>
        <h4 class="inspector-title">${subjectTree.icon} ${subjectTree.title} Track</h4>
      </div>

      <div class="inspector-stats-row">
        <div class="inspector-stat">
          <span class="inspector-stat-num">${acc}%</span>
          <span class="inspector-stat-label">Accuracy</span>
        </div>
        <div class="inspector-stat">
          <span class="inspector-stat-num">${progress}%</span>
          <span class="inspector-stat-label">Syllabus Progress</span>
        </div>
        <div class="inspector-stat">
          <span class="inspector-stat-num">${genome.completed_levels || 0}/5</span>
          <span class="inspector-stat-label">Levels Cleared</span>
        </div>
      </div>

      <div class="inspector-insights-duo">
        <div class="inspector-insight-box">
          <span class="insight-label">Strongest Concept</span>
          <span class="insight-value strong">${strongest}</span>
        </div>
        <div class="inspector-insight-box">
          <span class="insight-label">Focus Area</span>
          <span class="insight-value attention">${weak}</span>
        </div>
      </div>

      <div class="inspector-actions">
        <a href="${genome.action_url || 'student-practice.html'}" class="btn-action-primary btn-sm">
          <span>🎯 Launch ${subjectTree.title} Drill →</span>
        </a>
        <a href="${genome.notes_url || 'student-notes.html'}" class="btn-action-ghost btn-sm">
          <span>📖 Explore ${subjectTree.title} Notes</span>
        </a>
      </div>
    `;

    inspector.style.display = 'block';
    inspector.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  // =========================================================================
  // LEFT COLUMN: PERSONAL PATHWAY & CONCEPTUAL GAPS
  // =========================================================================

  function renderLearningPathway(data) {
    const list = document.getElementById('genome-pathway-list');
    if (!list) return;

    const items = data.learning_pathway || [];
    if (items.length === 0) {
      list.innerHTML = `<div class="pathway-empty">Complete your initial diagnostic quizzes to generate your custom sequence.</div>`;
      return;
    }

    list.innerHTML = items.slice(0, 6).map(item => {
      const isCompleted = item.status === 'completed';
      const isCurrent = item.status === 'current';
      const icon = isCompleted ? '✓' : (isCurrent ? '⚡' : '○');
      const statusClass = isCompleted ? 'completed' : (isCurrent ? 'current' : 'recommended');

      const accBadge = item.accuracy !== null && item.accuracy !== undefined
        ? `<span class="pathway-acc-badge ${item.accuracy >= 80 ? 'high' : 'low'}">${Math.round(item.accuracy)}%</span>`
        : `<span class="pathway-acc-badge upcoming">Next</span>`;

      return `
        <div class="genome-pathway-item ${statusClass}">
          <div class="pathway-step-indicator">${icon}</div>
          <div class="pathway-item-body">
            <div class="pathway-item-title-row">
              <span class="pathway-item-name">${item.topic}</span>
              ${accBadge}
            </div>
            <div class="pathway-item-sub">
              <span class="pathway-subject-tag">${item.subject_title}</span>
              <a href="${item.action_url || 'student-practice.html'}" class="pathway-quick-link">Practice →</a>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  function renderConceptualGaps(data) {
    const list = document.getElementById('genome-gaps-list');
    if (!list) return;

    const gaps = data.conceptual_gaps || [];
    if (gaps.length === 0) {
      list.innerHTML = `
        <div class="gaps-empty-state">
          <span class="gaps-empty-icon">✦</span>
          <p class="gaps-empty-text">No critical conceptual gaps detected! All attempted concepts maintain high accuracy.</p>
        </div>
      `;
      return;
    }

    list.innerHTML = gaps.slice(0, 5).map(gap => {
      const acc = Math.round(gap.accuracy || 0);
      const mistakeHtml = gap.common_mistake
        ? `<div class="gap-mistake-hint">⚠️ ${gap.common_mistake}</div>`
        : (gap.insight ? `<div class="gap-insight-desc">${gap.insight}</div>` : '');

      return `
        <div class="genome-gap-card">
          <div class="gap-card-header">
            <span class="gap-subject-chip">${gap.subject_title}</span>
            <span class="gap-accuracy-badge">${acc}% (${gap.attempts} attempt${gap.attempts === 1 ? '' : 's'})</span>
          </div>
          <h5 class="gap-topic-title">${gap.topic}</h5>
          ${mistakeHtml}
          <div class="gap-card-actions">
            <a href="${gap.action_url || 'student-practice.html'}" class="btn-gap-action primary">Practice Drill →</a>
            <a href="${gap.notes_url || 'student-notes.html'}" class="btn-gap-action secondary">Review Notes</a>
          </div>
        </div>
      `;
    }).join('');

    if (window.renderMathInElement) {
      try {
        window.renderMathInElement(list, {
          delimiters: [
            { left: '$$', right: '$$', display: true },
            { left: '$', right: '$', display: false }
          ],
          throwOnError: false
        });
      } catch (_) {}
    }
  }

  // =========================================================================
  // FREQUENT MISTAKES LOG WITH AUTHENTIC ANSWERS & KATEX MATH RENDERING
  // =========================================================================

  function renderFrequentMistakes(data) {
    const grid = document.getElementById('genome-mistakes-grid');
    if (!grid) return;

    const mistakes = data.frequent_mistakes || [];
    if (mistakes.length === 0) {
      grid.innerHTML = `
        <div class="mistakes-empty-state" style="padding: 1.5rem; text-align: center; color: var(--text-muted);">
          <span style="font-size: 1.5rem; display: block; margin-bottom: 0.5rem;">🎯</span>
          <p style="margin: 0; font-size: 0.84rem;">No recurring misconceptions logged! High accuracy maintained across all recent drills.</p>
        </div>
      `;
      return;
    }

    grid.innerHTML = mistakes.slice(0, 5).map(m => {
      const qText = m.question_text || m.question_prompt || 'Practice Question';
      const expl = m.explanation || 'Review fundamental definitions and step-by-step reasoning.';
      
      const selOptText = m.selected_option_text 
        || (m.selected_option !== undefined && m.selected_option !== null && m.selected_option !== -1 ? `Option ${m.selected_option}` : 'Unanswered / Skipped');
      const corrOptText = m.correct_option_text 
        || (m.correct_option !== undefined && m.correct_option !== null ? `Option ${m.correct_option}` : 'Correct Option');
      
      const actionUrl = m.action_url || (m.subject_id ? `student-practice.html?subject=${m.subject_id}` : 'student-practice.html');

      return `
        <div class="genome-mistake-card">
          <div class="mistake-card-top">
            <span class="mistake-subject-tag">${m.subject_title || m.subject_id || 'Concept'}</span>
            <span class="mistake-topic-tag">${m.topic || 'Diagnostic Review'}</span>
          </div>
          <div class="mistake-question-excerpt">
            "${qText}"
          </div>
          <div class="mistake-detail-box">
            <div class="mistake-row incorrect">
              <span class="mistake-marker">✕</span>
              <span><strong>Your Answer:</strong> ${selOptText}</span>
            </div>
            <div class="mistake-row correct">
              <span class="mistake-marker">✓</span>
              <span><strong>Correct Solution:</strong> ${corrOptText}</span>
            </div>
          </div>
          <div class="mistake-explanation-excerpt">
            💡 <strong>Reasoning:</strong> ${expl}
          </div>
          <div style="margin-top: 0.25rem;">
            <a href="${actionUrl}" class="mistake-drill-link">Retest this concept →</a>
          </div>
        </div>
      `;
    }).join('');

    if (window.renderMathInElement) {
      try {
        window.renderMathInElement(grid, {
          delimiters: [
            { left: '$$', right: '$$', display: true },
            { left: '$', right: '$', display: false }
          ],
          throwOnError: false
        });
      } catch (err) {
        console.warn('[KaTeX Mistakes render]', err);
      }
    }
  }

  function renderNextAction(data) {
    const nba = data.next_best_action;
    if (!nba) return;

    const titleEl = document.getElementById('genome-next-action-title');
    const reasonEl = document.getElementById('genome-next-action-reason');
    const primaryEl = document.getElementById('genome-next-action-primary');
    const secondaryEl = document.getElementById('genome-next-action-secondary');

    if (titleEl) titleEl.textContent = nba.title;
    if (reasonEl) reasonEl.textContent = nba.reason;
    if (primaryEl) {
      primaryEl.href = nba.action_url || 'student-practice.html';
      primaryEl.innerHTML = `<span>${nba.action_label || 'Practice Now →'}</span>`;
    }
    if (secondaryEl) {
      secondaryEl.href = nba.notes_url || 'student-notes.html';
      secondaryEl.innerHTML = `<span>${nba.notes_label || 'Study Notes'}</span>`;
    }
  }

  // =========================================================================
  // COGNITIVE RADAR (6 DIMENSIONS)
  // =========================================================================

  function renderPerformanceRadar(data) {
    const svg = document.getElementById('genome-radar-svg');
    const legend = document.getElementById('genome-radar-legend');
    if (!svg) return;

    const vectors = data.cognitive_vectors || [];
    if (vectors.length === 0) return;

    const cx = 130, cy = 130, r = 85;
    const numAxes = 6;
    const angleStep = (2 * Math.PI) / numAxes;

    let svgHTML = '';

    // Concentric Reference Polygons (33%, 66%, 100%)
    [0.33, 0.66, 1.0].forEach(factor => {
      let polyPoints = [];
      for (let i = 0; i < numAxes; i++) {
        const angle = -Math.PI / 2 + i * angleStep;
        const x = cx + r * factor * Math.cos(angle);
        const y = cy + r * factor * Math.sin(angle);
        polyPoints.push(`${x.toFixed(1)},${y.toFixed(1)}`);
      }
      svgHTML += `
        <polygon points="${polyPoints.join(' ')}"
                 fill="none" stroke="rgba(99,102,241,0.12)" stroke-width="1"
                 stroke-dasharray="${factor === 1.0 ? 'none' : '3 3'}" />
      `;
    });

    // Axis Lines & Dimension Labels
    const shortAxisLabels = ['Depth', 'Rigor', 'Speed', 'Precision', 'Consistency', 'Synthesis'];
    for (let i = 0; i < numAxes; i++) {
      const angle = -Math.PI / 2 + i * angleStep;
      const x = cx + r * Math.cos(angle);
      const y = cy + r * Math.sin(angle);
      svgHTML += `
        <line x1="${cx}" y1="${cy}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}"
              stroke="rgba(99,102,241,0.15)" stroke-width="1" />
      `;

      // Label position slightly outside outer ring
      const lx = cx + (r + 16) * Math.cos(angle);
      const ly = cy + (r + 16) * Math.sin(angle);
      const textAnchor = (Math.abs(Math.cos(angle)) < 0.2) ? 'middle' : (Math.cos(angle) > 0 ? 'start' : 'end');

      svgHTML += `
        <text x="${lx.toFixed(1)}" y="${(ly + 3).toFixed(1)}" text-anchor="${textAnchor}"
              font-family="var(--font-sans)" font-size="8.5" font-weight="700" fill="#64748B">
          ${shortAxisLabels[i]}
        </text>
      `;
    }

    // Student Data Polygon
    let dataPoints = [];
    vectors.slice(0, 6).forEach((v, i) => {
      const angle = -Math.PI / 2 + i * angleStep;
      const scoreClamped = Math.max(15, Math.min(100, v.score || 0));
      const dist = (scoreClamped / 100) * r;
      const x = cx + dist * Math.cos(angle);
      const y = cy + dist * Math.sin(angle);
      dataPoints.push({ x, y, score: v.score, name: v.short_name });
    });

    const polygonCoords = dataPoints.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');

    svgHTML += `
      <polygon points="${polygonCoords}"
               fill="rgba(99,102,241,0.22)" stroke="#6366F1" stroke-width="2.2"
               filter="drop-shadow(0 2px 4px rgba(79,70,229,0.15))" />
    `;

    // Vertex dots
    dataPoints.forEach(p => {
      svgHTML += `
        <circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="3.5"
                fill="#4F46E5" stroke="#FFFFFF" stroke-width="1.5" />
      `;
    });

    svg.innerHTML = svgHTML;

    // Legend items under radar
    if (legend) {
      legend.innerHTML = vectors.slice(0, 6).map(v => {
        const score = Math.round(v.score);
        return `
          <div class="radar-legend-item">
            <span class="radar-legend-name">${v.short_name}</span>
            <span class="radar-legend-score" style="color: ${score >= 70 ? 'var(--emerald-primary)' : 'var(--indigo-primary)'}">${score}%</span>
          </div>
        `;
      }).join('');
    }
  }

  // =========================================================================
  // STAR FEATURE: NEURAL FORGETTING PREDICTION & TIME-TRAVEL DECAY ENGINE
  // =========================================================================

  let _activeRetentionFilter = 'all';
  let _currentSimulatedDays = 0;
  let _cachedRetentionProfile = null;

  function renderForgettingEngine(data) {
    const rp = data.retention_profile || {};
    _cachedRetentionProfile = rp;

    const curRet = Math.round(rp.current_retention_percent || 85);
    const halfLife = rp.average_half_life_days || 4.2;
    const atRiskCount = rp.at_risk_count || 0;
    const criticalCount = rp.critical_count || 0;
    const topics = rp.topics_breakdown || [];

    // Header pills & links
    const badge = document.getElementById('genome-current-retention-badge');
    if (badge) badge.textContent = `${curRet}% Recall Equilibrium`;

    const ctaBtn = document.getElementById('smart-revision-cta-btn');
    if (ctaBtn && rp.smart_revision_url) {
      ctaBtn.href = rp.smart_revision_url;
    }

    // Telemetry Stat Strip
    const valOverall = document.getElementById('retention-val-overall');
    if (valOverall) valOverall.textContent = `${curRet}%`;

    const valHalfLife = document.getElementById('retention-val-halflife');
    if (valHalfLife) valHalfLife.textContent = `${halfLife} Days`;

    const valDanger = document.getElementById('retention-val-danger');
    if (valDanger) {
      valDanger.textContent = `${criticalCount} Concept${criticalCount === 1 ? '' : 's'}`;
      valDanger.style.color = criticalCount > 0 ? 'var(--rose-accent, #DC2626)' : 'var(--emerald-primary, #059669)';
    }

    const noteDanger = document.getElementById('retention-note-danger');
    if (noteDanger) {
      noteDanger.textContent = criticalCount > 0 ? `< 50% critical void risk (${atRiskCount} total review due)` : 'All concepts above danger threshold';
    }

    const valWindow = document.getElementById('retention-val-window');
    if (valWindow) {
      valWindow.textContent = curRet < 50 ? 'Urgent Today' : (curRet < 75 ? 'Next 24-48 Hours' : 'Next 3-5 Days');
      valWindow.style.color = curRet < 50 ? '#DC2626' : (curRet < 75 ? '#D97706' : '#059669');
    }

    // Render Dual-Curve SVG
    drawDualDecayChart(rp, _currentSimulatedDays);

    // Setup Time-Travel Slider Listeners
    setupTimeTravelSlider(rp);

    // Top Endangered Concept Spotlight
    renderTopEndangeredSpotlight(rp);

    // Status description
    renderRetentionStatusText(rp);

    // Render Concept-by-Concept Matrix Cards
    renderConceptRetentionMatrix(topics, _currentSimulatedDays, _activeRetentionFilter);

    // Setup Topic Filter Pills
    setupRetentionFilters(topics);
  }

  // Backward compatibility wrapper
  function renderForgettingCurve(data) {
    renderForgettingEngine(data);
  }

  // Draw Dual SVG Decay Chart (Actual Trajectory vs Spaced Repetition)
  function drawDualDecayChart(rp, simDays) {
    const svg = document.getElementById('genome-decay-svg');
    if (!svg) return;

    const W = 540, H = 200;
    const l = 45, r = 510, t = 20, b = 160;
    const plotW = r - l;
    const plotH = b - t;
    const maxDays = 30;

    const decayPoints = rp.curve_points && rp.curve_points.length > 0 ? rp.curve_points : [
      { days: 0, retention: 100 }, { days: 1, retention: 86 }, { days: 2, retention: 75 },
      { days: 5, retention: 52 }, { days: 7, retention: 37 }, { days: 14, retention: 18 }, { days: 30, retention: 8 }
    ];

    const spacedPoints = rp.spaced_curve_points && rp.spaced_curve_points.length > 0 ? rp.spaced_curve_points : [
      { days: 0, retention: 100 }, { days: 2, retention: 90 }, { days: 6, retention: 84 },
      { days: 14, retention: 76 }, { days: 30, retention: 70 }
    ];

    // Build Decay Curve Path
    let decayPath = '';
    decayPoints.forEach((pt, i) => {
      const x = l + (Math.min(maxDays, pt.days) / maxDays) * plotW;
      const y = b - (Math.min(100, Math.max(0, pt.retention)) / 100) * plotH;
      if (i === 0) decayPath += `M ${x.toFixed(1)} ${y.toFixed(1)}`;
      else decayPath += ` L ${x.toFixed(1)} ${y.toFixed(1)}`;
    });

    // Build Area Path under decay curve
    const lastX = l + plotW;
    const firstX = l;
    const areaPath = `${decayPath} L ${lastX.toFixed(1)} ${b} L ${firstX.toFixed(1)} ${b} Z`;

    // Build Spaced Curve Path
    let spacedPath = '';
    spacedPoints.forEach((pt, i) => {
      const x = l + (Math.min(maxDays, pt.days) / maxDays) * plotW;
      const y = b - (Math.min(100, Math.max(0, pt.retention)) / 100) * plotH;
      if (i === 0) spacedPath += `M ${x.toFixed(1)} ${y.toFixed(1)}`;
      else spacedPath += ` L ${x.toFixed(1)} ${y.toFixed(1)}`;
    });

    // Current Simulated Marker Coordinates
    const simX = l + (Math.min(maxDays, simDays) / maxDays) * plotW;
    // Interpolate retention at simDays
    let interpRet = 85;
    for (let i = 0; i < decayPoints.length - 1; i++) {
      if (simDays >= decayPoints[i].days && simDays <= decayPoints[i + 1].days) {
        const ratio = (simDays - decayPoints[i].days) / Math.max(1, decayPoints[i + 1].days - decayPoints[i].days);
        interpRet = decayPoints[i].retention + ratio * (decayPoints[i + 1].retention - decayPoints[i].days);
        break;
      }
    }
    if (simDays === 0) interpRet = rp.current_retention_percent || 85;
    const simY = b - (Math.min(100, Math.max(0, interpRet)) / 100) * plotH;

    let svgHTML = `
      <defs>
        <linearGradient id="decayAreaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#6366F1" stop-opacity="0.22" />
          <stop offset="80%" stop-color="#6366F1" stop-opacity="0.03" />
          <stop offset="100%" stop-color="#6366F1" stop-opacity="0" />
        </linearGradient>
      </defs>

      <!-- Horizontal Reference Grid Lines -->
      <line x1="${l}" y1="${b}" x2="${r}" y2="${b}" stroke="#E2E8F0" stroke-width="1" />
      <line x1="${l}" y1="${(b - 0.25 * plotH).toFixed(1)}" x2="${r}" y2="${(b - 0.25 * plotH).toFixed(1)}" stroke="#F1F5F9" stroke-width="1" stroke-dasharray="3 3" />
      <line x1="${l}" y1="${(b - 0.5 * plotH).toFixed(1)}" x2="${r}" y2="${(b - 0.5 * plotH).toFixed(1)}" stroke="#FEE2E2" stroke-width="1.2" stroke-dasharray="4 3" />
      <line x1="${l}" y1="${(b - 0.75 * plotH).toFixed(1)}" x2="${r}" y2="${(b - 0.75 * plotH).toFixed(1)}" stroke="#F1F5F9" stroke-width="1" stroke-dasharray="3 3" />
      <line x1="${l}" y1="${t}" x2="${r}" y2="${t}" stroke="#E2E8F0" stroke-width="1" stroke-dasharray="3 3" />

      <!-- Critical Void Zone Shade (< 50%) -->
      <rect x="${l}" y="${(b - 0.5 * plotH).toFixed(1)}" width="${plotW}" height="${(0.5 * plotH).toFixed(1)}" fill="rgba(239,68,68,0.03)" />
      <text x="${r - 6}" y="${(b - 0.5 * plotH - 5).toFixed(1)}" text-anchor="end" font-family="var(--font-sans)" font-size="8" font-weight="700" fill="#EF4444">50% Critical Recall Threshold</text>

      <!-- Area Fill Under Decay Curve -->
      <path d="${areaPath}" fill="url(#decayAreaGrad)" />

      <!-- Spaced Repetition Recovery Path (Dashed Green) -->
      <path d="${spacedPath}" fill="none" stroke="#059669" stroke-width="2.2" stroke-dasharray="5 4" stroke-linecap="round" />

      <!-- Primary Decay Curve Path (Solid Indigo) -->
      <path d="${decayPath}" fill="none" stroke="#6366F1" stroke-width="3" stroke-linecap="round" />

      <!-- Simulated Time Marker Vertical Guide -->
      <line x1="${simX.toFixed(1)}" y1="${t}" x2="${simX.toFixed(1)}" y2="${b}" stroke="#4F46E5" stroke-width="1.2" stroke-dasharray="3 3" opacity="0.6" />

      <!-- Simulated Time Marker Point -->
      <circle cx="${simX.toFixed(1)}" cy="${simY.toFixed(1)}" r="7" fill="rgba(79,70,229,0.2)" />
      <circle cx="${simX.toFixed(1)}" cy="${simY.toFixed(1)}" r="4.5" fill="#4F46E5" stroke="#FFFFFF" stroke-width="1.8" filter="drop-shadow(0 2px 4px rgba(79,70,229,0.3))" />

      <!-- Y-Axis Labels -->
      <text x="${l - 8}" y="${t + 4}" font-family="var(--font-mono)" font-size="8.5" font-weight="700" fill="#94A3B8" text-anchor="end">100%</text>
      <text x="${l - 8}" y="${(b - 0.5 * plotH + 3).toFixed(1)}" font-family="var(--font-mono)" font-size="8.5" font-weight="700" fill="#EF4444" text-anchor="end">50%</text>
      <text x="${l - 8}" y="${b}" font-family="var(--font-mono)" font-size="8.5" font-weight="700" fill="#94A3B8" text-anchor="end">0%</text>

      <!-- X-Axis Day Labels -->
      <text x="${l}" y="${H - 12}" font-family="var(--font-sans)" font-size="8.5" font-weight="700" fill="#64748B">Day 0</text>
      <text x="${(l + 0.166 * plotW).toFixed(1)}" y="${H - 12}" font-family="var(--font-sans)" font-size="8.5" fill="#94A3B8" text-anchor="middle">Day 5</text>
      <text x="${(l + 0.333 * plotW).toFixed(1)}" y="${H - 12}" font-family="var(--font-sans)" font-size="8.5" fill="#94A3B8" text-anchor="middle">Day 10</text>
      <text x="${(l + 0.466 * plotW).toFixed(1)}" y="${H - 12}" font-family="var(--font-sans)" font-size="8.5" fill="#94A3B8" text-anchor="middle">Day 14</text>
      <text x="${(l + 0.7 * plotW).toFixed(1)}" y="${H - 12}" font-family="var(--font-sans)" font-size="8.5" fill="#94A3B8" text-anchor="middle">Day 21</text>
      <text x="${r}" y="${H - 12}" font-family="var(--font-sans)" font-size="8.5" font-weight="700" fill="#64748B" text-anchor="end">Day 30</text>
    `;

    svg.innerHTML = svgHTML;
  }

  // Setup Time-Travel Range Slider
  function setupTimeTravelSlider(rp) {
    const slider = document.getElementById('retention-time-slider');
    const label = document.getElementById('slider-target-day-text');
    const indicator = document.getElementById('retention-sim-indicator');
    const resetBtn = document.getElementById('slider-reset-btn');
    const ticks = document.querySelectorAll('.slider-tick');

    if (!slider) return;

    function applySimulation(days) {
      _currentSimulatedDays = days;
      slider.value = days;

      // Calculate projected average retention
      const topics = rp.topics_breakdown || [];
      let simRet = 0;
      if (topics.length > 0) {
        const total = topics.reduce((acc, t) => {
          const S = t.stability_days || 5.0;
          const simT = (t.days_elapsed || 0) + days;
          return acc + Math.max(5.0, Math.min(100.0, 100.0 * Math.exp(-simT / S)));
        }, 0);
        simRet = Math.round(total / topics.length);
      } else {
        simRet = Math.round(Math.max(8.0, 88.0 * Math.exp(-days / 5.5)));
      }

      if (label) {
        if (days === 0) {
          label.innerHTML = `Projected Recall Today: <strong>${rp.current_retention_percent || 85}%</strong>`;
        } else {
          const urgencyColor = simRet < 50 ? '#DC2626' : (simRet < 75 ? '#D97706' : '#059669');
          label.innerHTML = `Projected in <strong>+${days} Days</strong>: <strong style="color: ${urgencyColor}">${simRet}% Recall</strong>`;
        }
      }

      if (indicator) {
        indicator.textContent = days === 0 ? 'Day 0 (Current State)' : `+${days} Days Simulated Projection`;
      }

      ticks.forEach(t => {
        const tDay = parseInt(t.getAttribute('data-day'), 10);
        t.classList.toggle('active', tDay === days);
      });

      // Redraw curve marker
      drawDualDecayChart(rp, days);

      // Rerender topic cards with updated percentages
      renderConceptRetentionMatrix(topics, days, _activeRetentionFilter);
    }

    slider.oninput = (e) => {
      applySimulation(parseInt(e.target.value, 10));
    };

    if (resetBtn) {
      resetBtn.onclick = () => applySimulation(0);
    }

    ticks.forEach(t => {
      t.onclick = () => {
        const tDay = parseInt(t.getAttribute('data-day'), 10);
        applySimulation(tDay);
      };
    });
  }

  // Render Top Endangered Concept Box
  function renderTopEndangeredSpotlight(rp) {
    const box = document.getElementById('retention-top-endangered-box');
    if (!box) return;

    const atRisk = rp.topics_at_risk || [];
    if (atRisk.length === 0) {
      box.innerHTML = `
        <div style="font-size: 0.8rem; color: #059669; font-weight: 600;">
          ✓ All active concepts are currently in equilibrium. Keep up your active study streak!
        </div>
      `;
      return;
    }

    const top = atRisk[0];
    box.innerHTML = `
      <div style="min-width: 0;">
        <div style="font-weight: 800; font-size: 0.88rem; color: var(--text-main);">${top.topic}</div>
        <div style="font-size: 0.72rem; color: var(--text-muted);">${top.subject_title} · ${top.days_elapsed} days elapsed · ${Math.round(top.retention_pct)}% recall</div>
      </div>
      <a href="${top.action_url || 'student-practice.html'}" class="btn btn-primary btn-sm" style="flex-shrink: 0; padding: 0.35rem 0.75rem; font-size: 0.75rem;">
        <span>Revise Now ⚡</span>
      </a>
    `;
  }

  // Render Status Text
  function renderRetentionStatusText(rp) {
    const wrap = document.getElementById('genome-retention-status-wrap');
    if (!wrap) return;

    const atRisk = rp.topics_at_risk || [];
    if (atRisk.length > 0) {
      wrap.innerHTML = `
        <div style="display: flex; gap: 0.6rem; align-items: flex-start;">
          <span style="font-size: 1.1rem; color: #D97706;">⚠️</span>
          <div>
            <strong>${atRisk.length} concept${atRisk.length === 1 ? '' : 's'} approaching memory decay threshold:</strong>
            <div style="font-size: 0.76rem; color: var(--text-muted); margin-top: 0.2rem;">
              Targeted spaced practice on <strong>${atRisk[0].topic}</strong> within the next 48 hours will restore full recall equilibrium.
            </div>
          </div>
        </div>
      `;
    } else {
      wrap.innerHTML = `
        <div style="display: flex; gap: 0.6rem; align-items: flex-start;">
          <span style="font-size: 1.1rem; color: #059669;">✓</span>
          <div>
            <strong>Neural recall equilibrium is strong.</strong>
            <div style="font-size: 0.76rem; color: var(--text-muted); margin-top: 0.2rem;">
              Your active study consistency has stabilized conceptual retention across all active subjects.
            </div>
          </div>
        </div>
      `;
    }
  }

  // Render Concept Retention Matrix Cards
  function renderConceptRetentionMatrix(topics, simDays, filter) {
    const grid = document.getElementById('genome-retention-topics-grid');
    if (!grid) return;

    if (!topics || topics.length === 0) {
      grid.innerHTML = `
        <div style="grid-column: 1 / -1; padding: 2rem; text-align: center; color: var(--text-muted); background: #FFFFFF; border: 1px solid var(--border-subtle); border-radius: 14px;">
          <p style="margin: 0 0 0.75rem; font-size: 0.88rem;">Complete diagnostic quizzes to activate per-concept forgetting telemetry.</p>
          <a href="student-practice.html" class="btn btn-primary btn-sm">Start Practice Arena →</a>
        </div>
      `;
      return;
    }

    // Compute simulated retention for each topic
    const augmentedTopics = topics.map(t => {
      const S = t.stability_days || 4.5;
      const totalDays = (t.days_elapsed || 0) + simDays;
      const simRet = Math.round(Math.max(5.0, Math.min(100.0, 100.0 * Math.exp(-totalDays / S))));

      let urgency = 'safe';
      let badge = 'Optimal Recall';
      if (simRet < 50) {
        urgency = 'critical';
        badge = 'Critical Void Risk';
      } else if (simRet < 70) {
        urgency = 'warning';
        badge = 'Review Due';
      } else if (simRet < 85) {
        urgency = 'stable';
        badge = 'Consolidating';
      }

      return {
        ...t,
        sim_retention: simRet,
        sim_days_total: totalDays,
        sim_urgency: urgency,
        sim_badge: badge
      };
    });

    // Filter
    let filtered = augmentedTopics;
    if (filter === 'at-risk') {
      filtered = augmentedTopics.filter(t => t.sim_retention < 70);
    } else if (filter === 'safe') {
      filtered = augmentedTopics.filter(t => t.sim_retention >= 70);
    }

    if (filtered.length === 0) {
      grid.innerHTML = `
        <div style="grid-column: 1 / -1; padding: 1.5rem; text-align: center; color: var(--text-muted); font-size: 0.84rem;">
          No concepts matching filter "${filter}". All concepts meet the criteria!
        </div>
      `;
      return;
    }

    grid.innerHTML = filtered.map(t => {
      const simNote = simDays > 0 ? ` (${t.days_elapsed}d + ${simDays}d sim)` : ` (${t.days_elapsed}d ago)`;
      return `
        <div class="topic-retention-card" data-subject="${t.subject_id}">
          <div class="topic-card-top">
            <span class="topic-subj-badge" style="color: ${t.subject_id === 'phys' ? '#D97706' : (t.subject_id === 'chem' ? '#059669' : '#4F46E5')}">${t.subject_title}</span>
            <span class="topic-urgency-pill ${t.sim_urgency}">${t.sim_badge}</span>
          </div>
          <h5 class="topic-card-name">${t.topic}</h5>

          <div class="retention-meter-wrap">
            <div class="retention-meter-labels">
              <span>Memory Recall</span>
              <span style="color: ${t.sim_urgency === 'critical' ? '#DC2626' : (t.sim_urgency === 'warning' ? '#D97706' : '#059669')}">${t.sim_retention}%</span>
            </div>
            <div class="retention-meter-bg">
              <div class="retention-meter-fill ${t.sim_urgency}" style="width: ${t.sim_retention}%;"></div>
            </div>
          </div>

          <div class="topic-card-meta-row">
            <span>Last practiced${simNote}</span>
            <a href="${t.action_url || 'student-practice.html'}" class="topic-quick-drill-btn" title="Launch practice on ${t.topic}">
              <span>Quick Drill ⚡</span>
            </a>
          </div>
        </div>
      `;
    }).join('');
  }

  // Setup Topic Matrix Filters
  function setupRetentionFilters(topics) {
    const filterBtns = document.querySelectorAll('.retention-filter-btn');
    filterBtns.forEach(btn => {
      btn.onclick = () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        _activeRetentionFilter = btn.getAttribute('data-filter') || 'all';
        renderConceptRetentionMatrix(topics, _currentSimulatedDays, _activeRetentionFilter);
      };
    });
  }

  function renderAIMentorConnection(data) {
    const prompt = data.ai_mentor_prompt;
    if (!prompt) return;

    const guideText = document.getElementById('genome-mentor-guidance-text');
    const questionBox = document.getElementById('genome-mentor-question-box');
    const ctaBtn = document.getElementById('genome-mentor-cta-btn');

    if (guideText) guideText.textContent = prompt.message || 'Socratic Guide: Let us reinforce core principles.';
    if (questionBox) questionBox.textContent = `"${prompt.sample_question || 'How do forces interact in equilibrium?'}"`;
    if (ctaBtn) {
      let url = prompt.mentor_url || 'student-mentor.html';
      if (url.startsWith('mentor.html')) {
        url = url.replace('mentor.html', 'student-mentor.html');
      }
      ctaBtn.href = url;
    }
  }

  // ---- Interactive Control Listeners ----
  function setupGenomeControls() {
    const resetBtn = document.getElementById('genome-reset-focus-btn');
    if (resetBtn && !resetBtn.dataset.bound) {
      resetBtn.dataset.bound = '1';
      resetBtn.addEventListener('click', () => {
        resetBranchFocus();
      });
    }

    const inspectorClose = document.getElementById('genome-inspector-close');
    if (inspectorClose && !inspectorClose.dataset.bound) {
      inspectorClose.dataset.bound = '1';
      inspectorClose.addEventListener('click', () => {
        const inspector = document.getElementById('genome-node-inspector');
        if (inspector) inspector.style.display = 'none';
      });
    }
  }

  // ---- Backward-Compatible DOM Syncer ----
  function populateBackwardCompatibleElements(data) {
    const nt = document.getElementById('genome-narrative-title');
    if (nt && data.narrative_identity) nt.textContent = data.narrative_identity;

    if (data.calibration) {
      const se = document.getElementById('genome-calibration-stage');
      if (se) se.textContent = data.calibration.stage_name || '';
      const de = document.getElementById('genome-calibration-desc');
      if (de) de.textContent = data.calibration.description || '';
      const dp = document.getElementById('genome-data-points');
      if (dp) dp.textContent = `${data.calibration.total_data_points} questions completed`;
      const as = document.getElementById('genome-active-subjs');
      if (as) as.textContent = `${data.calibration.active_subjects_count}/${(data.subject_genomes && data.subject_genomes.length) || 5} Subjects`;
    }

    if (data.subject_genomes) {
      data.subject_genomes.forEach(s => {
        const pctEl = document.getElementById(`genome-${s.id}-pct`);
        const fillEl = document.getElementById(`genome-${s.id}-fill`);
        if (pctEl) pctEl.textContent = `${s.progress_percent}%`;
        if (fillEl) fillEl.style.width = `${s.progress_percent}%`;
      });

      const strongest = [...data.subject_genomes].sort((a, b) => b.accuracy_percent - a.accuracy_percent)[0];
      const dominantEl = document.getElementById('genome-dominant-subject');
      if (dominantEl && strongest && strongest.progress_percent > 0) {
        dominantEl.textContent = strongest.title;
      }
    }
  }

  // =========================================================================
  let currentActiveRoadmap = null;

  async function loadStudentRoadmap() {
    const container = document.getElementById('roadmap-nodes-container');
    if (!container) return;

    try {
      const headers = window.SikshaSession ? window.SikshaSession.getAuthHeaders() : {};
      const res = await fetch(getApiUrl('/api/student/roadmap'), { headers });
      if (!res.ok) return;

      const data = await res.json();
      if (data.status !== 'success') return;

      const hasRoadmap = data.has_roadmap;
      const isOutdated = data.is_outdated;
      const roadmap = data.roadmap;
      currentActiveRoadmap = roadmap;

      // 1. Update Outdated Notice Banner
      const outdatedBanner = document.getElementById('roadmap-outdated-alert');
      if (outdatedBanner) {
        outdatedBanner.style.display = isOutdated ? 'flex' : 'none';
      }

      // 2. Update Hero Button Text
      const btnText = document.getElementById('roadmap-btn-text');
      const btnIcon = document.getElementById('roadmap-btn-icon');
      if (btnText && btnIcon) {
        if (hasRoadmap) {
          btnText.textContent = isOutdated ? 'Update Roadmap' : 'Regenerate Roadmap';
          btnIcon.textContent = '🔄';
        } else {
          btnText.textContent = 'Generate My Roadmap';
          btnIcon.textContent = '✨';
        }
      }

      // 3. If roadmap exists, render nodes & hero info
      if (hasRoadmap && roadmap && roadmap.nodes && roadmap.nodes.length > 0) {
        const titleEl = document.getElementById('roadmap-main-title');
        const subEl = document.getElementById('roadmap-main-sub');
        const durEl = document.getElementById('roadmap-duration-pill');

        if (titleEl && roadmap.title) titleEl.textContent = roadmap.title;
        if (subEl && roadmap.summary) subEl.textContent = roadmap.summary;
        if (durEl && roadmap.estimated_duration) durEl.textContent = `Estimated: ${roadmap.estimated_duration}`;

        renderRoadmapNodes(roadmap.nodes);
        renderOverviewRoadmapPreview(roadmap);
      }
    } catch (err) {
      console.warn('[Roadmap Engine] Failed to load student roadmap:', err);
    }
  }

  function renderOverviewRoadmapPreview(roadmap) {
    const focusText = document.getElementById('overview-roadmap-focus-text');
    if (!focusText || !roadmap.nodes) return;

    const currentOrRec = roadmap.nodes.find(n => n.type === 'current') ||
                         roadmap.nodes.find(n => n.type === 'recommended') ||
                         roadmap.nodes[0];

    if (currentOrRec) {
      focusText.textContent = `${currentOrRec.subject} — ${currentOrRec.topic}`;
    }
  }

  function renderRoadmapNodes(nodes) {
    const container = document.getElementById('roadmap-nodes-container');
    if (!container) return;

    container.innerHTML = '<div class="roadmap-journey-backbone"></div>';

    const iconMap = {
      start: '🎯',
      completed: '✓',
      current: '●',
      recommended: '→',
      review: '↻',
      milestone: '★',
      locked: '🔒'
    };

    const badgeClassMap = {
      completed: 'background: rgba(25, 184, 107, 0.1); color: var(--emerald-primary);',
      current: 'background: rgba(79, 70, 229, 0.12); color: var(--indigo-primary);',
      recommended: 'background: rgba(79, 70, 229, 0.08); color: var(--indigo-primary);',
      review: 'background: rgba(234, 160, 35, 0.12); color: var(--amber-accent);',
      milestone: 'background: rgba(124, 58, 237, 0.12); color: #7C3AED;',
      locked: 'background: rgba(0,0,0,0.06); color: var(--text-muted);'
    };

    nodes.forEach((node, idx) => {
      const row = document.createElement('div');
      const nodeType = (node.type || 'recommended').toLowerCase();
      row.className = `roadmap-node-row ${nodeType}`;

      const icon = iconMap[nodeType] || '○';
      const badgeStyle = badgeClassMap[nodeType] || badgeClassMap.recommended;
      const statusLabel = nodeType === 'current' ? 'CURRENT FOCUS' :
                          nodeType === 'completed' ? 'COMPLETED' :
                          nodeType === 'review' ? 'NEEDS REINFORCEMENT' :
                          nodeType === 'milestone' ? 'MILESTONE' :
                          nodeType === 'locked' ? 'FUTURE' : 'RECOMMENDED';

      let actionsHtml = '';
      if (node.actions && node.actions.length > 0) {
        actionsHtml = '<div class="roadmap-node-actions">';
        node.actions.forEach(act => {
          if (act.type === 'notes') {
            actionsHtml += `
              <a href="student-notes.html" class="roadmap-action-btn notes" onclick="event.stopPropagation();">
                <span>📖</span> <span>${act.label || 'Study Notes'}</span>
              </a>
            `;
          } else if (act.type === 'practice') {
            actionsHtml += `
              <a href="student-practice.html" class="roadmap-action-btn practice" onclick="event.stopPropagation();">
                <span>⚡</span> <span>${act.label || 'Practice Quiz'}</span>
              </a>
            `;
          }
        });
        actionsHtml += '</div>';
      }

      row.innerHTML = `
        <div class="roadmap-node-anchor" title="${statusLabel}">${icon}</div>
        <div class="roadmap-node-card" data-node-index="${idx}">
          <div class="roadmap-node-top">
            <span class="roadmap-node-subject">${node.subject || 'ACADEMICS'}</span>
            <span class="roadmap-node-badge" style="${badgeStyle}">${statusLabel}</span>
          </div>
          <div class="roadmap-node-title">${node.topic || 'Core Concept'}</div>
          <div class="roadmap-node-reason">${node.reason || 'Personalized recommendation from your learning metrics.'}</div>
          ${actionsHtml}
        </div>
      `;

      // Node click handler for detailed expansion drawer
      const card = row.querySelector('.roadmap-node-card');
      if (card) {
        card.addEventListener('click', () => openNodeDetailModal(node));
      }

      container.appendChild(row);
    });
  }

  function openNodeDetailModal(node) {
    const modal = document.getElementById('roadmap-detail-modal');
    if (!modal) return;

    const subjEl = document.getElementById('roadmap-modal-subject');
    const titleEl = document.getElementById('roadmap-modal-node-title');
    const reasonEl = document.getElementById('roadmap-modal-reason');
    const timeEl = document.getElementById('roadmap-modal-time');
    const badgeEl = document.getElementById('roadmap-modal-status-badge');
    const actionsCont = document.getElementById('roadmap-modal-actions-container');

    if (subjEl) subjEl.textContent = (node.subject || 'SCIENCE').toUpperCase();
    if (titleEl) titleEl.textContent = node.topic || 'Curriculum Concept';
    if (reasonEl) reasonEl.textContent = node.reason || 'Recommended based on your recent diagnostic performance and learning trajectory.';
    if (timeEl) timeEl.textContent = `${node.estimatedMinutes || 45} mins`;

    if (badgeEl) {
      badgeEl.textContent = (node.type || 'RECOMMENDED').toUpperCase();
    }

    if (actionsCont) {
      actionsCont.innerHTML = '';
      if (node.actions && node.actions.length > 0) {
        node.actions.forEach(act => {
          const btn = document.createElement('a');
          if (act.type === 'notes') {
            btn.href = 'student-notes.html';
            btn.className = 'btn btn-secondary';
            btn.innerHTML = `<span>📖</span> <span>${act.label || 'Study Chapter Notes'}</span>`;
          } else {
            btn.href = 'student-practice.html';
            btn.className = 'btn btn-primary';
            btn.innerHTML = `<span>⚡</span> <span>${act.label || 'Start Practice Level'}</span>`;
          }
          btn.style.fontSize = '0.85rem';
          actionsCont.appendChild(btn);
        });
      } else {
        actionsCont.innerHTML = '<span style="font-size: 0.82rem; color: var(--text-muted);">No direct action required at this step. Follow the sequence above.</span>';
      }
    }

    modal.classList.add('open');
  }

  // Bind Generate / Update Roadmap Button
  const genRoadmapBtn = document.getElementById('generate-roadmap-btn');
  const alertUpdateBtn = document.getElementById('update-roadmap-alert-btn');

  async function triggerRoadmapGeneration() {
    if (!genRoadmapBtn) return;
    const btnText = document.getElementById('roadmap-btn-text');
    const btnIcon = document.getElementById('roadmap-btn-icon');
    const origText = btnText ? btnText.textContent : 'Generate';

    if (genRoadmapBtn) genRoadmapBtn.disabled = true;
    if (btnText) btnText.textContent = '✦ AI Synthesizing Path...';
    if (btnIcon) btnIcon.textContent = '⏳';

    try {
      const headers = window.SikshaSession ? window.SikshaSession.getAuthHeaders() : {};
      const res = await fetch(getApiUrl('/api/student/roadmap/generate'), {
        method: 'POST',
        headers
      });

      if (res.ok) {
        const data = await res.json();
        if (data.status === 'success' && data.roadmap) {
          currentActiveRoadmap = data.roadmap;
          loadStudentRoadmap();
          const outdatedBanner = document.getElementById('roadmap-outdated-alert');
          if (outdatedBanner) outdatedBanner.style.display = 'none';
        }
      }
    } catch (err) {
      console.error('[Roadmap] Generation failed:', err);
    } finally {
      if (genRoadmapBtn) genRoadmapBtn.disabled = false;
      if (btnText) btnText.textContent = origText;
      if (btnIcon) btnIcon.textContent = '✨';
    }
  }

  if (genRoadmapBtn) {
    genRoadmapBtn.addEventListener('click', triggerRoadmapGeneration);
  }
  if (alertUpdateBtn) {
    alertUpdateBtn.addEventListener('click', triggerRoadmapGeneration);
  }

  // Close Roadmap Detail Modal
  const closeRoadmapModalBtn = document.getElementById('close-roadmap-modal-btn');
  const roadmapModal = document.getElementById('roadmap-detail-modal');
  if (closeRoadmapModalBtn && roadmapModal) {
    closeRoadmapModalBtn.addEventListener('click', () => roadmapModal.classList.remove('open'));
    roadmapModal.addEventListener('click', (e) => {
      if (e.target === roadmapModal) roadmapModal.classList.remove('open');
    });
  }

  // Overview Teaser "View Full Roadmap" Button
  const overviewViewRoadmapBtn = document.getElementById('overview-view-roadmap-btn');
  if (overviewViewRoadmapBtn) {
    overviewViewRoadmapBtn.addEventListener('click', () => {
      const roadmapTabBtn = document.querySelector('.profile-nav-tab[data-tab-target="tab-roadmap"]');
      if (roadmapTabBtn) {
        roadmapTabBtn.click();
        window.scrollTo({ top: 320, behavior: 'smooth' });
      }
    });
  }

  // URL Handling
  function checkUrlReviewParams() {
    if (typeof window === 'undefined' || !window.location) return;
    const params = new URLSearchParams(window.location.search);
    const reviewAttemptId = params.get('review');
    if (reviewAttemptId && window.SikshaPractice && window.SikshaPractice.loadAndRenderHistoricalReview) {
      setTimeout(() => {
        window.SikshaPractice.loadAndRenderHistoricalReview(reviewAttemptId);
      }, 150);
    }
  }

  // Synchronize sidebar active selection for Progress / Achievements / Classroom based on hash / tab
  function syncSidebarActiveState() {
    if (typeof window === 'undefined' || !window.location) return;
    const path = window.location.pathname || '';
    const hash = window.location.hash || '';

    if (path.includes('student-profile')) {
      const progressLink = document.getElementById('sidebar-progress-link') || document.querySelector('.sidebar-nav a[href*="#tab-genome"]');
      const achievementsLink = document.getElementById('sidebar-achievements-link') || document.querySelector('.sidebar-nav a[href*="#tab-achievements"]');
      const classesLink = document.getElementById('sidebar-classes-link');

      if (hash === '#tab-classes') {
        if (progressLink) {
          progressLink.classList.remove('active');
          progressLink.removeAttribute('aria-current');
        }
        if (achievementsLink) {
          achievementsLink.classList.remove('active');
          achievementsLink.removeAttribute('aria-current');
        }
        if (classesLink) {
          classesLink.classList.add('active');
          classesLink.setAttribute('aria-current', 'page');
        }
      } else if (hash === '#tab-achievements') {
        if (progressLink) {
          progressLink.classList.remove('active');
          progressLink.removeAttribute('aria-current');
        }
        if (classesLink) {
          classesLink.classList.remove('active');
          classesLink.removeAttribute('aria-current');
        }
        if (achievementsLink) {
          achievementsLink.classList.add('active');
          achievementsLink.setAttribute('aria-current', 'page');
        }
      } else {
        if (classesLink) {
          classesLink.classList.remove('active');
          classesLink.removeAttribute('aria-current');
        }
        if (achievementsLink) {
          achievementsLink.classList.remove('active');
          achievementsLink.removeAttribute('aria-current');
        }
        if (progressLink) {
          progressLink.classList.add('active');
          progressLink.setAttribute('aria-current', 'page');
        }
      }
    }
  }

  // Check URL hash for direct tab navigation (e.g. #tab-roadmap or #tab-genome)
  function checkUrlTabHash() {
    if (typeof window === 'undefined' || !window.location) return;
    let hash = window.location.hash;
    if (hash) {
      let targetTabId = hash.replace('#', '');
      if (targetTabId === 'tab-genome') {
        targetTabId = 'tab-overview';
      }
      const matchingTabBtn = document.querySelector(`.profile-nav-tab[data-tab-target="${targetTabId}"]`);
      if (matchingTabBtn) {
        matchingTabBtn.click();
        if (hash === '#tab-genome') {
          setTimeout(() => {
            const genomeHero = document.querySelector('.genome-hero-canvas-card, #genome-main-content');
            if (genomeHero) genomeHero.scrollIntoView({ behavior: 'smooth' });
          }, 150);
        }
      }
    }
    syncSidebarActiveState();
  }

  window.addEventListener('hashchange', () => {
    checkUrlTabHash();
    syncSidebarActiveState();
  });

  // Initialize Core Telemetry & Profile tabs only on relevant pages
  const isProfilePage = Boolean(document.querySelector('.profile-nav-tab') || document.getElementById('genome-main-content') || (window.location && window.location.pathname.includes('student-profile')));
  const isDashboardPage = Boolean(document.getElementById('dashboard-hero-streak') || (window.location && (window.location.pathname.endsWith('student.html') || window.location.pathname.endsWith('/student'))));

  if (isDashboardPage || isProfilePage) {
    loadStudentTelemetry();
    loadStudentProgress();
  }
  checkUrlReviewParams();

  // Lazy-load active tab only on student profile page
  if (isProfilePage) {
    const initialHash = window.location.hash;
    if (initialHash) {
      checkUrlTabHash();
    } else {
      triggerTabLazyLoad('tab-overview');
    }
  }
  syncSidebarActiveState();

  // GSAP Entrance Animations (Non-destructive to child DOM spans)
  if (typeof gsap !== 'undefined') {
    gsap.from('.metric-col, .metric-card', {
      opacity: 0,
      y: 12,
      duration: 0.6,
      ease: 'power2.out',
      stagger: 0.08
    });

    gsap.from('.card, .hero-recommendation-card, .track-card, .profile-banner-card, .roadmap-hero-card', {
      opacity: 0,
      y: 18,
      duration: 0.7,
      stagger: 0.06,
      ease: 'power3.out'
    });
  }
});


