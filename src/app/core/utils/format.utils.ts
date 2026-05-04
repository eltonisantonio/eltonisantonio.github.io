import type { ScoreStatus } from '../models/score.model';

export const MONTHS_PT = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez',
];

/**
 * Formats a numeric value for display, mirroring the legacy fmt() function.
 * - Very small (0 < v < 0.1): 4 decimal places
 * - Between 0 and 1 (inclusive): converted to % with 1 decimal
 * - Above 1 or zero: localized number (pt-BR)
 * - null/undefined: em dash
 */
export function formatValue(v: number | null | undefined): string {
  if (v === null || v === undefined) return '—';
  if (v > 0 && v < 0.1)  return v.toFixed(4);
  if (v > 0 && v <= 1)   return (v * 100).toFixed(1) + '%';
  return v.toLocaleString('pt-BR', { maximumFractionDigits: 3 });
}

/** Formats a ratio as a signed percentage string, e.g. -0.05 → "-5,00%". */
export function formatSignedPercent(v: number | null): string {
  if (v === null) return '—';
  const sign = v >= 0 ? '+' : '';
  return sign + (v * 100).toFixed(2).replace('.', ',') + '%';
}

/** Returns the display status tier for a final score. */
export function getScoreStatus(v: number | null): ScoreStatus {
  if (v === null) return 'no-data';
  if (v >= 1.00) return '100%';
  if (v >= 0.95) return '95%+';
  if (v >= 0.90) return '90%+';
  if (v >= 0.85) return '85%+';
  return '<85%';
}

/** Formats a 'YYYY-MM' period string as 'Mon / YYYY' in Portuguese. */
export function formatPeriodLabel(period: string): string {
  const [year, month] = period.split('-');
  return `${MONTHS_PT[parseInt(month, 10) - 1]} / ${year}`;
}
