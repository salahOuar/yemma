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
import { ColDef, GetContextMenuItemsParams, IDatasource, IGetRowsParams, MenuItemDef } from 'ag-grid-community';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatIconModule } from '@angular/material/icon';
import { EditMessageDialogComponent } from './dialogs/edit-message.component';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { InterbankInMessage, InterbankMessage, InterbankMessageControllerService, SearchMsgParam } from './api';

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
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'Messages console';
  collapsed = false;
  messages: InterbankMessage[] = [];

  @ViewChild(AgGridAngular) grid?: AgGridAngular;
  @ViewChild('sidenav') sidenav?: ElementRef<HTMLElement>;

  constructor(
    private fb: FormBuilder,
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef,
    private interbankMessageControllerService: InterbankMessageControllerService
  ) { }



  getSearchParams(): SearchMsgParam {
    const raw = this.form.getRawValue();

    const clean = (value: string | null): string | undefined =>
      value === null || value === '' ? undefined : value;

    return {
      type: clean(raw.type),
      direction: raw.direction as SearchMsgParam.DirectionEnum,
      network: raw.network ? raw.network : [],
      sender: clean(raw.sender),
      receiver: clean(raw.receiver),
      internalRef: clean(raw.intRef),
      externalRef: clean(raw.extRef),
      fileRef: clean(raw.fileRef),
      startDate: raw.startDate ? raw.startDate.getTime() + "" : undefined,
      stopDate: raw.stopDate ? raw.stopDate.getTime() + "" : undefined
    };
  }

  form = this.fb.group({
    direction: SearchMsgParam.DirectionEnum.Incoming,
    network: [],
    type: [''],
    startDate: [new Date(new Date().setMonth(new Date().getMonth() - 1))],
    stopDate: [new Date()],
    replayed: [false],
    countOnly: [false],
    subType: [''],
    body: ['Body'],
    sender: [''],
    receiver: [''],
    extRef: [''],
    intRef: [''],
    intKey: [''],
    receptionDate: [new Date()],
    owner: [''],
    fileRef: [''],
    blockName: [''],
    applicationName: [''],
    environnement: ['']

  });

  rightOpen = false;
  selectedRow?: InterbankMessage;

  menuOpen = false;
  menuX = 0;
  menuY = 0;
  menuRow?: InterbankMessage;


  pageSize = 100;
  currentPage = 0;


  history: Array<{ when: string; who: string; action: string }> = [];

  private currentMenuIcon?: HTMLElement | null;

  leftOpen = false;

  onRowClicked(ev: any) {
    const t = ev.event?.target as HTMLElement | null;
    if (t && t.closest('.action-icon')) return; // ⛔ ne pas ouvrir le drawer si on clique une icône
    this.selectedRow = ev.data;
    this.history = this.buildHistoryMock(this.selectedRow);
    //this.rightOpen = true;
    this.leftOpen = true;
  }

  closeDetail() {
    this.rightOpen = false;
    // si tu veux aussi désélectionner la ligne :
    // this.grid?.api.deselectAll();
  }

  private buildHistoryMock(row?: InterbankMessage): MsgHistoryItem[] {
    if (!row) return [];
    const base = row.externalReference || row.internalReference || 'MSG';
    return [
      { when: '2025-10-16 09:12', who: 'system', action: `Imported ${base}` },
      { when: '2025-10-16 09:14', who: 'NDP', action: `Routed to ${row.receiverId}` },
      { when: '2025-10-16 09:18', who: 'ops', action: 'Validated headers' },
      { when: '2025-10-16 09:20', who: 'ops', action: 'Delivered to back-office' },
    ];
  }
  onPaginationChanged(): void {
    if (this.grid) {
      const currentPage = this.grid.api.paginationGetCurrentPage();
      this.currentPage = currentPage;
      this.search(); // recharge les données avec la nouvelle page
    }
  }
  columnDefs: ColDef<InterbankMessage>[] = [
    /*{
      headerName: 'Status', field: 'status', maxWidth: 110, pinned: 'left', sortable: true,
      cellRenderer: (p: { data: { status: string | undefined; }; }) => this.statusCell(p.data?.status as MsgRow['status'])
    },*/
    {
      headerName: 'Direction',
      field: 'direction',
      width: 140,
      colId: 'direction',
      cellRenderer: (p: { value: string }) => {
        const dir = p.value ?? '';

        // conteneur principal
        const host = document.createElement('div');
        host.className = 'dir-cell';

        // texte
        const label = document.createElement('span');
        label.className = 'dir-label';
        label.textContent = dir;

        // icônes d’action (masquées par défaut)
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

        // gestion du survol
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
    { headerName: 'Type', field: 'category.category', width: 90 },
    { headerName: 'Ext. reference', field: 'externalReference', flex: 1, minWidth: 180 },
    { headerName: 'Int. reference', field: 'internalReference', flex: 1, minWidth: 180 },
    { headerName: 'Receiver', field: 'receiverId', width: 180 },
    { headerName: 'Sender', field: 'senderId', width: 180 },
    { headerName: 'Start date', field: 'creationDate', width: 170 },
    { headerName: 'Stop date', field: 'receptionDate', width: 170 },
    { headerName: 'Owner', field: 'cdOwner', width: 140 },
  ];

  defaultColDef: ColDef = {
    sortable: true,
    resizable: true,
    filter: true,
  };
  openMenu(row: InterbankMessage, event: MouseEvent) {
    const rect = (event.target as HTMLElement).getBoundingClientRect();
    this.menuX = rect.right + 6;
    this.menuY = rect.top;
    this.menuRow = row;
    this.menuOpen = true;
  }
  rowData: InterbankInMessage[] = [];
  total = this.rowData.length;
  loading = false;


  /*statusCell(s?: MsgRow['status']) {
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
  }*/



  /* search(): void {
     if (this.form.valid) {
       this.loading = true;
       const params = this.getSearchParams(); // méthode qui convertit ton formulaire en SearchMsgParam
 
       this.interbankMessageControllerService.searchMessages(params).subscribe({
         next: (data) => {
           if (this.grid) {
             this.grid.api.setGridOption('rowData', data.interbankMessageList as InterbankMessage[]);
           } else {
             this.rowData = data.interbankMessageList as InterbankMessage[];
           }
 
           this.total = (data?.nbrMessages) && (data?.nbrMessages > 1000) ? 1000 : data.interbankMessageList?.length ? data.interbankMessageList?.length : 0;
           this.loading = false;
         },
         error: (err) => {
           console.error('Erreur lors de la recherche', err);
           this.loading = false;
         }
       });
 
       this.loading = true;
     } else {
       this.form.markAllAsTouched();
     }
   }*/
  /* search(): void {
     if (this.form.valid) {
       this.loading = true;
       const params = this.getSearchParams();
 
 
       const page = this.grid?.api.paginationGetCurrentPage() ?? 0;
       const size = this.grid?.api.paginationGetPageSize() ?? this.pageSize;
 
 
       this.interbankMessageControllerService.searchMessages(params, page, size).subscribe({
         next: (data) => {
           const messages = data.interbankMessageList as InterbankMessage[];
           this.rowData = messages;
           this.total = data?.nbrMessages ?? messages.length ?? 0;
 
           if (this.grid) {
             this.grid.api.setGridOption('rowData', data.interbankMessageList as InterbankMessage[]);
           }
 
           this.loading = false;
         },
         error: (err) => {
           console.error('Erreur lors de la recherche', err);
           this.loading = false;
         }
       });
     } else {
       this.form.markAllAsTouched();
     }
   }*/

  /*search(): void {
    if (this.form.valid) {
      this.loading = true;
      const params = this.getSearchParams();

      const currentPage = this.grid?.api.paginationGetCurrentPage() ?? 0;
      const size = this.pageSize;

      this.interbankMessageControllerService.searchMessages(params, currentPage, size).subscribe({
        next: (data) => {
          this.rowData = data.interbankMessageList ?? [];
          this.total = (data?.nbrMessages) && (data?.nbrMessages > 1000) ? 1000 : data.interbankMessageList?.length ? data.interbankMessageList?.length : 0;
          this.grid?.api.setGridOption('rowData', data.interbankMessageList as InterbankMessage[]);
          this.loading = false;

          const dataSource: IDatasource = {
            rowCount: undefined, // behave as infinite scroll
            getRows: (params: IGetRowsParams) => {
        
            },
          };

          this.grid!.api.setGridOption("datasource", dataSource);
        },
        error: (err) => {
          console.error('Erreur lors de la recherche', err);
          this.loading = false;
        }
      });
    } else {
      this.form.markAllAsTouched();
    }
  };*/



  search(): void {
    if (this.form.valid) {
      const searchParams = this.getSearchParams();

      const datasource: IDatasource = {
        getRows: (params: IGetRowsParams) => {
          const page = Math.floor(params.startRow / this.pageSize);

          this.grid!.api.setGridOption("loading", true);
          this.interbankMessageControllerService.searchMessages(searchParams, page, this.pageSize).subscribe({
            next: (data) => {
              console.info("33333")
              const rows = data.interbankMessageList ?? [];
              this.total = (data?.nbrMessages) && (data?.nbrMessages > 1000) ? 1000 : data.interbankMessageList?.length ? data.interbankMessageList?.length : 0;


              params.successCallback(rows, this.total);
              this.grid!.api.setGridOption("loading", false);
            },
            error: () => {
              params.failCallback();
            }
          });
        }
      };

      // ✅ Recharge le datasource
      this.grid!.api.setGridOption("datasource", datasource);
    } else {
      this.form.markAllAsTouched();
    }
  }

  onGridReady(params: any) {
    console.log('AG Grid ready. rowData length =', this.rowData?.length);
    params.api.sizeColumnsToFit();
  }
  getContextMenuItems = (params: GetContextMenuItemsParams<InterbankMessage>) => {
    const custom: (MenuItemDef | string)[] = [
      {
        name: 'Edit message',
        action: () => alert(`Edit ${params.node?.data?.externalReference}`),
        icon: '<span class="material-icons" style="font-size:16px">edit</span>'
      },
      {
        name: 'Replay',
        action: () => alert(`Replay ${params.node?.data?.externalReference}`),
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
    this.resultsMenuX = r.right - 180;                 // aligne le menu sous l’icône
    this.resultsMenuY = Math.min(
      r.bottom + 6,
      window.innerHeight - 120
    );
    this.resultsMenuOpen = true;
    this.cdr.detectChanges();
    // fermer au scroll de la grille
    document.querySelector('.ag-body-viewport')
      ?.addEventListener('scroll', this.closeResultsMenu, { once: true });
  }

  closeResultsMenu = () => {
    this.resultsMenuOpen = false;
    this.cdr.markForCheck();
  };

  exportExcelAll() {
    // Excel (Enterprise) sinon CSV (Community)
    try {
      (this.grid as any)?.api.exportDataAsExcel?.({}) ??
        (this.grid as any)?.api.exportDataAsCsv?.({});
    } finally {
      this.closeResultsMenu();
    }
  }

  openEditDialog(row: InterbankMessage) {
    const ref = this.dialog.open(EditMessageDialogComponent, {
      width: '760px',
      maxWidth: '92vw',
      // 👉 pas de hauteur max, pas de scroll interne
      height: 'auto',
      maxHeight: 'none',
      autoFocus: false,
      disableClose: true,
      panelClass: 'edit-dialog',
      data: { ...row },
    });


    ref.afterClosed().subscribe((result?: InterbankMessage) => {
      if (!result) return; // Cancel
      // Update in memory (simple remplacement par extRef; adapte si id unique diffère)
      const idx = this.rowData.findIndex(r => r.externalReference === row.externalReference);
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

  exportExcelRow(row: InterbankMessage) {
    // Si Enterprise importé, on peut exporter Excel. Sinon: bascule vers CSV.
    try {
      // sélectionne la ligne puis exporte
      const node = this.grid?.api.getDisplayedRowAtIndex(
        this.rowData.findIndex(r => r.externalReference === row.externalReference)
      );
      node?.setSelected(true);
      (this.grid as any)?.api.exportDataAsExcel?.({ onlySelected: true }) // Enterprise
        ?? (this.grid as any)?.api.exportDataAsCsv?.({ onlySelected: true }); // Community fallback
    } catch {
      (this.grid as any)?.api.exportDataAsCsv?.();
    } finally {
      this.closeMiniMenu();
    }
  }

  deleteRow(row: InterbankMessage) {
    this.rowData = this.rowData.filter(r => r.externalReference !== row.externalReference);
    if (this.grid) {
      this.grid.api.setGridOption('rowData', [...this.rowData] as any);
    }
    this.total = this.rowData.length;
    this.closeMiniMenu();
  }

  duplicateRow(row: InterbankMessage) {
    const copy: InterbankMessage = { ...row, externalReference: row.externalReference + '-COPY', internalReference: row.internalReference + '-COPY' };
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

  noRowsTemplate = `
  <div class="empty-state">   
    <div class="main-title">Nothing here yet</div>
    <div class="description">Start typing in the field to find what you're looking for.</div>
  </div>
`;
  onCellClicked(ev: any) {
    if (ev.colDef?.colId !== 'direction') return;

    const target = ev.event?.target as HTMLElement | null;
    if (!target) return;
    const icon = target.closest('[data-action]') as HTMLElement | null;
    if (!icon) return;

    // STOP la propagation pour ne pas ouvrir le drawer gauche
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
  rowMenuRow?: InterbankMessage;

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
  private openRowMenuAtIcon(iconEl: HTMLElement, row: InterbankMessage) {
    const r = iconEl.getBoundingClientRect();
    this.rowMenuX = Math.max(8, r.right + 8);
    // place le menu, clamp pour rester visible
    const menuHeight = 180;
    this.rowMenuY = Math.min(r.top, window.innerHeight - menuHeight - 10);
    this.rowMenuRow = row;
    this.rowMenuOpen = true;
    this.rowSubOpen = false;
    this.cdr.detectChanges();

    // ferme si on scroll dans la grille
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
    alert(`Replay ${row.externalReference}`); // branche ton action
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



  // --- pour gestion du timer de fermeture du sous-menu
  private rowSubCloseTimeout?: any;

  // Montre le sous-menu au survol du parent
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

  // Ferme le sous-menu (avec un léger délai pour laisser le temps au survol)
  scheduleCloseSubmenu() {
    clearTimeout(this.rowSubCloseTimeout);
    this.rowSubCloseTimeout = setTimeout(() => {
      this.rowSubOpen = false;
      this.rowSubKind = null;
      this.cdr.markForCheck();
    }, 200); // délai 200 ms = fluide
  }

  // Annule la fermeture (quand on revient sur le sous-menu)
  cancelCloseSubmenu() {
    clearTimeout(this.rowSubCloseTimeout);
  }
  showAdvanced = false;

  toggleAdvancedSearch() {
    this.showAdvanced = !this.showAdvanced;
  }

  onSearchClick() {
    this.search(); // raccourci pour cliquer sur la loupe
  }

  onResetClick() {
    this.form.reset();
  }





  closeModal(): void {
    this.selectedRow = undefined;
  }

  selectPreviousRow(): void {
    const index = this.getDisplayedRowIndexFromData(this.selectedRow);
    if (index && index > 0) {
      const previousNode = this.grid?.api?.getDisplayedRowAtIndex(index - 1);
      this.selectedRow = previousNode?.data;
    }
  }

  selectNextRow(): void {
    const index = this.getDisplayedRowIndexFromData(this.selectedRow);
    if (index !== null) {
      const previousNode = this.grid?.api.getDisplayedRowAtIndex(index - 1);
      this.selectedRow = previousNode?.data;
    }

    const nextNode = this.grid?.api?.getDisplayedRowAtIndex(index ? index + 1 : 1);
    if (nextNode) {
      this.selectedRow = nextNode.data;
    }
  }

  getDisplayedRowIndexFromData(data: any): number | null {
    const rowCount = this.grid?.api?.getDisplayedRowCount();
    if (rowCount) {
      for (let i = 0; i < rowCount; i++) {
        const rowNode = this.grid?.api?.getDisplayedRowAtIndex(i);
        if (rowNode?.data === data) {
          return i;
        }
      }
    }

    return null;
  }




  closeLeftModal(): void {
    this.leftOpen = false;
  }




}
