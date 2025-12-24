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


"styles": [
  "node_modules/primeicons/primeicons.css",
  "node_modules/primeng/resources/primeng.css",
  "src/styles.scss"
]


"styles": [
  "node_modules/primeicons/primeicons.css",
  "node_modules/primeng/resources/primeng.css",

  // ⚠️ Le thème PrimeNG (light ou dark) — un seul à la fois idéalement
  "src/assets/primeng/lara-light-blue.theme.css",

  // ✅ Ton DS en dernier (tokens, overrides, components)
  "src/styles.scss"
]

import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  setDark(isDark: boolean) {
    const link = document.getElementById('primeng-theme') as HTMLLinkElement;
    link.href = isDark
      ? 'assets/primeng/lara-dark-blue.theme.css'
      : 'assets/primeng/lara-light-blue.theme.css';

    document.documentElement.classList.toggle('dark', isDark);
  }
}

/* styles.scss */
:root.dark {
  /* variables à toi si besoin */
}

.custom-datetime .p-datepicker {
  border-radius: 12px;
}

/* Ajustements spécifiques en dark */
:root.dark .custom-datetime .p-datepicker {
  box-shadow: 0 10px 30px rgba(0, 0, 0, .4);
}

@Injectable({ providedIn: 'root' })
export class ThemeService {
  setDark(isDark: boolean) {
    const link = document.getElementById('primeng-theme') as HTMLLinkElement;
    link.href = isDark
      ? 'assets/primeng/lara-dark-blue.theme.css'
      : 'assets/primeng/lara-light-blue.theme.css';

    document.documentElement.classList.toggle('dark', isDark); // utile aussi pour TON CSS
  }
}

npm install primeng primeicons


Bonjour,

Dans le cadre des nouveaux développements en Spring Boot 3 (Jakarta EE), je souhaite signaler un point d’attention concernant la messagerie JMS.
Le broker HornetQ, basé sur javax.jms, est legacy et n’est pas compatible directement avec Spring Boot 3 (jakarta.jms).

Les applications existantes peuvent bien entendu rester inchangées.
Pour les nouveaux services, les options techniques envisagées sont :

migration progressive vers ActiveMQ Artemis (successeur officiel de HornetQ),

ou cohabitation HornetQ / Artemis via un bridge JMS.

Ce point est remonté à titre d’anticipation et d’alignement long terme.

Bien cordialement,


Architecture JMS – Migration progressive vers Spring Boot 3
------------------------------------------------------------

Monde legacy (Java EE / javax.jms) :
----------------------------------
[Applications existantes]
        |
        |  JMS (HornetQ client)
        v
   (HornetQ BROKER)
      - queues / topics
      - legacy, non maintenu
      - utilisé par JBoss EAP 6

Monde cible (Jakarta / Spring Boot 3) :
--------------------------------------
[Spring Boot 3 services]
        |
        |  JMS (Jakarta)
        v
   (ActiveMQ Artemis BROKER)
      - successeur officiel de HornetQ
      - compatible Spring Boot 3
      - cloud / OpenShift ready

Migration progressive :
-----------------------
(HornetQ) === bridge JMS ===> (Artemis)

- Les applications legacy restent inchangées
- Les nouveaux services Spring Boot 3 utilisent Artemis
- Le bridge permet une cohabitation sans rupture


Bonjour,

Dans le cadre de la migration progressive de certains composants vers **Spring Boot 3 (Jakarta EE)**, je souhaite partager un **point d’attention technique** concernant la messagerie JMS actuellement basée sur **HornetQ**.

### Contexte

* Spring Boot 3 repose sur **Jakarta EE** (`jakarta.jms.*`)
* HornetQ est un broker **legacy**, basé sur **Java EE / `javax.jms.*`**, et **n’est plus maintenu**
* Cette différence d’API rend l’utilisation directe du client HornetQ **non compatible** avec Spring Boot 3

### Impact identifié

* Une application Spring Boot 3 ne peut pas consommer/publier de messages HornetQ de manière fiable via le client HornetQ historique
* Le risque est principalement **technique (incompatibilité Jakarta / javax)**, plus que fonctionnel
* Les applications legacy existantes (JBoss EAP 6 / HornetQ) peuvent évidemment rester inchangées à court terme

### Options d’architecture envisageables

1. **Migration progressive vers ActiveMQ Artemis**

   * Artemis est le **successeur officiel de HornetQ**
   * Compatible Spring Boot 3 / Jakarta
   * Solution cible long terme, cloud-ready

2. **Cohabitation HornetQ / Artemis via un bridge**

   * Les applications legacy continuent à utiliser HornetQ
   * Les nouvelles applications Spring Boot 3 utilisent Artemis
   * Un bridge assure le transfert des messages entre brokers
   * Permet une migration incrémentale sans impact immédiat

3. **Alternative transitoire**

   * Maintien des applications JMS legacy sur leur stack actuelle
   * Les nouveaux services Spring Boot 3 s’intègrent via une approche découplée (ex. outbox / intégration asynchrone)

### Point important

Cette remarque n’implique **aucune urgence immédiate**, mais vise à :

* sécuriser les choix techniques pour les nouveaux développements
* éviter des blocages lors des futures montées de version
* aligner progressivement l’architecture avec les standards supportés à long terme

Je reste bien entendu disponible pour détailler ces points ou participer à une discussion d’architecture si nécessaire.

Bien cordialement,

Lead développeur Java / Spring / Messaging


| Élément       | HornetQ | ActiveMQ (classic) | Artemis | IBM MQ             |
| ------------- | ------- | ------------------ | ------- | ------------------ |
| Type          | Broker  | Broker             | Broker  | Broker             |
| JMS           | javax   | javax              | jakarta | javax / jakarta    |
| Spring Boot 3 | ❌       | ❌                  | ✅       | ⚠️ (client récent) |
| Statut        | ❌ Mort  | ⚠️ ancien          | ✅ Actif | ✅ Actif            |
| Cloud/K8s     | ❌       | ⚠️                 | ✅       | ⚠️                 |
| Licence       | Open    | Open               | Open    | 💰 Payant          |


On va démêler clairement tout ça, parce que beaucoup de gens mélangent JMS, HornetQ, ActiveMQ, IBM MQ alors que ce ne sont PAS la même chose.

Je vais te donner :

la différence fondamentale

un tableau comparatif

un schéma simple (visuel mental)

une règle claire pour ton contexte (Spring Boot 3 / migration)

1️⃣ La clé absolue à comprendre (1 phrase)

👉 JMS est une API (un contrat)
👉 HornetQ / ActiveMQ / Artemis / IBM MQ sont des BROKERS (implémentations)

💡 JMS ≠ broker

2️⃣ JMS : c’est QUOI exactement ?

JMS (Java Message Service) :

une API Java

définit des interfaces :

ConnectionFactory

Queue

Topic

Message

ne transporte aucun message tout seul

👉 JMS = “comment parler”
👉 Broker = “où les messages vivent”

3️⃣ Les brokers, un par un (clair et honnête)
🔴 HornetQ

Ancien broker Red Hat

Utilisé dans JBoss EAP 6

API : javax.jms

❌ Projet arrêté

❌ Incompatible Spring Boot 3

👉 Legacy pur

🟢 ActiveMQ “Classic”

Broker Apache historique

API : javax.jms

Fonctionnel mais ancien

Encore utilisé

👉 Ancien, mais pas mort

🟢 ActiveMQ Artemis

Successeur officiel de HornetQ

Broker moderne

API : jakarta.jms

Cloud / Kubernetes / OpenShift ready

Support Spring Boot 3

👉 Le choix moderne

🔵 IBM MQ (anciennement WebSphere MQ)

Broker IBM

Ultra robuste

Très utilisé en banque

API JMS fournie par IBM

Payant (licence)

👉 Le tank des brokers
