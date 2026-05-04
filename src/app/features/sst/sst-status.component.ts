import { Component, computed, inject } from '@angular/core';
import { DbService } from '../../core/services/db.service';
import { ScoringService } from '../../core/services/scoring.service';
import { ROUTE_LABELS } from '../../core/routes.map';

interface StatusRow {
  sector:     string;
  count:      number;
  penalty:    number;
  penLabel:   string;
  ok:         boolean;
}

@Component({
  selector: 'app-sst-status',
  standalone: true,
  imports: [],
  templateUrl: './sst-status.component.html',
})
export class SstStatusComponent {
  private readonly db      = inject(DbService);
  private readonly scoring = inject(ScoringService);

  protected readonly title       = ROUTE_LABELS.sstStatus;
  protected readonly fatalActive = computed(() => this.db.sstFatalActive());
  protected readonly period      = computed(() => this.db.currentPeriod());

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
}
