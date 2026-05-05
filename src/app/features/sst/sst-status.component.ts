import { Component, computed, inject, signal } from '@angular/core';
import { DbService } from '../../core/services/db.service';
import { ScoringService } from '../../core/services/scoring.service';
import { ToastService } from '../../shared/services/toast.service';
import { APP_ROUTES } from '../../core/configs/app-routes';

interface StatusRow {
  sector:   string;
  count:    number;
  penalty:  number;
  penLabel: string;
  ok:       boolean;
}

@Component({
  standalone: true,
  imports: [],
  templateUrl: './sst-status.component.html',
})
export class SstStatusComponent {
  private readonly db      = inject(DbService);
  private readonly scoring = inject(ScoringService);
  private readonly toast   = inject(ToastService);

  protected readonly title       = APP_ROUTES.sstStatus.label;
  protected readonly fatalActive = computed(() => this.db.sstFatalActive());
  protected readonly period      = computed(() => this.db.currentPeriod());
  protected readonly sectors     = computed(() => this.db.sectors());

  protected readonly rows = computed((): StatusRow[] =>
    this.db.sectors().map(sector => {
      const count    = this.scoring.countSstIncidents(sector);
      const penalty  = this.scoring.calcSstPenalty(sector);
      const penLabel = this.db.sstFatalActive()
        ? '−100% (fatal)'
        : count > 0 ? '−5%' : '—';
      return { sector, count, penalty, penLabel, ok: count === 0 && !this.db.sstFatalActive() };
    }),
  );

  // ── Incident history ───────────────────────────────────────────────────────

  protected readonly filterSector = signal('');

  protected readonly filteredIncidents = computed(() => {
    const f = this.filterSector();
    return [...this.db.sstIncidents()]
      .filter(i => !f || i.sector === f)
      .sort((a, b) => b.date.localeCompare(a.date));
  });

  protected remove(id: number): void {
    if (!confirm('Remover este incidente?')) return;
    this.db.update(db => ({
      ...db,
      sstIncidents: db.sstIncidents.filter(i => i.id !== id),
    }));
    this.toast.show('Incidente removido.');
  }

  protected clearAll(): void {
    if (!confirm('Limpar TODOS os incidentes SST registrados? Esta ação não pode ser desfeita.')) return;
    this.db.update(db => ({ ...db, sstIncidents: [], sstFatalActive: false }));
    this.toast.show('Incidentes limpos!');
  }
}
