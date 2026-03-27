(function () {
  'use strict';

  var config = window.BotForgeConfig || {};
  var API_KEY = config.apiKey || '';
  var BOT_ID = config.botId || '';
  var BASE_URL = (config.baseUrl || '').replace(/\/$/, '');
  var ACCENT = config.color || '#4F46E5';
  var PROACTIVE_DELAY = typeof config.proactiveDelay === 'number' ? config.proactiveDelay : 0;
  var QUICK_REPLIES = Array.isArray(config.quickReplies) ? config.quickReplies : [];
  var BOT_NAME = config.botName || 'Chat with us';
  var EXIT_MESSAGE = config.exitMessage || "Wait! Got any questions before you go? I'm here to help. 👋";
  var VISITOR_KEY = 'bf_visitor_' + BOT_ID;

  if (!API_KEY || !BOT_ID) {
    console.warn('[BotForge] Missing apiKey or botId in window.BotForgeConfig');
    return;
  }

  // ── Simple markdown parser ───────────────────────────────────────────────────
  function renderMarkdown(text) {
    if (!text) return '';
    // Escape HTML
    var escaped = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Code blocks ```...```
    escaped = escaped.replace(/```([\s\S]*?)```/g, '<pre style="background:#f1f3f5;padding:8px;border-radius:6px;overflow-x:auto;font-size:12px;margin:4px 0"><code>$1</code></pre>');
    // Inline code `...`
    escaped = escaped.replace(/`([^`]+)`/g, '<code style="background:#f1f3f5;padding:2px 5px;border-radius:3px;font-size:12px">$1</code>');
    // Bold **...**
    escaped = escaped.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    // Italic *...*
    escaped = escaped.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    // Unordered lists - item
    escaped = escaped.replace(/^[\s]*[-*]\s+(.+)$/gm, '<li style="margin-left:16px;margin-bottom:2px">$1</li>');
    // Numbered lists
    escaped = escaped.replace(/^[\s]*\d+\.\s+(.+)$/gm, '<li style="margin-left:16px;margin-bottom:2px">$1</li>');
    // Wrap consecutive <li> items
    escaped = escaped.replace(/(<li[^>]*>.*<\/li>\n?)+/g, function(m) { return '<ul style="padding:0;margin:4px 0;list-style:disc">' + m + '</ul>'; });
    // Line breaks
    escaped = escaped.replace(/\n/g, '<br>');

    return escaped;
  }

  // ── Session persistence ──────────────────────────────────────────────────────
  var STORAGE_KEY = 'bf_session_' + BOT_ID;

  function saveSession(sessionId, messages) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ sessionId: sessionId, messages: messages, ts: Date.now() }));
    } catch (e) {}
  }

  function loadSession() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      var data = JSON.parse(raw);
      // Expire sessions older than 24 hours
      if (Date.now() - data.ts > 86400000) { localStorage.removeItem(STORAGE_KEY); return null; }
      return data;
    } catch (e) { return null; }
  }

  function clearSession() {
    try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
  }

  // ── Visitor profile (persists across sessions) ───────────────────────────────
  function saveVisitor(name, email) {
    try { localStorage.setItem(VISITOR_KEY, JSON.stringify({ name: name, email: email })); } catch (e) {}
  }

  function loadVisitor() {
    try {
      var raw = localStorage.getItem(VISITOR_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }

  // ── Styles ───────────────────────────────────────────────────────────────────
  var style = document.createElement('style');
  style.textContent = [
    '#bf-btn{position:fixed;bottom:24px;right:24px;width:56px;height:56px;border-radius:50%;background:' + ACCENT + ';border:none;cursor:pointer;box-shadow:0 4px 16px rgba(0,0,0,.25);display:flex;align-items:center;justify-content:center;z-index:99999;transition:transform .2s;}',
    '#bf-btn:hover{transform:scale(1.1);}',
    '#bf-btn svg{width:28px;height:28px;fill:#fff;transition:opacity .2s;}',
    '#bf-win{position:fixed;bottom:90px;right:24px;width:370px;height:560px;background:#fff;border-radius:16px;box-shadow:0 8px 32px rgba(0,0,0,.18);display:none;flex-direction:column;z-index:99998;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;overflow:hidden;}',
    '#bf-win.bf-open{display:flex;}',
    '#bf-head{background:' + ACCENT + ';padding:14px 18px;display:flex;align-items:center;gap:10px;}',
    '#bf-avatar{width:32px;height:32px;border-radius:50%;background:rgba(255,255,255,.25);display:flex;align-items:center;justify-content:center;flex-shrink:0;}',
    '#bf-avatar svg{width:18px;height:18px;fill:#fff;}',
    '#bf-head-info{flex:1;}',
    '#bf-head-name{color:#fff;font-weight:600;font-size:14px;line-height:1.2;}',
    '#bf-head-status{color:rgba(255,255,255,.7);font-size:11px;}',
    '#bf-close{background:none;border:none;cursor:pointer;color:rgba(255,255,255,.7);font-size:20px;line-height:1;padding:0;margin-left:auto;}',
    '#bf-close:hover{color:#fff;}',
    '#bf-msgs{flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:10px;}',
    '.bf-msg{max-width:82%;padding:10px 14px;border-radius:14px;font-size:14px;line-height:1.6;word-wrap:break-word;}',
    '.bf-bot{background:#f1f3f5;color:#1a1a2e;border-bottom-left-radius:4px;align-self:flex-start;}',
    '.bf-user{background:' + ACCENT + ';color:#fff;border-bottom-right-radius:4px;align-self:flex-end;}',
    '.bf-typing{display:flex;gap:4px;align-items:center;padding:10px 14px;}',
    '.bf-dot{width:7px;height:7px;border-radius:50%;background:#aaa;animation:bf-bounce .9s infinite;}',
    '.bf-dot:nth-child(2){animation-delay:.15s;}',
    '.bf-dot:nth-child(3){animation-delay:.3s;}',
    '@keyframes bf-bounce{0%,60%,100%{transform:translateY(0);}30%{transform:translateY(-6px);}}',
    '#bf-quick-replies{display:flex;flex-wrap:wrap;gap:6px;padding:8px 16px;}',
    '.bf-qr{background:#fff;border:1.5px solid ' + ACCENT + ';color:' + ACCENT + ';border-radius:20px;padding:5px 12px;font-size:13px;cursor:pointer;transition:all .15s;}',
    '.bf-qr:hover{background:' + ACCENT + ';color:#fff;}',
    '#bf-lead-form{padding:14px 16px;background:#f9fafb;border-top:1px solid #eee;font-size:13px;}',
    '#bf-lead-form p{margin:0 0 8px;color:#374151;font-weight:500;}',
    '.bf-lead-input{width:100%;border:1px solid #ddd;border-radius:8px;padding:7px 10px;font-size:13px;box-sizing:border-box;margin-bottom:6px;outline:none;}',
    '.bf-lead-input:focus{border-color:' + ACCENT + ';}',
    '.bf-lead-btns{display:flex;gap:6px;}',
    '.bf-lead-submit{background:' + ACCENT + ';color:#fff;border:none;border-radius:8px;padding:7px 14px;font-size:13px;cursor:pointer;flex:1;}',
    '.bf-lead-skip{background:none;color:#6b7280;border:1px solid #ddd;border-radius:8px;padding:7px 14px;font-size:13px;cursor:pointer;}',
    '#bf-form{display:flex;padding:10px 12px;border-top:1px solid #eee;gap:8px;align-items:flex-end;}',
    '#bf-input{flex:1;border:1px solid #ddd;border-radius:20px;padding:8px 14px;font-size:14px;outline:none;resize:none;max-height:100px;line-height:1.4;}',
    '#bf-input:focus{border-color:' + ACCENT + ';}',
    '#bf-send{background:' + ACCENT + ';border:none;border-radius:50%;width:38px;height:38px;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;}',
    '#bf-send:hover{opacity:.9;}',
    '#bf-send svg{width:16px;height:16px;fill:#fff;}',
    '.bf-sources{margin-top:6px;display:flex;flex-wrap:wrap;gap:4px;}',
    '.bf-source-link{font-size:11px;color:' + ACCENT + ';text-decoration:none;background:rgba(79,70,229,.08);border-radius:10px;padding:2px 8px;white-space:nowrap;}',
    '.bf-source-link:hover{background:rgba(79,70,229,.16);}',
    '@media(max-width:420px){#bf-win{width:calc(100vw - 16px);right:8px;bottom:80px;height:calc(100vh - 110px);}}'
  ].join('');
  document.head.appendChild(style);

  // ── HTML ─────────────────────────────────────────────────────────────────────
  var container = document.createElement('div');
  container.innerHTML =
    '<button id="bf-btn" title="Chat with us">' +
      '<svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>' +
    '</button>' +
    '<div id="bf-win">' +
      '<div id="bf-head">' +
        '<div id="bf-avatar"><svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg></div>' +
        '<div id="bf-head-info"><div id="bf-head-name">' + BOT_NAME + '</div><div id="bf-head-status">Online</div></div>' +
        '<button id="bf-close">&#x2715;</button>' +
      '</div>' +
      '<div id="bf-msgs"></div>' +
      '<div id="bf-quick-replies"></div>' +
      '<div id="bf-lead-form" style="display:none">' +
        '<p>Leave your contact details and we\'ll follow up:</p>' +
        '<input class="bf-lead-input" id="bf-lead-name" placeholder="Your name">' +
        '<input class="bf-lead-input" id="bf-lead-email" placeholder="Email address" type="email">' +
        '<div class="bf-lead-btns">' +
          '<button class="bf-lead-submit" id="bf-lead-submit">Submit</button>' +
          '<button class="bf-lead-skip" id="bf-lead-skip">Skip</button>' +
        '</div>' +
      '</div>' +
      '<div id="bf-form">' +
        '<textarea id="bf-input" rows="1" placeholder="Type a message..."></textarea>' +
        '<button id="bf-send"><svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg></button>' +
      '</div>' +
    '</div>';
  document.body.appendChild(container);

  var btn = document.getElementById('bf-btn');
  var win = document.getElementById('bf-win');
  var closeBtn = document.getElementById('bf-close');
  var msgs = document.getElementById('bf-msgs');
  var input = document.getElementById('bf-input');
  var sendBtn = document.getElementById('bf-send');
  var quickRepliesEl = document.getElementById('bf-quick-replies');
  var leadForm = document.getElementById('bf-lead-form');
  var leadNameInput = document.getElementById('bf-lead-name');
  var leadEmailInput = document.getElementById('bf-lead-email');
  var leadSubmitBtn = document.getElementById('bf-lead-submit');
  var leadSkipBtn = document.getElementById('bf-lead-skip');
  var headName = document.getElementById('bf-head-name');

  var sessionId = null;
  var isOpen = false;
  var initialized = false;
  var chatHistory = [];
  var visitor = loadVisitor();

  // ── Session restore ───────────────────────────────────────────────────────────
  var savedSession = loadSession();
  if (savedSession) {
    sessionId = savedSession.sessionId;
    chatHistory = savedSession.messages || [];
  }

  // ── Toggle ───────────────────────────────────────────────────────────────────
  function toggle() {
    isOpen = !isOpen;
    win.classList.toggle('bf-open', isOpen);
    if (isOpen) {
      if (!initialized) {
        initialized = true;
        if (sessionId && chatHistory.length > 0) {
          restoreHistory();
        } else {
          startSession();
        }
      }
      setTimeout(function () { input.focus(); }, 100);
    }
  }

  btn.addEventListener('click', toggle);
  closeBtn.addEventListener('click', toggle);

  // ── Restore chat history ──────────────────────────────────────────────────────
  function restoreHistory() {
    chatHistory.forEach(function (m) {
      addMsg(m.content, m.role, true);
    });
  }

  // ── Start session ────────────────────────────────────────────────────────────
  function startSession() {
    addTyping();
    var body = { botId: BOT_ID, channel: 'widget' };
    if (visitor) { body.visitorName = visitor.name; body.visitorEmail = visitor.email; }
    fetch(BASE_URL + '/api/v1/chat/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + API_KEY },
      body: JSON.stringify(body)
    })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        removeTyping();
        if (data.data) {
          sessionId = data.data.sessionId;
          if (data.data.botName) { headName.textContent = data.data.botName; BOT_NAME = data.data.botName; }
          var greeting;
          if (visitor && visitor.name) {
            greeting = 'Welcome back, ' + visitor.name + '! 👋 How can I help you today?';
          } else {
            greeting = data.data.welcomeMessage || 'Hi! How can I help you today?';
          }
          addMsg(greeting, 'bot');
          chatHistory.push({ role: 'bot', content: greeting });
          saveSession(sessionId, chatHistory);
          showQuickReplies();
        }
      })
      .catch(function () {
        removeTyping();
        var greeting = visitor && visitor.name ? 'Welcome back, ' + visitor.name + '! 👋 How can I help?' : 'Hi! How can I help you today?';
        addMsg(greeting, 'bot');
        showQuickReplies();
      });
  }

  // ── Quick replies ────────────────────────────────────────────────────────────
  function showQuickReplies() {
    if (!QUICK_REPLIES.length) return;
    quickRepliesEl.innerHTML = '';
    QUICK_REPLIES.forEach(function (text) {
      var btn = document.createElement('button');
      btn.className = 'bf-qr';
      btn.textContent = text;
      btn.addEventListener('click', function () {
        quickRepliesEl.innerHTML = '';
        sendMessage(text);
      });
      quickRepliesEl.appendChild(btn);
    });
  }

  // ── Send ─────────────────────────────────────────────────────────────────────
  function send() {
    var text = input.value.trim();
    if (!text) return;
    input.value = '';
    input.style.height = 'auto';
    quickRepliesEl.innerHTML = '';
    sendMessage(text);
  }

  function sendMessage(text) {
    if (!sessionId) return;
    addMsg(text, 'user');
    chatHistory.push({ role: 'user', content: text });
    addTyping();

    fetch(BASE_URL + '/api/v1/chat/message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + API_KEY },
      body: JSON.stringify({ sessionId: sessionId, message: text })
    })
      .then(function (res) {
        removeTyping();
        var botEl = addMsg('', 'bot');
        var reader = res.body.getReader();
        var decoder = new TextDecoder();
        var buffer = '';
        var fullText = '';

        function read() {
          reader.read().then(function (result) {
            if (result.done) {
              if (fullText) {
                chatHistory.push({ role: 'bot', content: fullText });
                saveSession(sessionId, chatHistory);
              }
              return;
            }
            buffer += decoder.decode(result.value, { stream: true });
            var lines = buffer.split('\n');
            buffer = lines.pop();
            lines.forEach(function (line) {
              if (!line.startsWith('data:')) return;
              var json = line.replace(/^data:\s*/, '');
              if (!json) return;
              try {
                var evt = JSON.parse(json);
                if (evt.token) {
                  fullText += evt.token;
                  botEl.innerHTML = renderMarkdown(fullText);
                  msgs.scrollTop = msgs.scrollHeight;
                }
                if (evt.type === 'done') {
                  if (evt.lead_prompt) {
                    setTimeout(function () { leadForm.style.display = 'block'; }, 500);
                  }
                  if (evt.sources && evt.sources.length > 0) {
                    addSources(botEl, evt.sources);
                  }
                }
              } catch (e) {}
            });
            read();
          });
        }
        read();
      })
      .catch(function () {
        removeTyping();
        addMsg('Sorry, something went wrong. Please try again.', 'bot');
      });
  }

  // ── Lead form ────────────────────────────────────────────────────────────────
  leadSubmitBtn.addEventListener('click', function () {
    var name = leadNameInput.value.trim();
    var email = leadEmailInput.value.trim();
    if (!name && !email) return;
    fetch(BASE_URL + '/api/v1/chat/' + sessionId + '/lead', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + API_KEY },
      body: JSON.stringify({ fullName: name, email: email })
    }).catch(function () {});
    // Save visitor profile so next visit shows returning greeting
    if (name || email) saveVisitor(name, email);
    visitor = { name: name, email: email };
    leadForm.style.display = 'none';
    addMsg('Thanks ' + (name ? name : '') + '! We\'ll be in touch soon. 😊', 'bot');
  });

  leadSkipBtn.addEventListener('click', function () {
    leadForm.style.display = 'none';
  });

  // ── Input handlers ───────────────────────────────────────────────────────────
  sendBtn.addEventListener('click', send);
  input.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  });
  input.addEventListener('input', function () {
    this.style.height = 'auto';
    this.style.height = Math.min(this.scrollHeight, 100) + 'px';
  });

  // ── Helpers ──────────────────────────────────────────────────────────────────
  function addMsg(text, who, isHtml) {
    var el = document.createElement('div');
    el.className = 'bf-msg bf-' + who;
    if (who === 'bot') {
      el.innerHTML = isHtml ? text : renderMarkdown(text);
    } else {
      el.textContent = text;
    }
    msgs.appendChild(el);
    msgs.scrollTop = msgs.scrollHeight;
    return el;
  }

  function addTyping() {
    var el = document.createElement('div');
    el.id = 'bf-typing';
    el.className = 'bf-msg bf-bot bf-typing';
    el.innerHTML = '<div class="bf-dot"></div><div class="bf-dot"></div><div class="bf-dot"></div>';
    msgs.appendChild(el);
    msgs.scrollTop = msgs.scrollHeight;
  }

  function removeTyping() {
    var t = document.getElementById('bf-typing');
    if (t) t.remove();
  }

  function addSources(botEl, sources) {
    var div = document.createElement('div');
    div.className = 'bf-sources';
    sources.forEach(function (s) {
      if (!s.url) return;
      var a = document.createElement('a');
      a.className = 'bf-source-link';
      a.href = s.url;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.textContent = '📄 ' + (s.title || s.url);
      div.appendChild(a);
    });
    if (div.children.length > 0) {
      botEl.parentNode.insertBefore(div, botEl.nextSibling);
      msgs.scrollTop = msgs.scrollHeight;
    }
  }

  // ── Proactive trigger ─────────────────────────────────────────────────────────
  if (PROACTIVE_DELAY > 0 && !savedSession) {
    setTimeout(function () {
      if (!isOpen) toggle();
    }, PROACTIVE_DELAY * 1000);
  }

  // ── Exit intent detection ─────────────────────────────────────────────────────
  var exitTriggered = false;
  document.addEventListener('mouseleave', function (e) {
    // Only trigger when mouse moves toward top of page (exiting browser tab)
    if (e.clientY > 20) return;
    if (exitTriggered || isOpen) return;
    exitTriggered = true;
    toggle();
    // Wait for chat to open and session to init, then show exit message
    setTimeout(function () {
      if (initialized && sessionId) {
        addMsg(EXIT_MESSAGE, 'bot');
        chatHistory.push({ role: 'bot', content: EXIT_MESSAGE });
        saveSession(sessionId, chatHistory);
      }
    }, 800);
  });
})();
