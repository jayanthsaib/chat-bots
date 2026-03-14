import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';

declare const Razorpay: any;

@Component({
  selector: 'app-pricing',
  standalone: true,
  imports: [CommonModule, RouterLink, MatCardModule, MatButtonModule, MatIconModule,
    MatChipsModule, MatProgressSpinnerModule, MatSnackBarModule],
  template: `
    <div class="pricing-page">
      <div class="header">
        <h1>Simple, Transparent Pricing</h1>
        <p>Choose the plan that fits your business. Upgrade or downgrade anytime.</p>
        <a routerLink="/billing" class="billing-link">
          <mat-icon>receipt_long</mat-icon> View billing & usage
        </a>
      </div>

      <div *ngIf="loading" class="loading-center">
        <mat-spinner diameter="48"></mat-spinner>
      </div>

      <div *ngIf="!loading" class="plans-grid">
        <mat-card *ngFor="let plan of plans" [class.popular]="plan.name === 'growth'" class="plan-card">
          <div *ngIf="plan.name === 'growth'" class="popular-badge">Most Popular</div>
          <div *ngIf="currentPlanName === plan.name" class="current-badge">Current Plan</div>

          <mat-card-content>
            <div class="plan-icon" [class]="'icon-' + plan.name">
              <mat-icon>{{ iconFor(plan.name) }}</mat-icon>
            </div>

            <h2 class="plan-name">{{ plan.displayName }}</h2>

            <div class="plan-price">
              <ng-container *ngIf="plan.priceInr === 0; else paidPrice">
                <span class="amount free">Free</span>
              </ng-container>
              <ng-template #paidPrice>
                <span class="currency">₹</span>
                <span class="amount">{{ plan.priceInr | number }}</span>
                <span class="period">/month</span>
              </ng-template>
            </div>

            <ul class="features-list">
              <li>
                <mat-icon class="check-icon">check_circle</mat-icon>
                <span>{{ plan.maxBots === -1 ? 'Unlimited chatbots' : plan.maxBots + ' chatbot' + (plan.maxBots > 1 ? 's' : '') }}</span>
              </li>
              <li>
                <mat-icon class="check-icon">check_circle</mat-icon>
                <span>{{ plan.maxMessagesPerMonth === -1 ? 'Unlimited messages' : (plan.maxMessagesPerMonth | number) + ' messages/month' }}</span>
              </li>
              <li>
                <mat-icon class="check-icon">check_circle</mat-icon>
                <span>{{ plan.maxKnowledgeSources === -1 ? 'Unlimited knowledge sources' : plan.maxKnowledgeSources + ' knowledge sources' }}</span>
              </li>
              <li *ngIf="plan.name !== 'free'">
                <mat-icon class="check-icon">check_circle</mat-icon>
                <span>Priority support</span>
              </li>
              <li *ngIf="plan.name === 'pro' || plan.name === 'growth'">
                <mat-icon class="check-icon">check_circle</mat-icon>
                <span>Advanced analytics</span>
              </li>
              <li *ngIf="plan.name === 'pro'">
                <mat-icon class="check-icon">check_circle</mat-icon>
                <span>Custom integrations</span>
              </li>
            </ul>

            <button mat-raised-button
              [class.btn-popular]="plan.name === 'growth'"
              [disabled]="currentPlanName === plan.name || plan.name === 'free' || subscribing === plan.name"
              (click)="subscribe(plan)"
              class="cta-btn">
              <mat-spinner *ngIf="subscribing === plan.name" diameter="18" style="display:inline-block;margin-right:8px;"></mat-spinner>
              <span *ngIf="currentPlanName === plan.name">Current Plan</span>
              <span *ngIf="currentPlanName !== plan.name && plan.name === 'free'">Default</span>
              <span *ngIf="currentPlanName !== plan.name && plan.name !== 'free' && subscribing !== plan.name">Get Started</span>
              <span *ngIf="subscribing === plan.name">Processing...</span>
            </button>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .pricing-page {
      padding: 40px 24px;
      max-width: 1100px;
      margin: 0 auto;
    }

    .header {
      text-align: center;
      margin-bottom: 48px;
    }

    .header h1 {
      font-size: 2rem;
      font-weight: 700;
      color: #1a1a2e;
      margin: 0 0 12px;
    }

    .header p {
      font-size: 1rem;
      color: #6b7280;
      margin: 0 0 16px;
    }

    .billing-link {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      color: #4F46E5;
      text-decoration: none;
      font-size: 0.9rem;
      font-weight: 500;
    }

    .billing-link:hover { text-decoration: underline; }

    .loading-center {
      display: flex;
      justify-content: center;
      padding: 80px;
    }

    .plans-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      gap: 24px;
      align-items: start;
    }

    .plan-card {
      position: relative;
      border-radius: 16px !important;
      padding: 8px;
      transition: transform 0.2s, box-shadow 0.2s;
    }

    .plan-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 12px 32px rgba(0,0,0,0.12) !important;
    }

    .plan-card.popular {
      border: 2px solid #4F46E5;
      box-shadow: 0 8px 24px rgba(79,70,229,0.15) !important;
    }

    .popular-badge, .current-badge {
      position: absolute;
      top: -14px;
      left: 50%;
      transform: translateX(-50%);
      padding: 4px 14px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 700;
      white-space: nowrap;
    }

    .popular-badge {
      background: #4F46E5;
      color: #fff;
    }

    .current-badge {
      background: #10b981;
      color: #fff;
    }

    .plan-icon {
      width: 56px;
      height: 56px;
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 16px;
    }

    .plan-icon mat-icon { font-size: 28px; width: 28px; height: 28px; }

    .icon-free { background: #f3f4f6; }
    .icon-free mat-icon { color: #6b7280; }
    .icon-starter { background: #d1fae5; }
    .icon-starter mat-icon { color: #10b981; }
    .icon-growth { background: #ede9fe; }
    .icon-growth mat-icon { color: #4F46E5; }
    .icon-pro { background: #fef3c7; }
    .icon-pro mat-icon { color: #f59e0b; }

    .plan-name {
      font-size: 1.25rem;
      font-weight: 700;
      color: #1a1a2e;
      margin: 0 0 12px;
    }

    .plan-price {
      display: flex;
      align-items: baseline;
      gap: 2px;
      margin-bottom: 24px;
    }

    .currency {
      font-size: 1.25rem;
      font-weight: 600;
      color: #4F46E5;
    }

    .amount {
      font-size: 2.5rem;
      font-weight: 800;
      color: #1a1a2e;
      line-height: 1;
    }

    .amount.free { font-size: 1.8rem; color: #6b7280; }

    .period {
      font-size: 0.9rem;
      color: #6b7280;
      margin-left: 2px;
    }

    .features-list {
      list-style: none;
      padding: 0;
      margin: 0 0 28px;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .features-list li {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.9rem;
      color: #374151;
    }

    .check-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      color: #10b981;
    }

    .cta-btn {
      width: 100%;
      padding: 10px;
      border-radius: 8px !important;
      font-weight: 600;
      font-size: 0.95rem;
    }

    .btn-popular {
      background: #4F46E5 !important;
      color: #fff !important;
    }
  `]
})
export class PricingComponent implements OnInit {
  private api = inject(ApiService);
  private auth = inject(AuthService);
  private snack = inject(MatSnackBar);

  plans: any[] = [];
  currentPlanName = 'free';
  loading = true;
  subscribing: string | null = null;

  ngOnInit() {
    this.api.getPlans().subscribe({
      next: res => {
        this.plans = res.data ?? [];
        this.api.getSubscriptionStatus().subscribe({
          next: sub => {
            this.currentPlanName = sub.data?.planName ?? 'free';
            this.loading = false;
          },
          error: () => { this.loading = false; }
        });
      },
      error: () => { this.loading = false; }
    });
  }

  iconFor(name: string): string {
    const icons: Record<string, string> = {
      free: 'star_outline',
      starter: 'rocket_launch',
      growth: 'trending_up',
      pro: 'workspace_premium'
    };
    return icons[name] ?? 'star';
  }

  subscribe(plan: any) {
    if (plan.name === 'free' || this.currentPlanName === plan.name) return;
    this.subscribing = plan.name;

    this.api.subscribe(plan.name).subscribe({
      next: res => {
        const { subscriptionId, keyId } = res.data;
        this.openRazorpay(plan, subscriptionId, keyId);
        this.subscribing = null;
      },
      error: err => {
        this.subscribing = null;
        const msg = err.error?.message ?? 'Failed to initiate subscription';
        this.snack.open(msg, 'Close', { duration: 4000, panelClass: 'snack-error' });
      }
    });
  }

  private openRazorpay(plan: any, subscriptionId: string, keyId: string) {
    const user = this.auth.currentUser();
    const options = {
      key: keyId,
      subscription_id: subscriptionId,
      name: 'BotForge',
      description: `${plan.displayName} Plan`,
      handler: (response: any) => {
        this.snack.open(
          `Subscribed to ${plan.displayName}! Your plan will activate shortly.`,
          'Close', { duration: 5000, panelClass: 'snack-success' }
        );
        // Refresh subscription status after a short delay
        setTimeout(() => {
          this.api.getSubscriptionStatus().subscribe({
            next: sub => { this.currentPlanName = sub.data?.planName ?? this.currentPlanName; }
          });
        }, 3000);
      },
      prefill: {
        name: user?.businessName ?? '',
        email: user?.email ?? ''
      },
      theme: { color: '#4F46E5' }
    };
    const rzp = new Razorpay(options);
    rzp.on('payment.failed', (response: any) => {
      this.snack.open('Payment failed: ' + (response.error?.description ?? 'Unknown error'),
        'Close', { duration: 5000, panelClass: 'snack-error' });
    });
    rzp.open();
  }
}
