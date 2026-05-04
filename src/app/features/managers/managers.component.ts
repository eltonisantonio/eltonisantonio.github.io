import { Component, computed, inject } from '@angular/core';
import { DbService } from '../../core/services/db.service';
import { ScoringService } from '../../core/services/scoring.service';
import { formatSignedPercent, getScoreStatus, MONTHS_PT } from '../../core/utils/format.utils';
import { ROUTE_LABELS } from '../../core/routes.map';
import type { ScoreBreakdown, ScoreStatus } from '../../core/models';

interface ManagerRow {
  label:     string;
  sector:    string;
  shift:     string;
  role:      string;
  breakdown: ScoreBreakdown;
  status:    ScoreStatus;
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

  protected readonly title           = ROUTE_LABELS.managers;
  protected readonly fmtPct          = formatSignedPercent;

  protected readonly period = computed(() => {
    const [year, month] = this.db.currentPeriod().split('-');
    return `${MONTHS_PT[parseInt(month, 10) - 1]}/${year}`;
  });

  // ── Rows ───────────────────────────────────────────────────────────────────

  protected readonly rows = computed((): ManagerRow[] =>
    this.scoring.getGroupCombinations().map(({ sector, shift, role }) => {
      const breakdown = this.scoring.calcScoreBreakdown(sector, shift, role);
      const status    = getScoreStatus(breakdown.final);

      let label = sector;
      if (shift) label += ` — ${shift.split(' ').slice(0, 2).join(' ')}`;
      if (role)  label += ` / ${role}`;

      return { label, sector, shift, role, breakdown, status };
    }),
  );

  // ── Summary stats ──────────────────────────────────────────────────────────

  protected readonly summary = computed(() => {
    const finals = this.rows()
      .map(r => r.breakdown.final)
      .filter((f): f is number => f !== null);

    const average = finals.length > 0
      ? finals.reduce((a, b) => a + b, 0) / finals.length
      : null;

    return {
      total:   this.rows().length,
      withData: finals.length,
      average,
      billing: this.scoring.getBillingRate(),
    };
  });

  // ── Status badge ───────────────────────────────────────────────────────────

  protected statusClass(status: ScoreStatus): string {
    switch (status) {
      case '100%':    return 'badge badge-green';
      case '95%+':    return 'badge badge-green';
      case '90%+':    return 'badge badge-amber';
      case '85%+':    return 'badge badge-amber';
      case '<85%':    return 'badge badge-red';
      default:        return 'badge badge-gray';
    }
  }

  protected finalColor(final: number | null): string {
    if (final === null) return 'var(--text3)';
    if (final >= 0.95) return 'var(--green)';
    if (final >= 0.85) return 'var(--amber)';
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
      ['', '', 'MÉDIA GERAL', '', '', '', '', fmtPct(s.average), ''],
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
