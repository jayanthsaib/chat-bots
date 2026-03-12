import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { NgFor, NgIf } from '@angular/common';
import { ApiService } from '../../../core/services/api.service';
import { Chatbot } from '../../../core/models/api.models';

@Component({
  selector: 'app-chatbot-list',
  standalone: true,
  imports: [RouterLink, MatCardModule, MatButtonModule, MatIconModule,
    MatChipsModule, MatMenuModule, MatSnackBarModule, NgFor, NgIf],
  template: `
    <div class="page-container">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px">
        <h2 style="margin:0">My Chatbots</h2>
        <button mat-raised-button color="primary" routerLink="/chatbots/new">
          <mat-icon>add</mat-icon> Create Chatbot
        </button>
      </div>

      <div *ngIf="chatbots.length === 0" style="text-align:center;padding:80px 20px">
        <mat-icon style="font-size:64px;width:64px;height:64px;color:#d1d5db">smart_toy</mat-icon>
        <h3 style="color:#374151">No chatbots yet</h3>
        <p style="color:#9ca3af">Create your first AI chatbot to get started</p>
        <button mat-raised-button color="primary" routerLink="/chatbots/new">Create Chatbot</button>
      </div>

      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:20px">
        <mat-card *ngFor="let bot of chatbots" style="cursor:pointer"
                  [routerLink]="['/chatbots', bot.id]">
          <mat-card-header>
            <div mat-card-avatar
                 [style.background]="bot.widgetColor"
                 style="display:flex;align-items:center;justify-content:center;border-radius:50%;color:white;font-weight:700">
              {{ bot.name[0] }}
            </div>
            <mat-card-title>{{ bot.name }}</mat-card-title>
            <mat-card-subtitle>{{ bot.language?.toUpperCase() }}</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <p style="color:#6b7280;font-size:13px;height:40px;overflow:hidden">
              {{ bot.description || 'No description' }}
            </p>
            <span class="status-chip" [class]="bot.status">{{ bot.status }}</span>
          </mat-card-content>
          <mat-card-actions>
            <button mat-button color="primary" [routerLink]="['/chatbots', bot.id]">Manage</button>
            <button mat-button color="warn" (click)="$event.stopPropagation(); delete(bot)">Delete</button>
          </mat-card-actions>
        </mat-card>
      </div>
    </div>
  `
})
export class ChatbotListComponent implements OnInit {
  private api = inject(ApiService);
  private snack = inject(MatSnackBar);

  chatbots: Chatbot[] = [];

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.api.getChatbots().subscribe(r => this.chatbots = r.data || []);
  }

  delete(bot: Chatbot): void {
    if (!confirm(`Delete "${bot.name}"?`)) return;
    this.api.deleteChatbot(bot.id).subscribe({
      next: () => { this.snack.open('Chatbot deleted', '', { duration: 2000 }); this.load(); },
      error: () => this.snack.open('Failed to delete', 'Close', { duration: 3000 })
    });
  }
}
