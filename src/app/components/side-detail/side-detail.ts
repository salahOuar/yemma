import {
  Component, Input, Output, EventEmitter,
  ChangeDetectionStrategy, ChangeDetectorRef
} from '@angular/core';
import { MatTabsModule } from '@angular/material/tabs';

@Component({
  selector: 'app-side-detail',
  templateUrl: './side-detail.html',
  styleUrls: ['./side-detail.css'],
  standalone: true,
  imports: [MatTabsModule],                 // ← simple et sûr
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SideDetailComponent {
  /** Ouvre/ferme l’overlay */
  @Input() open = false;

  /** Ligne sélectionnée (setter = maj immédiate) */
  private _row: any;
  @Input() set row(v: any) {
    this._row = v;
    this.displayedRow = v ? { ...v } : null; // ← nouvelle ref pour OnPush
    this.cdr.markForCheck();
  }
  get row() { return this._row; }

  /** Historique (setter = maj immédiate) */
  private _history: any[] = [];
  @Input() set history(v: any[]) {
    this._history = v || [];
    this.displayedHistory = [...this._history]; // ← nouvelle ref
    this.cdr.markForCheck();
  }
  get history() { return this._history; }

  /** Vers le parent */
  @Output() closed   = new EventEmitter<void>();
  @Output() navigate = new EventEmitter<'previous' | 'next'>();

  /** Données réellement affichées dans le template */
  displayedRow: any = null;
  displayedHistory: any[] = [];

  constructor(private cdr: ChangeDetectorRef) {}

  close()    { this.closed.emit(); }
  previous() { console.info('navigate prev', this.row); this.navigate.emit('previous'); }
  next()     { console.info('navigate next', this.row); this.navigate.emit('next'); }
}
