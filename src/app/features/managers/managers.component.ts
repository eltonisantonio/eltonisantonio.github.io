import { Component, computed, inject, signal } from '@angular/core';
import { DbService } from '../../core/services/db.service';
import { ScoringService } from '../../core/services/scoring.service';
import { formatSignedPercent, getScoreStatus, MONTHS_PT } from '../../core/utils/format.utils';
import { APP_ROUTES } from '../../core/configs/app-routes';
import type { ScoreBreakdown, ScoreStatus } from '../../core/models';
import type { Periodicity } from '../../core/models';

const MONTHS_FULL_PT = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

interface IndicatorDetail {
  name:        string;
  periodicity: Periodicity;
  weight:      number;
  rawValue:    number | null;
  achievement: number | null;
  countsMonth: boolean;
}

interface ManagerRow {
  label:     string;
  sector:    string;
  shift:     string;
  role:      string;
  breakdown: ScoreBreakdown;
  status:    ScoreStatus;
  details:   IndicatorDetail[];
}

@Component({
  selector: 'app-managers',
  standalone: true,
  imports: [],
  templateUrl: './managers.component.html',
})
export class ManagersComponent {
  private readonly db      = inject(DbService);
  private readonly scoring = inject(ScoringService);

  protected readonly title  = APP_ROUTES.managers.label;
  protected readonly fmtPct = formatSignedPercent;

  protected readonly PERIOD_LABELS: Record<Periodicity, string> = {
    monthly:    'Mensal',
    quarterly:  'Trimestral',
    semiannual: 'Semestral',
    annual:     'Anual',
  };

  protected readonly period = computed(() => {
    const [year, month] = this.db.currentPeriod().split('-');
    return `${MONTHS_PT[parseInt(month, 10) - 1]}/${year}`;
  });

  protected readonly periodComponents = computed(() => {
    const [year, month] = this.db.currentPeriod().split('-');
    return { month: MONTHS_FULL_PT[parseInt(month, 10) - 1], year };
  });

  // ── Expandable rows ────────────────────────────────────────────────────────

  protected readonly expandedRows = signal(new Set<string>());

  protected toggleRow(label: string): void {
    this.expandedRows.update(set => {
      const next = new Set(set);
      next.has(label) ? next.delete(label) : next.add(label);
      return next;
    });
  }

  // ── Rows ───────────────────────────────────────────────────────────────────

  protected readonly rows = computed((): ManagerRow[] => {
    const period     = this.db.currentPeriod();
    const month      = parseInt(period.split('-')[1], 10);
    const allResults = this.db.results();

    return this.scoring.getGroupCombinations().map(({ sector, shift, role }) => {
      const breakdown = this.scoring.calcScoreBreakdown(sector, shift, role);
      const status    = getScoreStatus(breakdown.final);

      let label = sector;
      if (shift) label += ` — ${shift.split(' ').slice(0, 2).join(' ')}`;
      if (role)  label += ` / ${role}`;

      const groupKey = this.scoring.buildGroupKey(sector, shift, role || undefined);
      const saved    = allResults[period]?.[groupKey] ?? {};

      const details: IndicatorDetail[] = this.db.indicators()
        .filter(i => i.sector === sector && i.shift === shift && (role === '' || i.role === role))
        .map(ind => {
          const countsMonth = this.scoring.indicatorCountsInMonth(ind, month);
          const rawValue    = saved[String(ind.id)] ?? null;
          const achievement = countsMonth
            ? this.scoring.calcIndicatorAchievement(ind, rawValue)
            : null;
          return { name: ind.name, periodicity: ind.periodicity, weight: ind.weight, rawValue, achievement, countsMonth };
        });

      return { label, sector, shift, role, breakdown, status, details };
    });
  });

  // ── Summary stats ──────────────────────────────────────────────────────────

  protected readonly summary = computed(() => {
    const finals = this.rows()
      .map(r => r.breakdown.final)
      .filter((f): f is number => f !== null);

    const average = finals.length > 0
      ? finals.reduce((a, b) => a + b, 0) / finals.length
      : null;

    const aboveMeta  = this.rows().filter(r => r.breakdown.final !== null && r.breakdown.final >= 0.85).length;
    const fatalActive = this.db.sstFatalActive();

    return {
      total:      this.rows().length,
      withData:   finals.length,
      average,
      billing:    this.scoring.getBillingRate(),
      aboveMeta,
      fatalActive,
    };
  });

  // ── Status badge ───────────────────────────────────────────────────────────

  protected statusClass(status: ScoreStatus): string {
    switch (status) {
      case '100%':  return 'badge badge-green';
      case '95%+':  return 'badge badge-green';
      case '90%+':  return 'badge badge-amber';
      case '85%+':  return 'badge badge-amber';
      case '<85%':  return 'badge badge-red';
      default:      return 'badge badge-gray';
    }
  }

  protected finalColor(final: number | null): string {
    if (final === null) return 'var(--text3)';
    if (final >= 0.95) return 'var(--green)';
    if (final >= 0.85) return 'var(--amber)';
    return 'var(--red)';
  }

  protected achievementColor(achievement: number | null, weight: number): string {
    if (achievement === null) return 'var(--text3)';
    const pct = weight > 0 ? achievement / weight : 0;
    if (pct >= 0.95) return 'var(--green)';
    if (pct >= 0.85) return 'var(--amber)';
    return 'var(--red)';
  }

  // ── CSV export ─────────────────────────────────────────────────────────────

  protected exportCsv(): void {
    const period  = this.db.currentPeriod();
    const rows    = this.rows();
    const fmtPct  = (v: number | null) =>
      v !== null ? (v * 100).toFixed(2).replace('.', ',') + '%' : '—';

    const header = ['Setor', 'Turno', 'Função', 'Bruto', '5S', 'SST', 'Faturamento', 'Final', 'Status'];
    const lines  = rows.map(r => [
      r.sector,
      r.shift  || '—',
      r.role   || '—',
      fmtPct(r.breakdown.raw),
      r.breakdown.penalty5S  < 0 ? fmtPct(r.breakdown.penalty5S)  : '—',
      r.breakdown.penaltySst < 0 ? fmtPct(r.breakdown.penaltySst) : '—',
      r.breakdown.billing    > 0 ? '+' + fmtPct(r.breakdown.billing) : '—',
      fmtPct(r.breakdown.final),
      r.status,
    ]);

    const s = this.summary();
    const csvRows = [
      [`SISTEMA VARIÁVEL — ${period}`],
      [],
      header,
      ...lines,
      [],
      ['', '', 'MÉDIA GERAL',           '', '', '', '', fmtPct(s.average), ''],
      ['', '', 'FATURAMENTO DO PERÍODO', '', '', '', '', s.billing > 0 ? '+' + fmtPct(s.billing) : '—', ''],
    ];

    const csv = csvRows
      .map(row => row.map(c => `"${String(c).replace(/"/g, '""')}"`).join(';'))
      .join('\r\n');

    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const a    = document.createElement('a');
    a.href     = URL.createObjectURL(blob);
    a.download = `variavel_${period.replace('/', '_')}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }
}
