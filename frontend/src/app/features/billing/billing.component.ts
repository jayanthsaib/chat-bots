import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-billing',
  standalone: true,
  imports: [CommonModule, RouterLink, MatCardModule, MatButtonModule, MatIconModule,
    MatProgressBarModule, MatProgressSpinnerModule, MatDividerModule,
    MatSnackBarModule, MatDialogModule],
  template: `
    <div class="billing-page">
      <div class="page-header">
        <div>
          <h1>Billing & Usage</h1>
          <p>Monitor your usage and manage your subscription</p>
        </div>
        <a routerLink="/pricing" mat-stroked-button color="primary">
          <mat-icon>upgrade</mat-icon> Upgrade Plan
        </a>
      </div>

      <div *ngIf="loading" class="loading-center">
        <mat-spinner diameter="48"></mat-spinner>
      </div>

      <div *ngIf="!loading" class="content-grid">

        <!-- Current Plan Card -->
        <mat-card class="plan-card">
          <mat-card-header>
            <mat-icon mat-card-avatar class="plan-avatar">{{ planIcon }}</mat-icon>
            <mat-card-title>Current Plan</mat-card-title>
            <mat-card-subtitle>{{ subscription?.status ?? 'active' }}</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <div class="plan-name-row">
              <span class="plan-badge" [class]="'badge-' + (subscription?.planName ?? 'free')">
                {{ subscription?.planDisplayName ?? 'Free' }}
              </span>
              <span *ngIf="subscription?.priceInr" class="plan-price">
                ₹{{ subscription?.priceInr | number }}/month
              </span>
            </div>

            <mat-divider style="margin: 16px 0;"></mat-divider>

            <div *ngIf="subscription?.currentPeriodEnd" class="info-row">
              <mat-icon>calendar_today</mat-icon>
              <span>Renews on {{ subscription?.currentPeriodEnd | date:'mediumDate' }}</span>
            </div>
            <div *ngIf="subscription?.razorpaySubscriptionId" class="info-row">
              <mat-icon>receipt</mat-icon>
              <span>Subscription ID: {{ subscription?.razorpaySubscriptionId }}</span>
            </div>
          </mat-card-content>
          <mat-card-actions *ngIf="subscription?.planName && subscription?.planName !== 'free'">
            <button mat-button color="warn" (click)="cancelSubscription()" [disabled]="cancelling">
              <mat-spinner *ngIf="cancelling" diameter="16" style="display:inline-block;margin-right:6px;"></mat-spinner>
              {{ cancelling ? 'Cancelling...' : 'Cancel Subscription' }}
            </button>
          </mat-card-actions>
        </mat-card>

        <!-- Usage Card -->
        <mat-card class="usage-card">
          <mat-card-header>
            <mat-icon mat-card-avatar class="usage-avatar">bar_chart</mat-icon>
            <mat-card-title>Usage This Month</mat-card-title>
            <mat-card-subtitle>{{ currentMonth }}</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>

            <!-- Messages -->
            <div class="usage-item">
              <div class="usage-label-row">
                <div class="usage-label">
                  <mat-icon>chat</mat-icon>
                  <span>Messages</span>
                </div>
                <span class="usage-count">
                  {{ usage?.messagesThisMonth | number }} / {{ usage?.maxMessages === -1 ? '∞' : (usage?.maxMessages | number) }}
                </span>
              </div>
              <mat-progress-bar
                [value]="usagePercent(usage?.messagesThisMonth, usage?.maxMessages)"
                [color]="usagePercent(usage?.messagesThisMonth, usage?.maxMessages) > 85 ? 'warn' : 'primary'"
                mode="determinate">
              </mat-progress-bar>
              <span *ngIf="usage?.maxMessages !== -1" class="usage-remaining">
                {{ (usage?.maxMessages - usage?.messagesThisMonth) | number }} remaining
              </span>
            </div>

            <mat-divider style="margin: 20px 0;"></mat-divider>

            <!-- Chatbots -->
            <div class="usage-item">
              <div class="usage-label-row">
                <div class="usage-label">
                  <mat-icon>smart_toy</mat-icon>
                  <span>Chatbots</span>
                </div>
                <span class="usage-count">
                  {{ usage?.botsUsed }} / {{ usage?.maxBots === -1 ? '∞' : usage?.maxBots }}
                </span>
              </div>
              <mat-progress-bar
                [value]="usagePercent(usage?.botsUsed, usage?.maxBots)"
                [color]="usagePercent(usage?.botsUsed, usage?.maxBots) > 85 ? 'warn' : 'primary'"
                mode="determinate">
              </mat-progress-bar>
            </div>

            <mat-divider style="margin: 20px 0;"></mat-divider>

            <!-- Knowledge Sources -->
            <div class="usage-item">
              <div class="usage-label-row">
                <div class="usage-label">
                  <mat-icon>library_books</mat-icon>
                  <span>Knowledge Sources</span>
                </div>
                <span class="usage-count">
                  {{ usage?.knowledgeSourcesUsed }} / {{ usage?.maxKnowledgeSources === -1 ? '∞' : usage?.maxKnowledgeSources }}
                </span>
              </div>
              <mat-progress-bar
                [value]="usagePercent(usage?.knowledgeSourcesUsed, usage?.maxKnowledgeSources)"
                [color]="usagePercent(usage?.knowledgeSourcesUsed, usage?.maxKnowledgeSources) > 85 ? 'warn' : 'primary'"
                mode="determinate">
              </mat-progress-bar>
            </div>

          </mat-card-content>
        </mat-card>

      </div>
    </div>
  `,
  styles: [`
    .billing-page {
      padding: 32px 24px;
      max-width: 960px;
      margin: 0 auto;
    }

    .page-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      margin-bottom: 32px;
    }

    .page-header h1 {
      font-size: 1.75rem;
      font-weight: 700;
      color: #1a1a2e;
      margin: 0 0 4px;
    }

    .page-header p {
      color: #6b7280;
      margin: 0;
      font-size: 0.9rem;
    }

    .loading-center {
      display: flex;
      justify-content: center;
      padding: 80px;
    }

    .content-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
    }

    @media (max-width: 700px) {
      .content-grid { grid-template-columns: 1fr; }
    }

    .plan-card, .usage-card {
      border-radius: 16px !important;
    }

    .plan-avatar { background: #ede9fe; color: #4F46E5; }
    .usage-avatar { background: #d1fae5; color: #10b981; }

    .plan-name-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-top: 8px;
    }

    .plan-badge {
      padding: 4px 16px;
      border-radius: 20px;
      font-weight: 700;
      font-size: 0.9rem;
    }

    .badge-free { background: #f3f4f6; color: #6b7280; }
    .badge-starter { background: #d1fae5; color: #059669; }
    .badge-growth { background: #ede9fe; color: #4F46E5; }
    .badge-pro { background: #fef3c7; color: #d97706; }

    .plan-price {
      font-size: 1.1rem;
      font-weight: 600;
      color: #1a1a2e;
    }

    .info-row {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.85rem;
      color: #6b7280;
      margin-top: 8px;
    }

    .info-row mat-icon { font-size: 16px; width: 16px; height: 16px; }

    .usage-item { margin-bottom: 4px; }

    .usage-label-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 8px;
    }

    .usage-label {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.9rem;
      font-weight: 500;
      color: #374151;
    }

    .usage-label mat-icon { font-size: 18px; width: 18px; height: 18px; color: #6b7280; }

    .usage-count {
      font-size: 0.85rem;
      font-weight: 600;
      color: #1a1a2e;
    }

    .usage-remaining {
      font-size: 0.78rem;
      color: #6b7280;
      display: block;
      margin-top: 4px;
      text-align: right;
    }
  `]
})
export class BillingComponent implements OnInit {
  private api = inject(ApiService);
  private snack = inject(MatSnackBar);

  loading = true;
  subscription: any = null;
  usage: any = null;
  cancelling = false;
  currentMonth = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });

  get planIcon(): string {
    const icons: Record<string, string> = {
      free: 'star_outline', starter: 'rocket_launch', growth: 'trending_up', pro: 'workspace_premium'
    };
    return icons[this.subscription?.planName ?? 'free'] ?? 'star_outline';
  }

  ngOnInit() {
    this.api.getSubscriptionStatus().subscribe({
      next: res => {
        this.subscription = res.data;
        this.api.getUsage().subscribe({
          next: u => { this.usage = u.data; this.loading = false; },
          error: () => { this.loading = false; }
        });
      },
      error: () => { this.loading = false; }
    });
  }

  usagePercent(used: number, max: number): number {
    if (!used || !max || max === -1) return 0;
    return Math.min(100, Math.round((used / max) * 100));
  }

  cancelSubscription() {
    if (!confirm('Are you sure you want to cancel your subscription? You will keep access until the end of the billing period.')) return;
    this.cancelling = true;
    this.api.cancelSubscription().subscribe({
      next: () => {
        this.cancelling = false;
        this.snack.open('Subscription cancelled. You retain access until period end.', 'Close', { duration: 5000 });
        this.ngOnInit();
      },
      error: err => {
        this.cancelling = false;
        this.snack.open(err.error?.message ?? 'Cancellation failed', 'Close', { duration: 4000, panelClass: 'snack-error' });
      }
    });
  }
}
