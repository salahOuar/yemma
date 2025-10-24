import { Component, ViewChild, ElementRef, ChangeDetectorRef, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';

import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { AgGridAngular } from 'ag-grid-angular';
import { ColDef, GetContextMenuItemsParams, MenuItemDef } from 'ag-grid-community';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

import { generateRows, MsgRow } from './mock-data';

import { MatTabsModule } from '@angular/material/tabs';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatIconModule } from '@angular/material/icon';
import { EditMessageDialogComponent } from './dialogs/edit-message.component';
import { RouterLink, RouterLinkActive } from '@angular/router';

// ⚠️ garde ton chemin existant (ou adapte selon ton arborescence)
import { SideDetailComponent } from "./components/side-detail/side-detail";

type MsgHistoryItem = { when: string; who: string; action: string; };

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    // material
    MatSidenavModule, MatToolbarModule, MatIconModule, MatListModule,
    MatButtonModule, MatCardModule, MatFormFieldModule, MatInputModule,
    MatSelectModule, MatCheckboxModule, MatDatepickerModule, MatProgressSpinnerModule, MatTabsModule, MatDialogModule,
    RouterLink, RouterLinkActive,
    MatDividerModule,
    // ag-grid
    AgGridAngular,
    SideDetailComponent
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'Messages console';
  collapsed = false;

  @ViewChild(AgGridAngular) grid?: AgGridAngular;
  @ViewChild('sidenav') sidenav?: ElementRef<HTMLElement>;
  // ➜ référence au panneau latéral (pense à mettre #sideDetail dans le template)
  @ViewChild('sideDetail') sideDetail!: SideDetailComponent;

  constructor(
    private fb: FormBuilder,
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef
  ) { }

  form = this.fb.group({
    direction: ['Incoming'],
    network: ['SWIFT'],
    type: ['535'],
    start: [new Date(new Date().setMonth(new Date().getMonth() - 1))],
    stop: [new Date()],
    replayed: [false],
    countOnly: [false],
    subType: [''],
    body: ['Body'],
    sender: [''],
    receiver: [''],
    extRef: [''],
    intRef: [''],
    owner: [''],
  });

  // ⛔ supprimé: rightOpen (on ne l’utilise plus)

  selectedRow?: MsgRow;

  menuOpen = false;
  menuX = 0;
  menuY = 0;
  menuRow?: MsgRow;

  history: Array<MsgHistoryItem> = [];

  private currentMenuIcon?: HTMLElement | null;


  // ➜ conservé si tu veux aussi fermer depuis le parent (par ex. via un bouton)
  closeDetail() {
    // simplement déléguer au composant, ou laisser le composant gérer son état
    this.sideDetail?.close();
    // Option: désélectionner la ligne
    // this.grid?.api.deselectAll();
  }

  private buildHistoryMock(row?: MsgRow): MsgHistoryItem[] {
    if (!row) return [];
    const base = row.extRef || row.intRef || 'MSG';
    return [
      { when: '2025-10-16 09:12', who: 'system', action: `Imported ${base}` },
      { when: '2025-10-16 09:14', who: 'NDP', action: `Routed to ${row.receiver}` },
      { when: '2025-10-16 09:18', who: 'ops', action: 'Validated headers' },
      { when: '2025-10-16 09:20', who: 'ops', action: 'Delivered to back-office' },
    ];
  }

  columnDefs: ColDef<MsgRow>[] = [
    {
      headerName: 'Status', field: 'status', maxWidth: 110, pinned: 'left', sortable: true,
      cellRenderer: (p: { data: { status: string | undefined; }; }) => this.statusCell(p.data?.status as MsgRow['status'])
    },
    {
      headerName: 'Direction',
      field: 'direction',
      width: 140,
      colId: 'direction',
      cellRenderer: (p: { value: string }) => {
        const dir = p.value ?? '';
        const host = document.createElement('div');
        host.className = 'dir-cell';

        const label = document.createElement('span');
        label.className = 'dir-label';
        label.textContent = dir;

        const actions = document.createElement('span');
        actions.className = 'row-actions';
        actions.innerHTML = `
          <span class="material-icons action-icon" data-action="menu" title="Plus">more_vert</span>
          <span class="material-icons action-icon" data-action="edit" title="Éditer">edit</span>
        `;
        Object.assign(actions.style, {
          opacity: '0',
          pointerEvents: 'none',
          transform: 'translateY(3px)',
          transition: 'opacity 0.25s ease, transform 0.25s ease'
        });

        host.addEventListener('mouseenter', () => {
          actions.style.opacity = '1';
          actions.style.pointerEvents = 'auto';
          actions.style.transform = 'translateY(0)';
        });
        host.addEventListener('mouseleave', () => {
          actions.style.opacity = '0';
          actions.style.pointerEvents = 'none';
          actions.style.transform = 'translateY(3px)';
        });

        host.appendChild(label);
        host.appendChild(actions);
        return host;
      },
    },
    { headerName: 'Network', field: 'network', width: 110 },
    { headerName: 'Type', field: 'type', width: 90 },
    { headerName: 'Ext. reference', field: 'extRef', flex: 1, minWidth: 180 },
    { headerName: 'Int. reference', field: 'intRef', flex: 1, minWidth: 180 },
    { headerName: 'Receiver', field: 'receiver', width: 180 },
    { headerName: 'Sender', field: 'sender', width: 180 },
    { headerName: 'Start date', field: 'start', width: 170 },
    { headerName: 'Stop date', field: 'stop', width: 170 },
    { headerName: 'Owner', field: 'owner', width: 140 },
  ];

  defaultColDef: ColDef = {
    sortable: true,
    resizable: true,
    filter: true,
  };

  openMenu(row: MsgRow, event: MouseEvent) {
    const rect = (event.target as HTMLElement).getBoundingClientRect();
    this.menuX = rect.right + 6;
    this.menuY = rect.top;
    this.menuRow = row;
    this.menuOpen = true;
  }

  rowData: MsgRow[] = generateRows(250);
  total = this.rowData.length;
  loading = false;

  statusCell(s?: MsgRow['status']) {
    const map: Record<NonNullable<MsgRow['status']>, string> = {
      ok: '#2e7d32', waiting: '#f9a825', warn: '#ef6c00', err: '#c62828'
    };
    const color = s ? map[s] : '#9e9e9e';
    const label = s === 'ok' ? 'Incoming' : s === 'err' ? 'Error' : s === 'warn' ? 'Warning' : 'Waiting';
    return `
      <div style="display:flex;align-items:center;gap:8px;">
        <span style="width:10px;height:10px;border-radius:50%;background:${color};display:inline-block"></span>
        <span>${label}</span>
      </div>`;
  }

  search() {
    this.loading = true;
    setTimeout(() => {
      const data = [...this.rowData];
      if (this.grid) {
        this.grid.api.setGridOption('rowData', data as any);
      } else {
        this.rowData = data;
      }
      this.total = data.length;
      this.loading = false;
    }, 400);
  }

  onGridReady(params: any) {
    console.log('AG Grid ready. rowData length =', this.rowData?.length);
    params.api.sizeColumnsToFit();
  }

  getContextMenuItems = (params: GetContextMenuItemsParams<MsgRow>) => {
    const custom: (MenuItemDef | string)[] = [
      {
        name: 'Edit message',
        action: () => alert(`Edit ${params.node?.data?.extRef}`),
        icon: '<span class="material-icons" style="font-size:16px">edit</span>'
      },
      {
        name: 'Replay',
        action: () => alert(`Replay ${params.node?.data?.extRef}`),
        icon: '<span class="material-icons" style="font-size:16px">replay</span>'
      },
      'separator',
      {
        name: 'Export',
        subMenu: [
          { name: 'Body', action: () => alert('Export Body') },
          { name: 'Body in hexa', action: () => alert('Export Body Hexa') },
          { name: 'Decoded header', action: () => alert('Export Header') },
        ]
      }
    ];
    return custom;
  };

  toggleCollapse() {
    this.collapsed = !this.collapsed;
    const el = this.sidenav?.nativeElement;
    if (!el) return;
    if (this.collapsed) el.classList.add('collapsed'); else el.classList.remove('collapsed');
  }

  resultsMenuOpen = false;
  resultsMenuX = 0;
  resultsMenuY = 0;

  openResultsMenu(ev: MouseEvent) {
    ev.stopPropagation();
    const r = (ev.currentTarget as HTMLElement).getBoundingClientRect();
    this.resultsMenuX = r.right - 180;
    this.resultsMenuY = Math.min(r.bottom + 6, window.innerHeight - 120);
    this.resultsMenuOpen = true;
    this.cdr.detectChanges();
    document.querySelector('.ag-body-viewport')
      ?.addEventListener('scroll', this.closeResultsMenu, { once: true });
  }

  closeResultsMenu = () => {
    this.resultsMenuOpen = false;
    this.cdr.markForCheck();
  };

  exportExcelAll() {
    try {
      (this.grid as any)?.api.exportDataAsExcel?.({}) ??
        (this.grid as any)?.api.exportDataAsCsv?.({});
    } finally {
      this.closeResultsMenu();
    }
  }

  openEditDialog(row: MsgRow) {
    const ref = this.dialog.open(EditMessageDialogComponent, {
      width: '760px',
      maxWidth: '92vw',
      height: 'auto',
      maxHeight: 'none',
      autoFocus: false,
      disableClose: true,
      panelClass: 'edit-dialog',
      data: { ...row },
    });

    ref.afterClosed().subscribe((result?: MsgRow) => {
      if (!result) return; // Cancel
      const idx = this.rowData.findIndex(r => r.extRef === row.extRef);
      if (idx >= 0) {
        this.rowData[idx] = { ...this.rowData[idx], ...result };
        if (this.grid) {
          this.grid.api.setGridOption('rowData', [...this.rowData] as any);
        } else {
          this.rowData = [...this.rowData];
        }
      }
    });
  }

  closeMiniMenu = () => {
    const gridViewport = document.querySelector('.ag-body-viewport');
    gridViewport?.removeEventListener('scroll', this.updateMenuPositionBound);
    this.currentMenuIcon = null;
    this.menuOpen = false;
    this.cdr.markForCheck();
  };

  exportExcelRow(row: MsgRow) {
    try {
      const node = this.grid?.api.getDisplayedRowAtIndex(
        this.rowData.findIndex(r => r.extRef === row.extRef)
      );
      node?.setSelected(true);
      (this.grid as any)?.api.exportDataAsExcel?.({ onlySelected: true })
        ?? (this.grid as any)?.api.exportDataAsCsv?.({ onlySelected: true });
    } catch {
      (this.grid as any)?.api.exportDataAsCsv?.();
    } finally {
      this.closeMiniMenu();
    }
  }

  deleteRow(row: MsgRow) {
    this.rowData = this.rowData.filter(r => r.extRef !== row.extRef);
    if (this.grid) {
      this.grid.api.setGridOption('rowData', [...this.rowData] as any);
    }
    this.total = this.rowData.length;
    this.closeMiniMenu();
  }

  duplicateRow(row: MsgRow) {
    const copy: MsgRow = { ...row, extRef: row.extRef + '-COPY', intRef: row.intRef + '-COPY' };
    this.rowData = [copy, ...this.rowData];
    if (this.grid) {
      this.grid.api.setGridOption('rowData', [...this.rowData] as any);
    }
    this.total = this.rowData.length;
    this.closeMiniMenu();
  }

  updateMenuPosition = () => {
    if (!this.currentMenuIcon) return;
    const r = this.currentMenuIcon.getBoundingClientRect();
    const gridViewport = document.querySelector('.ag-body-viewport') as HTMLElement;
    const scrollY = (gridViewport?.scrollTop ?? 0) + window.scrollY;
    this.menuX = r.right + 6;
    this.menuY = r.top + scrollY;
    this.cdr.detectChanges();
  };
  private updateMenuPositionBound = this.updateMenuPosition.bind(this);

  onCellClicked(ev: any) {
    if (ev.colDef?.colId !== 'direction') return;

    const target = ev.event?.target as HTMLElement | null;
    if (!target) return;
    const icon = target.closest('[data-action]') as HTMLElement | null;
    if (!icon) return;

    ev.event.stopPropagation();
    ev.event.preventDefault();

    const action = icon.dataset.action;
    if (action === 'edit') {
      this.openEditDialog(ev.data);
    } else if (action === 'menu') {
      this.openRowMenuAtIcon(icon, ev.data);
    }
  }

  ngOnInit() {
    const gridViewport = document.querySelector('.ag-body-viewport');
    gridViewport?.addEventListener('scroll', this.closeMiniMenu, true);
    window.addEventListener('resize', this.closeMiniMenu, true);
  }

  ngOnDestroy() {
    const gridViewport = document.querySelector('.ag-body-viewport');
    gridViewport?.removeEventListener('scroll', this.closeMiniMenu, true);
    window.removeEventListener('resize', this.closeMiniMenu, true);
  }

  /** ------- état du menu de ligne ------- */
  rowMenuOpen = false;
  rowMenuX = 0;
  rowMenuY = 0;
  rowMenuRow?: MsgRow;

  rowSubOpen = false;
  rowSubX = 0;
  rowSubY = 0;
  rowSubKind: 'view' | 'export' | null = null;

  closeRowMenus = () => {
    this.rowMenuOpen = false;
    this.rowSubOpen = false;
    this.rowSubKind = null;
    this.cdr.markForCheck();
  };

  /** Appelé au clic sur l'icône ⋮ de la colonne Direction */
  private openRowMenuAtIcon(iconEl: HTMLElement, row: MsgRow) {
    const r = iconEl.getBoundingClientRect();
    this.rowMenuX = Math.max(8, r.right + 8);
    const menuHeight = 180;
    this.rowMenuY = Math.min(r.top, window.innerHeight - menuHeight - 10);
    this.rowMenuRow = row;
    this.rowMenuOpen = true;
    this.rowSubOpen = false;
    this.cdr.detectChanges();

    document.querySelector('.ag-body-viewport')
      ?.addEventListener('scroll', this.closeRowMenus, { once: true });
  }

  /** Branches actions du menu principal */
  editSelectedRow() {
    const row = this.rowMenuRow ?? this.selectedRow;
    if (!row) { alert('Select a row first.'); return; }
    this.openEditDialog(row);
    this.closeRowMenus();
  }
  replayRow() {
    const row = this.rowMenuRow ?? this.selectedRow;
    if (!row) { alert('Select a row first.'); return; }
    alert(`Replay ${row.extRef}`);
    this.closeRowMenus();
  }

  /** Branches du sous-menu VIEW */
  viewBody() { alert('View → Body'); this.closeRowMenus(); }
  viewBodyHex() { alert('View → Body in hexa'); this.closeRowMenus(); }
  viewDecodedHeader() { alert('View → Decoded header'); this.closeRowMenus(); }

  /** Branches du sous-menu EXPORT */
  exportBody() { alert('Export → Body'); this.closeRowMenus(); }
  exportBodyHex() { alert('Export → Body in hexa'); this.closeRowMenus(); }
  exportDecodedHeader() { alert('Export → Decoded header'); this.closeRowMenus(); }

  // --- sous-menu (timers) ---
  private rowSubCloseTimeout?: any;
  openRowSubmenu(ev: MouseEvent, kind: 'view' | 'export') {
    ev.stopPropagation();
    clearTimeout(this.rowSubCloseTimeout);
    const el = ev.currentTarget as HTMLElement;
    const r = el.getBoundingClientRect();
    this.rowSubKind = kind;
    this.rowSubX = r.right + 8;
    const subHeight = 160;
    this.rowSubY = Math.min(r.top - 6, window.innerHeight - subHeight - 10);
    this.rowSubOpen = true;
    this.cdr.detectChanges();
  }
  scheduleCloseSubmenu() {
    clearTimeout(this.rowSubCloseTimeout);
    this.rowSubCloseTimeout = setTimeout(() => {
      this.rowSubOpen = false;
      this.rowSubKind = null;
      this.cdr.markForCheck();
    }, 200);
  }
  cancelCloseSubmenu() {
    clearTimeout(this.rowSubCloseTimeout);
  }

  showAdvanced = false;
  toggleAdvancedSearch() { this.showAdvanced = !this.showAdvanced; }
  onSearchClick() { this.search(); }
  onResetClick() { this.form.reset(); }

  // ✅ plus besoin de cette version — on pilote via sideDetail
  // openDetail(event: any) {
  //   this.selectedRow = event.data;
  // }










  detailOpen = false;



  onRowClicked(ev: any) {
    const t = ev.event?.target as HTMLElement | null;
    if (t && t.closest('.action-icon')) return; // ignore clics sur icônes d’action

    this.selectedRow = ev.data as MsgRow;
    this.history = this.buildHistoryMock(this.selectedRow);

    // ouverture synchronisée (prep -> is-open)
    this.detailOpen = false;
    requestAnimationFrame(() => this.detailOpen = true);
  }

  onDetailClosed() {
    this.detailOpen = false;
    this.selectedRow = undefined;
  }

  onNavigate(dir: 'previous' | 'next') {
    const i = this.rowData.findIndex(r => r === this.selectedRow);
    const j = dir === 'next' ? i + 1 : i - 1;
    if (j < 0 || j >= this.rowData.length) return;
    this.selectedRow = this.rowData[j];
    this.history = this.buildHistoryMock(this.selectedRow);
    // on laisse detailOpen = true (pas besoin de rejouer l’anim)
  }

}
