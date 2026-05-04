export interface Audit5S {
  score: number;   // 0–10
  date: string;    // YYYY-MM-DD
  auditor: string;
}

// audits5S['SECTOR||YYYY-MM'] = up to 5 evaluations
export type Audits5S = Record<string, Audit5S[]>;
