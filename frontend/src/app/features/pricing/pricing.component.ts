import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { CommonModule } from '@angular/common';

interface Plan {
  name: string;
  price: number;
  features: string[];
  popular?: boolean;
  icon: string;
  color: string;
}

@Component({
  selector: 'app-pricing',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, MatChipsModule],
  template: `
    <div class="pricing-page">
      <div class="header">
        <h1>Simple, Transparent Pricing</h1>
        <p>Choose the plan that fits your business. Upgrade or downgrade anytime.</p>
      </div>

      <div class="plans-grid">
        <mat-card *ngFor="let plan of plans" [class.popular]="plan.popular" class="plan-card">
          <mat-chip *ngIf="plan.popular" class="popular-chip">Most Popular</mat-chip>

          <mat-card-content>
            <div class="plan-icon" [style.background]="plan.color + '20'">
              <mat-icon [style.color]="plan.color">{{ plan.icon }}</mat-icon>
            </div>

            <h2 class="plan-name">{{ plan.name }}</h2>

            <div class="plan-price">
              <span class="currency">₹</span>
              <span class="amount">{{ plan.price | number }}</span>
              <span class="period">/month</span>
            </div>

            <ul class="features-list">
              <li *ngFor="let feature of plan.features">
                <mat-icon class="check-icon">check_circle</mat-icon>
                <span>{{ feature }}</span>
              </li>
            </ul>

            <button mat-raised-button
              [style.background]="plan.popular ? plan.color : ''"
              [style.color]="plan.popular ? '#fff' : ''"
              [color]="plan.popular ? '' : 'primary'"
              class="cta-btn">
              Get Started
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
      margin: 0;
    }

    .plans-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
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

    .popular-chip {
      position: absolute;
      top: -14px;
      left: 50%;
      transform: translateX(-50%);
      background: #4F46E5 !important;
      color: #fff !important;
      font-size: 12px;
      font-weight: 600;
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

    .plan-icon mat-icon {
      font-size: 28px;
      width: 28px;
      height: 28px;
    }

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
      border-radius: 8px;
      font-weight: 600;
      font-size: 0.95rem;
    }
  `]
})
export class PricingComponent {
  plans: Plan[] = [
    {
      name: 'Starter',
      price: 999,
      icon: 'rocket_launch',
      color: '#10b981',
      features: [
        'Website chatbot',
        '500 messages/month',
        'Basic analytics',
        'Email support'
      ]
    },
    {
      name: 'Growth',
      price: 1999,
      icon: 'trending_up',
      color: '#4F46E5',
      popular: true,
      features: [
        'Website + WhatsApp chatbot',
        '5,000 messages/month',
        'Advanced analytics',
        'Lead capture',
        'Priority support'
      ]
    },
    {
      name: 'Pro',
      price: 3999,
      icon: 'workspace_premium',
      color: '#f59e0b',
      features: [
        'Unlimited messages',
        'All channels',
        'Advanced AI responses',
        'Custom integrations',
        'Dedicated support'
      ]
    }
  ];
}
