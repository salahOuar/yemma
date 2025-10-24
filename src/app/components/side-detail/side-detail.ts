import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectorRef,
  ChangeDetectionStrategy,
  SimpleChanges,
  OnChanges
} from '@angular/core';
import { MatTabGroup, MatTab } from "@angular/material/tabs";

@Component({
  selector: 'app-side-detail',
  templateUrl: './side-detail.html',
  styleUrls: ['./side-detail.css'],
  standalone: true,
  imports: [MatTabGroup, MatTab],
  // ✅ OnPush = Angular ne redessine que quand les @Input changent de référence
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SideDetailComponent implements OnChanges {
  /** --- Données reçues du parent --- */
  @Input() open = false;
  @Input() row: any;
  @Input() history: any[] = [];


  /** --- Événements renvoyés au parent --- */
  @Output() closed = new EventEmitter<void>();
  @Output() navigate = new EventEmitter<'previous' | 'next'>();

  /** --- Copie affichée dans le template --- */
  displayedRow: any;
  displayedHistory: any[] = [];

  constructor(private cdr: ChangeDetectorRef) {}

  /** Appelé à chaque fois que AppComponent change les @Input */
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['row']) {
      this.displayedRow = { ...this.row }; // 🔁 copie pour forcer changement
    }
    if (changes['history']) {
      this.displayedHistory = [...this.history];
    }

    // ✅ Force le rafraîchissement même avec OnPush
    this.cdr.markForCheck();
  }

  /** Émet un événement pour fermer la modale */
  close() {
    this.closed.emit();
  }

  /** Émet un événement pour naviguer vers la ligne précédente */
  previous() {
      console.info('SideDetailComponent instantiated', this.row);
    this.navigate.emit('previous');
  }

  /** Émet un événement pour naviguer vers la ligne suivante */
  next() {
      console.info('SideDetailComponent instantiated', this.row);
    this.navigate.emit('next');
  }
}
