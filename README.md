# Angular 20 Console (Standalone)

- Angular 20 standalone (no AppModule)
- Angular Material + AG Grid
- Sidebar collapsible + filters grid + results table + context menu
- Mocked data in `src/app/mock-data.ts`

## Run
```bash
npm i
npm start
```
Open http://localhost:4200/


https://www.ag-grid.com/angular-data-grid/context-menu/

import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AgGridAngular } from 'ag-grid-angular';

import {
  CellSelectionOptions,
  CheckboxEditorModule,
  ClientSideRowModelModule,
  ColDef,
  DataTypeDefinition,
  DateEditorModule,
  GridApi,
  GridOptions,
  GridReadyEvent,
  ModuleRegistry,
  NumberEditorModule,
  TextEditorModule,
  ValidationModule,
  GetContextMenuItemsParams,
  MenuItemDef,
} from 'ag-grid-community';

import {
  CellSelectionModule,
  ClipboardModule,
  ColumnMenuModule,
  ContextMenuModule,
  ExcelExportModule,
  RowGroupingModule,
  RowGroupingPanelModule,
  SetFilterModule,
} from 'ag-grid-enterprise';

// 🔐 modules Enterprise / Community
ModuleRegistry.registerModules([
  NumberEditorModule,
  TextEditorModule,
  CheckboxEditorModule,
  DateEditorModule,
  ClientSideRowModelModule,
  ClipboardModule,
  ExcelExportModule,
  ColumnMenuModule,
  ContextMenuModule,
  CellSelectionModule,
  RowGroupingModule,
  SetFilterModule,
  RowGroupingPanelModule,
  ...(process.env.NODE_ENV !== 'production' ? [ValidationModule] : []),
]);

interface IOlympicData {
  athlete: string;
  age: number;
  gold: number;
  silver: number;
  date: string;
  country: string;
}

interface IOlympicDataTypes extends IOlympicData {
  dateObject: Date;
  hasGold: boolean;
  hasSilver: boolean;
  dateTime: Date;
  dateTimeString: string;
  countryObject: {
    name: string;
  };
}

@Component({
  selector: 'my-app',
  standalone: true,
  imports: [AgGridAngular],
  template: `
    <ag-grid-angular
      style="width: 100%; height: 100%;"
      class="ag-theme-quartz"
      [rowData]="rowData"
      [columnDefs]="columnDefs"
      [defaultColDef]="defaultColDef"
      [dataTypeDefinitions]="dataTypeDefinitions"
      [rowGroupPanelShow]="rowGroupPanelShow"
      [cellSelection]="cellSelection"
      [gridOptions]="gridOptions"
      (gridReady)="onGridReady($event)"
    />
  `,
})
export class AppComponent {
  columnDefs: ColDef[] = [
    // 🔹 Colonne d’actions avec icône (visible au hover)
    {
      headerName: '',
      field: 'actions',
      width: 60,
      pinned: 'left',
      suppressMenu: true,
      sortable: false,
      filter: false,
      resizable: false,
      cellRenderer: (params) => {
        const eDiv = document.createElement('div');
        eDiv.classList.add('action-cell');

        eDiv.innerHTML = `
          <button class="action-icon" title="Actions">
            <span class="material-icons">more_horiz</span>
          </button>
        `;

        const btn = eDiv.querySelector('button') as HTMLButtonElement;

        btn.addEventListener('click', (event) => {
          event.preventDefault();
          event.stopPropagation();

          // 👉 ouverture du menu contextuel AG Grid, ancré sur le bouton
          params.api.showContextMenu({
            anchorToElement: btn,
            rowNode: params.node,
            column: params.column,         // tu peux mettre une autre colonne si tu veux
            value: params.value,
          });
        });

        return eDiv;
      },
      cellClass: 'action-cell-wrapper',
    },

    { field: 'athlete' },
    { field: 'age', minWidth: 100 },
    { field: 'hasGold', minWidth: 100, headerName: 'Gold' },
    {
      field: 'hasSilver',
      minWidth: 100,
      headerName: 'Silver',
      cellRendererParams: { disabled: true },
    },
    { field: 'dateObject', headerName: 'Date' },
    { field: 'date', headerName: 'Date (String)' },
    {
      field: 'dateTime',
      headerName: 'DateTime',
      cellDataType: 'dateTime',
      minWidth: 250,
    },
    { field: 'dateTimeString', headerName: 'DateTime (String)', minWidth: 250 },
    { field: 'countryObject', headerName: 'Country' },
  ];

  defaultColDef: ColDef = {
    flex: 1,
    minWidth: 180,
    filter: true,
    floatingFilter: true,
    editable: true,
    enableRowGroup: true,
  };

  dataTypeDefinitions: { [cellDataType: string]: DataTypeDefinition } = {
    object: {
      baseDataType: 'object',
      extendsDataType: 'object',
      valueParser: (params) => ({ name: params.newValue }),
      valueFormatter: (params) =>
        params.value == null ? '' : params.value.name,
    },
  };

  rowGroupPanelShow: 'always' | 'onlyWhenGrouping' | 'never' = 'always';
  cellSelection: boolean | CellSelectionOptions = {
    handle: { mode: 'fill' },
  };

  rowData!: IOlympicDataTypes[];
  private gridApi!: GridApi<IOlympicDataTypes>;

  // 👉 GridOptions avec menu contextuel custom
  gridOptions: GridOptions<IOlympicDataTypes> = {
    getContextMenuItems: (params: GetContextMenuItemsParams) =>
      this.buildContextMenuItems(params),
  };

  constructor(private http: HttpClient) {}

  onGridReady(params: GridReadyEvent<IOlympicDataTypes>) {
    this.gridApi = params.api;

    this.http
      .get<IOlympicDataTypes[]>(
        'https://www.ag-grid.com/example-assets/olympic-winners.json',
      )
      .subscribe((data) => {
        this.rowData = data.map((rowData) => {
          const dateParts = rowData.date.split('/');
          const [year, month, day] = dateParts
            .reverse()
            .map((e) => parseInt(e, 10));
          const [h, m, s] = [
            Math.floor((window as any).agRandom() * 24),
            Math.floor((window as any).agRandom() * 60),
            Math.floor((window as any).agRandom() * 60),
          ];
          const padded = [month, day, h, m, s].map((e) =>
            e.toString().padStart(2, '0'),
          );
          const dateString = `${year}-${padded[0]}-${padded[1]}`;
          const dateTimeString = `${year}-${padded[0]}-${padded[1]}T${padded
            .slice(2)
            .join(':')}`;
          return {
            ...rowData,
            date: dateString,
            dateObject: new Date(year, month - 1, day),
            dateTimeString,
            dateTime: new Date(year, month - 1, day, h, m, s),
            countryObject: { name: rowData.country },
            hasGold: rowData.gold > 0,
            hasSilver: rowData.silver > 0,
          };
        });
      });
  }

  // 🚩 ici tu customises complètement le menu contextuel
  private buildContextMenuItems(
    params: GetContextMenuItemsParams,
  ): (MenuItemDef | string)[] {
    const row = params.node?.data;

    const customItems: (MenuItemDef | string)[] = [
      {
        name: 'Ouvrir fiche détaillée',
        icon: '<span class="material-icons">open_in_new</span>',
        action: () => {
          // 👉 ici tu appelles ta modale Angular
          alert('Ouvrir modale pour ' + row?.athlete);
        },
      },
      'separator',
      {
        name: 'Supprimer la ligne',
        icon: '<span class="material-icons">delete</span>',
        action: () => {
          params.api.applyTransaction({ remove: [row!] });
        },
      },
      'separator',
      // tu peux ajouter ici des items AG Grid natifs si tu veux les garder :
      'copy',
      'copyWithHeaders',
      'paste',
    ];

    return customItems;
  }
}
/* styles.scss ou global.css */

.ag-theme-quartz .action-cell-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
}

.action-icon {
  border: none;
  background: transparent;
  cursor: pointer;
  padding: 0;
  opacity: 0;
  transition: opacity 0.15s ease-in-out;
  display: flex;
  align-items: center;
  justify-content: center;
}

.ag-row-hover .action-icon {
  opacity: 1;
}

/* Si tu utilises Material Icons */
.material-icons {
  font-size: 18px;
}
