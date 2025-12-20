import { Component, OnDestroy } from '@angular/core';
import { IStatusPanelAngularComp } from 'ag-grid-angular';
import { IStatusPanelParams, GridApi } from 'ag-grid-community';

// Interface pour définir à quoi ressemblent vos données (à adapter)
interface MyData {
  id: number;
  make?: string; // Propriété optionnelle pour l'exemple
  [key: string]: any;
}

@Component({
  selector: 'app-action-status-panel',
  template: `
    <div class="action-panel" [class.visible]="visible">
      <ng-container *ngIf="visible">
        <span class="info-text">
          <strong>{{ selectedCount }}</strong> ligne(s) sélectionnée(s)
        </span>
        <div class="btn-group">
          <button type="button" (click)="onEdit()" class="action-btn edit" title="Éditer">
            <i class="fas fa-edit"></i> Éditer
          </button>
          <button type="button" (click)="onDelete()" class="action-btn delete" title="Supprimer">
            <i class="fas fa-trash"></i> Supprimer
          </button>
        </div>
      </ng-container>
    </div>
  `,
  styles: [`
    .action-panel { display: none; align-items: center; gap: 15px; padding: 0 10px; }
    .action-panel.visible { display: flex; }
    .info-text { margin-right: 10px; font-size: 0.9rem; }
    .action-btn { 
      cursor: pointer; padding: 6px 12px; border: none; border-radius: 4px; margin-left: 5px; color: white; 
      transition: background-color 0.2s; 
    }
    .edit { background-color: #2196f3; }
    .edit:hover { background-color: #1976d2; }
    .delete { background-color: #f44336; }
    .delete:hover { background-color: #d32f2f; }
  `]
})
export class ActionStatusPanelComponent implements IStatusPanelAngularComp, OnDestroy {
  private params!: IStatusPanelParams;
  private gridApi!: GridApi;
  public visible = false;
  public selectedCount = 0;

  // On garde une référence à la fonction liée pour pouvoir la désinscrire
  private onSelectionChangedCallback = this.onSelectionChanged.bind(this);

  agInit(params: IStatusPanelParams): void {
    this.params = params;
    this.gridApi = params.api;

    // Abonnement sécurisé
    this.gridApi.addEventListener('selectionChanged', this.onSelectionChangedCallback);
  }

  // ✅ NETTOYAGE (Crucial pour éviter les fuites de mémoire)
  ngOnDestroy(): void {
    if (this.gridApi) {
      this.gridApi.removeEventListener('selectionChanged', this.onSelectionChangedCallback);
    }
  }

  onSelectionChanged(): void {
    const selectedRows = this.gridApi.getSelectedRows();
    this.selectedCount = selectedRows.length;
    this.visible = this.selectedCount > 0;
  }

  onEdit(): void {
    const selectedRows = this.gridApi.getSelectedRows() as MyData[];
    if (selectedRows.length === 0) return;
    
    // ✅ Sécurité : Utilisation de l'opérateur ?. et nullish coalescing
    const firstRow = selectedRows[0];
    alert(`Édition de : ${firstRow.make ?? 'Élément sans nom'}`);
  }

  onDelete(): void {
    const selectedRows = this.gridApi.getSelectedRows();
    if (selectedRows.length === 0) return;

    if (confirm(`Voulez-vous vraiment supprimer ${selectedRows.length} ligne(s) ?`)) {
        this.gridApi.applyTransaction({ remove: selectedRows });
        // La grille déclenchera 'selectionChanged' automatiquement après, mettant à jour le panel
    }
  }
}