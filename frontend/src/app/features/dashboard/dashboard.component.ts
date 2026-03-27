import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { DatePipe, DecimalPipe, NgFor, NgIf, PercentPipe, SlicePipe, TitleCasePipe } from '@angular/common';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { Conversation, Lead } from '../../core/models/api.models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, MatIconModule, MatButtonModule, NgFor, NgIf, DecimalPipe, PercentPipe, DatePipe, SlicePipe, TitleCasePipe],
  template: `
    <div class="page-container">

      <!-- Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Good {{ timeOfDay }}, {{ firstName }}!</h1>
          <p class="page-subtitle">Here's what's happening with your chatbots today</p>
        </div>
        <button mat-raised-button color="primary" routerLink="/chatbots/new">
          <mat-icon style="margin-right:6px;font-size:18px;width:18px;height:18px">add</mat-icon>
          New Chatbot
        </button>
      </div>

      <!-- Stat Cards -->
      <div class="stats-grid">

        <a class="stat-card" routerLink="/chatbots" style="text-decoration:none">
          <div class="stat-icon" style="background:#ede9fe">
            <mat-icon style="color:#7c3aed">smart_toy</mat-icon>
          </div>
          <div class="stat-value">{{ chatbotCount }}</div>
          <div class="stat-label">Chatbots</div>
          <div class="stat-trend" style="color:#7c3aed">
            <mat-icon style="font-size:13px;width:13px;height:13px">circle</mat-icon> Active
          </div>
        </a>

        <a class="stat-card" routerLink="/conversations" style="text-decoration:none">
          <div class="stat-icon" style="background:#dbeafe">
            <mat-icon style="color:#2563eb">forum</mat-icon>
          </div>
          <div class="stat-value">{{ analytics?.totalConversations || 0 }}</div>
          <div class="stat-label">Conversations</div>
          <div class="stat-trend" *ngIf="analytics?.conversationsToday">
            <mat-icon style="font-size:13px;width:13px;height:13px">arrow_upward</mat-icon>
            +{{ analytics.conversationsToday }} today
          </div>
        </a>

        <a class="stat-card" routerLink="/leads" style="text-decoration:none">
          <div class="stat-icon" style="background:#dcfce7">
            <mat-icon style="color:#16a34a">person_search</mat-icon>
          </div>
          <div class="stat-value">{{ analytics?.totalLeads || 0 }}</div>
          <div class="stat-label">Leads</div>
          <div class="stat-trend" *ngIf="analytics?.leadsToday">
            <mat-icon style="font-size:13px;width:13px;height:13px">arrow_upward</mat-icon>
            +{{ analytics.leadsToday }} today
          </div>
        </a>

        <div class="stat-card">
          <div class="stat-icon" style="background:#fef9c3">
            <mat-icon style="color:#ca8a04">message</mat-icon>
          </div>
          <div class="stat-value">{{ analytics?.totalMessages || 0 }}</div>
          <div class="stat-label">Messages</div>
          <div class="stat-trend" *ngIf="analytics?.messagesToday">
            <mat-icon style="font-size:13px;width:13px;height:13px">arrow_upward</mat-icon>
            +{{ analytics.messagesToday }} today
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon" style="background:#fee2e2">
            <mat-icon style="color:#dc2626">help_outline</mat-icon>
          </div>
          <div class="stat-value">{{ (analytics?.unansweredRate || 0) | percent:'1.0-0' }}</div>
          <div class="stat-label">Unanswered Rate</div>
          <div class="stat-trend" style="color:#94a3b8">
            {{ analytics?.unansweredQuestions || 0 }} questions
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon" style="background:#e0f2fe">
            <mat-icon style="color:#0284c7">bolt</mat-icon>
          </div>
          <div class="stat-value">{{ (analytics?.avgResponseMs || 0) / 1000 | number:'1.1-1' }}s</div>
          <div class="stat-label">Avg Response</div>
          <div class="stat-trend" style="color:#0284c7">Response time</div>
        </div>

      </div>

      <!-- Charts Row -->
      <div class="charts-row">

        <!-- Activity Chart -->
        <div class="card chart-card">
          <div class="card-header">
            <span class="card-title">Activity — Last 7 Days</span>
            <div style="display:flex;gap:16px">
              <span class="legend-dot" style="background:#6366f1">Conversations</span>
              <span class="legend-dot" style="background:#10b981">Leads</span>
            </div>
          </div>
          <div *ngIf="analytics?.dailyStats?.length; else noChartData" class="bar-chart">
            <div *ngFor="let day of analytics.dailyStats" class="bar-group">
              <div class="bars">
                <div class="bar bar-primary"
                     [style.height.px]="barH(day.conversations, maxConv)"
                     [title]="day.conversations + ' conversations'"></div>
                <div class="bar bar-success"
                     [style.height.px]="barH(day.leads, maxConv)"
                     [title]="day.leads + ' leads'"></div>
              </div>
              <div class="bar-label">{{ day.date | slice:5 }}</div>
            </div>
          </div>
          <ng-template #noChartData>
            <div class="empty-state">
              <mat-icon>bar_chart</mat-icon>
              <p>No activity data yet</p>
            </div>
          </ng-template>
        </div>

        <!-- Channel Breakdown -->
        <div class="card">
          <div class="card-header">
            <span class="card-title">Channels</span>
          </div>
          <div *ngIf="channelEntries.length === 0" class="empty-state" style="padding:24px 0">
            <mat-icon>device_hub</mat-icon>
            <p>No data yet</p>
          </div>
          <div *ngFor="let entry of channelEntries" style="margin-bottom:14px">
            <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:6px">
              <span style="font-weight:500;text-transform:capitalize;color:#334155">{{ entry[0] }}</span>
              <span style="font-weight:600;color:#0f172a">{{ entry[1] }}</span>
            </div>
            <div class="progress-track">
              <div class="progress-fill" [style.width.%]="channelPct(entry[1])"></div>
            </div>
          </div>
        </div>

      </div>

      <!-- Bottom Row -->
      <div class="bottom-row">

        <!-- Recent Conversations -->
        <div class="card">
          <div class="card-header">
            <span class="card-title">Recent Conversations</span>
            <a routerLink="/conversations" class="view-all">View all</a>
          </div>
          <div *ngIf="conversations.length === 0" class="empty-state" style="padding:20px 0">
            <mat-icon>forum</mat-icon>
            <p>No conversations yet</p>
          </div>
          <div *ngFor="let conv of conversations" class="list-item">
            <div style="display:flex;align-items:center;gap:10px">
              <div class="avatar-circle" style="background:#dbeafe;color:#2563eb">
                <mat-icon style="font-size:14px;width:14px;height:14px">forum</mat-icon>
              </div>
              <div>
                <div style="font-size:13px;font-weight:500;color:#0f172a">{{ conv.channel | titlecase }} chat</div>
                <div style="font-size:11px;color:#94a3b8">{{ conv.startedAt | date:'MMM d, h:mm a' }}</div>
              </div>
            </div>
            <span class="status-chip" [class]="conv.status">{{ conv.status }}</span>
          </div>
        </div>

        <!-- Recent Leads -->
        <div class="card">
          <div class="card-header">
            <span class="card-title">Recent Leads</span>
            <a routerLink="/leads" class="view-all">View all</a>
          </div>
          <div *ngIf="leads.length === 0" class="empty-state" style="padding:20px 0">
            <mat-icon>person_search</mat-icon>
            <p>No leads yet</p>
          </div>
          <div *ngFor="let lead of leads" class="list-item">
            <div style="display:flex;align-items:center;gap:10px">
              <div class="avatar-circle" style="background:#dcfce7;color:#16a34a">
                {{ (lead.fullName || 'A').charAt(0).toUpperCase() }}
              </div>
              <div>
                <div style="font-size:13px;font-weight:500;color:#0f172a">{{ lead.fullName || 'Anonymous' }}</div>
                <div style="font-size:11px;color:#94a3b8">{{ lead.email || 'No email' }}</div>
              </div>
            </div>
            <span class="status-chip" [class]="lead.status">{{ lead.status }}</span>
          </div>
        </div>

        <!-- Top Unanswered -->
        <div class="card">
          <div class="card-header">
            <span class="card-title">Top Unanswered</span>
          </div>
          <div *ngIf="!analytics?.topUnansweredQuestions?.length" class="empty-state" style="padding:20px 0">
            <mat-icon>check_circle_outline</mat-icon>
            <p>All questions answered!</p>
          </div>
          <div *ngFor="let q of analytics?.topUnansweredQuestions; let i = index" class="unanswered-item">
            <div class="unanswered-index">{{ i + 1 }}</div>
            <span style="font-size:12px;color:#475569">{{ q }}</span>
          </div>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(6, 1fr);
      gap: 14px;
      margin-bottom: 20px;
    }

    @media (max-width: 1200px) {
      .stats-grid { grid-template-columns: repeat(3, 1fr); }
    }

    @media (max-width: 768px) {
      .stats-grid { grid-template-columns: repeat(2, 1fr); }
    }

    .charts-row {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 16px;
      margin-bottom: 16px;
    }

    .chart-card { }

    .bar-chart {
      display: flex;
      align-items: flex-end;
      gap: 10px;
      height: 130px;
      padding-top: 16px;
    }

    .bar-group {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      height: 100%;
    }

    .bars {
      flex: 1;
      width: 100%;
      display: flex;
      flex-direction: column;
      justify-content: flex-end;
      gap: 2px;
    }

    .bar {
      width: 100%;
      border-radius: 3px 3px 0 0;
      min-height: 3px;
      transition: height 0.4s ease;
    }

    .bar-primary { background: #6366f1; }
    .bar-success { background: #10b981; }
    .bar-label {
      font-size: 10px;
      color: #94a3b8;
      margin-top: 5px;
      font-weight: 500;
    }

    .legend-dot {
      display: flex;
      align-items: center;
      gap: 5px;
      font-size: 11px;
      color: #64748b;
      font-weight: 500;

      &::before {
        content: '';
        display: inline-block;
        width: 8px;
        height: 8px;
        border-radius: 2px;
        background: inherit;
      }
    }

    .progress-track {
      background: #f1f5f9;
      border-radius: 6px;
      height: 7px;
      overflow: hidden;
    }

    .progress-fill {
      background: linear-gradient(90deg, #6366f1, #8b5cf6);
      height: 100%;
      border-radius: 6px;
      transition: width 0.4s ease;
    }

    .bottom-row {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 16px;
    }

    .list-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 0;
      border-bottom: 1px solid #f8fafc;

      &:last-child { border-bottom: none; }
    }

    .avatar-circle {
      width: 32px;
      height: 32px;
      min-width: 32px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: 700;
    }

    .view-all {
      font-size: 12px;
      color: #6366f1;
      text-decoration: none;
      font-weight: 500;

      &:hover { text-decoration: underline; }
    }

    .unanswered-item {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      padding: 8px 0;
      border-bottom: 1px solid #f8fafc;

      &:last-child { border-bottom: none; }
    }

    .unanswered-index {
      min-width: 20px;
      height: 20px;
      background: #fee2e2;
      color: #dc2626;
      border-radius: 50%;
      font-size: 10px;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  `]
})
export class DashboardComponent implements OnInit {
  private api = inject(ApiService);
  auth = inject(AuthService);

  chatbotCount = 0;
  analytics: any = null;
  conversations: Conversation[] = [];
  leads: Lead[] = [];

  get firstName(): string {
    return this.auth.currentUser()?.fullName?.split(' ')[0] || 'there';
  }

  get timeOfDay(): string {
    const h = new Date().getHours();
    if (h < 12) return 'morning';
    if (h < 17) return 'afternoon';
    return 'evening';
  }

  get channelEntries(): [string, number][] {
    if (!this.analytics?.channelBreakdown) return [];
    return Object.entries(this.analytics.channelBreakdown) as [string, number][];
  }

  get maxConv(): number {
    if (!this.analytics?.dailyStats?.length) return 1;
    return Math.max(1, ...this.analytics.dailyStats.map((d: any) => d.conversations));
  }

  barH(value: number, max: number): number {
    return max > 0 ? Math.max(3, Math.round((value / max) * 100)) : 3;
  }

  channelPct(value: number): number {
    const total = this.channelEntries.reduce((s, e) => s + e[1], 0);
    return total > 0 ? Math.round((value / total) * 100) : 0;
  }

  ngOnInit(): void {
    this.api.getChatbots().subscribe(r => this.chatbotCount = r.data?.length || 0);
    this.api.getAnalyticsOverview().subscribe(r => this.analytics = r.data);
    this.api.getConversations(0, 5).subscribe(r => this.conversations = r.data?.content || []);
    this.api.getLeads(0, 5).subscribe(r => this.leads = r.data?.content || []);
  }
}
