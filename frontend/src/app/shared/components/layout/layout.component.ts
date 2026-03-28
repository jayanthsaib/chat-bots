import { Component, inject } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { NgFor } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AuthService } from '../../../core/services/auth.service';

const NAV = [
  { path: '/dashboard',     icon: 'grid_view',      label: 'Dashboard' },
  { path: '/chatbots',      icon: 'smart_toy',      label: 'Chatbots' },
  { path: '/conversations', icon: 'forum',          label: 'Conversations' },
  { path: '/leads',         icon: 'person_search',  label: 'Leads' },
  { path: '/pricing',       icon: 'sell',           label: 'Pricing' },
  { path: '/billing',       icon: 'receipt_long',   label: 'Billing' },
];

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, MatIconModule, MatButtonModule, MatTooltipModule, NgFor],
  template: `
    <div class="app-shell">

      <!-- Sidebar -->
      <aside class="sidebar">

        <!-- Logo -->
        <div class="sidebar-logo">
          <div class="logo-icon">
            <mat-icon>smart_toy</mat-icon>
          </div>
          <span class="logo-text">Qbot</span>
        </div>

        <!-- Nav -->
        <nav class="sidebar-nav">
          <a *ngFor="let item of nav"
             class="nav-item"
             [routerLink]="item.path"
             routerLinkActive="active">
            <mat-icon class="nav-icon">{{ item.icon }}</mat-icon>
            <span class="nav-label">{{ item.label }}</span>
          </a>
        </nav>

        <!-- Bottom: User -->
        <div class="sidebar-footer">
          <div class="user-info">
            <div class="user-avatar">{{ initials }}</div>
            <div class="user-meta">
              <div class="user-name">{{ auth.currentUser()?.fullName }}</div>
              <div class="user-biz">{{ auth.currentUser()?.businessName }}</div>
            </div>
          </div>
          <button class="logout-btn" (click)="auth.logout()" matTooltip="Sign out">
            <mat-icon>logout</mat-icon>
          </button>
        </div>

      </aside>

      <!-- Main content -->
      <main class="main-content">
        <router-outlet />
      </main>

    </div>
  `,
  styles: [`
    .app-shell {
      display: flex;
      height: 100vh;
      overflow: hidden;
    }

    /* ── Sidebar ── */
    .sidebar {
      width: 228px;
      min-width: 228px;
      background: #0f172a;
      display: flex;
      flex-direction: column;
      padding: 0;
      overflow: hidden;
    }

    .sidebar-logo {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 22px 20px 20px;
      border-bottom: 1px solid rgba(255,255,255,0.06);
      margin-bottom: 8px;
    }

    .logo-icon {
      width: 34px;
      height: 34px;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      border-radius: 9px;
      display: flex;
      align-items: center;
      justify-content: center;

      mat-icon {
        color: #fff;
        font-size: 18px;
        width: 18px;
        height: 18px;
      }
    }

    .logo-text {
      font-size: 16px;
      font-weight: 700;
      color: #f1f5f9;
      letter-spacing: -0.3px;
    }

    /* ── Nav ── */
    .sidebar-nav {
      flex: 1;
      padding: 4px 12px;
      overflow-y: auto;
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 9px 12px;
      border-radius: 8px;
      color: #94a3b8;
      text-decoration: none;
      font-size: 13px;
      font-weight: 500;
      transition: all 0.15s ease;
      margin-bottom: 2px;

      &:hover {
        background: rgba(255,255,255,0.06);
        color: #e2e8f0;
      }

      &.active {
        background: rgba(99,102,241,0.18);
        color: #a5b4fc;

        .nav-icon { color: #818cf8; }
      }
    }

    .nav-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      transition: color 0.15s ease;
    }

    /* ── Footer ── */
    .sidebar-footer {
      padding: 12px 16px;
      border-top: 1px solid rgba(255,255,255,0.06);
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .user-info {
      display: flex;
      align-items: center;
      gap: 10px;
      flex: 1;
      min-width: 0;
    }

    .user-avatar {
      width: 32px;
      height: 32px;
      min-width: 32px;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: 700;
      color: #fff;
    }

    .user-meta {
      min-width: 0;
      overflow: hidden;
    }

    .user-name {
      font-size: 12px;
      font-weight: 600;
      color: #e2e8f0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .user-biz {
      font-size: 11px;
      color: #64748b;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .logout-btn {
      background: none;
      border: none;
      cursor: pointer;
      color: #475569;
      padding: 4px;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.15s ease;

      mat-icon { font-size: 16px; width: 16px; height: 16px; }

      &:hover { background: rgba(255,255,255,0.08); color: #94a3b8; }
    }

    /* ── Main ── */
    .main-content {
      flex: 1;
      overflow-y: auto;
      background: #f8fafc;
    }
  `]
})
export class LayoutComponent {
  auth = inject(AuthService);
  nav = NAV;

  get initials(): string {
    const name = this.auth.currentUser()?.fullName || '';
    return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  }
}
