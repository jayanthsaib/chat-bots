import { Component, OnInit, AfterViewChecked, ElementRef, ViewChild, inject, NgZone, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { NgFor, NgIf, DatePipe } from '@angular/common';
import { ApiService } from '../../../core/services/api.service';
import { Chatbot, KnowledgeSource } from '../../../core/models/api.models';

@Component({
  selector: 'app-chatbot-detail',
  standalone: true,
  imports: [RouterLink, FormsModule, MatTabsModule, MatCardModule, MatButtonModule,
    MatIconModule, MatFormFieldModule, MatInputModule, MatSnackBarModule, NgFor, NgIf, DatePipe],
  template: `
    <div class="page-container" *ngIf="chatbot">
      <div style="display:flex;align-items:center;gap:16px;margin-bottom:24px">
        <button mat-icon-button routerLink="/chatbots"><mat-icon>arrow_back</mat-icon></button>
        <div>
          <h2 style="margin:0">{{ chatbot.name }}</h2>
          <span class="status-chip" [class]="chatbot.status">{{ chatbot.status }}</span>
        </div>
      </div>

      <mat-tab-group>
        <!-- Knowledge Base Tab -->
        <mat-tab label="Knowledge Base">
          <div style="padding:24px 0">
            <div style="display:flex;gap:16px;margin-bottom:24px;flex-wrap:wrap">
              <!-- Add Text -->
              <mat-card style="flex:1;min-width:280px">
                <mat-card-header><mat-card-title>Add Text</mat-card-title></mat-card-header>
                <mat-card-content>
                  <mat-form-field appearance="outline" style="width:100%;margin-top:16px">
                    <mat-label>Title</mat-label>
                    <input matInput [(ngModel)]="textTitle">
                  </mat-form-field>
                  <mat-form-field appearance="outline" style="width:100%">
                    <mat-label>Content</mat-label>
                    <textarea matInput [(ngModel)]="textContent" rows="5" placeholder="Paste your business information, policies, FAQs..."></textarea>
                  </mat-form-field>
                </mat-card-content>
                <mat-card-actions>
                  <button mat-raised-button color="primary" (click)="addText()" [disabled]="!textContent">
                    <mat-icon>upload</mat-icon> Add Text
                  </button>
                </mat-card-actions>
              </mat-card>

              <!-- Add URL -->
              <mat-card style="flex:1;min-width:280px">
                <mat-card-header><mat-card-title>Scrape Website</mat-card-title></mat-card-header>
                <mat-card-content>
                  <mat-form-field appearance="outline" style="width:100%;margin-top:16px">
                    <mat-label>Website URL</mat-label>
                    <input matInput [(ngModel)]="url" placeholder="https://yourwebsite.com/about">
                  </mat-form-field>
                </mat-card-content>
                <mat-card-actions>
                  <button mat-raised-button color="primary" (click)="addUrl()" [disabled]="!url">
                    <mat-icon>language</mat-icon> Scrape URL
                  </button>
                </mat-card-actions>
              </mat-card>

              <!-- Upload File -->
              <mat-card style="flex:1;min-width:280px">
                <mat-card-header><mat-card-title>Upload Document</mat-card-title></mat-card-header>
                <mat-card-content style="padding-top:16px">
                  <p style="color:#6b7280;font-size:13px">Upload PDF or TXT files (max 10MB)</p>
                  <input #fileInput type="file" accept=".pdf,.txt" style="display:none"
                         (change)="onFileSelected($event)">
                </mat-card-content>
                <mat-card-actions>
                  <button mat-raised-button color="primary" (click)="fileInput.click()">
                    <mat-icon>attach_file</mat-icon> Choose File
                  </button>
                </mat-card-actions>
              </mat-card>
            </div>

            <!-- Knowledge Sources List -->
            <h3>Knowledge Sources ({{ sources.length }})</h3>
            <div *ngIf="sources.length === 0" style="color:#9ca3af;text-align:center;padding:32px">
              No knowledge sources yet. Add content above to train your chatbot.
            </div>
            <mat-card *ngFor="let source of sources" style="margin-bottom:8px">
              <mat-card-content style="padding:12px 16px;display:flex;align-items:center;gap:12px">
                <mat-icon style="color:#6b7280">{{ getSourceIcon(source.sourceType) }}</mat-icon>
                <div style="flex:1">
                  <div style="font-weight:500">{{ source.title }}</div>
                  <div style="font-size:12px;color:#9ca3af">{{ source.chunkCount }} chunks · {{ source.createdAt | date:'short' }}</div>
                </div>
                <span class="status-chip" [class]="source.status">{{ source.status }}</span>
                <button mat-icon-button color="warn" (click)="deleteSource(source)">
                  <mat-icon>delete</mat-icon>
                </button>
              </mat-card-content>
            </mat-card>
          </div>
        </mat-tab>

        <!-- Embed Code Tab -->
        <mat-tab label="Deploy">
          <div style="padding:24px 0;max-width:600px">
            <h3>Get Your API Key</h3>
            <p style="color:#6b7280;font-size:14px">Generate an API key to use with the widget embed code.</p>
            <button mat-raised-button color="primary" (click)="generateApiKey()" style="margin-bottom:24px">
              <mat-icon>vpn_key</mat-icon> Generate New API Key
            </button>

            <div *ngIf="apiKey" style="margin-bottom:24px">
              <mat-form-field appearance="outline" style="width:100%">
                <mat-label>API Key (save this — shown once)</mat-label>
                <input matInput [value]="apiKey" readonly>
                <button mat-icon-button matSuffix (click)="copy(apiKey)"><mat-icon>content_copy</mat-icon></button>
              </mat-form-field>
            </div>

            <h3>Embed Code</h3>
            <p style="color:#6b7280;font-size:14px">Paste this before &lt;/body&gt; on your website.</p>
            <mat-form-field appearance="outline" style="width:100%">
              <textarea matInput [value]="embedCode" rows="6" readonly style="font-family:monospace;font-size:12px"></textarea>
            </mat-form-field>
            <button mat-button color="primary" (click)="copy(embedCode)">
              <mat-icon>content_copy</mat-icon> Copy Embed Code
            </button>
          </div>
        </mat-tab>

        <!-- Test Chat Tab -->
        <mat-tab label="Test Chat">
          <div style="padding:24px 0;max-width:600px">
            <div style="border:1px solid #e5e7eb;border-radius:12px;overflow:hidden">
              <!-- Messages -->
              <div #chatBox style="height:400px;overflow-y:auto;padding:16px;background:#f9fafb;display:flex;flex-direction:column;gap:12px">
                <div *ngIf="testMessages.length === 0" style="text-align:center;color:#9ca3af;margin-top:160px">
                  Send a message to test your chatbot
                </div>
                <div *ngFor="let msg of testMessages"
                     [style.align-self]="msg.role === 'user' ? 'flex-end' : 'flex-start'"
                     [style.max-width]="'80%'">
                  <div [style.background]="msg.role === 'user' ? '#4F46E5' : '#ffffff'"
                       [style.color]="msg.role === 'user' ? '#fff' : '#111'"
                       style="padding:10px 14px;border-radius:12px;font-size:14px;box-shadow:0 1px 3px rgba(0,0,0,0.1);white-space:pre-wrap">
                    {{ msg.content }}
                  </div>
                </div>
              </div>
              <!-- Input -->
              <div style="display:flex;gap:8px;padding:12px;border-top:1px solid #e5e7eb;background:#fff">
                <input #chatInput matInput placeholder="Type a message..."
                       [(ngModel)]="testInput"
                       (keydown.enter)="sendTestMessage()"
                       style="flex:1;border:1px solid #e5e7eb;border-radius:8px;padding:8px 12px;font-size:14px;outline:none">
                <button mat-raised-button color="primary" (click)="sendTestMessage()" [disabled]="!testInput || testLoading">
                  <mat-icon>send</mat-icon>
                </button>
              </div>
            </div>
          </div>
        </mat-tab>

        <!-- Settings Tab -->
        <mat-tab label="Settings">
          <div style="padding:24px 0;max-width:500px">
            <mat-form-field appearance="outline" style="width:100%;margin-bottom:16px">
              <mat-label>Chatbot Name</mat-label>
              <input matInput [(ngModel)]="chatbot.name">
            </mat-form-field>
            <mat-form-field appearance="outline" style="width:100%;margin-bottom:16px">
              <mat-label>Description</mat-label>
              <textarea matInput [(ngModel)]="chatbot.description" rows="3"></textarea>
            </mat-form-field>
            <mat-form-field appearance="outline" style="width:100%;margin-bottom:16px">
              <mat-label>Welcome Message</mat-label>
              <input matInput [(ngModel)]="chatbot.welcomeMessage">
            </mat-form-field>
            <mat-form-field appearance="outline" style="width:100%;margin-bottom:24px">
              <mat-label>Personality / System Instructions</mat-label>
              <textarea matInput [(ngModel)]="chatbot.personality" rows="5"></textarea>
            </mat-form-field>
            <button mat-raised-button color="primary" (click)="saveSettings()">Save Settings</button>
          </div>
        </mat-tab>
      </mat-tab-group>
    </div>
  `
})
export class ChatbotDetailComponent implements OnInit, AfterViewChecked {
  private api = inject(ApiService);
  private route = inject(ActivatedRoute);
  private snack = inject(MatSnackBar);
  private zone = inject(NgZone);
  private cdr = inject(ChangeDetectorRef);

  @ViewChild('chatBox') chatBox!: ElementRef;

  chatbot: Chatbot | null = null;
  sources: KnowledgeSource[] = [];
  embedCode = '';
  apiKey = '';
  textTitle = '';
  textContent = '';
  url = '';

  testMessages: { role: 'user' | 'bot'; content: string }[] = [];
  testInput = '';
  testLoading = false;
  private testSessionId = '';
  private shouldScroll = false;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.api.getChatbot(id).subscribe(r => {
      this.chatbot = r.data;
      this.loadSources();
      this.loadEmbedCode();
    });
  }

  loadSources(): void {
    this.api.getKnowledgeSources(this.chatbot!.id).subscribe(r => this.sources = r.data || []);
  }

  loadEmbedCode(): void {
    this.api.getEmbedCode(this.chatbot!.id).subscribe(r => this.embedCode = r.data?.embedCode || '');
  }

  generateApiKey(): void {
    this.api.generateApiKey(this.chatbot!.id).subscribe({
      next: (r) => {
        this.apiKey = r.data.apiKey;
        this.loadEmbedCode();
        this.snack.open('API key generated! Save it now.', 'OK', { duration: 5000 });
      },
      error: () => this.snack.open('Failed to generate key', 'Close', { duration: 3000 })
    });
  }

  addText(): void {
    this.api.addTextKnowledge(this.chatbot!.id, this.textTitle || 'Text Content', this.textContent).subscribe({
      next: () => { this.textContent = ''; this.textTitle = ''; this.loadSources(); this.snack.open('Text added!', '', { duration: 2000 }); },
      error: () => this.snack.open('Failed to add text', 'Close', { duration: 3000 })
    });
  }

  addUrl(): void {
    this.api.addUrlKnowledge(this.chatbot!.id, this.url).subscribe({
      next: () => { this.url = ''; this.loadSources(); this.snack.open('URL scraping started', '', { duration: 2000 }); },
      error: () => this.snack.open('Failed to add URL', 'Close', { duration: 3000 })
    });
  }

  onFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.api.uploadFile(this.chatbot!.id, file).subscribe({
      next: () => { this.loadSources(); this.snack.open('File uploaded!', '', { duration: 2000 }); },
      error: () => this.snack.open('Upload failed', 'Close', { duration: 3000 })
    });
  }

  deleteSource(source: KnowledgeSource): void {
    if (!confirm(`Delete "${source.title}"?`)) return;
    this.api.deleteKnowledgeSource(this.chatbot!.id, source.id).subscribe({
      next: () => { this.loadSources(); this.snack.open('Source deleted', '', { duration: 2000 }); },
      error: () => this.snack.open('Delete failed', 'Close', { duration: 3000 })
    });
  }

  saveSettings(): void {
    this.api.updateChatbot(this.chatbot!.id, this.chatbot!).subscribe({
      next: (r) => { this.chatbot = r.data; this.snack.open('Settings saved', '', { duration: 2000 }); },
      error: () => this.snack.open('Save failed', 'Close', { duration: 3000 })
    });
  }

  getSourceIcon(type: string): string {
    const icons: Record<string, string> = {
      text: 'text_fields', faq: 'quiz', document: 'description', website_url: 'language'
    };
    return icons[type] || 'source';
  }

  copy(text: string): void {
    navigator.clipboard.writeText(text);
    this.snack.open('Copied!', '', { duration: 1500 });
  }

  ngAfterViewChecked(): void {
    if (this.shouldScroll && this.chatBox) {
      const el = this.chatBox.nativeElement;
      el.scrollTop = el.scrollHeight;
      this.shouldScroll = false;
    }
  }

  sendTestMessage(): void {
    if (!this.testInput.trim() || this.testLoading) return;
    const message = this.testInput.trim();
    this.testInput = '';
    this.testMessages.push({ role: 'user', content: message });
    this.testLoading = true;
    this.shouldScroll = true;

    const doSend = (sessionId: string) => {
      const botMsg = { role: 'bot' as const, content: '' };
      this.testMessages.push(botMsg);
      this.api.sendChatMessage(sessionId, message).subscribe({
        next: (token) => {
          console.log('[component token]', token);
          botMsg.content += token;
          this.shouldScroll = true;
          this.cdr.detectChanges();
        },
        error: () => this.zone.run(() => {
          botMsg.content = botMsg.content || 'Error getting response.';
          this.testLoading = false;
        }),
        complete: () => this.zone.run(() => { this.testLoading = false; })
      });
    };

    if (this.testSessionId) {
      doSend(this.testSessionId);
    } else {
      this.api.startChat(this.chatbot!.id).subscribe({
        next: (r) => { this.testSessionId = r.data.sessionId; doSend(this.testSessionId); },
        error: () => {
          this.snack.open('Failed to start chat session', 'Close', { duration: 3000 });
          this.testLoading = false;
        }
      });
    }
  }
}
