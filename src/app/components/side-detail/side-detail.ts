import {
  Component, Input, Output, EventEmitter,
  ChangeDetectionStrategy, ChangeDetectorRef
} from '@angular/core';
import { MatTabsModule } from '@angular/material/tabs';
import { CommonModule } from '@angular/common'; // Souvent nécessaire en standalone

// ✅ Définition des interfaces (Modèle)
export interface DetailRow {
  extRef: string;
  intRef: string;
  sender: string;
  receiver: string;
  [key: string]: any;
}

export interface HistoryItem {
  when: string | Date;
  who: string;
  action: string;
}

export type NavigateDirection = 'previous' | 'next';

@Component({
  selector: 'app-side-detail',
  templateUrl: './side-detail.html',
  styleUrls: ['./side-detail.css'],
  standalone: true,
  imports: [CommonModule, MatTabsModule], 
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SideDetailComponent {
  
  @Input() open = false;

  // ✅ Typage strict pour 'row'
  private _row: DetailRow | null = null;
  public displayedRow: DetailRow | null = null;

  @Input() set row(v: DetailRow | null) {
    this._row = v;
    // Copie défensive pour garantir la détection de changement OnPush
    this.displayedRow = v ? { ...v } : null; 
    // markForCheck n'est nécessaire que si l'input change mais que la réf reste la même (ex: mutation interne),
    // mais ici avec une nouvelle référence, Angular détectera le changement via @Input automatiquement.
    // Cependant, le garder est une sécurité si vous appelez le setter manuellement.
  }
  get row(): DetailRow | null { return this._row; }

  // ✅ Typage strict pour 'history'
  private _history: HistoryItem[] = [];
  public displayedHistory: HistoryItem[] = [];

  @Input() set history(v: HistoryItem[] | null) {
    this._history = v || [];
    this.displayedHistory = [...this._history];
  }
  get history(): HistoryItem[] { return this._history; }

  // ✅ Typage de l'output
  @Output() closed = new EventEmitter<void>();
  @Output() navigate = new EventEmitter<NavigateDirection>();

  constructor() {} // ChangeDetectorRef n'est plus strictement nécessaire si les Inputs changent par référence

  close(): void { 
    this.closed.emit(); 
  }

  previous(): void { 
    this.navigate.emit('previous'); 
  }

  next(): void { 
    this.navigate.emit('next'); 
  }
}