import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatStepperModule } from '@angular/material/stepper';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';

@Component({
  selector: 'app-chatbot-wizard',
  standalone: true,
  imports: [ReactiveFormsModule, FormsModule, NgIf, MatStepperModule, MatFormFieldModule,
    MatInputModule, MatButtonModule, MatSelectModule, MatSlideToggleModule, MatSnackBarModule, MatIconModule],
  template: `
    <div class="page-container" style="max-width:800px">
      <div style="display:flex;align-items:center;gap:16px;margin-bottom:24px">
        <button mat-icon-button routerLink="/chatbots"><mat-icon>arrow_back</mat-icon></button>
        <h2 style="margin:0">Create New Chatbot</h2>
      </div>

      <mat-stepper linear #stepper>
        <!-- Step 1: Basic Info -->
        <mat-step [stepControl]="basicForm" label="Basic Info">
          <form [formGroup]="basicForm" style="padding:24px 0">
            <mat-form-field appearance="outline" style="width:100%;margin-bottom:16px">
              <mat-label>Chatbot Name *</mat-label>
              <input matInput formControlName="name" placeholder="e.g. Support Bot">
              <mat-error>Name is required</mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline" style="width:100%;margin-bottom:16px">
              <mat-label>Description</mat-label>
              <textarea matInput formControlName="description" rows="3"
                        placeholder="What does this chatbot do?"></textarea>
            </mat-form-field>

            <mat-form-field appearance="outline" style="width:48%">
              <mat-label>Language</mat-label>
              <mat-select formControlName="language">
                <mat-option value="en">English</mat-option>
                <mat-option value="es">Spanish</mat-option>
                <mat-option value="fr">French</mat-option>
                <mat-option value="de">German</mat-option>
                <mat-option value="pt">Portuguese</mat-option>
              </mat-select>
            </mat-form-field>

            <div style="margin-top:24px">
              <button mat-raised-button color="primary" matStepperNext
                      [disabled]="basicForm.invalid">Next</button>
            </div>
          </form>
        </mat-step>

        <!-- Step 2: Personality -->
        <mat-step [stepControl]="personalityForm" label="Personality">
          <form [formGroup]="personalityForm" style="padding:24px 0">
            <mat-form-field appearance="outline" style="width:100%;margin-bottom:16px">
              <mat-label>Welcome Message</mat-label>
              <input matInput formControlName="welcomeMessage">
            </mat-form-field>

            <mat-form-field appearance="outline" style="width:100%;margin-bottom:16px">
              <mat-label>Personality / System Instructions</mat-label>
              <textarea matInput formControlName="personality" rows="5"
                        placeholder="e.g. You are a friendly assistant for [Business Name]. Be professional and helpful."></textarea>
            </mat-form-field>

            <div style="margin-top:24px;display:flex;gap:8px">
              <button mat-button matStepperPrevious>Back</button>
              <button mat-raised-button color="primary" matStepperNext>Next</button>
            </div>
          </form>
        </mat-step>

        <!-- Step 3: Lead Settings -->
        <mat-step label="Lead Capture">
          <form style="padding:24px 0">
            <mat-slide-toggle [checked]="collectLead" (change)="collectLead = $event.checked"
                              style="margin-bottom:16px">
              Capture visitor leads
            </mat-slide-toggle>

            <mat-form-field appearance="outline" style="width:100%;margin-bottom:16px" *ngIf="collectLead">
              <mat-label>When to ask for contact details</mat-label>
              <mat-select [(value)]="leadTrigger">
                <mat-option value="immediate">Immediately</mat-option>
                <mat-option value="after_3_messages">After 3 messages</mat-option>
                <mat-option value="after_5_messages">After 5 messages</mat-option>
              </mat-select>
            </mat-form-field>

            <div style="margin-top:24px;display:flex;gap:8px">
              <button mat-button matStepperPrevious>Back</button>
              <button mat-raised-button color="primary" matStepperNext>Next</button>
            </div>
          </form>
        </mat-step>

        <!-- Step 4: Widget Design -->
        <mat-step label="Widget Design">
          <div style="padding:24px 0">
            <mat-form-field appearance="outline" style="width:200px;margin-bottom:16px">
              <mat-label>Widget Color</mat-label>
              <input matInput type="color" [(ngModel)]="widgetColor">
            </mat-form-field>

            <mat-form-field appearance="outline" style="width:200px;margin-left:16px;margin-bottom:16px">
              <mat-label>Widget Position</mat-label>
              <mat-select [(value)]="widgetPosition">
                <mat-option value="bottom-right">Bottom Right</mat-option>
                <mat-option value="bottom-left">Bottom Left</mat-option>
              </mat-select>
            </mat-form-field>

            <div style="margin-top:24px;display:flex;gap:8px">
              <button mat-button matStepperPrevious>Back</button>
              <button mat-raised-button color="primary" (click)="create()" [disabled]="loading">
                {{ loading ? 'Creating...' : 'Create Chatbot' }}
              </button>
            </div>
          </div>
        </mat-step>
      </mat-stepper>
    </div>
  `
})
export class ChatbotWizardComponent {
  private api = inject(ApiService);
  private router = inject(Router);
  private snack = inject(MatSnackBar);
  private fb = inject(FormBuilder);

  loading = false;
  collectLead = true;
  leadTrigger = 'after_3_messages';
  widgetColor = '#4F46E5';
  widgetPosition = 'bottom-right';

  basicForm = this.fb.group({
    name: ['', Validators.required],
    description: [''],
    language: ['en']
  });

  personalityForm = this.fb.group({
    welcomeMessage: ['Hi! How can I help you today?'],
    personality: ['']
  });

  create(): void {
    this.loading = true;
    const bv = this.basicForm.value;
    const pv = this.personalityForm.value;
    const data = {
      name: bv.name ?? undefined,
      description: bv.description ?? undefined,
      language: bv.language ?? undefined,
      welcomeMessage: pv.welcomeMessage ?? undefined,
      personality: pv.personality ?? undefined,
      collectLead: this.collectLead,
      leadTrigger: this.leadTrigger,
      widgetColor: this.widgetColor,
      widgetPosition: this.widgetPosition,
    };

    this.api.createChatbot(data).subscribe({
      next: (res) => {
        this.snack.open('Chatbot created!', '', { duration: 2000 });
        this.router.navigate(['/chatbots', res.data.id]);
      },
      error: () => {
        this.loading = false;
        this.snack.open('Failed to create chatbot', 'Close', { duration: 3000 });
      }
    });
  }
}
