import { Component, OnInit, inject } from '@angular/core';
import { MatListModule } from '@angular/material/list';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { DatePipe, NgFor, NgIf } from '@angular/common';
import { ApiService } from '../../../core/services/api.service';
import { Conversation, Message } from '../../../core/models/api.models';

@Component({
  selector: 'app-conversation-inbox',
  standalone: true,
  imports: [MatListModule, MatCardModule, MatButtonModule, MatIconModule,
    MatDividerModule, DatePipe, NgFor, NgIf],
  template: `
    <div style="display:flex;height:calc(100vh - 64px)">
      <!-- Left Panel: Conversation List -->
      <div style="width:320px;border-right:1px solid #e5e7eb;overflow-y:auto">
        <div style="padding:16px;border-bottom:1px solid #e5e7eb">
          <h3 style="margin:0">Conversations</h3>
          <span style="font-size:13px;color:#9ca3af">{{ conversations.length }} total</span>
        </div>
        <mat-list>
          <mat-list-item *ngFor="let conv of conversations"
                         (click)="selectConversation(conv)"
                         [style.background]="selected?.id === conv.id ? '#f0f0ff' : ''"
                         style="cursor:pointer;border-bottom:1px solid #f3f4f6">
            <mat-icon matListItemIcon>chat_bubble_outline</mat-icon>
            <div matListItemTitle style="font-size:14px">
              <span class="status-chip" [class]="conv.status" style="margin-right:8px">{{ conv.status }}</span>
              {{ conv.channel }}
            </div>
            <div matListItemLine style="font-size:12px;color:#9ca3af">
              {{ conv.lastMessageAt | date:'short' }}
            </div>
          </mat-list-item>
        </mat-list>
      </div>

      <!-- Right Panel: Messages -->
      <div style="flex:1;display:flex;flex-direction:column">
        <div *ngIf="!selected" style="flex:1;display:flex;align-items:center;justify-content:center;color:#9ca3af">
          <div style="text-align:center">
            <mat-icon style="font-size:48px;width:48px;height:48px">chat</mat-icon>
            <p>Select a conversation</p>
          </div>
        </div>

        <div *ngIf="selected" style="display:flex;flex-direction:column;height:100%">
          <!-- Header -->
          <div style="padding:16px;border-bottom:1px solid #e5e7eb;display:flex;justify-content:space-between;align-items:center">
            <div>
              <span style="font-weight:600">Session: {{ selected.sessionId.substring(0, 16) }}...</span>
              <span style="margin-left:8px" class="status-chip" [class]="selected.status">{{ selected.status }}</span>
            </div>
            <button mat-button color="primary" *ngIf="selected.status === 'open'" (click)="resolve()">
              <mat-icon>check_circle</mat-icon> Resolve
            </button>
          </div>

          <!-- Messages -->
          <div style="flex:1;overflow-y:auto;padding:16px;background:#f9fafb;display:flex;flex-direction:column;gap:8px">
            <div *ngFor="let msg of messages"
                 [style.align-self]="msg.role === 'user' ? 'flex-end' : 'flex-start'"
                 [style.max-width]="'75%'">
              <div [style.background]="msg.role === 'user' ? '#4F46E5' : 'white'"
                   [style.color]="msg.role === 'user' ? 'white' : '#111827'"
                   style="padding:10px 14px;border-radius:12px;font-size:14px;line-height:1.5;box-shadow:0 1px 4px rgba(0,0,0,0.08)">
                {{ msg.content }}
              </div>
              <div style="font-size:11px;color:#9ca3af;margin-top:2px;text-align:right">
                {{ msg.createdAt | date:'short' }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class ConversationInboxComponent implements OnInit {
  private api = inject(ApiService);

  conversations: Conversation[] = [];
  selected: Conversation | null = null;
  messages: Message[] = [];

  ngOnInit(): void {
    this.api.getConversations(0, 50).subscribe(r => this.conversations = r.data?.content || []);
  }

  selectConversation(conv: Conversation): void {
    this.selected = conv;
    this.api.getConversation(conv.id).subscribe(r => {
      this.messages = r.data?.messages || [];
    });
  }

  resolve(): void {
    if (!this.selected) return;
    this.api.resolveConversation(this.selected.id).subscribe(r => {
      this.selected = r.data;
      const idx = this.conversations.findIndex(c => c.id === r.data.id);
      if (idx >= 0) this.conversations[idx] = r.data;
    });
  }
}
