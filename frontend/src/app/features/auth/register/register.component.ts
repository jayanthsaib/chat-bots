import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, MatCardModule, MatFormFieldModule,
    MatInputModule, MatButtonModule, MatSnackBarModule],
  template: `
    <div style="display:flex;align-items:center;justify-content:center;min-height:100vh;background:#f9fafb;">
      <mat-card style="width:100%;max-width:440px;padding:32px;">
        <h1 style="text-align:center;color:#4F46E5;margin:0 0 8px">Qbot</h1>
        <p style="text-align:center;color:#6b7280;margin:0 0 32px">Create your free account</p>

        <form [formGroup]="form" (ngSubmit)="onSubmit()">
          <mat-form-field appearance="outline" style="width:100%;margin-bottom:12px">
            <mat-label>Business Name</mat-label>
            <input matInput formControlName="businessName">
            <mat-error>Required</mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline" style="width:100%;margin-bottom:12px">
            <mat-label>Your Full Name</mat-label>
            <input matInput formControlName="fullName">
            <mat-error>Required</mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline" style="width:100%;margin-bottom:12px">
            <mat-label>Email</mat-label>
            <input matInput type="email" formControlName="email">
            <mat-error>Valid email required</mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline" style="width:100%;margin-bottom:24px">
            <mat-label>Password</mat-label>
            <input matInput type="password" formControlName="password">
            <mat-hint>At least 8 characters</mat-hint>
            <mat-error>Min 8 characters</mat-error>
          </mat-form-field>

          <button mat-raised-button color="primary" type="submit" style="width:100%;height:44px"
                  [disabled]="loading || form.invalid">
            {{ loading ? 'Creating account...' : 'Create Account' }}
          </button>
        </form>

        <p style="text-align:center;margin-top:20px;font-size:14px;">
          Already have an account? <a routerLink="/auth/login" style="color:#4F46E5">Sign in</a>
        </p>
      </mat-card>
    </div>
  `
})
export class RegisterComponent {
  private auth = inject(AuthService);
  private router = inject(Router);
  private snack = inject(MatSnackBar);
  private fb = inject(FormBuilder);

  loading = false;
  form = this.fb.group({
    businessName: ['', Validators.required],
    fullName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]]
  });

  onSubmit(): void {
    if (this.form.invalid) return;
    this.loading = true;

    this.auth.register(this.form.value as any).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: (err) => {
        this.loading = false;
        this.snack.open(err.error?.message || 'Registration failed', 'Close', { duration: 4000 });
      }
    });
  }
}
