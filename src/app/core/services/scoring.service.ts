import { Injectable, inject } from '@angular/core';
import { DbService } from './db.service';
import type { Indicator } from '../models';
import type { GroupCombo, ScoreBreakdown } from '../models/score.model';

@Injectable({ providedIn: 'root' })
export class ScoringService {
  private readonly db = inject(DbService);

  // ── Indicator achievement ─────────────────────────────────────────────────

  /**
   * Calculates the weighted achievement for a single indicator given a raw result.
   * Returns a value in [0, weight] representing how much of the weight was earned,
   * or null if the result is missing / the indicator cannot be scored.
   *
   * Mirrors legacy calcAtingInd().
   */
  calcIndicatorAchievement(
    indicator: Indicator,
    rawValue: string | number | null | undefined,
  ): number | null {
    if (rawValue === null || rawValue === undefined || rawValue === '') return null;
    let v = parseFloat(String(rawValue));
    if (isNaN(v)) return null;

    // Destructure and potentially scale for 'integer' format (input given as whole number)
    let { direction, format, weight, target85, target90, target95, target100 } = indicator;

    if (format === 'integer') {
      v         /= 100;
      if (target85  !== null) target85  /= 100;
      if (target90  !== null) target90  /= 100;
      if (target95  !== null) target95  /= 100;
      if (target100 !== null) target100 /= 100;
    }

    if (target100 === null) return null;

    const meets = direction === 'higher'
      ? (a: number, b: number) => a >= b
      : (a: number, b: number) => a <= b;

    // Linear interpolation between two band boundaries
    const interp = (
      r: number,
      lo: number | null, hi: number | null,
      loScore: number, hiScore: number,
    ): number => {
      if (lo === null || hi === null || lo === hi) return loScore;
      return loScore + (hiScore - loScore) * (r - lo) / (hi - lo);
    };

    if (meets(v, target100)) return weight;
    if (target95 !== null && meets(v, target95))
      return weight * interp(v, target95, target100, 0.95, 1.0);
    if (target90 !== null && meets(v, target90))
      return weight * interp(v, target90, target95 ?? target100, 0.90, 0.95);
    if (target85 !== null && meets(v, target85))
      return weight * interp(v, target85, target90 ?? target95 ?? target100, 0.85, 0.90);

    return 0;
  }

  /**
   * Returns true if the indicator should be scored in the given month (1-indexed).
   * Mirrors legacy indicadorContaMes().
   */
  indicatorCountsInMonth(indicator: Indicator, month: number): boolean {
    switch (indicator.periodicity) {
      case 'monthly':    return true;
      case 'quarterly':  return month % 3 === 0;
      case 'semiannual': return month === 6 || month === 12;
      case 'annual':     return month === 12;
    }
  }

  // ── Group key ─────────────────────────────────────────────────────────────

  /** Builds the composite key used in db.results to identify a sector/shift group. */
  buildGroupKey(sector: string, shift: string, role?: string): string {
    return role ? `${sector}||${shift}||${role}` : `${sector}||${shift}`;
  }

  // ── Raw score ─────────────────────────────────────────────────────────────

  /**
   * Sums weighted achievements for all scoreable indicators in a sector/shift/role
   * for the current period. Returns null if no indicator has a result entered.
   * Mirrors legacy calcBruto().
   */
  calcRawScore(sector: string, shift: string, role = ''): number | null {
    const period   = this.db.currentPeriod();
    const month    = parseInt(period.split('-')[1], 10);
    const groupKey = this.buildGroupKey(sector, shift, role || undefined);

    const savedResults = this.db.results()[period]?.[groupKey] ?? {};

    const indicators = this.db.indicators().filter(
      i => i.sector === sector && i.shift === shift && (role === '' || i.role === role),
    );

    let sum     = 0;
    let hasData = false;

    for (const ind of indicators) {
      if (!this.indicatorCountsInMonth(ind, month)) continue;
      const achievement = this.calcIndicatorAchievement(ind, savedResults[String(ind.id)]);
      if (achievement !== null) {
        sum += achievement;
        hasData = true;
      }
    }

    return hasData ? sum : null;
  }

  // ── 5S Audit ─────────────────────────────────────────────────────────────

  /**
   * Calculates the average 5S audit score for a sector in the current period.
   * Returns null if no valid audits exist. Mirrors legacy calcMedia5S().
   */
  calc5SAverage(sector: string): number | null {
    const key    = `${sector}||${this.db.currentPeriod()}`;
    const audits = this.db.audits5S()[key] ?? [];
    const scores = audits
      .map(a => a.score)
      .filter((s): s is number => s !== null && !isNaN(s));

    return scores.length > 0
      ? scores.reduce((a, b) => a + b, 0) / scores.length
      : null;
  }

  /**
   * Returns the 5S penalty for a sector (-5% if average < 7.5, otherwise 0).
   * Mirrors legacy calcPen5S().
   */
  calc5SPenalty(sector: string): number {
    const avg = this.calc5SAverage(sector);
    if (avg === null) return 0;
    return avg >= 7.5 ? 0 : -0.05;
  }

  // ── SST ───────────────────────────────────────────────────────────────────

  /** Counts SST incidents for a sector in the current period. */
  countSstIncidents(sector: string): number {
    const period = this.db.currentPeriod();
    return this.db
      .sstIncidents()
      .filter(i => i.sector === sector && i.period === period).length;
  }

  /**
   * Returns the SST penalty for a sector.
   * Fatal accident active → -100%; any incident → -5%; none → 0.
   * Mirrors legacy calcPenSST().
   */
  calcSstPenalty(sector: string): number {
    if (this.db.sstFatalActive()) return -1;
    return this.countSstIncidents(sector) > 0 ? -0.05 : 0;
  }

  // ── Billing ───────────────────────────────────────────────────────────────

  /** Returns the billing rate for the current period as a ratio (0–0.10). */
  getBillingRate(): number {
    return (this.db.billing()[this.db.currentPeriod()] ?? 0) / 100;
  }

  // ── Final score ───────────────────────────────────────────────────────────

  /**
   * Computes the final score: raw + 5S penalty + SST penalty + billing, floored at 0.
   * Returns null if there is no raw score data.
   */
  calcFinalScore(sector: string, shift: string, role = ''): number | null {
    const raw = this.calcRawScore(sector, shift, role);
    if (raw === null) return null;
    return Math.max(
      0,
      raw + this.calc5SPenalty(sector) + this.calcSstPenalty(sector) + this.getBillingRate(),
    );
  }

  /** Returns all score components in a single object for display purposes. */
  calcScoreBreakdown(sector: string, shift: string, role = ''): ScoreBreakdown {
    const raw        = this.calcRawScore(sector, shift, role);
    const penalty5S  = this.calc5SPenalty(sector);
    const penaltySst = this.calcSstPenalty(sector);
    const billing    = this.getBillingRate();
    const final      = raw !== null
      ? Math.max(0, raw + penalty5S + penaltySst + billing)
      : null;

    return { raw, penalty5S, penaltySst, billing, final };
  }

  // ── Group combinations ────────────────────────────────────────────────────

  /**
   * Returns the unique set of sector/shift/role groups derived from the
   * indicator list, preserving insertion order. Mirrors legacy getCombos().
   */
  getGroupCombinations(): GroupCombo[] {
    const seen   = new Set<string>();
    const combos: GroupCombo[] = [];

    for (const ind of this.db.indicators()) {
      const key = `${ind.sector}||${ind.shift}||${ind.role}`;
      if (!seen.has(key)) {
        seen.add(key);
        combos.push({ sector: ind.sector, shift: ind.shift, role: ind.role });
      }
    }

    return combos;
  }
}
