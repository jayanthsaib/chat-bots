import { Component, inject } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, MatToolbarModule,
    MatSidenavModule, MatListModule, MatIconModule, MatButtonModule],
  template: `
    <mat-sidenav-container style="height: 100vh;">
      <mat-sidenav mode="side" opened style="width: 240px; padding-top: 64px;">
        <mat-nav-list>
          <a mat-list-item routerLink="/dashboard" routerLinkActive="active-link">
            <mat-icon matListItemIcon>dashboard</mat-icon>
            <span matListItemTitle>Dashboard</span>
          </a>
          <a mat-list-item routerLink="/chatbots" routerLinkActive="active-link">
            <mat-icon matListItemIcon>smart_toy</mat-icon>
            <span matListItemTitle>Chatbots</span>
          </a>
          <a mat-list-item routerLink="/conversations" routerLinkActive="active-link">
            <mat-icon matListItemIcon>chat</mat-icon>
            <span matListItemTitle>Conversations</span>
          </a>
          <a mat-list-item routerLink="/leads" routerLinkActive="active-link">
            <mat-icon matListItemIcon>contacts</mat-icon>
            <span matListItemTitle>Leads</span>
          </a>
        </mat-nav-list>
      </mat-sidenav>
      <mat-sidenav-content>
        <mat-toolbar color="primary" style="position: fixed; top: 0; z-index: 100; width: calc(100% - 240px);">
          <span style="flex:1">BotForge</span>
          <span style="font-size: 13px; opacity: 0.8">{{ auth.currentUser()?.businessName }}</span>
          <button mat-icon-button (click)="auth.logout()" title="Logout" style="margin-left: 8px;">
            <mat-icon>logout</mat-icon>
          </button>
        </mat-toolbar>
        <div style="margin-top: 64px;">
          <router-outlet />
        </div>
      </mat-sidenav-content>
    </mat-sidenav-container>
  `,
  styles: [`
    .active-link { background: rgba(79,70,229,0.1); color: #4F46E5; }
    .active-link mat-icon { color: #4F46E5; }
  `]
})
export class LayoutComponent {
  auth = inject(AuthService);
}
