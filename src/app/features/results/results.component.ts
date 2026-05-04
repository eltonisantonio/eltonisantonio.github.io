import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormControl, FormGroup, Validators } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { startWith } from 'rxjs';
import { DbService } from '../../core/services/db.service';
import { ToastService } from '../../shared/services/toast.service';
import { ResultsTableComponent } from './results-table.component';
import { ROUTE_LABELS } from '../../core/routes.map';

const MONTHS_FULL = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

@Component({
  selector: 'app-results',
  standalone: true,
  imports: [ReactiveFormsModule, ResultsTableComponent],
  templateUrl: './results.component.html',
})
export class ResultsComponent implements OnInit {
  private readonly db    = inject(DbService);
  private readonly toast = inject(ToastService);

  protected readonly title   = ROUTE_LABELS.results;
  protected readonly months  = MONTHS_FULL.map((label, i) => ({ value: i + 1, label }));

  protected readonly sectors = computed(() =>
    [...new Set(this.db.indicators().map(i => i.sector))].sort(),
  );

  protected readonly activeSector = signal<string | null>(null);

  // ── Period form ───────────────────────────────────────────────────────────

  protected readonly periodForm = new FormGroup({
    month: new FormControl(1, { nonNullable: true, validators: [Validators.required] }),
    year:  new FormControl(new Date().getFullYear(), { nonNullable: true, validators: [Validators.required] }),
  });

  // ── Billing ───────────────────────────────────────────────────────────────

  protected readonly billingControl = new FormControl<number | null>(null);

  private readonly billingValue = toSignal(
    this.billingControl.valueChanges.pipe(startWith(this.billingControl.value)),
    { initialValue: this.billingControl.value },
  );

  protected readonly billingPreview = computed(() => {
    const v = this.billingValue();
    if (v === null || isNaN(Number(v)) || Number(v) < 0) return null;
    return Math.min(Number(v), 10);
  });

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  ngOnInit(): void {
    const [year, month] = this.db.currentPeriod().split('-').map(Number);
    this.periodForm.setValue({ month, year });
    this.syncBillingField(this.db.currentPeriod());
  }

  // ── Actions ───────────────────────────────────────────────────────────────

  protected savePeriod(): void {
    const { month, year } = this.periodForm.getRawValue();
    const period = `${year}-${String(month).padStart(2, '0')}`;
    this.db.update(db => ({ ...db, currentPeriod: period }));
    this.syncBillingField(period);
    this.toast.show('Período atualizado!');
  }

  protected saveBilling(): void {
    const v = this.billingControl.value;
    if (v === null || isNaN(Number(v)) || Number(v) < 0 || Number(v) > 10) return;
    const period = this.db.currentPeriod();
    this.db.update(db => ({ ...db, billing: { ...db.billing, [period]: Number(v) } }));
    this.toast.show('Faturamento salvo!');
  }

  protected selectSector(sector: string): void {
    this.activeSector.set(sector);
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private syncBillingField(period: string): void {
    const stored = this.db.billing()[period];
    this.billingControl.setValue(stored ?? null, { emitEvent: false });
  }
}
