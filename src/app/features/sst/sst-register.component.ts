import { Component, computed, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { DbService } from '../../core/services/db.service';
import { ToastService } from '../../shared/services/toast.service';
import { APP_ROUTES } from '../../core/configs/app-routes';
import type { SstIncidentType } from '../../core/models';

const INCIDENT_TYPES: SstIncidentType[] = [
  'Ato Inseguro',
  'Condição Insegura',
  'Acidente sem Afastamento',
  'Acidente com Afastamento',
];

@Component({
  selector: 'app-sst-register',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './sst-register.component.html',
})
export class SstRegisterComponent {
  private readonly db    = inject(DbService);
  private readonly toast = inject(ToastService);

  protected readonly title         = APP_ROUTES.sstRegister.label;
  protected readonly incidentTypes = INCIDENT_TYPES;
  protected readonly sectors       = computed(() => this.db.sectors());
  protected readonly fatalActive   = computed(() => this.db.sstFatalActive());

  // ── Filter & list ──────────────────────────────────────────────────────────

  protected readonly filterSector = signal('');

  protected readonly filteredIncidents = computed(() => {
    const f = this.filterSector();
    return [...this.db.sstIncidents()]
      .filter(i => !f || i.sector === f)
      .sort((a, b) => b.date.localeCompare(a.date));
  });

  // ── Register form ──────────────────────────────────────────────────────────

  protected readonly form = new FormGroup({
    sector:      new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    date:        new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    type:        new FormControl<SstIncidentType>('Ato Inseguro', { nonNullable: true }),
    description: new FormControl('', { nonNullable: true }),
  });

  protected register(): void {
    if (this.form.invalid) return;
    const { sector, date, type, description } = this.form.getRawValue();
    const period = this.db.currentPeriod();

    this.db.update(db => ({
      ...db,
      sstIncidents: [
        ...db.sstIncidents,
        { id: Date.now(), sector, date, type, description: description.trim(), period },
      ],
    }));

    this.form.patchValue({ date: '', description: '' });
    this.toast.show(`Incidente registrado para ${sector}.`);
  }

  // ── Fatal toggle ───────────────────────────────────────────────────────────

  protected toggleFatal(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    if (checked && !confirm(
      'ATENÇÃO: registrar acidente fatal ZERARÁ o variável de todos os setores neste período. Confirmar?',
    )) {
      (event.target as HTMLInputElement).checked = false;
      return;
    }
    this.db.update(db => ({ ...db, sstFatalActive: checked }));
    this.toast.show(checked ? 'Acidente fatal ativado.' : 'Acidente fatal desativado.');
  }

  // ── Delete ─────────────────────────────────────────────────────────────────

  protected remove(id: number): void {
    if (!confirm('Remover este incidente?')) return;
    this.db.update(db => ({
      ...db,
      sstIncidents: db.sstIncidents.filter(i => i.id !== id),
    }));
    this.toast.show('Incidente removido.');
  }
}
