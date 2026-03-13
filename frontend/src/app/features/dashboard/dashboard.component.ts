import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { DatePipe, NgFor, NgIf } from '@angular/common';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { Conversation, Lead } from '../../core/models/api.models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, MatCardModule, MatButtonModule, MatIconModule, DatePipe, NgFor, NgIf],
  template: `
    <div class="page-container">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:24px">
        <div>
          <h2 style="margin:0;font-size:24px">Welcome back, {{ auth.currentUser()?.fullName?.split(' ')[0] }}!</h2>
          <p style="color:#6b7280;margin:4px 0 0">Here's what's happening with your chatbots</p>
        </div>
        <button mat-raised-button color="primary" routerLink="/chatbots/new">
          <mat-icon>add</mat-icon> New Chatbot
        </button>
      </div>

      <!-- Stats cards -->
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:16px;margin-bottom:32px">
        <mat-card>
          <mat-card-content style="padding:20px">
            <div style="display:flex;align-items:center;gap:16px">
              <div style="background:#ede9fe;padding:12px;border-radius:12px">
                <mat-icon style="color:#7c3aed">smart_toy</mat-icon>
              </div>
              <div>
                <div style="font-size:28px;font-weight:700">{{ chatbotCount }}</div>
                <div style="color:#6b7280;font-size:13px">Chatbots</div>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card>
          <mat-card-content style="padding:20px">
            <div style="display:flex;align-items:center;gap:16px">
              <div style="background:#dbeafe;padding:12px;border-radius:12px">
                <mat-icon style="color:#2563eb">chat</mat-icon>
              </div>
              <div>
                <div style="font-size:28px;font-weight:700">{{ conversationCount }}</div>
                <div style="color:#6b7280;font-size:13px">Conversations</div>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card>
          <mat-card-content style="padding:20px">
            <div style="display:flex;align-items:center;gap:16px">
              <div style="background:#d1fae5;padding:12px;border-radius:12px">
                <mat-icon style="color:#059669">contacts</mat-icon>
              </div>
              <div>
                <div style="font-size:28px;font-weight:700">{{ leadCount }}</div>
                <div style="color:#6b7280;font-size:13px">Leads Captured</div>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px">
        <!-- Recent Conversations -->
        <mat-card>
          <mat-card-header>
            <mat-card-title>Recent Conversations</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div *ngIf="conversations.length === 0" style="color:#9ca3af;padding:16px 0;text-align:center">
              No conversations yet
            </div>
            <div *ngFor="let conv of conversations" style="padding:12px 0;border-bottom:1px solid #f3f4f6">
              <div style="display:flex;justify-content:space-between;align-items:center">
                <div>
                  <span class="status-chip" [class]="conv.status">{{ conv.status }}</span>
                  <span style="margin-left:8px;font-size:13px;color:#374151">{{ conv.channel }}</span>
                </div>
                <span style="font-size:12px;color:#9ca3af">{{ conv.lastMessageAt | date:'short' }}</span>
              </div>
            </div>
            <a routerLink="/conversations" style="display:block;text-align:center;margin-top:12px;color:#4F46E5;font-size:13px">
              View all conversations →
            </a>
          </mat-card-content>
        </mat-card>

        <!-- Recent Leads -->
        <mat-card>
          <mat-card-header>
            <mat-card-title>Recent Leads</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div *ngIf="leads.length === 0" style="color:#9ca3af;padding:16px 0;text-align:center">
              No leads captured yet
            </div>
            <div *ngFor="let lead of leads" style="padding:12px 0;border-bottom:1px solid #f3f4f6">
              <div style="display:flex;justify-content:space-between;align-items:center">
                <div>
                  <div style="font-weight:500;font-size:14px">{{ lead.fullName || 'Anonymous' }}</div>
                  <div style="font-size:12px;color:#9ca3af">{{ lead.email || 'No email' }}</div>
                </div>
                <span class="status-chip" [class]="lead.status">{{ lead.status }}</span>
              </div>
            </div>
            <a routerLink="/leads" style="display:block;text-align:center;margin-top:12px;color:#4F46E5;font-size:13px">
              View all leads →
            </a>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `
})
export class DashboardComponent implements OnInit {
  private api = inject(ApiService);
  auth = inject(AuthService);

  chatbotCount = 0;
  conversationCount = 0;
  leadCount = 0;
  conversations: Conversation[] = [];
  leads: Lead[] = [];

  ngOnInit(): void {
    this.api.getChatbots().subscribe(r => this.chatbotCount = r.data?.length || 0);
    this.api.getConversations(0, 5).subscribe(r => {
      this.conversations = r.data?.content || [];
      this.conversationCount = r.data?.totalElements || 0;
    });
    this.api.getLeads(0, 5).subscribe(r => {
      this.leads = r.data?.content || [];
      this.leadCount = r.data?.totalElements || 0;
    });
  }
}
