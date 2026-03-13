import { Component, OnInit, inject } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { DatePipe, NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { Lead } from '../../../core/models/api.models';

@Component({
  selector: 'app-lead-list',
  standalone: true,
  imports: [MatTableModule, MatButtonModule, MatIconModule, MatSelectModule,
    MatSnackBarModule, DatePipe, NgFor, NgIf, FormsModule],
  template: `
    <div class="page-container">
      <h2 style="margin-bottom:24px">Leads ({{ total }})</h2>

      <div *ngIf="leads.length === 0" style="text-align:center;padding:80px 20px;color:#9ca3af">
        <mat-icon style="font-size:64px;width:64px;height:64px">contacts</mat-icon>
        <p>No leads captured yet. Your chatbot will capture leads as it converses with visitors.</p>
      </div>

      <table mat-table [dataSource]="leads" *ngIf="leads.length > 0" style="width:100%">
        <ng-container matColumnDef="name">
          <th mat-header-cell *matHeaderCellDef>Name</th>
          <td mat-cell *matCellDef="let lead">{{ lead.fullName || '—' }}</td>
        </ng-container>
        <ng-container matColumnDef="email">
          <th mat-header-cell *matHeaderCellDef>Email</th>
          <td mat-cell *matCellDef="let lead">{{ lead.email || '—' }}</td>
        </ng-container>
        <ng-container matColumnDef="phone">
          <th mat-header-cell *matHeaderCellDef>Phone</th>
          <td mat-cell *matCellDef="let lead">{{ lead.phone || '—' }}</td>
        </ng-container>
        <ng-container matColumnDef="source">
          <th mat-header-cell *matHeaderCellDef>Source</th>
          <td mat-cell *matCellDef="let lead">{{ lead.source || 'web' }}</td>
        </ng-container>
        <ng-container matColumnDef="status">
          <th mat-header-cell *matHeaderCellDef>Status</th>
          <td mat-cell *matCellDef="let lead">
            <mat-select [(value)]="lead.status" (selectionChange)="updateStatus(lead)" style="font-size:13px">
              <mat-option value="new">New</mat-option>
              <mat-option value="contacted">Contacted</mat-option>
              <mat-option value="converted">Converted</mat-option>
              <mat-option value="lost">Lost</mat-option>
            </mat-select>
          </td>
        </ng-container>
        <ng-container matColumnDef="date">
          <th mat-header-cell *matHeaderCellDef>Date</th>
          <td mat-cell *matCellDef="let lead">{{ lead.createdAt | date:'short' }}</td>
        </ng-container>

        <tr mat-header-row *matHeaderRowDef="columns"></tr>
        <tr mat-row *matRowDef="let row; columns: columns;"></tr>
      </table>
    </div>
  `
})
export class LeadListComponent implements OnInit {
  private api = inject(ApiService);
  private snack = inject(MatSnackBar);

  leads: Lead[] = [];
  total = 0;
  columns = ['name', 'email', 'phone', 'source', 'status', 'date'];

  ngOnInit(): void {
    this.api.getLeads(0, 100).subscribe(r => {
      this.leads = r.data?.content || [];
      this.total = r.data?.totalElements || 0;
    });
  }

  updateStatus(lead: Lead): void {
    this.api.updateLead(lead.id, { status: lead.status }).subscribe({
      next: () => this.snack.open('Status updated', '', { duration: 1500 }),
      error: () => this.snack.open('Update failed', 'Close', { duration: 3000 })
    });
  }
}
