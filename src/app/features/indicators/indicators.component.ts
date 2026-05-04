import { Component, computed, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { DbService } from '../../core/services/db.service';
import { formatValue } from '../../core/utils/format.utils';
import { ROUTE_LABELS } from '../../core/routes.map';
import type { Indicator, Direction, Format, Periodicity } from '../../core/models';

type ModalState =
  | { mode: 'closed' }
  | { mode: 'create' }
  | { mode: 'edit'; indicator: Indicator };

const CLOSING_MONTH: Record<Periodicity, number | null> = {
  monthly: null, quarterly: 3, semiannual: 6, annual: 12,
};

@Component({
  selector: 'app-indicators',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './indicators.component.html',
})
export class IndicatorsComponent {
  private readonly db = inject(DbService);

  protected readonly title    = ROUTE_LABELS.indicators;
  protected readonly fmt      = formatValue;
  protected readonly sectors  = computed(() => this.db.sectors());
  protected readonly shifts   = computed(() => this.db.shifts());

  // ── Filter ─────────────────────────────────────────────────────────────────

  protected readonly filterSector = signal('');

  protected readonly filteredIndicators = computed(() => {
    const f = this.filterSector();
    return f
      ? this.db.indicators().filter(i => i.sector === f)
      : this.db.indicators();
  });

  // ── Modal state ────────────────────────────────────────────────────────────

  protected readonly modalState = signal<ModalState>({ mode: 'closed' });

  protected readonly isModalOpen  = computed(() => this.modalState().mode !== 'closed');
  protected readonly modalTitle   = computed(() =>
    this.modalState().mode === 'edit' ? 'Editar Indicador' : 'Novo Indicador',
  );

  // ── Form ───────────────────────────────────────────────────────────────────

  protected readonly form = new FormGroup({
    name:        new FormControl('',           { nonNullable: true, validators: [Validators.required] }),
    sector:      new FormControl('',           { nonNullable: true }),
    shift:       new FormControl('',           { nonNullable: true }),
    role:        new FormControl('',           { nonNullable: true }),
    direction:   new FormControl<Direction>('higher',  { nonNullable: true }),
    format:      new FormControl<Format>('decimal',    { nonNullable: true }),
    periodicity: new FormControl<Periodicity>('monthly', { nonNullable: true }),
    weight:      new FormControl<number>(0.1,  { nonNullable: true, validators: [Validators.required, Validators.min(0.01), Validators.max(1)] }),
    target85:    new FormControl<number | null>(null),
    target90:    new FormControl<number | null>(null),
    target95:    new FormControl<number | null>(null),
    target100:   new FormControl<number | null>(null, { validators: [Validators.required] }),
  });

  // ── Modal open/close ───────────────────────────────────────────────────────

  protected openCreate(): void {
    this.form.reset({
      name: '', sector: this.sectors()[0] ?? '', shift: '', role: '',
      direction: 'higher', format: 'decimal', periodicity: 'monthly',
      weight: 0.1, target85: null, target90: null, target95: null, target100: null,
    });
    this.modalState.set({ mode: 'create' });
  }

  protected openEdit(ind: Indicator): void {
    this.form.reset({
      name: ind.name, sector: ind.sector, shift: ind.shift, role: ind.role,
      direction: ind.direction, format: ind.format, periodicity: ind.periodicity,
      weight: ind.weight,
      target85: ind.target85, target90: ind.target90,
      target95: ind.target95, target100: ind.target100,
    });
    this.modalState.set({ mode: 'edit', indicator: ind });
  }

  protected closeModal(): void {
    this.modalState.set({ mode: 'closed' });
  }

  // ── Save ───────────────────────────────────────────────────────────────────

  protected save(): void {
    if (this.form.invalid) return;
    const v = this.form.getRawValue();
    const state = this.modalState();

    const partial: Omit<Indicator, 'id'> = {
      name:         v.name.trim().toUpperCase(),
      sector:       v.sector,
      shift:        v.shift,
      role:         v.role,
      direction:    v.direction,
      format:       v.format,
      periodicity:  v.periodicity,
      closingMonth: CLOSING_MONTH[v.periodicity],
      weight:       v.weight,
      target85:     v.target85,
      target90:     v.target90,
      target95:     v.target95,
      target100:    v.target100,
    };

    if (state.mode === 'edit') {
      this.db.update(db => ({
        ...db,
        indicators: db.indicators.map(i =>
          i.id === state.indicator.id ? { ...i, ...partial } : i,
        ),
      }));
    } else {
      this.db.update(db => ({
        ...db,
        indicators: [...db.indicators, { id: Date.now(), ...partial }],
      }));
    }

    this.closeModal();
  }

  // ── Delete ─────────────────────────────────────────────────────────────────

  protected remove(ind: Indicator): void {
    if (!confirm(`Remover "${ind.name}"? Esta ação não pode ser desfeita.`)) return;
    this.db.update(db => ({
      ...db,
      indicators: db.indicators.filter(i => i.id !== ind.id),
    }));
  }

  // ── Filter helper ──────────────────────────────────────────────────────────

  protected onFilterChange(event: Event): void {
    this.filterSector.set((event.target as HTMLSelectElement).value);
  }
}
