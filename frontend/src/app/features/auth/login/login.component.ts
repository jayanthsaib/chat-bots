import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { NgIf } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, MatCardModule, MatFormFieldModule,
    MatInputModule, MatButtonModule, MatSnackBarModule, MatProgressSpinnerModule, NgIf],
  template: `
    <div style="display:flex;align-items:center;justify-content:center;min-height:100vh;background:#f9fafb;">
      <mat-card style="width:100%;max-width:420px;padding:32px;">
        <h1 style="text-align:center;color:#4F46E5;margin:0 0 8px">Qbot</h1>
        <p style="text-align:center;color:#6b7280;margin:0 0 32px">Sign in to your dashboard</p>

        <form [formGroup]="form" (ngSubmit)="onSubmit()">
          <mat-form-field appearance="outline" style="width:100%;margin-bottom:12px">
            <mat-label>Email</mat-label>
            <input matInput type="email" formControlName="email" autocomplete="email">
            <mat-error *ngIf="form.get('email')?.invalid">Valid email required</mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline" style="width:100%;margin-bottom:24px">
            <mat-label>Password</mat-label>
            <input matInput type="password" formControlName="password" autocomplete="current-password">
            <mat-error *ngIf="form.get('password')?.invalid">Password required</mat-error>
          </mat-form-field>

          <button mat-raised-button color="primary" type="submit" style="width:100%;height:44px"
                  [disabled]="loading">
            <mat-spinner diameter="20" *ngIf="loading" style="display:inline-block;margin-right:8px"></mat-spinner>
            {{ loading ? '' : 'Sign In' }}
          </button>
        </form>

        <p style="text-align:center;margin-top:20px;font-size:14px;">
          No account? <a routerLink="/auth/register" style="color:#4F46E5">Create one free</a>
        </p>
      </mat-card>
    </div>
  `
})
export class LoginComponent {
  private auth = inject(AuthService);
  private router = inject(Router);
  private snack = inject(MatSnackBar);
  private fb = inject(FormBuilder);

  loading = false;
  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required]
  });

  onSubmit(): void {
    if (this.form.invalid) return;
    this.loading = true;
    const { email, password } = this.form.value;

    this.auth.login(email!, password!).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: (err) => {
        this.loading = false;
        this.snack.open(err.error?.message || 'Invalid credentials', 'Close', { duration: 3000 });
      }
    });
  }
}
