import { Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { DbService } from '../../core/services/db.service';
import { ScoringService } from '../../core/services/scoring.service';
import { formatValue } from '../../core/utils/format.utils';
import type { Indicator, Periodicity } from '../../core/models';

const PERIODICITY_LABELS: Record<Periodicity, string> = {
  monthly:    'Mensal',
  quarterly:  'Trimestral',
  semiannual: 'Semestral',
  annual:     'Anual',
};

interface IndicatorRow {
  ind:              Indicator;
  countsThisMonth:  boolean;
  rawValue:         number | null;
  achievement:      number | null;
  achievementDisplay: string;
  achievementColor:   string;
  periodicityClass:   string;
}

interface Totals {
  weight:     number;
  achievement: number | null;
  display:    string;
  color:      string;
}

@Component({
  selector: 'app-results-table',
  standalone: true,
  imports: [],
  templateUrl: './results-table.component.html',
})
export class ResultsTableComponent {
  readonly sector = input.required<string>();

  private readonly db      = inject(DbService);
  private readonly scoring = inject(ScoringService);

  protected readonly periodicityLabels = PERIODICITY_LABELS;
  protected readonly fmt               = formatValue;

  protected readonly activeShift       = signal('');
  protected readonly activeRole        = signal('');
  protected readonly activePeriodicity = signal('');

  constructor() {
    effect(() => {
      this.sector(); // track sector input so we reset tabs on sector change
      untracked(() => {
        this.activeShift.set(this.shifts()[0] ?? '');
        this.activeRole.set('');
        this.activePeriodicity.set('');
      });
    });
  }

  // ── Derived indicator sets ─────────────────────────────────────────────────

  private readonly sectorIndicators = computed(() =>
    this.db.indicators().filter(i => i.sector === this.sector()),
  );

  protected readonly shifts = computed(() =>
    [...new Set(this.sectorIndicators().filter(i => i.shift).map(i => i.shift))],
  );

  private readonly noShiftIndicators = computed(() =>
    this.sectorIndicators().filter(i => !i.shift),
  );

  private readonly shiftIndicators = computed(() =>
    this.sectorIndicators().filter(i => i.shift === this.activeShift()),
  );

  private readonly roleSourceIndicators = computed(() =>
    this.shifts().length > 0
      ? [...this.shiftIndicators(), ...this.noShiftIndicators()]
      : this.sectorIndicators(),
  );

  protected readonly roles = computed(() =>
    [...new Set(this.roleSourceIndicators().filter(i => i.role).map(i => i.role))],
  );

  private readonly baseIndicators = computed(() => {
    const hasShifts = this.shifts().length > 0;
    const role      = this.activeRole();
    const hasRoles  = this.roles().length > 0;

    if (hasShifts) {
      return hasRoles && role
        ? [
            ...this.shiftIndicators().filter(i => i.role === role),
            ...this.noShiftIndicators().filter(i => i.role === role || !i.role),
          ]
        : [...this.shiftIndicators(), ...this.noShiftIndicators()];
    }

    return hasRoles && role
      ? this.sectorIndicators().filter(i => i.role === role)
      : this.sectorIndicators();
  });

  protected readonly periodicities = computed(() =>
    [...new Set(this.baseIndicators().map(i => i.periodicity))],
  );

  protected readonly hasMultiplePeriods = computed(() => this.periodicities().length > 1);

  private readonly filteredIndicators = computed(() => {
    const p = this.activePeriodicity();
    return p ? this.baseIndicators().filter(i => i.periodicity === p) : this.baseIndicators();
  });

  // ── Group key & saved results ──────────────────────────────────────────────

  protected readonly groupKey = computed(() =>
    this.scoring.buildGroupKey(this.sector(), this.activeShift(), this.activeRole() || undefined),
  );

  private readonly savedResults = computed(() =>
    this.db.results()[this.db.currentPeriod()]?.[this.groupKey()] ?? {},
  );

  // ── Row data ───────────────────────────────────────────────────────────────

  protected readonly rowData = computed((): IndicatorRow[] => {
    const month = parseInt(this.db.currentPeriod().split('-')[1], 10);
    const saved = this.savedResults();

    return this.filteredIndicators().map(ind => {
      const countsThisMonth = this.scoring.indicatorCountsInMonth(ind, month);
      const rawValue        = saved[String(ind.id)] ?? null;
      const achievement     = countsThisMonth
        ? this.scoring.calcIndicatorAchievement(ind, rawValue)
        : null;

      const achievementDisplay = achievement !== null
        ? (achievement / ind.weight * 100).toFixed(1) + '%'
        : '—';

      const achievementColor = achievement === null
        ? 'var(--text3)'
        : achievement > 0 ? 'var(--green)' : 'var(--red)';

      const periodicityClass = `period-tag ${ind.periodicity}`;

      return { ind, countsThisMonth, rawValue, achievement, achievementDisplay, achievementColor, periodicityClass };
    });
  });

  protected readonly totals = computed((): Totals => {
    let weight      = 0;
    let achievement = 0;
    let hasData     = false;

    for (const row of this.rowData()) {
      if (!row.countsThisMonth) continue;
      weight += row.ind.weight;
      if (row.achievement !== null) {
        achievement += row.achievement;
        hasData = true;
      }
    }

    const result = hasData ? achievement : null;
    const display = result !== null ? (result * 100).toFixed(1) + '%' : '—';
    const color = result === null
      ? 'var(--text3)'
      : result >= 0.85 ? 'var(--green)' : result > 0 ? 'var(--amber)' : 'var(--red)';

    return { weight, achievement: result, display, color };
  });

  // ── Tab selection ──────────────────────────────────────────────────────────

  protected selectShift(shift: string): void {
    this.activeShift.set(shift);
    this.activeRole.set('');
    this.activePeriodicity.set('');
  }

  protected selectRole(role: string): void {
    this.activeRole.set(role);
    this.activePeriodicity.set('');
  }

  protected selectPeriodicity(p: string): void {
    this.activePeriodicity.set(p);
  }

  // ── Result persistence ─────────────────────────────────────────────────────

  protected saveResult(indId: number, event: Event): void {
    const val    = (event.target as HTMLInputElement).value;
    const num    = parseFloat(val);
    const period = this.db.currentPeriod();
    const key    = this.groupKey();

    this.db.update(db => {
      const groupResults = { ...(db.results[period]?.[key] ?? {}) };
      if (val === '' || isNaN(num)) {
        delete groupResults[String(indId)];
      } else {
        groupResults[String(indId)] = num;
      }
      return {
        ...db,
        results: {
          ...db.results,
          [period]: { ...(db.results[period] ?? {}), [key]: groupResults },
        },
      };
    });
  }

  protected clearResult(indId: number): void {
    const period = this.db.currentPeriod();
    const key    = this.groupKey();
    this.db.update(db => {
      const groupResults = { ...(db.results[period]?.[key] ?? {}) };
      delete groupResults[String(indId)];
      return {
        ...db,
        results: {
          ...db.results,
          [period]: { ...(db.results[period] ?? {}), [key]: groupResults },
        },
      };
    });
  }

  protected clearAll(): void {
    const period = this.db.currentPeriod();
    const key    = this.groupKey();
    this.db.update(db => {
      const periodResults = { ...(db.results[period] ?? {}) };
      delete periodResults[key];
      return { ...db, results: { ...db.results, [period]: periodResults } };
    });
  }
}
