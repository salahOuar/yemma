import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MsgRow } from '../../app/mock-data';
import { MatIconModule } from '@angular/material/icon';


@Component({
    selector: 'app-edit-message-dialog',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule,
        MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule, MatIconModule],
    template: `
    <div class="dialog-header">
      <h2>Edit message</h2>
      <button mat-icon-button (click)="onCancel()" aria-label="Close">
        <mat-icon>close</mat-icon>
      </button>
    </div>

    <div mat-dialog-content class="dialog-content">
      <form [formGroup]="form" class="form-grid">
        <mat-form-field appearance="outline">
          <mat-label>Ext. reference</mat-label>
          <input matInput formControlName="extRef">
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Int. reference</mat-label>
          <input matInput formControlName="intRef">
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Status</mat-label>
          <mat-select formControlName="status">
            <mat-option value="ok">ok</mat-option>
            <mat-option value="waiting">waiting</mat-option>
            <mat-option value="warn">warn</mat-option>
            <mat-option value="err">err</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Direction</mat-label>
          <mat-select formControlName="direction">
            <mat-option value="Incoming">Incoming</mat-option>
            <mat-option value="Outgoing">Outgoing</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Network</mat-label>
          <mat-select formControlName="network">
            <mat-option value="SWIFT">SWIFT</mat-option>
            <mat-option value="SWIFT_I">SWIFT_I</mat-option>
            <mat-option value="SEPA">SEPA</mat-option>
            <mat-option value="SIC">SIC</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Sender</mat-label>
          <input matInput formControlName="sender">
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Receiver</mat-label>
          <input matInput formControlName="receiver">
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Start</mat-label>
          <input matInput formControlName="start">
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Stop</mat-label>
          <input matInput formControlName="stop">
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Owner</mat-label>
          <input matInput formControlName="owner">
        </mat-form-field>
      </form>
    </div>

    <div mat-dialog-actions class="dialog-actions">
      <button mat-stroked-button (click)="onCancel()">Cancel</button>
      <button mat-flat-button color="primary" [disabled]="form.invalid" (click)="onSave()">Save</button>
    </div>
  `,
    styles: [`
    .dialog-header{
      display:flex; align-items:center; justify-content:space-between;
      padding:8px 8px 0 8px;
    }
    .dialog-header h2{ margin:0; font-weight:700; }

    /* centre et limite la largeur du contenu */
    .dialog-content{
      display:flex; justify-content:center;
      padding-top:8px;
    }
    .form-grid{
      width: 100%;
      max-width: 680px;     /* 👈 centre une colonne de taille confortable */
      display:grid;
      grid-template-columns: 1fr 1fr;  /* 2 colonnes */
      gap:12px;
    }
    /* champs sur toute la ligne pour les dates longues si besoin */
    @media (max-width: 860px){
      .form-grid{ grid-template-columns: 1fr; }
    }

    /* actions centrées */
    .dialog-actions{
      display:flex; justify-content:center; gap:12px; padding: 8px 0 12px 0;
    }
  `]
})
export class EditMessageDialogComponent {
    form = this.fb.group({
        extRef: ['', Validators.required],
        intRef: [''],
        status: ['ok', Validators.required],
        direction: ['Incoming', Validators.required],
        network: ['SWIFT', Validators.required],
        sender: [''],
        receiver: [''],
        start: [''],
        stop: [''],
        owner: ['']
    });

    constructor(
        private fb: FormBuilder,
        private ref: MatDialogRef<EditMessageDialogComponent, MsgRow>,
        @Inject(MAT_DIALOG_DATA) public data: MsgRow
    ) {
        this.form.patchValue(data);
    }

    onCancel() { this.ref.close(); }
    onSave() {
        if (this.form.valid) this.ref.close(this.form.value as MsgRow);
    }
}
