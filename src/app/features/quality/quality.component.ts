import { Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { DbService } from '../../core/services/db.service';
import { ToastService } from '../../shared/services/toast.service';
import { MONTHS_PT } from '../../core/utils/format.utils';
import { APP_ROUTES } from '../../core/configs/app-routes';

const MONTHS_FULL = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

interface AuditSlot {
  score:   number | null;
  date:    string;
  auditor: string;
}

interface HistoryRow {
  key:     string;
  sector:  string;
  period:  string;
  count:   number;
  average: number;
}

const EMPTY_SLOT: AuditSlot = { score: null, date: '', auditor: '' };

@Component({
  selector: 'app-quality',
  standalone: true,
  imports: [],
  templateUrl: './quality.component.html',
})
export class QualityComponent {
  private readonly db    = inject(DbService);
  private readonly toast = inject(ToastService);

  protected readonly title   = APP_ROUTES.quality.label;
  protected readonly sectors = computed(() => this.db.sectors());
  protected readonly months  = MONTHS_FULL.map((label, i) => ({
    label,
    value: String(i + 1).padStart(2, '0'),
  }));

  // ── Period selection ───────────────────────────────────────────────────────

  protected readonly selectedSector = signal('');
  protected readonly selectedMonth  = signal(
    this.db.currentPeriod().split('-')[1],
  );
  protected readonly auditYear = computed(() =>
    this.db.currentPeriod().split('-')[0],
  );

  protected readonly auditKey = computed(() =>
    `${this.selectedSector()}||${this.auditYear()}-${this.selectedMonth()}`,
  );

  // ── Draft audit slots ──────────────────────────────────────────────────────

  protected readonly draftSlots = signal<AuditSlot[]>(
    Array.from({ length: 5 }, () => ({ ...EMPTY_SLOT })),
  );

  constructor() {
    // initialise sectors to first available
    effect(() => {
      const s = this.sectors();
      if (s.length > 0 && !this.selectedSector()) {
        untracked(() => this.selectedSector.set(s[0]));
      }
    });

    // sync form when key changes
    effect(() => {
      const key  = this.auditKey();
      const saved = this.db.audits5S()[key] ?? [];
      untracked(() => {
        this.draftSlots.set(
          Array.from({ length: 5 }, (_, i) => ({
            score:   saved[i]?.score ?? null,
            date:    saved[i]?.date  ?? '',
            auditor: saved[i]?.auditor ?? '',
          })),
        );
      });
    });
  }

  // ── Draft slot updates ─────────────────────────────────────────────────────

  protected updateScore(i: number, event: Event): void {
    const raw = (event.target as HTMLInputElement).value;
    const v   = raw === '' ? null : parseFloat(raw);
    this.draftSlots.update(slots =>
      slots.map((s, idx) => idx === i ? { ...s, score: v } : s),
    );
  }

  protected updateDate(i: number, event: Event): void {
    const v = (event.target as HTMLInputElement).value;
    this.draftSlots.update(slots =>
      slots.map((s, idx) => idx === i ? { ...s, date: v } : s),
    );
  }

  protected updateAuditor(i: number, event: Event): void {
    const v = (event.target as HTMLInputElement).value;
    this.draftSlots.update(slots =>
      slots.map((s, idx) => idx === i ? { ...s, auditor: v } : s),
    );
  }

  // ── Average preview ────────────────────────────────────────────────────────

  protected readonly averagePreview = computed(() => {
    const scores = this.draftSlots()
      .map(s => s.score)
      .filter((s): s is number => s !== null && !isNaN(s));
    if (scores.length === 0) return null;
    return { value: scores.reduce((a, b) => a + b, 0) / scores.length, count: scores.length };
  });

  protected averageClass(avg: number): string {
    return `badge ${avg >= 8 ? 'badge-green' : avg >= 7 ? 'badge-amber' : 'badge-red'}`;
  }

  protected slotBadgeClass(score: number | null): string {
    if (score === null) return 'badge badge-gray';
    return `badge ${score >= 8 ? 'badge-green' : score >= 7 ? 'badge-amber' : 'badge-red'}`;
  }

  // ── Persistence ────────────────────────────────────────────────────────────

  protected save(): void {
    const key   = this.auditKey();
    const avals = this.draftSlots()
      .filter(s => s.score !== null && !isNaN(s.score as number))
      .map(s => ({ score: s.score as number, date: s.date, auditor: s.auditor }));

    this.db.update(db => ({
      ...db,
      audits5S: { ...db.audits5S, [key]: avals },
    }));
    this.toast.show('Avaliações salvas!');
  }

  protected clearCurrent(): void {
    const key = this.auditKey();
    const audits = this.db.audits5S()[key];
    if (!audits || audits.length === 0) return;
    if (!confirm('Limpar todas as avaliações deste setor/mês?')) return;
    this.db.update(db => {
      const audits5S = { ...db.audits5S };
      delete audits5S[key];
      return { ...db, audits5S };
    });
    this.toast.show('Avaliações limpas.');
  }

  // ── History ────────────────────────────────────────────────────────────────

  protected readonly historyFilter = signal('');

  protected readonly historyRows = computed((): HistoryRow[] => {
    const filter = this.historyFilter();
    return Object.entries(this.db.audits5S())
      .flatMap(([key, audits]) => {
        const [sector, period] = key.split('||');
        if (filter && sector !== filter) return [];
        const scores = audits.map(a => a.score).filter(s => !isNaN(s));
        if (scores.length === 0) return [];
        const average = scores.reduce((a, b) => a + b, 0) / scores.length;
        return [{ key, sector, period, count: scores.length, average }];
      })
      .sort((a, b) => b.period.localeCompare(a.period) || a.sector.localeCompare(b.sector));
  });

  protected formatPeriod(period: string): string {
    const [year, month] = period.split('-');
    return `${MONTHS_PT[parseInt(month, 10) - 1]}/${year}`;
  }

  protected clearHistoryEntry(key: string): void {
    if (!confirm('Remover este registro?')) return;
    this.db.update(db => {
      const audits5S = { ...db.audits5S };
      delete audits5S[key];
      return { ...db, audits5S };
    });
    this.toast.show('Registro removido.');
  }
}
