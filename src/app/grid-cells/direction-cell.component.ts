import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
    selector: 'app-direction-cell',
    standalone: true,
    imports: [CommonModule, MatIconModule],
    template: `
    <div class="dir-cell"
         (mouseenter)="hover=true"
         (mouseleave)="hover=false">
      <span class="dir-label">{{ value }}</span>
      <span class="row-actions" *ngIf="hover">
        <mat-icon class="action-icon" (click)="menu.emit($event)">more_vert</mat-icon>
        <mat-icon class="action-icon" (click)="edit.emit()">edit</mat-icon>
      </span>
    </div>
  `,
    styles: [`
    .dir-cell { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
    .row-actions { display: inline-flex; gap: 4px; }
    .action-icon { font-size: 18px; cursor: pointer; opacity: 0.7; }
    .action-icon:hover { opacity: 1; }
  `]
})
export class DirectionCellComponent {
    @Input() value = '';
    @Output() onEdit = new EventEmitter<void>();
    @Output() onMenu = new EventEmitter<MouseEvent>();
    hover = false;
}
