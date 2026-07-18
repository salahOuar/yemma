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








*********************************chat gpt*************************************************
Guide d'utilisation + Prompt GitHub Copilot

Ce document contient :
- Les étapes à suivre (en français).
- Le prompt maître à donner à GitHub Copilot (en anglais).

Étapes à suivre (FR)

Ouvre ton projet dans VS Code avec GitHub Copilot Chat.

Colle le prompt ci-dessous dans une nouvelle conversation.

Demande à Copilot de réaliser uniquement la Phase 1 (analyse). Ne le laisse pas coder immédiatement.

Relis son analyse et valide-la.

Demande ensuite la proposition d'architecture de tests et les éventuels refactorings minimaux.

Demande l'implémentation de l'infrastructure de tests (Testcontainers Oracle + IBM MQ, profil Spring Boot, utilitaires de nettoyage...).

Demande à Copilot de structurer les tests par domaines et scénarios cohérents, avec des classes de test ciblées et des utilitaires partagés, plutôt que de créer une seule classe d’intégration gigantesque.

Demande ensuite les scénarios Happy Path.

Puis les scénarios Compliance (succès, HIT, NO_HIT, timeout, réponses invalides, doublons, retry, erreurs MQ...).

Puis les scénarios Debulk (en rappelant que la Compliance intervient avant le Debulk) et tous les cas métier découverts dans le code.

Enfin, demande les tests de concurrence, d'idempotence, de reprise après incident, de restart et les revues de qualité.

Après chaque étape, exige la compilation et l'exécution réelle des tests avant de continuer.

Master Prompt for GitHub Copilot (EN)

Act as a Principal Software Engineer and Software Architect specialized in Java 25, Spring Boot 4, IBM MQ, JMS, Quartz Scheduler, Oracle Database, OpenShift, distributed systems, asynchronous processing, JUnit 5, Testcontainers, Awaitility and enterprise banking applications.

First, inspect the existing codebase. Do NOT generate implementation immediately.

PHASE 1
- Understand the complete business workflow from the code.
- Identify every Quartz job, scheduler, MQ producer/consumer, JMS producer, routing component, business service, entity, repository, transaction boundary and state transition.
- Discover the complete business workflow yourself. Do not rely on user descriptions.
- Identify every possible business path including Compliance, Debulk, Routing and every alternative branch discovered in the code.

MAIN OBJECTIVE

Design and implement reliable integration tests covering the complete workflow.

Use:
- JUnit 5
- @SpringBootTest
- Testcontainers
- a real IBM MQ container
- a real Oracle Database container
- real Spring JMS infrastructure
- real JPA repositories and transactions
- Awaitility where asynchronous waiting is necessary

Do not replace IBM MQ or Oracle with in-memory alternatives.

Do not rely on Quartz cron timings.
Quartz should be disabled in the integration-test profile.
Business logic must be extracted from Quartz jobs into processors/services.
Quartz jobs should only delegate to processors such as:
- incomingMessageProcessor.processAvailableMessages()
- pendingMessageProcessor.processPendingMessages()
- complianceResponseProcessor.processAvailableResponses()

Review the architecture.
If business logic is inside Quartz Jobs, refactor it using clean separation of responsibilities.

Build reusable Testcontainers infrastructure:
- Oracle
- IBM MQ
- DynamicPropertySource (or Spring Boot 4 equivalent)
- Queue manager configuration
- JMS configuration
- Database migrations
- Deterministic cleanup

Use fixed Docker image versions.

Automatically discover and implement ALL business scenarios found in the code, including:
- Happy paths
- Compliance required/not required
- Compliance HIT
- Compliance NO_HIT
- Invalid compliance response
- Duplicate compliance response
- Unknown correlation id
- MQ failures
- Oracle failures
- Retry
- Restart
- Duplicate scheduler execution
- Duplicate incoming messages
- Debulk required
- Debulk not required
- Debulk failures
- Duplicate debulk
- Routing validation
- Every additional workflow discovered in the code

Remember: Compliance happens before Debulk. Infer the detailed business rules from the code instead of assuming them.

Assume a non-XA architecture.
Review transaction boundaries, idempotency, retry mechanisms and consistency gaps.
Evaluate SELECT FOR UPDATE SKIP LOCKED, optimistic/pessimistic locking, Spring Quartz clustering, unique constraints and recovery strategies where appropriate.

Assertions must verify:
- SWIFT payload
- JMS headers
- Correlation ID
- Business references
- Routing
- Destination queue
- Status transitions
- Retry counters
- Parent/child relationships
- Duplicate prevention

Use Awaitility only when asynchronous waiting is required.
Never use Thread.sleep().

Keep every test isolated by cleaning MQ queues and Oracle tables.

TEST SUITE ORGANIZATION AND CLEAN TEST ARCHITECTURE

The number of scenarios is expected to be significant. Do not place all integration scenarios in one giant test class.

After analyzing the codebase, design a clean and maintainable test architecture. Prefer multiple focused integration-test classes grouped by coherent business capability or technical responsibility. Example groupings may include:
- incoming message ingestion and Oracle persistence;
- compliance decision and request publishing;
- compliance response handling;
- Debulk processing after Compliance;
- final JMS routing;
- idempotency and duplicate handling;
- retry, recovery and restart scenarios;
- failure injection;
- Quartz clustering and concurrency.

These names are suggestions only. Adapt the final class and package organization to the actual project structure and terminology.

Create reusable test-support components where they remove duplication, for example:
- shared Testcontainers and Spring test configuration;
- IBM MQ queue provisioning and purge utilities;
- Oracle cleanup and database assertion helpers;
- SWIFT, Compliance and FIX fixture builders;
- JMS message readers and assertion helpers;
- workflow or scenario drivers that execute processors in a readable sequence;
- controlled failure-injection helpers.

Shared test-support code must not become another monolithic framework. Keep helpers focused, composable and explicit. Avoid a single "god" base class, deep test inheritance hierarchies, hidden global state and overly generic test DSLs.

A common abstract integration-test base class is acceptable only for true cross-cutting infrastructure such as container lifecycle, dynamic properties and deterministic cleanup. It must not contain business assertions or scenario-specific logic. Prefer composition over inheritance for business-oriented test helpers.

Use nested test classes only when they make one focused test class easier to read. Use parameterized tests for genuine scenario matrices, but do not force unrelated business paths into one parameterized method.

Each test class and test method must remain small enough to understand independently. Test names and steps should express the business scenario and the expected state transitions.

Before implementing the suite, propose the package structure, test-class boundaries and shared utility components. Explain why the selected organization avoids duplication without hiding the workflow.

Do not introduce Allure, Serenity, Cucumber, GraphWalker or another reporting/visualization framework at this stage. Focus first on correct, clean and maintainable integration tests.

Implement the solution as an expert Java 25 / Spring Boot 4 engineer.
Prefer constructor injection, immutable objects, AssertJ, parameterized tests and production-quality code.

Workflow:
1. Analyze
2. Explain
3. Propose architecture
4. Implement infrastructure
5. Implement happy-path tests
6. Implement remaining business scenarios
7. Compile
8. Execute tests
9. Fix failures
10. Review architecture and improve robustness

Never claim a test passes unless it has actually been executed.
Produce production-quality, deterministic and maintainable code.

Suggestions de briques techniques à laisser évaluer par Copilot (FR)

Important : ces éléments sont des suggestions, pas des choix imposés. Copilot doit d'abord analyser le projet, les contraintes de licence, les versions compatibles et l'environnement CI/OpenShift avant de les retenir.

Images de conteneurs : IBM MQ officielle depuis IBM Container Registry, Oracle Database Free pour les tests, et versions explicites plutôt que latest.

Testcontainers : modules JUnit 5, Oracle, GenericContainer ou module IBM MQ disponible dans la version utilisée, Network dédié, WaitStrategy et éventuellement reusable containers uniquement si cela ne nuit pas à l'isolation.

Initialisation IBM MQ : scripts MQSC montés dans le conteneur pour créer le Queue Manager, les channels, les queues, la DLQ et les autorisations nécessaires.

Initialisation Oracle : Flyway ou Liquibase selon ce que le projet utilise déjà, avec migrations de production réutilisées dans les tests.

Tests asynchrones : Awaitility avec délais explicites, réception JMS avec timeout court, jamais de Thread.sleep().

Nettoyage : purge contrôlée des files MQ, TRUNCATE/DELETE ordonné des tables Oracle, reset des hooks de panne et arrêt des triggers Quartz.

Injection de pannes : composants de test décorateurs autour des adapters MQ/DB, Toxiproxy pour les coupures réseau, ou mécanismes Testcontainers équivalents.

Concurrence : ExecutorService, CountDownLatch/CyclicBarrier, plusieurs ApplicationContext ou plusieurs instances applicatives conteneurisées si nécessaire pour simuler plusieurs pods.

Observabilité de test : collecte des logs, correlation IDs, métriques Micrometer et traces uniquement si le projet les utilise déjà.

Comparaison des messages : XMLUnit pour XML, JSONAssert/Jackson pour JSON, comparaison normalisée pour SWIFT/FIX et AssertJ pour les assertions métier.

Architecture de fixtures : builders/fixtures dédiés aux messages SWIFT, réponses Compliance et messages FIX issus du Debulk.

CI : exécution Docker-compatible, images pré-tirées si nécessaire, timeouts maîtrisés et séparation claire entre tests rapides et tests d'intégration lourds.

Technical Building Blocks to Consider (EN - add to the Copilot prompt)

### Spring Quartz coordination candidates

The project already uses Spring Quartz. Use the existing Spring Quartz stack for scheduler-level coordination and do not introduce a second scheduling-lock framework.

For scheduler-level coordination across multiple OpenShift pods, evaluate the existing Quartz configuration and consider, only where appropriate:

- a persistent JDBC JobStore using the project database or the dedicated Quartz schema;
- Quartz clustering with a shared database;
- unique Quartz instance identifiers for every pod;
- an appropriate cluster check-in interval and misfire threshold;
- recovery behavior for jobs interrupted by a failed pod;
- `@DisallowConcurrentExecution` when the same Quartz job must not overlap;
- durable jobs, triggers and misfire instructions aligned with the business requirements;
- explicit testing that two Quartz scheduler instances do not execute the same trigger concurrently when clustering is enabled.

Do not treat Quartz clustering as a replacement for database record claiming or message-publishing idempotency. Quartz coordinates job execution, while record locking and unique business constraints protect the business data and outbound MQ publication.

## Suggested technical building blocks — evaluate, do not impose

The following are examples of technical building blocks that may be useful. Treat them only as candidates.

Before selecting any of them, inspect the existing project, dependency management, licensing constraints, CI environment, OpenShift platform constraints, and version compatibility with Java 25 and Spring Boot 4.

Prefer existing project standards when they are sound. Do not introduce a new library merely because it is listed here.

### Container images

Consider, where appropriate:

- an official IBM MQ container image from IBM Container Registry;
- Oracle Database Free or another Oracle image already approved by the project;
- fixed, explicit image tags;
- no use of `latest`;
- digest pinning in CI if the organization requires reproducible builds.

Verify that the chosen image versions are legally usable, available in the target registry, and compatible with the CI environment.

### Testcontainers

Possible Testcontainers building blocks include:

- JUnit 5 Testcontainers integration;
- `OracleContainer` when compatible with the chosen image;
- an IBM MQ-specific Testcontainers module if it is stable and compatible with the project version;
- otherwise, `GenericContainer` for IBM MQ;
- a dedicated `Network` when containers must communicate using aliases;
- explicit `WaitStrategy` definitions for database readiness, MQ listener readiness and channel readiness;
- reusable containers only when they do not compromise deterministic isolation.

Do not rely only on a TCP port being open. Prefer a readiness check that proves the actual service is usable.

### IBM MQ provisioning

Consider provisioning IBM MQ through version-controlled MQSC scripts mounted into the test container.

The scripts may create and configure, according to project conventions:

- the Queue Manager;
- server-connection channels;
- application queues;
- compliance request and response queues;
- incoming SWIFT queues;
- final destination queues;
- error queues and dead-letter queues;
- channel authentication and permissions required by the test application.

Keep test MQ configuration close to the integration tests and avoid hidden manual setup.

### Oracle schema and migrations

Reuse the same schema migration mechanism as production whenever possible, for example:

- Flyway;
- Liquibase;
- project-specific migration scripts.

Do not create a simplified test-only schema that differs from production.

Validate indexes, unique constraints, foreign keys, locking behavior and database-specific SQL against a real Oracle instance.

### Spring Boot integration-test configuration

Possible options include:

- `@DynamicPropertySource`;
- Spring Boot service connections when they support the selected containers and project setup;
- a dedicated `application-integration-test.yml` profile;
- explicit disabling of Quartz auto-start;
- short JMS receive timeouts;
- dedicated transaction and retry properties for tests.

Choose the most idiomatic Spring Boot 4 mechanism supported by the actual dependency versions.

### Asynchronous test coordination

Consider:

- Awaitility with explicit maximum duration and polling intervals;
- JMS receive operations with controlled timeouts;
- latches or barriers only for precise concurrency tests;
- deterministic direct invocation of processors when the production trigger is Quartz.

Never use arbitrary `Thread.sleep(...)` calls.

### Message comparison and assertions

Depending on the actual message formats, consider:

- AssertJ for domain assertions;
- XMLUnit for XML comparison and canonicalization;
- Jackson tree comparison or JSONAssert for JSON;
- dedicated SWIFT normalization utilities;
- dedicated FIX message parsing and semantic field comparison;
- JMS header/property assertion helpers.

Do not compare structured messages with brittle raw string equality when ordering, whitespace, timestamps or generated identifiers are dynamic.

### Test-suite structure and support code

Because the workflow contains many business branches, avoid a single oversized integration-test class.

Evaluate a package structure similar to the following, adapting it to the project:

- `integration/incoming` for ingestion and persistence scenarios;
- `integration/compliance` for compliance decisions, requests and responses;
- `integration/debulk` for Debulk processing that occurs after Compliance;
- `integration/routing` for final JMS routing;
- `integration/recovery` for retry, restart and failure scenarios;
- `integration/concurrency` for Quartz clustering and multi-pod behavior;
- `integration/support` for containers, fixtures, cleanup, message probes and focused assertion helpers.

Possible reusable support components include:

- `IntegrationTestEnvironment` or equivalent container configuration;
- `MqQueueAdmin` for queue purge and message inspection;
- `OracleTestCleaner` for deterministic database cleanup;
- `SwiftMessageFixture`, `ComplianceFixture` and `FixMessageFixture`;
- `SwiftWorkflowDriver` for explicit processor invocation;
- domain-specific assertion helpers such as `SwiftMessageAssertions` and `JmsMessageAssertions`.

Treat these names as examples, not mandatory APIs. Avoid a large inheritance hierarchy, a generic test framework, or a helper that hides all relevant workflow steps. Keep scenario execution visible in the test.

### Test fixtures and builders

Consider dedicated test-data builders or fixture factories for:

- incoming SWIFT messages;
- compliance requests;
- compliance HIT responses;
- compliance NO_HIT responses;
- malformed and unknown compliance responses;
- messages requiring Debulk;
- messages not requiring Debulk;
- expected FIX messages generated by Debulk;
- routing metadata and JMS properties.

Builders should produce valid defaults and allow focused overrides for each scenario.

### Queue and database cleanup

Consider implementing reusable utilities that:

- purge all relevant IBM MQ queues before each test;
- clean Oracle tables in referentially safe order;
- reset sequences only if required by assertions;
- reset failure-injection components;
- verify that no Quartz trigger is unexpectedly running;
- fail fast when cleanup cannot be completed.

Do not depend on test execution order.

### Failure injection

For deterministic failure scenarios, consider:

- test-specific decorators around MQ or persistence adapters;
- controlled fail-once or fail-after-send hooks;
- Toxiproxy or another network proxy for connection interruptions;
- pausing, stopping or disconnecting containers when this accurately represents the failure;
- database constraints or controlled transaction exceptions for persistence failures.

Prefer explicit and reproducible failure injection over random infrastructure instability.

### Concurrency and multi-pod simulation

To test concurrent scheduler execution and multiple OpenShift pods, consider:

- `ExecutorService` with `CountDownLatch`, `CyclicBarrier` or `Phaser` for synchronized starts;
- multiple Spring application contexts only when required;
- multiple application containers connected to the same Oracle and IBM MQ containers for stronger end-to-end multi-instance tests;
- explicit assertions on record claiming, locking and duplicate publishing.

Separate tests for:

1. preventing overlapping scheduler execution;
2. preventing two workers from claiming the same database record;
3. preventing duplicate MQ publication.

Do not use in-memory locks as the production concurrency mechanism.

### Database claiming and idempotency candidates

Evaluate the current implementation before selecting among candidates such as:

- `SELECT ... FOR UPDATE SKIP LOCKED`;
- pessimistic locking;
- optimistic locking with a version column;
- atomic status transitions;
- processing owner and lease-expiration columns;
- unique business-key constraints;
- inbox/deduplication tables;
- transactional outbox;
- recovery schedulers;
- Spring Quartz clustering with a JDBC JobStore for scheduler-level coordination, when multiple application instances share the same Quartz tables.

Explain what each selected mechanism protects and what it does not protect.

### Observability during tests

When the project already uses them, consider validating:

- structured logs containing business and correlation identifiers;
- Micrometer counters for processed, failed, retried and duplicated messages;
- trace propagation across MQ operations;
- persisted status history or audit records.

Do not add observability frameworks solely for the test suite unless there is a clear production benefit.

### CI execution

Ensure the solution can run in the real CI environment.

Consider:

- Docker-compatible runners;
- approved internal image registries;
- image pre-pulling or caching where permitted;
- explicit test timeouts;
- separation between fast unit tests and heavier integration tests;
- Maven or Gradle test groups/tags;
- collection of container logs when tests fail;
- deterministic cleanup even after test failure.

Document any environmental limitation honestly.

### Decision rule

For every proposed technical building block:

1. explain why it is needed;
2. verify compatibility with the existing project;
3. prefer the smallest change;
4. avoid duplicating capabilities already present;
5. implement it only after the analysis phase;
6. compile and execute the relevant tests after introducing it.






















