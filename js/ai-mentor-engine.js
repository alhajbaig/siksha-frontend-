/**
 * SIKSHASATHI — Production AI Mentor Engine (Frontend)
 * Secure backend proxy calls, real conversation persistence, 3 genuine modes.
 * NO direct Groq API calls. All AI goes through /api/mentor/* endpoints.
 */

(function () {
  'use strict';

  // =========================================================================
  // 1. STATE
  // =========================================================================
  const state = {
    currentMode: 'socratic',
    activeConversationId: null,
    conversations: [],
    preferences: { persona: 'balanced', daily_study_minutes: 45 },
    activeAttachment: null,
    isSending: false
  };

  function getAuthHeaders() {
    return window.SikshaSession ? window.SikshaSession.getAuthHeaders() : { 'Content-Type': 'application/json' };
  }

  // =========================================================================
  // 2. DOM REFERENCES
  // =========================================================================
  let chatStream, chatForm, userInput, fileInput, attachBtn, voiceBtn,
      attachmentPreview, modePills, promptChipsContainer, threadsList,
      newConvBtn, searchInput, convTitleEl, convSubjectEl, chatHeader;

  function initElements() {
    chatStream = document.getElementById('mentor-chat-stream');
    chatForm = document.getElementById('mentor-chat-form');
    userInput = document.getElementById('mentor-user-input');
    fileInput = document.getElementById('mentor-file-upload');
    attachBtn = document.getElementById('btn-mentor-attach');
    voiceBtn = document.getElementById('btn-mentor-voice');
    attachmentPreview = document.getElementById('mentor-attachment-preview');
    modePills = document.querySelectorAll('.mentor-mode-pill');
    promptChipsContainer = document.querySelector('.mentor-prompt-chips');
    threadsList = document.getElementById('mentor-threads-list');
    newConvBtn = document.getElementById('btn-new-conversation');
    searchInput = document.getElementById('mentor-search-input');
    convTitleEl = document.getElementById('mentor-conv-title');
    convSubjectEl = document.getElementById('mentor-conv-subject');
    chatHeader = document.querySelector('.mentor-chat-header');
  }

  // =========================================================================
  // MULTIMODAL ATTACHMENT HANDLER (Images, PDFs, Diagrams)
  // =========================================================================
  function handleFileUpload(file) {
    if (!file) return;
    const isImage = file.type.startsWith('image/');
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');

    if (!isImage && !isPdf && !file.type.startsWith('text/')) {
      alert('Please upload an image (PNG, JPG, WEBP) or a PDF document.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target.result;
      const sizeFormatted = file.size > 1024 * 1024
        ? (file.size / (1024 * 1024)).toFixed(1) + ' MB'
        : (file.size / 1024).toFixed(0) + ' KB';

      state.activeAttachment = {
        name: file.name,
        type: isPdf ? 'pdf' : (isImage ? 'image' : 'text'),
        size: sizeFormatted,
        base64: base64
      };

      renderAttachmentPreview();
    };
    reader.readAsDataURL(file);
  }

  function renderAttachmentPreview() {
    if (!attachmentPreview) return;
    if (!state.activeAttachment) {
      attachmentPreview.style.display = 'none';
      attachmentPreview.innerHTML = '';
      return;
    }

    const att = state.activeAttachment;
    attachmentPreview.style.display = 'flex';

    let thumbHtml = '';
    if (att.type === 'image') {
      thumbHtml = `<img class="attachment-chip-img" src="${att.base64}" alt="Attachment preview">`;
    } else {
      thumbHtml = `<span style="font-size: 1.25rem;">📄</span>`;
    }

    attachmentPreview.innerHTML = `
      <div class="attachment-chip">
        ${thumbHtml}
        <div class="attachment-chip-info">
          <span class="attachment-chip-name" title="${escapeHtml(att.name)}">${escapeHtml(att.name)}</span>
          <span class="attachment-chip-size">${att.size} • Multimodal RAG</span>
        </div>
        <button type="button" class="attachment-chip-remove" title="Remove attachment" id="btn-remove-attachment">✕</button>
      </div>
    `;

    const removeBtn = document.getElementById('btn-remove-attachment');
    if (removeBtn) {
      removeBtn.addEventListener('click', () => {
        state.activeAttachment = null;
        if (fileInput) fileInput.value = '';
        renderAttachmentPreview();
      });
    }
  }

  // =========================================================================
  // 3. API LAYER — All calls go through authenticated backend with timeout
  // =========================================================================
  async function apiCall(path, method = 'GET', body = null, timeoutMs = 30000) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    const opts = { method, headers: getAuthHeaders(), signal: controller.signal };
    if (body) opts.body = JSON.stringify(body);
    const url = (window.SIKSHA_CONFIG && window.SIKSHA_CONFIG.getApiUrl)
      ? window.SIKSHA_CONFIG.getApiUrl(`/api/mentor${path}`)
      : `/api/mentor${path}`;
    try {
      const res = await fetch(url, opts);
      clearTimeout(timeoutId);
      if (res.status === 401) {
        window.location.href = 'auth.html';
        return null;
      }
      if (res.status === 429) {
        showError("You're sending messages too quickly. Please wait a moment.");
        return null;
      }
      if (!res.ok) {
        const err = await res.text().catch(() => '');
        console.warn('[Mentor API]', res.status, err);
        return null;
      }
      return await res.json();
    } catch (e) {
      clearTimeout(timeoutId);
      if (e.name === 'AbortError') {
        console.warn('[Mentor API] Request timed out for', path);
      } else {
        console.warn('[Mentor API] Network error:', e);
      }
      return null;
    }
  }

  // =========================================================================
  // 4. CONVERSATIONS CRUD
  // =========================================================================
  async function loadConversations(search = '') {
    const q = search ? `?search=${encodeURIComponent(search)}` : '';
    const data = await apiCall(`/conversations${q}`);
    if (!data) return;
    state.conversations = data.conversations || [];
    renderThreadsList();
  }

  async function createConversation(title = 'New Conversation') {
    const data = await apiCall('/conversations', 'POST', {
      title, mode: state.currentMode, subject: ''
    });
    if (!data || !data.conversation_id) return null;
    state.activeConversationId = data.conversation_id;
    await loadConversations();
    await loadConversation(data.conversation_id);
    return data.conversation_id;
  }

  async function loadConversation(convId) {
    const data = await apiCall(`/conversations/${convId}`);
    if (!data) return;

    state.activeConversationId = convId;
    const conv = data.conversation;

    // Update Header
    if (convTitleEl) convTitleEl.textContent = conv.title || 'Conversation';
    if (convSubjectEl) convSubjectEl.textContent = (conv.subject || 'AI MENTOR').toUpperCase();

    // Set active mode pill
    syncModePills(conv.mode);
    state.currentMode = conv.mode || 'socratic';

    // Render messages
    renderMessages(data.messages || []);

    // Highlight active thread in sidebar
    highlightActiveThread(convId);

    // Load suggestions for this mode
    loadSuggestions();
  }

  async function deleteConversation(convId) {
    await apiCall(`/conversations/${convId}`, 'DELETE');
    if (state.activeConversationId === convId) {
      state.activeConversationId = null;
      if (chatStream) chatStream.innerHTML = '';
      renderEmptyState();
    }
    await loadConversations();
  }

  // =========================================================================
  // 5. CHAT — Send message & receive AI response (Multimodal)
  // =========================================================================
  async function sendMessage(text) {
    const hasAttachment = Boolean(state.activeAttachment);
    if ((!text || !text.trim()) && !hasAttachment) return;
    if (state.isSending) return;

    text = (text || (hasAttachment ? 'Please analyze and explain this attached document/diagram.' : '')).trim();

    state.isSending = true;

    // Snapshot and clear attachment
    const currentAttachment = state.activeAttachment;
    state.activeAttachment = null;
    renderAttachmentPreview();
    if (fileInput) fileInput.value = '';

    // Clear input
    if (userInput) userInput.value = '';

    // Render user bubble immediately
    appendUserBubble(text, null, currentAttachment);

    // Render thinking bubble
    const thinkingEl = appendThinkingBubble();

    try {
      // Bootstrap conversation if none active
      if (!state.activeConversationId) {
        const convTitle = hasAttachment ? `Document Analysis: ${currentAttachment.name}` : text.substring(0, 60);
        const data = await apiCall('/conversations', 'POST', {
          title: convTitle,
          mode: state.currentMode,
          subject: ''
        });
        if (data && data.conversation_id) {
          state.activeConversationId = data.conversation_id;
          if (convTitleEl) convTitleEl.textContent = convTitle;
          loadConversations().catch(() => {});
        } else {
          if (thinkingEl) thinkingEl.remove();
          appendErrorBubble("Could not start conversation session. Please check your connection and try again.");
          return;
        }
      }

      const payload = {
        conversation_id: state.activeConversationId,
        message: text,
        mode: state.currentMode
      };

      if (currentAttachment) {
        payload.attachment_base64 = currentAttachment.base64;
        payload.attachment_name = currentAttachment.name;
        payload.attachment_type = currentAttachment.type;
      }

      const data = await apiCall('/chat', 'POST', payload, 45000);

      // Remove thinking bubble
      if (thinkingEl) thinkingEl.remove();

      if (data && data.status === 'success') {
        appendMentorBubble(data.reply, data.hint, data.mode);
        loadSuggestions();
        loadConversations().catch(() => {});
      } else {
        appendErrorBubble(data?.detail || data?.reply || "I couldn't respond right now. Please try again.");
      }
    } catch (err) {
      if (thinkingEl) thinkingEl.remove();
      appendErrorBubble("Connection error. Please check your internet and try again.");
      console.error('[Mentor Chat Error]', err);
    } finally {
      state.isSending = false;
    }
  }

  // =========================================================================
  // 6. SUGGESTIONS — Dynamic mode-aware chips
  // =========================================================================
  async function loadSuggestions() {
    if (!promptChipsContainer) return;
    const data = await apiCall(`/suggestions?mode=${state.currentMode}`, 'POST');
    if (!data || !data.suggestions) return;
    renderSuggestionChips(data.suggestions);
  }

  // =========================================================================
  // 7. PREFERENCES
  // =========================================================================
  async function loadPreferences() {
    const data = await apiCall('/preferences');
    if (data && data.preferences) {
      state.preferences = data.preferences;
    }
  }

  async function savePreferences(updates) {
    const data = await apiCall('/preferences', 'PUT', updates);
    if (data && data.preferences) {
      state.preferences = data.preferences;
    }
  }

  // =========================================================================
  // 8. RENDER FUNCTIONS — Use existing CSS classes, no redesign
  // =========================================================================

  function renderThreadsList() {
    if (!threadsList) return;
    if (state.conversations.length === 0) {
      threadsList.innerHTML = `
        <div style="text-align: center; padding: 1.5rem 0.5rem; color: var(--text-muted); font-size: 0.78rem;">
          No conversations yet.<br>Start one below!
        </div>
      `;
      return;
    }

    threadsList.innerHTML = state.conversations.map(c => {
      const isActive = c.id === state.activeConversationId;
      const timeAgo = formatTimeAgo(c.updated_at);
      const modeIcon = c.mode === 'socratic' ? '\u2726' : c.mode === 'exam' ? '\uD83C\uDFAF' : '\u26A1';
      return `
        <div class="mentor-thread-item ${isActive ? 'active' : ''}" data-conv-id="${c.id}">
          <svg class="svg-icon-sm" viewBox="0 0 24 24" ${isActive ? 'style="stroke: var(--indigo-primary);"' : ''}>
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          <div style="flex-grow: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
            <strong>${escapeHtml(c.title || 'Untitled')}</strong>
            <div style="font-size: 0.72rem; color: var(--text-muted);">${modeIcon} ${c.subject || 'General'} \u2022 ${timeAgo}</div>
          </div>
          <button class="thread-delete-btn" data-del-id="${c.id}" title="Delete" style="background:none;border:none;cursor:pointer;color:var(--text-muted);font-size:0.7rem;padding:2px 4px;opacity:0.5;">\u2715</button>
        </div>
      `;
    }).join('');

    // Bind click events
    threadsList.querySelectorAll('.mentor-thread-item').forEach(el => {
      el.addEventListener('click', (e) => {
        if (e.target.closest('.thread-delete-btn')) return;
        const convId = el.dataset.convId;
        if (convId) loadConversation(convId);
      });
    });

    threadsList.querySelectorAll('.thread-delete-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const convId = btn.dataset.delId;
        if (convId && confirm('Delete this conversation?')) {
          deleteConversation(convId);
        }
      });
    });
  }

  function highlightActiveThread(convId) {
    if (!threadsList) return;
    threadsList.querySelectorAll('.mentor-thread-item').forEach(el => {
      el.classList.toggle('active', el.dataset.convId === convId);
    });
  }

  function renderMessages(messages) {
    if (!chatStream) return;
    chatStream.innerHTML = '';

    if (messages.length === 0) {
      renderEmptyState();
      return;
    }

    messages.forEach(msg => {
      if (msg.role === 'user') {
        let attachment = null;
        try {
          const meta = typeof msg.metadata === 'string' ? JSON.parse(msg.metadata || '{}') : (msg.metadata || {});
          attachment = meta.attachment || null;
        } catch (_) {}
        appendUserBubble(msg.content, msg.created_at, attachment);
      } else if (msg.role === 'assistant') {
        appendMentorBubble(msg.content, null, msg.mode || state.currentMode, msg.created_at);
      }
    });
  }

  function renderEmptyState() {
    if (!chatStream) return;
    chatStream.innerHTML = `
      <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; text-align: center; padding: 2rem; color: var(--text-muted);">
        <div style="font-size: 2.5rem; margin-bottom: 1rem;">✨</div>
        <strong style="font-size: 1.1rem; color: var(--text-main); margin-bottom: 0.5rem;">Start a conversation with your AI Mentor</strong>
        <p style="font-size: 0.88rem; max-width: 420px; line-height: 1.5;">
          Ask questions, upload study diagrams/PDFs, or paste problem screenshots. Your multimodal mentor adapts to your exact learning needs.
        </p>
      </div>
    `;
  }

  function appendUserBubble(text, timestamp, attachment) {
    if (!chatStream) return;
    const bubble = document.createElement('div');
    bubble.className = 'chat-bubble chat-bubble-user';
    const time = timestamp ? formatTimeAgo(timestamp) : 'Just now';

    let attachmentHtml = '';
    if (attachment) {
      if (attachment.type === 'image' || (attachment.base64 && attachment.base64.startsWith('data:image/'))) {
        attachmentHtml = `
          <div style="margin-bottom: 0.65rem;">
            <img src="${attachment.base64}" alt="Attached image" style="max-width: 240px; max-height: 180px; border-radius: 8px; object-fit: cover; display: block; border: 1px solid rgba(255,255,255,0.25);">
          </div>
        `;
      } else {
        attachmentHtml = `
          <div style="display: inline-flex; align-items: center; gap: 0.45rem; background: rgba(255,255,255,0.15); padding: 4px 10px; border-radius: 6px; font-size: 0.8rem; margin-bottom: 0.6rem;">
            <span>📄</span> <strong>${escapeHtml(attachment.name || 'Attached PDF Document')}</strong>
          </div>
        `;
      }
    }

    bubble.innerHTML = `
      <div class="chat-bubble-meta">
        <span>YOU</span> • <span>${time}</span>
      </div>
      ${attachmentHtml}
      <div>${escapeHtml(text)}</div>
    `;
    chatStream.appendChild(bubble);
    renderMath(bubble);
    scrollToBottom();
  }

  function appendMentorBubble(text, hint, mode, timestamp) {
    if (!chatStream) return;
    const bubble = document.createElement('div');
    bubble.className = 'chat-bubble chat-bubble-mentor';
    const time = timestamp ? formatTimeAgo(timestamp) : 'Just now';
    const modeLabel = (mode || 'socratic').toUpperCase().replace('_', ' ');

    let formattedText = formatMarkdown(text);

    let hintHtml = '';
    if (hint) {
      hintHtml = `
        <div class="hint-accordion-wrap">
          <button class="hint-toggle-btn" type="button">\uD83D\uDCA1 Need a Socratic Hint?</button>
          <div class="hint-content-box">
            <strong>Hint:</strong> ${formatMarkdown(hint)}
          </div>
        </div>
      `;
    }

    bubble.innerHTML = `
      <div class="chat-bubble-meta">
        <span>AI MENTOR</span> \u2022 <span>${modeLabel} MODE</span>
      </div>
      <div class="mentor-message-body">${formattedText}</div>
      ${hintHtml}
    `;

    // Bind hint toggle
    const hintBtn = bubble.querySelector('.hint-toggle-btn');
    if (hintBtn) {
      hintBtn.addEventListener('click', () => {
        hintBtn.parentElement.classList.toggle('open');
      });
    }

    chatStream.appendChild(bubble);
    renderMath(bubble);
    scrollToBottom();
  }

  function appendThinkingBubble() {
    if (!chatStream) return null;
    const bubble = document.createElement('div');
    bubble.className = 'chat-bubble chat-bubble-mentor thinking-bubble';
    const modeLabel = state.currentMode.toUpperCase().replace('_', ' ');
    bubble.innerHTML = `
      <div class="chat-bubble-meta">
        <span>AI MENTOR</span> \u2022 <span>${modeLabel} MODE</span>
      </div>
      <div class="mentor-thinking-row">
        <div class="thinking-dots">
          <span></span><span></span><span></span>
        </div>
        <span style="font-size: 0.8rem; color: var(--text-muted);">Thinking...</span>
      </div>
    `;
    chatStream.appendChild(bubble);
    scrollToBottom();
    return bubble;
  }

  function appendErrorBubble(text) {
    if (!chatStream) return;
    const bubble = document.createElement('div');
    bubble.className = 'chat-bubble chat-bubble-mentor';
    bubble.innerHTML = `
      <div class="chat-bubble-meta">
        <span>AI MENTOR</span> \u2022 <span>Error</span>
      </div>
      <div style="color: var(--rose-accent);">${escapeHtml(text)}</div>
      <button class="prompt-chip" style="margin-top: 0.5rem;" onclick="this.closest('.chat-bubble').remove();">Dismiss</button>
    `;
    chatStream.appendChild(bubble);
    scrollToBottom();
  }

  function showError(msg) {
    appendErrorBubble(msg);
  }

  function renderSuggestionChips(suggestions) {
    if (!promptChipsContainer) return;
    promptChipsContainer.innerHTML = suggestions.map(s =>
      `<button class="prompt-chip" type="button">${escapeHtml(s)}</button>`
    ).join('');

    promptChipsContainer.querySelectorAll('.prompt-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        if (userInput) userInput.value = chip.textContent.trim();
        sendMessage(chip.textContent.trim());
      });
    });
  }

  function syncModePills(mode) {
    if (!modePills) return;
    const modeMap = { 'socratic': 'SOCRATIC', 'deep': 'DEEP', 'deep_concept': 'DEEP', 'exam': 'EXAM', 'exam_solver': 'EXAM' };
    const target = modeMap[mode] || 'SOCRATIC';
    modePills.forEach(p => {
      p.classList.toggle('active', p.getAttribute('data-mode') === target);
    });
  }

  // =========================================================================
  // 9. UTILITIES
  // =========================================================================

  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function formatMarkdown(text) {
    if (!text) return '';

    // 1. Protect LaTeX blocks from markdown regex interference
    const mathTokens = [];
    let protectedText = text.replace(/(\$\$[\s\S]*?\$\$|\\\[[\s\S]*?\\\]|\$[^\$\n]+?\$|\\\([^\)]+?\\\))/g, (match) => {
      const token = `%%MATH_TOKEN_${mathTokens.length}%%`;
      mathTokens.push(match);
      return token;
    });

    // 2. Protect Code blocks
    const codeTokens = [];
    protectedText = protectedText.replace(/```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g, (match, lang, code) => {
      const token = `%%CODE_TOKEN_${codeTokens.length}%%`;
      codeTokens.push(`<pre><code class="language-${lang || 'text'}">${escapeHtml(code.trim())}</code></pre>`);
      return token;
    });

    const lines = protectedText.split('\n');
    const result = [];
    let inTable = false;
    let tableRows = [];
    let inUl = false;
    let inOl = false;
    let inBlockquote = false;
    let bqLines = [];

    function flushTable() {
      if (!inTable || tableRows.length === 0) return;
      let html = '<div class="table-wrapper"><table>';
      let hasHeader = false;
      let bodyRows = [];

      for (let i = 0; i < tableRows.length; i++) {
        const row = tableRows[i].trim();
        // Skip separator line |---|---|
        if (/^\|?[\s-:]+\|[\s-:|]+$/.test(row)) {
          hasHeader = true;
          continue;
        }
        const cells = row.split('|').map(c => c.trim()).filter((c, idx, arr) => {
          if ((idx === 0 || idx === arr.length - 1) && c === '') return false;
          return true;
        });

        if (!hasHeader && i === 0 && tableRows.length > 1 && /^\|?[\s-:]+\|[\s-:|]+$/.test(tableRows[1].trim())) {
          html += '<thead><tr>' + cells.map(c => `<th>${formatInline(c)}</th>`).join('') + '</tr></thead>';
        } else {
          bodyRows.push('<tr>' + cells.map(c => `<td>${formatInline(c)}</td>`).join('') + '</tr>');
        }
      }

      if (bodyRows.length > 0) {
        html += '<tbody>' + bodyRows.join('') + '</tbody>';
      }
      html += '</table></div>';
      result.push(html);
      inTable = false;
      tableRows = [];
    }

    function flushLists() {
      if (inUl) { result.push('</ul>'); inUl = false; }
      if (inOl) { result.push('</ol>'); inOl = false; }
    }

    function flushBlockquote() {
      if (inBlockquote && bqLines.length > 0) {
        result.push(`<blockquote>${bqLines.map(l => formatInline(l)).join('<br>')}</blockquote>`);
        inBlockquote = false;
        bqLines = [];
      }
    }

    function formatInline(str) {
      return str
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        .replace(/`([^`]+)`/g, '<code>$1</code>');
    }

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      // Check Table
      if (trimmed.startsWith('|') && trimmed.endsWith('|') && trimmed.includes('|')) {
        flushLists();
        flushBlockquote();
        inTable = true;
        tableRows.push(trimmed);
        continue;
      } else if (inTable) {
        flushTable();
      }

      // Check Horizontal Divider
      if (/^(\*{3,}|-{3,}|_{3,})$/.test(trimmed)) {
        flushLists();
        flushBlockquote();
        result.push('<hr class="mentor-divider">');
        continue;
      }

      // Check Headings
      if (trimmed.startsWith('#### ')) {
        flushLists(); flushBlockquote();
        result.push(`<h4>${formatInline(trimmed.substring(5))}</h4>`);
        continue;
      } else if (trimmed.startsWith('### ')) {
        flushLists(); flushBlockquote();
        result.push(`<h3>${formatInline(trimmed.substring(4))}</h3>`);
        continue;
      } else if (trimmed.startsWith('## ')) {
        flushLists(); flushBlockquote();
        result.push(`<h2>${formatInline(trimmed.substring(3))}</h2>`);
        continue;
      } else if (trimmed.startsWith('# ')) {
        flushLists(); flushBlockquote();
        result.push(`<h2>${formatInline(trimmed.substring(2))}</h2>`);
        continue;
      }

      // Check Blockquote
      if (trimmed.startsWith('> ')) {
        flushLists();
        inBlockquote = true;
        bqLines.push(trimmed.substring(2));
        continue;
      } else if (inBlockquote) {
        flushBlockquote();
      }

      // Check Unordered list
      const ulMatch = trimmed.match(/^[-*•]\s+(.*)$/);
      if (ulMatch) {
        if (inOl) { result.push('</ol>'); inOl = false; }
        if (!inUl) { result.push('<ul>'); inUl = true; }
        result.push(`<li>${formatInline(ulMatch[1])}</li>`);
        continue;
      }

      // Check Ordered list
      const olMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
      if (olMatch) {
        if (inUl) { result.push('</ul>'); inUl = false; }
        if (!inOl) { result.push('<ol>'); inOl = true; }
        result.push(`<li>${formatInline(olMatch[2])}</li>`);
        continue;
      }

      // Plain line
      flushLists();
      flushBlockquote();

      if (trimmed === '') {
        result.push('<div style="height: 0.4rem;"></div>');
      } else {
        result.push(`<p>${formatInline(trimmed)}</p>`);
      }
    }

    flushTable();
    flushLists();
    flushBlockquote();

    let finalHtml = result.join('');

    // Restore Code tokens
    for (let i = 0; i < codeTokens.length; i++) {
      finalHtml = finalHtml.replace(`%%CODE_TOKEN_${i}%%`, codeTokens[i]);
    }

    // Restore Math tokens
    for (let i = 0; i < mathTokens.length; i++) {
      finalHtml = finalHtml.replace(`%%MATH_TOKEN_${i}%%`, mathTokens[i]);
    }

    return finalHtml;
  }

  function formatTimeAgo(isoStr) {
    if (!isoStr) return '';
    try {
      const date = new Date(isoStr + (isoStr.endsWith('Z') ? '' : 'Z'));
      const now = new Date();
      const diffMs = now - date;
      const diffMin = Math.floor(diffMs / 60000);
      if (diffMin < 1) return 'Just now';
      if (diffMin < 60) return `${diffMin}m ago`;
      const diffHr = Math.floor(diffMin / 60);
      if (diffHr < 24) return `${diffHr}h ago`;
      const diffDay = Math.floor(diffHr / 24);
      if (diffDay < 7) return `${diffDay}d ago`;
      return date.toLocaleDateString();
    } catch { return ''; }
  }

  function renderMath(container) {
    if (typeof renderMathInElement === 'function') {
      try {
        renderMathInElement(container, {
          delimiters: [
            { left: '$$', right: '$$', display: true },
            { left: '$', right: '$', display: false },
            { left: '\\[', right: '\\]', display: true },
            { left: '\\(', right: '\\)', display: false }
          ],
          throwOnError: false
        });
      } catch (e) {
        console.warn('KaTeX render:', e);
      }
    }
  }

  function scrollToBottom() {
    if (chatStream) {
      chatStream.scrollTop = chatStream.scrollHeight;
    }
  }

  // =========================================================================
  // 10. VOICE DICTATION
  // =========================================================================
  let isRecognizingVoice = false;
  let recognition = null;

  function toggleVoiceDictation() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { alert('Voice dictation requires Chrome, Edge, or Safari.'); return; }

    if (isRecognizingVoice) {
      recognition?.stop();
      isRecognizingVoice = false;
      if (voiceBtn) voiceBtn.classList.remove('listening');
      return;
    }

    recognition = new SR();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      isRecognizingVoice = true;
      if (voiceBtn) voiceBtn.classList.add('listening');
      if (userInput) userInput.placeholder = 'Listening... Speak now!';
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      if (userInput) {
        userInput.value = (userInput.value ? userInput.value + ' ' : '') + transcript;
        userInput.focus();
      }
    };

    recognition.onerror = recognition.onend = () => {
      isRecognizingVoice = false;
      if (voiceBtn) voiceBtn.classList.remove('listening');
      if (userInput) userInput.placeholder = 'Ask anything, upload diagrams/notes, or paste screenshots...';
    };

    recognition.start();
  }

  // =========================================================================
  // 11. EVENT BINDING
  // =========================================================================
  function bindEvents() {
    // Mode selector pills
    if (modePills) {
      modePills.forEach(pill => {
        pill.addEventListener('click', () => {
          modePills.forEach(p => p.classList.remove('active'));
          pill.classList.add('active');
          const rawMode = pill.getAttribute('data-mode') || 'SOCRATIC';
          state.currentMode = rawMode.toLowerCase().replace('_concept', '').replace('_solver', '');

          // Update conversation mode if active
          if (state.activeConversationId) {
            apiCall(`/conversations/${state.activeConversationId}`, 'PATCH', { mode: state.currentMode });
          }
          loadSuggestions();
        });
      });
    }

    // Form submission
    if (chatForm) {
      chatForm.addEventListener('submit', (e) => {
        e.preventDefault();
        sendMessage(userInput?.value);
      });
    }

    // Enter key
    if (userInput) {
      userInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          sendMessage(userInput.value);
        }
      });
    }

    // New conversation button
    if (newConvBtn) {
      newConvBtn.addEventListener('click', async () => {
        state.activeConversationId = null;
        if (chatStream) chatStream.innerHTML = '';
        if (convTitleEl) convTitleEl.textContent = 'New Conversation';
        if (convSubjectEl) convSubjectEl.textContent = 'AI MENTOR';
        renderEmptyState();
        highlightActiveThread(null);
        loadSuggestions();
      });
    }

    // Search conversations
    if (searchInput) {
      let searchTimeout;
      searchInput.addEventListener('input', () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => loadConversations(searchInput.value.trim()), 300);
      });
    }

    // Voice
    if (voiceBtn) {
      voiceBtn.addEventListener('click', toggleVoiceDictation);
    }

    // File attachment input change
    if (fileInput) {
      fileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files.length > 0) {
          handleFileUpload(e.target.files[0]);
        }
      });
    }

    // File attachment button trigger
    if (attachBtn && fileInput) {
      attachBtn.addEventListener('click', (e) => {
        e.preventDefault();
        fileInput.click();
      });
    }

    // Drag and Drop files onto chat
    [chatStream, chatForm].forEach(dropArea => {
      if (!dropArea) return;
      dropArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropArea.style.opacity = '0.85';
      });
      dropArea.addEventListener('dragleave', () => {
        dropArea.style.opacity = '1';
      });
      dropArea.addEventListener('drop', (e) => {
        e.preventDefault();
        dropArea.style.opacity = '1';
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
          handleFileUpload(e.dataTransfer.files[0]);
        }
      });
    });

    // Clipboard paste for screenshots and images
    window.addEventListener('paste', (e) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].kind === 'file') {
          const file = items[i].getAsFile();
          if (file) {
            handleFileUpload(file);
            break;
          }
        }
      }
    });

    // Existing hint toggles in static HTML
    document.querySelectorAll('.hint-toggle-btn').forEach(btn => {
      btn.addEventListener('click', () => btn.parentElement.classList.toggle('open'));
    });
  }

  // =========================================================================
  // 12. INITIALIZATION
  // =========================================================================
  async function initMentor() {
    if (!document.getElementById('mentor-chat-stream')) return;

    initElements();
    bindEvents();

    // Load preferences
    await loadPreferences();

    // Load conversations
    await loadConversations();

    // If there are conversations, load the most recent one
    if (state.conversations.length > 0) {
      await loadConversation(state.conversations[0].id);
    } else {
      renderEmptyState();
    }

    // Load initial suggestions
    loadSuggestions();

    // Render math in any existing static content
    if (chatStream) renderMath(chatStream);

    // Support incoming prompt from Learning Genome (?q=...)
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const incomingPrompt = urlParams.get('q');
      if (incomingPrompt && userInput) {
        userInput.value = incomingPrompt;
        userInput.focus();
        userInput.dispatchEvent(new Event('input'));
      }
    } catch (e) {
      console.warn('[AI Mentor] URL prompt parse error:', e);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMentor);
  } else {
    initMentor();
  }

})();
