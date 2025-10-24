import { Component, ChangeDetectorRef, Input, Output, EventEmitter } from '@angular/core';
import { MatTabGroup, MatTab } from "@angular/material/tabs";

@Component({
  selector: 'app-side-detail',
  templateUrl: './side-detail.html',
  styleUrls: ['./side-detail.css'],
  imports: [MatTabGroup, MatTab]
})
export class SideDetailComponent {
  private _open = false;
  prep = false;     // phase de préparation (monté mais invisible)
  isOpen = false;   // phase ouverte (anim en cours/finie)

  @Input() row: any = null;
  @Input() history: any[] = [];

  @Input() set open(v: boolean) {
    if (v === this._open) return;
    this._open = v;

    if (v) {
      this.prep = true;
      this.isOpen = false;
      this.cdr.detectChanges();
      requestAnimationFrame(() => {
        this.prep = false;
        this.isOpen = true;
        this.cdr.detectChanges();
      });
    } else {
      this.isOpen = false;
      this.prep = false;
      this.cdr.detectChanges();
    }
  }
  get open() { return this._open; }

  @Output() closed = new EventEmitter<void>();
  @Output() navigate = new EventEmitter<'previous' | 'next'>();

  constructor(private cdr: ChangeDetectorRef) {}

  close()    { this.closed.emit(); }
  previous() { this.navigate.emit('previous'); }
  next()     { this.navigate.emit('next'); }
}
