import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [RouterLink],
  template: `
    <!-- ═══════════════════════ NAVBAR ═══════════════════════ -->
    <nav class="nav">
      <div class="nav-inner">
        <a routerLink="/" class="nav-logo">
          <span class="nav-logo-icon">Q</span>
          <span class="nav-logo-text">Qbot</span>
        </a>
        <div class="nav-links">
          <a href="#features" class="nav-link">Features</a>
          <a href="#how-it-works" class="nav-link">How it works</a>
          <a href="#pricing" class="nav-link">Pricing</a>
        </div>
        <div class="nav-actions">
          <a routerLink="/auth/login" class="btn btn-ghost">Sign In</a>
          <a routerLink="/auth/register" class="btn btn-primary">Get Started Free</a>
        </div>
        <!-- Mobile menu toggle (CSS-only) -->
        <a routerLink="/auth/register" class="btn btn-primary btn-mobile">Get Started</a>
      </div>
    </nav>

    <!-- ═══════════════════════ HERO ═══════════════════════ -->
    <section class="hero">
      <div class="hero-bg-blobs">
        <div class="blob blob-1"></div>
        <div class="blob blob-2"></div>
        <div class="blob blob-3"></div>
      </div>
      <div class="hero-inner">
        <div class="hero-left">
          <div class="hero-badge">
            <span class="badge-dot"></span>
            AI-Powered Customer Support
          </div>
          <h1 class="hero-title">
            Build chatbots that<br>
            <span class="gradient-text">actually know</span><br>
            your business
          </h1>
          <p class="hero-sub">
            Train an AI chatbot on your PDFs, website, FAQs, and docs in minutes.
            Embed it anywhere. Capture leads. Answer questions 24/7 — in any language.
          </p>
          <div class="hero-cta">
            <a routerLink="/auth/register" class="btn btn-primary btn-lg">
              Start for free
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </a>
            <a routerLink="/auth/login" class="btn btn-outline btn-lg">Sign in</a>
          </div>
          <p class="hero-note">No credit card required &nbsp;·&nbsp; Free plan forever</p>
        </div>

        <!-- Chat widget mockup -->
        <div class="hero-right">
          <div class="widget-mockup">
            <div class="widget-header">
              <div class="widget-avatar">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/></svg>
              </div>
              <div>
                <div class="widget-name">Acme Support</div>
                <div class="widget-status"><span class="status-dot"></span> Online</div>
              </div>
              <button class="widget-close">✕</button>
            </div>
            <div class="widget-messages">
              <div class="msg msg-bot">
                <div class="msg-bubble">
                  👋 Hi! I'm Acme's AI assistant. How can I help you today?
                </div>
                <div class="msg-time">Just now</div>
              </div>
              <div class="msg msg-user">
                <div class="msg-bubble">What are your pricing plans?</div>
              </div>
              <div class="msg msg-bot">
                <div class="msg-bubble">
                  We offer 4 plans:<br><br>
                  <strong>Free</strong> — 1 bot, 100 msgs/mo<br>
                  <strong>Starter</strong> — ₹499/mo<br>
                  <strong>Growth</strong> — ₹999/mo ⭐<br>
                  <strong>Pro</strong> — ₹1,999/mo
                </div>
                <div class="msg-time">Just now</div>
              </div>
              <div class="msg msg-user">
                <div class="msg-bubble">Do you support Telugu?</div>
              </div>
              <div class="msg msg-bot typing">
                <div class="msg-bubble">
                  <span class="typing-dots"><span></span><span></span><span></span></span>
                </div>
              </div>
            </div>
            <div class="widget-input">
              <input type="text" placeholder="Type a message…" disabled>
              <button class="send-btn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
              </button>
            </div>
            <div class="widget-footer">Powered by <strong>Qbot</strong></div>
          </div>

          <!-- Floating stat cards -->
          <div class="float-card float-card-1">
            <div class="float-icon float-icon-green">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M20 6h-2.18c.07-.44.18-.88.18-1.34C18 2.99 16.01 1 13.66 1c-1.3 0-2.51.56-3.36 1.44L9 3.75l-1.3-1.31C6.85 1.56 5.64 1 4.34 1 1.99 1 0 2.99 0 5.34c0 .46.1.89.18 1.34H0v2h20v-2z"/></svg>
            </div>
            <div>
              <div class="float-label">Leads captured</div>
              <div class="float-value">+42 today</div>
            </div>
          </div>
          <div class="float-card float-card-2">
            <div class="float-icon float-icon-purple">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>
            </div>
            <div>
              <div class="float-label">Chats resolved</div>
              <div class="float-value">98.3% rate</div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ═══════════════════════ TRUST BAR ═══════════════════════ -->
    <section class="trust-bar">
      <div class="trust-inner">
        <span class="trust-label">Powered by</span>
        <div class="trust-logos">
          <div class="trust-logo">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="#10a37f"><circle cx="12" cy="12" r="10"/></svg>
            OpenAI GPT-4o
          </div>
          <div class="trust-divider"></div>
          <div class="trust-logo">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="#336791"><rect width="24" height="24" rx="4"/></svg>
            PostgreSQL + pgvector
          </div>
          <div class="trust-divider"></div>
          <div class="trust-logo">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="#6db33f"><path d="M12 0L1.5 6v12L12 24l10.5-6V6L12 0z"/></svg>
            Spring Boot
          </div>
          <div class="trust-divider"></div>
          <div class="trust-logo">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="#dd0031"><path d="M12 2L2 7l1.09 11.38L12 22l8.91-3.62L22 7 12 2z"/></svg>
            Angular 17
          </div>
          <div class="trust-divider"></div>
          <div class="trust-logo">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="#dc382d"><circle cx="12" cy="12" r="10"/></svg>
            Redis Cache
          </div>
        </div>
      </div>
    </section>

    <!-- ═══════════════════════ FEATURES ═══════════════════════ -->
    <section class="section" id="features">
      <div class="section-inner">
        <div class="section-label">Features</div>
        <h2 class="section-title">Everything you need to support your customers</h2>
        <p class="section-sub">One platform — train, deploy, monitor, and grow.</p>

        <div class="features-grid">

          <div class="feature-card">
            <div class="feature-icon feature-icon-blue">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
            </div>
            <h3>Knowledge Base</h3>
            <p>Train your bot from PDFs, website URLs, raw text, or FAQ pairs. Multiple sources, all indexed automatically.</p>
            <ul class="feature-list">
              <li>PDF document parsing</li>
              <li>Website URL scraping</li>
              <li>FAQ import</li>
              <li>Plain text entry</li>
            </ul>
          </div>

          <div class="feature-card">
            <div class="feature-icon feature-icon-purple">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
            </div>
            <h3>RAG-Powered Answers</h3>
            <p>Responses are grounded in your actual content using vector similarity search — not hallucinations.</p>
            <ul class="feature-list">
              <li>pgvector semantic search</li>
              <li>Keyword fallback retrieval</li>
              <li>Token-budget optimised context</li>
              <li>Source-grounded replies</li>
            </ul>
          </div>

          <div class="feature-card">
            <div class="feature-icon feature-icon-green">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
            </div>
            <h3>Embeddable Widget</h3>
            <p>One &lt;script&gt; tag — drop your chatbot onto any website, app, or landing page instantly.</p>
            <ul class="feature-list">
              <li>2-line embed code</li>
              <li>Custom brand colours</li>
              <li>Mobile responsive</li>
              <li>SSE streaming responses</li>
            </ul>
          </div>

          <div class="feature-card">
            <div class="feature-icon feature-icon-orange">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            </div>
            <h3>Lead Capture</h3>
            <p>Automatically collect visitor name and email after a set number of messages. Leads stored in your dashboard.</p>
            <ul class="feature-list">
              <li>Configurable trigger</li>
              <li>Name + email collection</li>
              <li>Leads inbox & export</li>
              <li>Per-bot settings</li>
            </ul>
          </div>

          <div class="feature-card">
            <div class="feature-icon feature-icon-teal">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            </div>
            <h3>Conversation Inbox</h3>
            <p>Review every chat, mark conversations resolved, and see what your customers are really asking.</p>
            <ul class="feature-list">
              <li>Full chat history</li>
              <li>Open / resolved status</li>
              <li>Per-bot filtering</li>
              <li>Visitor info alongside chat</li>
            </ul>
          </div>

          <div class="feature-card">
            <div class="feature-icon feature-icon-pink">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
            </div>
            <h3>Multilingual Support</h3>
            <p>Users ask in Telugu, Hindi, or any language — the bot understands the intent and answers in the same language.</p>
            <ul class="feature-list">
              <li>Cross-language RAG retrieval</li>
              <li>Replies in user's language</li>
              <li>Regional greeting detection</li>
              <li>English knowledge base, any query language</li>
            </ul>
          </div>

        </div>
      </div>
    </section>

    <!-- ═══════════════════════ HOW IT WORKS ═══════════════════════ -->
    <section class="section section-alt" id="how-it-works">
      <div class="section-inner">
        <div class="section-label">How it works</div>
        <h2 class="section-title">Live in three steps</h2>
        <p class="section-sub">No code required. Go from signup to deployed in under 10 minutes.</p>

        <div class="steps">
          <div class="step">
            <div class="step-number">01</div>
            <div class="step-content">
              <div class="step-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>
              </div>
              <h3>Create your chatbot</h3>
              <p>Give it a name, personality, and welcome message. Takes 60 seconds. Each bot is fully isolated.</p>
            </div>
          </div>
          <div class="step-connector"></div>
          <div class="step">
            <div class="step-number">02</div>
            <div class="step-content">
              <div class="step-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
              </div>
              <h3>Train on your content</h3>
              <p>Upload PDFs, paste URLs, add FAQs or text. The AI indexes everything into a searchable vector store.</p>
            </div>
          </div>
          <div class="step-connector"></div>
          <div class="step">
            <div class="step-number">03</div>
            <div class="step-content">
              <div class="step-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
              </div>
              <h3>Embed &amp; go live</h3>
              <p>Copy your 2-line script tag. Paste it into your website's HTML. Your chatbot is live immediately.</p>
            </div>
          </div>
        </div>

        <!-- Embed code snippet -->
        <div class="code-block">
          <div class="code-header">
            <span class="code-lang">HTML</span>
            <span class="code-title">Add to your website</span>
          </div>
          <pre class="code-content"><span class="code-comment">&lt;!-- Add before &lt;/body&gt; --&gt;</span>
<span class="code-tag">&lt;script&gt;</span>
  <span class="code-var">window</span>.<span class="code-prop">QbotConfig</span> <span class="code-op">=</span> &#123;
    <span class="code-key">apiKey</span>: <span class="code-str">"qb_live_xxxxxxxxxxxx"</span>,
    <span class="code-key">botId</span>:  <span class="code-str">"your-bot-uuid"</span>
  &#125;;
<span class="code-tag">&lt;/script&gt;</span>
<span class="code-tag">&lt;script</span> <span class="code-prop">src</span><span class="code-op">=</span><span class="code-str">"https://botforge.dravex.in/widget/botforge-widget.min.js"</span> <span class="code-prop">async</span><span class="code-tag">&gt;&lt;/script&gt;</span></pre>
        </div>
      </div>
    </section>

    <!-- ═══════════════════════ PRICING ═══════════════════════ -->
    <section class="section" id="pricing">
      <div class="section-inner">
        <div class="section-label">Pricing</div>
        <h2 class="section-title">Simple, transparent pricing</h2>
        <p class="section-sub">Start free. Scale as you grow. No hidden fees.</p>

        <div class="pricing-grid">

          <div class="pricing-card">
            <div class="pricing-icon pricing-icon-gray">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            </div>
            <div class="pricing-name">Free</div>
            <div class="pricing-price"><span class="pricing-amount">₹0</span><span class="pricing-period">/month</span></div>
            <ul class="pricing-features">
              <li><svg width="14" height="14" viewBox="0 0 24 24" fill="#10b981"><path d="M20 6L9 17l-5-5"/></svg> 1 chatbot</li>
              <li><svg width="14" height="14" viewBox="0 0 24 24" fill="#10b981"><path d="M20 6L9 17l-5-5"/></svg> 100 messages/month</li>
              <li><svg width="14" height="14" viewBox="0 0 24 24" fill="#10b981"><path d="M20 6L9 17l-5-5"/></svg> 2 knowledge sources</li>
              <li><svg width="14" height="14" viewBox="0 0 24 24" fill="#10b981"><path d="M20 6L9 17l-5-5"/></svg> Embeddable widget</li>
              <li><svg width="14" height="14" viewBox="0 0 24 24" fill="#10b981"><path d="M20 6L9 17l-5-5"/></svg> Lead capture</li>
            </ul>
            <a routerLink="/auth/register" class="btn btn-outline pricing-btn">Get started free</a>
          </div>

          <div class="pricing-card">
            <div class="pricing-icon pricing-icon-green">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L8 6H4l2 4-3 3 3 1-1 4 4-2 3 3 3-3 4 2-1-4 3-1-3-3 2-4H16L12 2z"/></svg>
            </div>
            <div class="pricing-name">Starter</div>
            <div class="pricing-price"><span class="pricing-currency">₹</span><span class="pricing-amount">499</span><span class="pricing-period">/month</span></div>
            <ul class="pricing-features">
              <li><svg width="14" height="14" viewBox="0 0 24 24" fill="#10b981"><path d="M20 6L9 17l-5-5"/></svg> 3 chatbots</li>
              <li><svg width="14" height="14" viewBox="0 0 24 24" fill="#10b981"><path d="M20 6L9 17l-5-5"/></svg> 1,000 messages/month</li>
              <li><svg width="14" height="14" viewBox="0 0 24 24" fill="#10b981"><path d="M20 6L9 17l-5-5"/></svg> 10 knowledge sources</li>
              <li><svg width="14" height="14" viewBox="0 0 24 24" fill="#10b981"><path d="M20 6L9 17l-5-5"/></svg> Priority support</li>
              <li><svg width="14" height="14" viewBox="0 0 24 24" fill="#10b981"><path d="M20 6L9 17l-5-5"/></svg> Everything in Free</li>
            </ul>
            <a routerLink="/auth/register" class="btn btn-outline pricing-btn">Get Starter</a>
          </div>

          <div class="pricing-card pricing-card-popular">
            <div class="pricing-badge">Most Popular</div>
            <div class="pricing-icon pricing-icon-indigo">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
            </div>
            <div class="pricing-name">Growth</div>
            <div class="pricing-price"><span class="pricing-currency">₹</span><span class="pricing-amount">999</span><span class="pricing-period">/month</span></div>
            <ul class="pricing-features">
              <li><svg width="14" height="14" viewBox="0 0 24 24" fill="#fff"><path d="M20 6L9 17l-5-5"/></svg> 10 chatbots</li>
              <li><svg width="14" height="14" viewBox="0 0 24 24" fill="#fff"><path d="M20 6L9 17l-5-5"/></svg> 5,000 messages/month</li>
              <li><svg width="14" height="14" viewBox="0 0 24 24" fill="#fff"><path d="M20 6L9 17l-5-5"/></svg> 50 knowledge sources</li>
              <li><svg width="14" height="14" viewBox="0 0 24 24" fill="#fff"><path d="M20 6L9 17l-5-5"/></svg> Advanced analytics</li>
              <li><svg width="14" height="14" viewBox="0 0 24 24" fill="#fff"><path d="M20 6L9 17l-5-5"/></svg> Priority support</li>
            </ul>
            <a routerLink="/auth/register" class="btn btn-white pricing-btn">Get Growth</a>
          </div>

          <div class="pricing-card">
            <div class="pricing-icon pricing-icon-amber">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg>
            </div>
            <div class="pricing-name">Pro</div>
            <div class="pricing-price"><span class="pricing-currency">₹</span><span class="pricing-amount">1,999</span><span class="pricing-period">/month</span></div>
            <ul class="pricing-features">
              <li><svg width="14" height="14" viewBox="0 0 24 24" fill="#10b981"><path d="M20 6L9 17l-5-5"/></svg> Unlimited chatbots</li>
              <li><svg width="14" height="14" viewBox="0 0 24 24" fill="#10b981"><path d="M20 6L9 17l-5-5"/></svg> Unlimited messages</li>
              <li><svg width="14" height="14" viewBox="0 0 24 24" fill="#10b981"><path d="M20 6L9 17l-5-5"/></svg> Unlimited sources</li>
              <li><svg width="14" height="14" viewBox="0 0 24 24" fill="#10b981"><path d="M20 6L9 17l-5-5"/></svg> Custom integrations</li>
              <li><svg width="14" height="14" viewBox="0 0 24 24" fill="#10b981"><path d="M20 6L9 17l-5-5"/></svg> Everything in Growth</li>
            </ul>
            <a routerLink="/auth/register" class="btn btn-outline pricing-btn">Get Pro</a>
          </div>

        </div>
      </div>
    </section>

    <!-- ═══════════════════════ FINAL CTA ═══════════════════════ -->
    <section class="cta-section">
      <div class="cta-inner">
        <div class="cta-blob-1"></div>
        <div class="cta-blob-2"></div>
        <h2 class="cta-title">Ready to build your AI chatbot?</h2>
        <p class="cta-sub">Join businesses already using Qbot to answer questions, capture leads, and support customers 24/7.</p>
        <div class="cta-buttons">
          <a routerLink="/auth/register" class="btn btn-white btn-lg">
            Start for free
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </a>
          <a routerLink="/auth/login" class="btn btn-outline-white btn-lg">Sign in</a>
        </div>
      </div>
    </section>

    <!-- ═══════════════════════ FOOTER ═══════════════════════ -->
    <footer class="footer">
      <div class="footer-inner">
        <div class="footer-brand">
          <a routerLink="/" class="nav-logo">
            <span class="nav-logo-icon">Q</span>
            <span class="nav-logo-text footer-logo-text">Qbot</span>
          </a>
          <p class="footer-tagline">AI chatbots trained on your content.</p>
        </div>
        <div class="footer-links">
          <div class="footer-col">
            <div class="footer-col-title">Product</div>
            <a href="#features" class="footer-link">Features</a>
            <a href="#pricing" class="footer-link">Pricing</a>
            <a href="#how-it-works" class="footer-link">How it works</a>
          </div>
          <div class="footer-col">
            <div class="footer-col-title">Account</div>
            <a routerLink="/auth/register" class="footer-link">Sign up</a>
            <a routerLink="/auth/login" class="footer-link">Sign in</a>
            <a routerLink="/dashboard" class="footer-link">Dashboard</a>
          </div>
        </div>
      </div>
      <div class="footer-bottom">
        <span>© 2025 Qbot. Built by Dravex.</span>
      </div>
    </footer>
  `,
  styles: [`
    /* ─── Reset & base ─────────────────────────────────────── */
    :host { display: block; font-family: 'Inter', 'Helvetica Neue', sans-serif; color: #0f172a; }
    * { box-sizing: border-box; }
    a { text-decoration: none; }

    /* ─── Buttons ──────────────────────────────────────────── */
    .btn {
      display: inline-flex; align-items: center; gap: 8px;
      padding: 10px 20px; border-radius: 10px; font-size: 14px;
      font-weight: 600; cursor: pointer; border: none; transition: all 0.18s ease;
      font-family: 'Inter', sans-serif; white-space: nowrap;
    }
    .btn-primary { background: #4F46E5; color: #fff; }
    .btn-primary:hover { background: #4338ca; transform: translateY(-1px); box-shadow: 0 4px 16px rgba(79,70,229,0.35); }
    .btn-ghost { color: #374151; background: transparent; }
    .btn-ghost:hover { background: #f3f4f6; }
    .btn-outline { border: 1.5px solid #d1d5db; background: #fff; color: #374151; }
    .btn-outline:hover { border-color: #4F46E5; color: #4F46E5; }
    .btn-white { background: #fff; color: #4F46E5; }
    .btn-white:hover { background: #f5f3ff; transform: translateY(-1px); }
    .btn-outline-white { border: 1.5px solid rgba(255,255,255,0.5); color: #fff; background: transparent; }
    .btn-outline-white:hover { background: rgba(255,255,255,0.1); }
    .btn-lg { padding: 13px 28px; font-size: 15px; border-radius: 12px; }
    .btn-mobile { display: none; }

    /* ─── Navbar ───────────────────────────────────────────── */
    .nav {
      position: sticky; top: 0; z-index: 100;
      background: rgba(255,255,255,0.92); backdrop-filter: blur(12px);
      border-bottom: 1px solid #f1f5f9;
    }
    .nav-inner {
      max-width: 1200px; margin: 0 auto; padding: 0 32px;
      height: 64px; display: flex; align-items: center; gap: 32px;
    }
    .nav-logo { display: flex; align-items: center; gap: 10px; }
    .nav-logo-icon {
      width: 34px; height: 34px; border-radius: 9px;
      background: linear-gradient(135deg, #4F46E5, #7c3aed);
      display: flex; align-items: center; justify-content: center;
      font-size: 16px; font-weight: 800; color: #fff;
    }
    .nav-logo-text { font-size: 18px; font-weight: 700; color: #0f172a; }
    .nav-links { display: flex; gap: 4px; margin-left: 12px; flex: 1; }
    .nav-link { padding: 6px 14px; border-radius: 8px; color: #374151; font-size: 14px; font-weight: 500; transition: all 0.15s; }
    .nav-link:hover { background: #f3f4f6; color: #0f172a; }
    .nav-actions { display: flex; align-items: center; gap: 8px; margin-left: auto; }

    /* ─── Hero ─────────────────────────────────────────────── */
    .hero {
      position: relative; overflow: hidden;
      background: linear-gradient(160deg, #fafafe 0%, #f0f0ff 50%, #faf5ff 100%);
      padding: 100px 32px 80px;
    }
    .hero-bg-blobs { position: absolute; inset: 0; pointer-events: none; }
    .blob {
      position: absolute; border-radius: 50%; filter: blur(80px); opacity: 0.45;
    }
    .blob-1 { width: 600px; height: 600px; background: #e0e7ff; top: -200px; right: -100px; }
    .blob-2 { width: 400px; height: 400px; background: #ede9fe; bottom: -100px; left: -100px; }
    .blob-3 { width: 300px; height: 300px; background: #dbeafe; top: 100px; left: 35%; }

    .hero-inner {
      position: relative; z-index: 1;
      max-width: 1200px; margin: 0 auto;
      display: grid; grid-template-columns: 1fr 1fr; gap: 60px; align-items: center;
    }
    .hero-badge {
      display: inline-flex; align-items: center; gap: 8px;
      background: #ede9fe; color: #5b21b6; border-radius: 20px;
      padding: 6px 14px; font-size: 13px; font-weight: 600; margin-bottom: 24px;
    }
    .badge-dot { width: 8px; height: 8px; border-radius: 50%; background: #7c3aed; animation: pulse 2s infinite; }
    @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }

    .hero-title { font-size: 52px; font-weight: 800; line-height: 1.1; margin: 0 0 20px; color: #0f172a; }
    .gradient-text { background: linear-gradient(135deg, #4F46E5, #7c3aed, #db2777); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
    .hero-sub { font-size: 17px; color: #475569; line-height: 1.65; margin: 0 0 32px; max-width: 480px; }
    .hero-cta { display: flex; gap: 12px; flex-wrap: wrap; }
    .hero-note { margin: 16px 0 0; font-size: 13px; color: #94a3b8; }

    /* Chat widget mockup */
    .hero-right { position: relative; display: flex; justify-content: center; }
    .widget-mockup {
      width: 340px; background: #fff; border-radius: 20px;
      box-shadow: 0 24px 64px rgba(0,0,0,0.14), 0 0 0 1px rgba(0,0,0,0.05);
      overflow: hidden;
    }
    .widget-header {
      background: linear-gradient(135deg, #4F46E5, #7c3aed);
      padding: 16px; display: flex; align-items: center; gap: 12px;
    }
    .widget-avatar {
      width: 38px; height: 38px; border-radius: 50%; background: rgba(255,255,255,0.2);
      display: flex; align-items: center; justify-content: center; color: #fff; flex-shrink: 0;
    }
    .widget-name { font-size: 14px; font-weight: 700; color: #fff; }
    .widget-status { font-size: 11px; color: rgba(255,255,255,0.75); display: flex; align-items: center; gap: 5px; margin-top: 2px; }
    .status-dot { width: 7px; height: 7px; border-radius: 50%; background: #4ade80; }
    .widget-close { margin-left: auto; color: rgba(255,255,255,0.7); background: none; border: none; cursor: pointer; font-size: 14px; }

    .widget-messages { padding: 16px; display: flex; flex-direction: column; gap: 12px; background: #f8fafc; min-height: 240px; }
    .msg { display: flex; flex-direction: column; max-width: 85%; }
    .msg-bot { align-self: flex-start; }
    .msg-user { align-self: flex-end; }
    .msg-bubble {
      padding: 10px 13px; border-radius: 14px; font-size: 13px; line-height: 1.5;
    }
    .msg-bot .msg-bubble { background: #fff; color: #0f172a; border-bottom-left-radius: 4px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
    .msg-user .msg-bubble { background: #4F46E5; color: #fff; border-bottom-right-radius: 4px; }
    .msg-time { font-size: 10px; color: #94a3b8; margin-top: 4px; }

    .typing-dots { display: inline-flex; gap: 4px; align-items: center; height: 16px; }
    .typing-dots span {
      width: 7px; height: 7px; border-radius: 50%; background: #cbd5e1;
      animation: typingBounce 1.2s infinite;
    }
    .typing-dots span:nth-child(2) { animation-delay: 0.2s; }
    .typing-dots span:nth-child(3) { animation-delay: 0.4s; }
    @keyframes typingBounce { 0%,60%,100% { transform: translateY(0); } 30% { transform: translateY(-5px); } }

    .widget-input {
      display: flex; align-items: center; gap: 8px;
      padding: 12px 16px; background: #fff; border-top: 1px solid #f1f5f9;
    }
    .widget-input input { flex: 1; border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px 12px; font-size: 13px; outline: none; }
    .send-btn { width: 34px; height: 34px; border-radius: 8px; background: #4F46E5; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; color: #fff; }
    .widget-footer { text-align: center; padding: 8px; font-size: 11px; color: #94a3b8; background: #fff; }

    /* Floating stat cards */
    .float-card {
      position: absolute; background: #fff; border-radius: 14px;
      padding: 12px 16px; display: flex; align-items: center; gap: 10px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.1); border: 1px solid #f1f5f9;
    }
    .float-card-1 { bottom: -20px; left: -40px; animation: floatUp 3s ease-in-out infinite; }
    .float-card-2 { top: 20px; right: -40px; animation: floatUp 3s ease-in-out infinite 1.5s; }
    @keyframes floatUp { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
    .float-icon { width: 34px; height: 34px; border-radius: 10px; display: flex; align-items: center; justify-content: center; }
    .float-icon-green { background: #dcfce7; color: #16a34a; }
    .float-icon-purple { background: #ede9fe; color: #7c3aed; }
    .float-label { font-size: 11px; color: #64748b; font-weight: 500; }
    .float-value { font-size: 14px; font-weight: 700; color: #0f172a; }

    /* ─── Trust bar ────────────────────────────────────────── */
    .trust-bar { background: #fff; border-top: 1px solid #f1f5f9; border-bottom: 1px solid #f1f5f9; padding: 20px 32px; }
    .trust-inner { max-width: 1200px; margin: 0 auto; display: flex; align-items: center; gap: 24px; flex-wrap: wrap; }
    .trust-label { font-size: 12px; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; white-space: nowrap; }
    .trust-logos { display: flex; align-items: center; gap: 20px; flex-wrap: wrap; }
    .trust-logo { display: flex; align-items: center; gap: 7px; font-size: 13px; font-weight: 600; color: #475569; }
    .trust-divider { width: 1px; height: 20px; background: #e2e8f0; }

    /* ─── Sections ─────────────────────────────────────────── */
    .section { padding: 96px 32px; }
    .section-alt { background: #f8fafc; }
    .section-inner { max-width: 1200px; margin: 0 auto; }
    .section-label {
      display: inline-block; background: #ede9fe; color: #5b21b6;
      border-radius: 20px; padding: 5px 14px; font-size: 12px; font-weight: 700;
      text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 16px;
    }
    .section-title { font-size: 38px; font-weight: 800; line-height: 1.2; margin: 0 0 12px; color: #0f172a; }
    .section-sub { font-size: 16px; color: #64748b; margin: 0 0 56px; max-width: 560px; }

    /* ─── Features grid ────────────────────────────────────── */
    .features-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
    .feature-card {
      background: #fff; border-radius: 18px; padding: 28px;
      border: 1px solid #f1f5f9; transition: all 0.2s ease;
    }
    .feature-card:hover { box-shadow: 0 8px 32px rgba(0,0,0,0.08); transform: translateY(-3px); }
    .feature-icon {
      width: 52px; height: 52px; border-radius: 14px;
      display: flex; align-items: center; justify-content: center; margin-bottom: 18px;
    }
    .feature-icon-blue  { background: #dbeafe; color: #2563eb; }
    .feature-icon-purple { background: #ede9fe; color: #7c3aed; }
    .feature-icon-green { background: #dcfce7; color: #16a34a; }
    .feature-icon-orange { background: #ffedd5; color: #ea580c; }
    .feature-icon-teal  { background: #ccfbf1; color: #0d9488; }
    .feature-icon-pink  { background: #fce7f3; color: #db2777; }
    .feature-card h3 { font-size: 16px; font-weight: 700; color: #0f172a; margin: 0 0 8px; }
    .feature-card p { font-size: 14px; color: #64748b; line-height: 1.6; margin: 0 0 16px; }
    .feature-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 6px; }
    .feature-list li { font-size: 13px; color: #475569; padding-left: 16px; position: relative; }
    .feature-list li::before { content: '→'; position: absolute; left: 0; color: #4F46E5; font-size: 12px; }

    /* ─── Steps ────────────────────────────────────────────── */
    .steps { display: flex; align-items: flex-start; gap: 0; margin-bottom: 56px; }
    .step { flex: 1; }
    .step-connector { width: 80px; height: 2px; background: linear-gradient(90deg, #4F46E5, #7c3aed); margin-top: 56px; flex-shrink: 0; }
    .step-number { font-size: 48px; font-weight: 900; color: #e0e7ff; line-height: 1; margin-bottom: 4px; }
    .step-content { padding: 0 8px; }
    .step-icon {
      width: 56px; height: 56px; border-radius: 16px;
      background: linear-gradient(135deg, #4F46E5, #7c3aed);
      display: flex; align-items: center; justify-content: center;
      color: #fff; margin-bottom: 16px;
    }
    .step-content h3 { font-size: 17px; font-weight: 700; color: #0f172a; margin: 0 0 8px; }
    .step-content p { font-size: 14px; color: #64748b; line-height: 1.6; margin: 0; }

    /* Code block */
    .code-block { background: #0f172a; border-radius: 16px; overflow: hidden; box-shadow: 0 8px 32px rgba(0,0,0,0.15); }
    .code-header { background: #1e293b; padding: 14px 20px; display: flex; align-items: center; gap: 12px; border-bottom: 1px solid #334155; }
    .code-lang { background: #4F46E5; color: #fff; padding: 2px 10px; border-radius: 6px; font-size: 11px; font-weight: 700; }
    .code-title { font-size: 13px; color: #94a3b8; font-weight: 500; }
    .code-content { padding: 24px; margin: 0; font-family: 'Fira Code', 'Cascadia Code', monospace; font-size: 13px; line-height: 1.75; overflow-x: auto; }
    .code-comment { color: #64748b; }
    .code-tag { color: #7dd3fc; }
    .code-prop { color: #86efac; }
    .code-var { color: #f0abfc; }
    .code-key { color: #93c5fd; }
    .code-str { color: #fca5a5; }
    .code-op { color: #e2e8f0; }

    /* ─── Pricing ──────────────────────────────────────────── */
    .pricing-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; align-items: start; }
    .pricing-card {
      background: #fff; border-radius: 20px; padding: 28px;
      border: 1.5px solid #f1f5f9; position: relative;
      transition: all 0.2s ease;
    }
    .pricing-card:hover { box-shadow: 0 8px 32px rgba(0,0,0,0.08); transform: translateY(-3px); }
    .pricing-card-popular {
      background: linear-gradient(160deg, #4F46E5, #7c3aed);
      border-color: #4F46E5; color: #fff;
    }
    .pricing-badge {
      position: absolute; top: -14px; left: 50%; transform: translateX(-50%);
      background: #fbbf24; color: #78350f;
      padding: 4px 14px; border-radius: 20px; font-size: 11px; font-weight: 800;
      white-space: nowrap;
    }
    .pricing-icon { width: 48px; height: 48px; border-radius: 13px; display: flex; align-items: center; justify-content: center; margin-bottom: 16px; }
    .pricing-icon-gray { background: #f3f4f6; color: #6b7280; }
    .pricing-icon-green { background: #dcfce7; color: #16a34a; }
    .pricing-icon-indigo { background: rgba(255,255,255,0.2); color: #fff; }
    .pricing-icon-amber { background: #fef3c7; color: #d97706; }
    .pricing-name { font-size: 15px; font-weight: 700; margin-bottom: 8px; }
    .pricing-card-popular .pricing-name { color: #fff; }
    .pricing-price { display: flex; align-items: baseline; gap: 2px; margin-bottom: 24px; }
    .pricing-currency { font-size: 18px; font-weight: 600; color: #4F46E5; }
    .pricing-card-popular .pricing-currency { color: rgba(255,255,255,0.8); }
    .pricing-amount { font-size: 36px; font-weight: 800; color: #0f172a; line-height: 1; }
    .pricing-card-popular .pricing-amount { color: #fff; }
    .pricing-period { font-size: 13px; color: #64748b; margin-left: 4px; }
    .pricing-card-popular .pricing-period { color: rgba(255,255,255,0.7); }
    .pricing-features { list-style: none; padding: 0; margin: 0 0 28px; display: flex; flex-direction: column; gap: 10px; }
    .pricing-features li { display: flex; align-items: center; gap: 8px; font-size: 13px; color: #374151; }
    .pricing-card-popular .pricing-features li { color: rgba(255,255,255,0.9); }
    .pricing-btn { width: 100%; justify-content: center; }

    /* ─── CTA section ──────────────────────────────────────── */
    .cta-section {
      background: linear-gradient(135deg, #4F46E5 0%, #7c3aed 100%);
      padding: 96px 32px; text-align: center; position: relative; overflow: hidden;
    }
    .cta-blob-1 { position: absolute; width: 500px; height: 500px; border-radius: 50%; background: rgba(255,255,255,0.05); top: -200px; left: -100px; }
    .cta-blob-2 { position: absolute; width: 400px; height: 400px; border-radius: 50%; background: rgba(255,255,255,0.05); bottom: -150px; right: -50px; }
    .cta-inner { position: relative; z-index: 1; max-width: 620px; margin: 0 auto; }
    .cta-title { font-size: 40px; font-weight: 800; color: #fff; margin: 0 0 16px; line-height: 1.2; }
    .cta-sub { font-size: 16px; color: rgba(255,255,255,0.8); margin: 0 0 40px; line-height: 1.65; }
    .cta-buttons { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }

    /* ─── Footer ───────────────────────────────────────────── */
    .footer { background: #0f172a; padding: 64px 32px 24px; }
    .footer-inner { max-width: 1200px; margin: 0 auto; display: flex; gap: 64px; margin-bottom: 48px; }
    .footer-brand { flex: 1; }
    .footer-logo-text { color: #f8fafc !important; }
    .footer-tagline { font-size: 14px; color: #64748b; margin: 12px 0 0; line-height: 1.6; }
    .footer-links { display: flex; gap: 64px; }
    .footer-col { display: flex; flex-direction: column; gap: 10px; }
    .footer-col-title { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; color: #475569; margin-bottom: 4px; }
    .footer-link { font-size: 14px; color: #64748b; transition: color 0.15s; }
    .footer-link:hover { color: #f8fafc; }
    .footer-bottom { max-width: 1200px; margin: 0 auto; padding-top: 24px; border-top: 1px solid #1e293b; font-size: 13px; color: #475569; }

    /* ─── Responsive ───────────────────────────────────────── */
    @media (max-width: 1024px) {
      .features-grid { grid-template-columns: repeat(2, 1fr); }
      .pricing-grid { grid-template-columns: repeat(2, 1fr); }
    }
    @media (max-width: 768px) {
      .hero-inner { grid-template-columns: 1fr; gap: 48px; }
      .hero-title { font-size: 36px; }
      .hero-right { display: none; }
      .nav-links { display: none; }
      .nav-actions { display: none; }
      .btn-mobile { display: inline-flex; margin-left: auto; }
      .features-grid { grid-template-columns: 1fr; }
      .pricing-grid { grid-template-columns: 1fr; }
      .steps { flex-direction: column; }
      .step-connector { width: 2px; height: 40px; margin: 0 0 0 28px; }
      .section-title { font-size: 28px; }
      .cta-title { font-size: 28px; }
      .footer-inner { flex-direction: column; gap: 40px; }
      .float-card-1, .float-card-2 { display: none; }
    }
  `]
})
export class LandingComponent {}
