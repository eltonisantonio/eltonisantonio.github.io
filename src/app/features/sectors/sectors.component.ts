import { Component, computed, inject } from '@angular/core';
import { ReactiveFormsModule, FormControl, Validators } from '@angular/forms';
import { DbService } from '../../core/services/db.service';
import { ToastService } from '../../shared/services/toast.service';
import { ROUTE_LABELS } from '../../core/routes.map';

@Component({
  selector: 'app-sectors',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './sectors.component.html',
})
export class SectorsComponent {
  private readonly db    = inject(DbService);
  private readonly toast = inject(ToastService);

  protected readonly title   = ROUTE_LABELS.sectors;
  protected readonly sectors = computed(() => this.db.sectors());
  protected readonly shifts  = computed(() => this.db.shifts());

  protected readonly newSectorCtrl = new FormControl('', { nonNullable: true, validators: [Validators.required] });
  protected readonly newShiftCtrl  = new FormControl('', { nonNullable: true, validators: [Validators.required] });

  protected readonly sectorError = computed(() => {
    const v = this.sectors();
    return (name: string) => v.includes(name.trim().toUpperCase());
  });

  // ── Sectors ────────────────────────────────────────────────────────────────

  protected addSector(): void {
    const name = this.newSectorCtrl.value.trim().toUpperCase();
    if (!name) return;
    if (this.db.sectors().includes(name)) {
      this.newSectorCtrl.setErrors({ duplicate: true });
      return;
    }
    this.db.update(db => ({ ...db, sectors: [...db.sectors, name] }));
    this.newSectorCtrl.reset('');
    this.toast.show('Setor adicionado!');
  }

  protected removeSector(sector: string): void {
    if (!confirm(`Remover "${sector}"? Isso também remove os indicadores vinculados.`)) return;
    this.db.update(db => ({
      ...db,
      sectors:    db.sectors.filter(s => s !== sector),
      indicators: db.indicators.filter(i => i.sector !== sector),
    }));
    this.toast.show('Setor removido.');
  }

  // ── Shifts ─────────────────────────────────────────────────────────────────

  protected addShift(): void {
    const name = this.newShiftCtrl.value.trim();
    if (!name) return;
    if (this.db.shifts().includes(name)) {
      this.newShiftCtrl.setErrors({ duplicate: true });
      return;
    }
    this.db.update(db => ({ ...db, shifts: [...db.shifts, name] }));
    this.newShiftCtrl.reset('');
    this.toast.show('Turno adicionado!');
  }

  protected removeShift(shift: string): void {
    if (!confirm(`Remover "${shift}"? Os indicadores vinculados não serão excluídos.`)) return;
    this.db.update(db => ({ ...db, shifts: db.shifts.filter(s => s !== shift) }));
    this.toast.show('Turno removido.');
  }
}
