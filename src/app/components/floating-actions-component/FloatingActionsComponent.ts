// =================================================================================================
// IMPORTS
// =================================================================================================
import {
    Component,
    input,      // Signal Input
    output,     // Signal Output
    ChangeDetectionStrategy
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';

// ✅ IMPORTANT: plus d'import depuis '@angular/animations' (legacy) => plus de transition() déprécié

// =================================================================================================
// INTERFACES
// =================================================================================================
export interface MsgRow {
    extRef: string;
    [key: string]: any;
}

// =================================================================================================
// COMPOSANT
// =================================================================================================
@Component({
    selector: 'app-floating-actions',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        CommonModule,
        MatButtonModule,
        MatIconModule,
        MatMenuModule,
        MatTooltipModule
    ],

    // -----------------------------------------------------------------------------------------------
    // TEMPLATE HTML (Nouveau Control Flow @if)
    // -----------------------------------------------------------------------------------------------
    template: `
    @if (row(); as currentRow) {
      <div
        class="floating-bar"
        animate.enter="slide-enter"
        animate.leave="slide-leave"
      >

        <div class="info-section">
          <span class="label">Sélection :</span>
          <span class="value">{{ currentRow.extRef }}</span>
        </div>

        <div class="separator"></div>

        <div class="actions-section">
          <button mat-icon-button (click)="onEdit()" matTooltip="Edit Message">
            <mat-icon>edit</mat-icon>
          </button>

          <button mat-icon-button (click)="onReplay()" matTooltip="Replay">
            <mat-icon>replay</mat-icon>
          </button>

          <button mat-icon-button [matMenuTriggerFor]="exportMenu" matTooltip="Export Options">
            <mat-icon>file_download</mat-icon>
          </button>

          <mat-menu #exportMenu="matMenu" yPosition="above">
            <button mat-menu-item (click)="onExport('body')">
              <mat-icon>text_snippet</mat-icon>
              <span>Body only</span>
            </button>
            <button mat-menu-item (click)="onExport('hexa')">
              <mat-icon>code</mat-icon>
              <span>Body in Hexa</span>
            </button>
            <button mat-menu-item (click)="onExport('header')">
              <mat-icon>info</mat-icon>
              <span>Decoded Header</span>
            </button>
          </mat-menu>
        </div>

        <button mat-icon-button class="close-btn" (click)="onClose()">
          <mat-icon>close</mat-icon>
        </button>

      
      </div>
    }
  `,

    // -----------------------------------------------------------------------------------------------
    // STYLES CSS 
    // -----------------------------------------------------------------------------------------------
    styles: [`
    :host {
      position: fixed;
      bottom: 30px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 1000;
      pointer-events: none;
    }
    .floating-bar {
      pointer-events: auto;
      background: #333;
      color: white;
      padding: 8px 16px;
      border-radius: 50px;
      display: flex;
      align-items: center;
      gap: 12px;
      box-shadow: 0 6px 16px rgba(0,0,0,0.3);
      min-width: 300px;
    }
    .floating-bar {
  position: relative; /* OBLIGATOIRE pour ancrer la croix */
}

/* Croix collée en haut à droite */
.close-btn--top-right {
  position: absolute;
  top: 6px;
  right: 6px;

  width: 28px;
  height: 28px;

  padding: 0;
  margin: 0;

  color: rgba(255, 255, 255, 0.6);
}

.close-btn--top-right:hover {
  color: #fff;
}
    .info-section {
      display: flex;
      flex-direction: column;
      font-size: 0.8rem;
      padding-left: 8px;
    }
    .info-section .label { opacity: 0.7; font-size: 0.7rem; }
    .info-section .value { font-weight: bold; }
    .separator {
      width: 1px;
      height: 24px;
      background: rgba(255,255,255,0.2);
    }
    .actions-section {
      display: flex;
      gap: 4px;
    }
    .mat-mdc-icon-button { color: rgba(255,255,255,0.9); }
    .mat-mdc-icon-button:hover { background: rgba(255,255,255,0.1); }
    .close-btn {
      margin-left: auto;
      transform: scale(0.8);
      color: rgba(255,255,255,0.5);
    }
    .close-btn:hover { color: white; }

    /* =============================================================================================
       ✅ Angular 20+ : animate.enter / animate.leave (CSS-only)
       Remplace transition(':enter') / transition(':leave') (legacy)
       ============================================================================================= */

    .slide-enter {
      animation: slideIn 300ms cubic-bezier(0.25, 0.8, 0.25, 1);
    }

    .slide-leave {
      animation: slideOut 200ms ease-in forwards;
    }

    @keyframes slideIn {
      from { transform: translateY(100%); opacity: 0; }
      to   { transform: translateY(0); opacity: 1; }
    }

    @keyframes slideOut {
      from { transform: translateY(0); opacity: 1; }
      to   { transform: translateY(100%); opacity: 0; }
    }
  `]
})
export class FloatingActionsComponent {
    /**
     *   <button
  mat-icon-button
  class="close-btn close-btn--top-right"
  (click)="onClose()"
  matTooltip="Fermer"
>
  <mat-icon>close</mat-icon>
</button>

     */

    // ===============================================================================================
    // SIGNAL INPUTS & OUTPUTS
    // ===============================================================================================
    row = input<MsgRow | null>(null);

    // alias 'close' pour garder le même nom côté parent si tu avais (close)="..."
    closeEvent = output<void>({ alias: 'close' });

    // ===============================================================================================
    // MÉTHODES (HANDLERS)
    // ===============================================================================================

    onEdit() {
        const currentRow = this.row();
        if (!currentRow) return;

        console.log('Action: Edit', currentRow);
        alert(`Édition du message : ${currentRow.extRef}`);
    }

    onReplay() {
        const currentRow = this.row();
        if (!currentRow) return;

        console.log('Action: Replay', currentRow);
        alert(`Rejeu du message : ${currentRow.extRef}`);
    }

    onExport(type: 'body' | 'hexa' | 'header') {
        const currentRow = this.row();
        if (!currentRow) return;

        const ref = currentRow.extRef;

        switch (type) {
            case 'body':
                console.log('Export Body');
                alert(`Export Body pour ${ref}`);
                break;
            case 'hexa':
                console.log('Export Hexa');
                alert(`Export Hexa pour ${ref}`);
                break;
            case 'header':
                console.log('Export Header');
                alert(`Export Header pour ${ref}`);
                break;
        }
    }

    onClose() {
        this.closeEvent.emit();
    }
}
