/**
 * Qbot Embeddable Chat Widget
 * Usage:
 *   <script>
 *     window.QbotConfig = { apiKey: "bf_live_xxx", botId: "uuid" };
 *   </script>
 *   <script src="http://yourserver/widget/botforge-widget.min.js" async></script>
 */

declare global {
  interface Window {
    QbotConfig: QbotConfig;
  }
}

interface QbotConfig {
  apiKey: string;
  botId?: string;
  baseUrl?: string;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

class QbotWidget {
  private config: QbotConfig;
  private sessionId: string | null = null;
  private messages: Message[] = [];
  private isOpen: boolean = false;
  private isTyping: boolean = false;
  private messageCount: number = 0;
  private leadCaptured: boolean = false;

  // DOM references
  private shadow: ShadowRoot | null = null;
  private container: HTMLElement | null = null;
  private chatPanel: HTMLElement | null = null;
  private messagesContainer: HTMLElement | null = null;
  private inputEl: HTMLInputElement | null = null;
  private bubble: HTMLElement | null = null;

  constructor(config: QbotConfig) {
    this.config = {
      baseUrl: window.location.origin,
      ...config,
    };
    this.sessionId = localStorage.getItem('bf_session_' + config.apiKey);
  }

  private get apiHeaders(): HeadersInit {
    return {
      'Content-Type': 'application/json',
      'X-API-Key': this.config.apiKey,
    };
  }

  private get baseUrl(): string {
    return this.config.baseUrl || window.location.origin;
  }

  async init(): Promise<void> {
    this.render();
    this.bindEvents();
    if (!this.sessionId) {
      await this.startSession();
    }
  }

  private render(): void {
    this.container = document.createElement('div');
    this.container.id = 'botforge-widget-root';
    this.shadow = this.container.attachShadow({ mode: 'open' });
    document.body.appendChild(this.container);

    this.shadow.innerHTML = this.getTemplate();
    this.bubble = this.shadow.getElementById('bf-bubble');
    this.chatPanel = this.shadow.getElementById('bf-panel');
    this.messagesContainer = this.shadow.getElementById('bf-messages');
    this.inputEl = this.shadow.getElementById('bf-input') as HTMLInputElement;
  }

  private getTemplate(): string {
    return `
      <style>
        :host { all: initial; }
        * { box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }

        #bf-bubble {
          position: fixed; bottom: 24px; right: 24px; width: 56px; height: 56px;
          background: #4F46E5; border-radius: 50%; cursor: pointer; z-index: 999999;
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 4px 16px rgba(79,70,229,0.4);
          transition: transform 0.2s, box-shadow 0.2s;
        }
        #bf-bubble:hover { transform: scale(1.1); box-shadow: 0 6px 20px rgba(79,70,229,0.5); }
        #bf-bubble svg { width: 24px; height: 24px; fill: white; }

        #bf-panel {
          position: fixed; bottom: 92px; right: 24px; width: 360px; height: 540px;
          background: white; border-radius: 16px; z-index: 999998;
          box-shadow: 0 8px 40px rgba(0,0,0,0.15);
          display: flex; flex-direction: column; overflow: hidden;
          transition: opacity 0.3s, transform 0.3s;
          opacity: 0; transform: translateY(20px) scale(0.95); pointer-events: none;
        }
        #bf-panel.open { opacity: 1; transform: translateY(0) scale(1); pointer-events: all; }

        #bf-header {
          background: #4F46E5; color: white; padding: 16px 20px;
          display: flex; align-items: center; gap: 12px;
        }
        #bf-header .avatar {
          width: 36px; height: 36px; background: rgba(255,255,255,0.2);
          border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 18px;
        }
        #bf-header .info { flex: 1; }
        #bf-header .name { font-weight: 600; font-size: 15px; }
        #bf-header .status { font-size: 12px; opacity: 0.8; }

        #bf-messages {
          flex: 1; padding: 16px; overflow-y: auto; display: flex;
          flex-direction: column; gap: 10px; background: #f9fafb;
        }

        .bf-msg { max-width: 82%; padding: 10px 14px; border-radius: 12px; font-size: 14px; line-height: 1.5; word-wrap: break-word; }
        .bf-msg.user { background: #4F46E5; color: white; align-self: flex-end; border-bottom-right-radius: 4px; }
        .bf-msg.assistant { background: white; color: #111827; align-self: flex-start;
          border-bottom-left-radius: 4px; box-shadow: 0 1px 4px rgba(0,0,0,0.08); }

        .bf-typing { display: flex; gap: 4px; align-items: center; padding: 10px 14px;
          background: white; border-radius: 12px; border-bottom-left-radius: 4px;
          align-self: flex-start; box-shadow: 0 1px 4px rgba(0,0,0,0.08); }
        .bf-typing span { width: 8px; height: 8px; background: #9CA3AF; border-radius: 50%; animation: bounce 1.2s infinite; }
        .bf-typing span:nth-child(2) { animation-delay: 0.2s; }
        .bf-typing span:nth-child(3) { animation-delay: 0.4s; }
        @keyframes bounce { 0%,60%,100% { transform: translateY(0); } 30% { transform: translateY(-6px); } }

        #bf-lead-form {
          background: white; border-top: 1px solid #e5e7eb; padding: 14px 16px;
          display: none; flex-direction: column; gap: 8px;
        }
        #bf-lead-form.show { display: flex; }
        #bf-lead-form p { font-size: 13px; color: #374151; margin: 0 0 4px; }
        #bf-lead-form input {
          border: 1px solid #D1D5DB; border-radius: 8px; padding: 8px 12px;
          font-size: 13px; outline: none; transition: border-color 0.2s;
        }
        #bf-lead-form input:focus { border-color: #4F46E5; }
        #bf-lead-submit {
          background: #4F46E5; color: white; border: none; padding: 9px;
          border-radius: 8px; cursor: pointer; font-size: 13px; font-weight: 500;
        }

        #bf-footer {
          padding: 12px 16px; border-top: 1px solid #e5e7eb;
          display: flex; gap: 8px; align-items: center; background: white;
        }
        #bf-input {
          flex: 1; border: 1px solid #D1D5DB; border-radius: 8px; padding: 9px 12px;
          font-size: 14px; outline: none; transition: border-color 0.2s;
        }
        #bf-input:focus { border-color: #4F46E5; }
        #bf-send {
          background: #4F46E5; border: none; width: 36px; height: 36px; border-radius: 8px;
          cursor: pointer; display: flex; align-items: center; justify-content: center;
          transition: background 0.2s;
        }
        #bf-send:hover { background: #4338CA; }
        #bf-send svg { width: 16px; height: 16px; fill: white; }

        @media (max-width: 480px) {
          #bf-panel { width: calc(100vw - 16px); height: calc(100vh - 100px); bottom: 80px; right: 8px; }
        }
      </style>

      <div id="bf-bubble" title="Chat with us">
        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
        </svg>
      </div>

      <div id="bf-panel">
        <div id="bf-header">
          <div class="avatar">🤖</div>
          <div class="info">
            <div class="name">AI Assistant</div>
            <div class="status">● Online</div>
          </div>
        </div>

        <div id="bf-messages"></div>

        <div id="bf-lead-form">
          <p>May I get your contact details to follow up?</p>
          <input id="bf-lead-name" type="text" placeholder="Your name" />
          <input id="bf-lead-email" type="email" placeholder="Email address" />
          <input id="bf-lead-phone" type="tel" placeholder="Phone (optional)" />
          <button id="bf-lead-submit">Submit</button>
        </div>

        <div id="bf-footer">
          <input id="bf-input" type="text" placeholder="Type a message..." />
          <button id="bf-send">
            <svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
          </button>
        </div>
      </div>
    `;
  }

  private bindEvents(): void {
    this.bubble?.addEventListener('click', () => this.togglePanel());

    this.shadow?.getElementById('bf-send')?.addEventListener('click', () => this.sendMessage());

    this.inputEl?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });

    this.shadow?.getElementById('bf-lead-submit')?.addEventListener('click', () => this.submitLead());
  }

  private togglePanel(): void {
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      this.chatPanel?.classList.add('open');
      this.inputEl?.focus();
    } else {
      this.chatPanel?.classList.remove('open');
    }
  }

  private async startSession(): Promise<void> {
    try {
      const resp = await fetch(`${this.baseUrl}/api/v1/chat/start`, {
        method: 'POST',
        headers: this.apiHeaders,
        body: JSON.stringify({ botId: this.config.botId, channel: 'web' }),
      });
      const data = await resp.json();
      if (data.success && data.data) {
        this.sessionId = data.data.sessionId;
        localStorage.setItem('bf_session_' + this.config.apiKey, this.sessionId!);
        if (data.data.welcomeMessage) {
          this.appendMessage('assistant', data.data.welcomeMessage);
        }
      }
    } catch (e) {
      console.error('[Qbot] Failed to start session:', e);
    }
  }

  private async sendMessage(): Promise<void> {
    const text = this.inputEl?.value?.trim();
    if (!text || this.isTyping || !this.sessionId) return;

    this.inputEl!.value = '';
    this.appendMessage('user', text);
    this.messageCount++;
    this.showTyping();

    try {
      const resp = await fetch(`${this.baseUrl}/api/v1/chat/message`, {
        method: 'POST',
        headers: this.apiHeaders,
        body: JSON.stringify({ sessionId: this.sessionId, message: text, channel: 'web' }),
      });

      if (!resp.ok || !resp.body) {
        this.hideTyping();
        this.appendMessage('assistant', 'Sorry, I encountered an error. Please try again.');
        return;
      }

      let msgEl: HTMLElement | null = null;
      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      this.hideTyping();
      msgEl = this.createMessageEl('assistant', '');

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const jsonStr = line.slice(6);
          try {
            const event = JSON.parse(jsonStr);
            if (event.token && msgEl) {
              msgEl.textContent += event.token;
              this.scrollToBottom();
            } else if (event.type === 'done') {
              if (event.lead_prompt && !this.leadCaptured) {
                this.showLeadForm();
              }
            }
          } catch (_) {}
        }
      }
    } catch (e) {
      this.hideTyping();
      console.error('[Qbot] Streaming error:', e);
    }
  }

  private appendMessage(role: 'user' | 'assistant', content: string): void {
    this.createMessageEl(role, content);
    this.scrollToBottom();
  }

  private createMessageEl(role: 'user' | 'assistant', content: string): HTMLElement {
    const el = document.createElement('div');
    el.className = `bf-msg ${role}`;
    el.textContent = content;
    this.messagesContainer?.appendChild(el);
    this.scrollToBottom();
    return el;
  }

  private showTyping(): void {
    this.isTyping = true;
    const el = document.createElement('div');
    el.id = 'bf-typing-indicator';
    el.className = 'bf-typing';
    el.innerHTML = '<span></span><span></span><span></span>';
    this.messagesContainer?.appendChild(el);
    this.scrollToBottom();
  }

  private hideTyping(): void {
    this.isTyping = false;
    this.shadow?.getElementById('bf-typing-indicator')?.remove();
  }

  private showLeadForm(): void {
    const form = this.shadow?.getElementById('bf-lead-form');
    form?.classList.add('show');
  }

  private async submitLead(): Promise<void> {
    const name = (this.shadow?.getElementById('bf-lead-name') as HTMLInputElement)?.value;
    const email = (this.shadow?.getElementById('bf-lead-email') as HTMLInputElement)?.value;
    const phone = (this.shadow?.getElementById('bf-lead-phone') as HTMLInputElement)?.value;

    if (!email) return;

    try {
      await fetch(`${this.baseUrl}/api/v1/chat/${this.sessionId}/lead`, {
        method: 'POST',
        headers: this.apiHeaders,
        body: JSON.stringify({ fullName: name, email, phone }),
      });
      this.leadCaptured = true;
      const form = this.shadow?.getElementById('bf-lead-form');
      form?.classList.remove('show');
      this.appendMessage('assistant', `Thanks ${name || ''}! We'll be in touch at ${email}. Now, how else can I help?`);
    } catch (e) {
      console.error('[Qbot] Lead submission error:', e);
    }
  }

  private scrollToBottom(): void {
    if (this.messagesContainer) {
      this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }
  }
}

// Auto-initialize when script loads
(function () {
  const config = (window as any).QbotConfig as QbotConfig;
  if (!config || !config.apiKey) {
    console.warn('[Qbot] No config found. Add window.QbotConfig before loading the widget.');
    return;
  }

  function init() {
    const widget = new QbotWidget(config);
    widget.init().catch(console.error);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
