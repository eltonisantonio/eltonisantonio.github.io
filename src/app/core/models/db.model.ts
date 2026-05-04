import type { Indicator } from './indicator.model';
import type { Results } from './result.model';
import type { Audits5S } from './audit-5s.model';
import type { SstIncident } from './sst-incident.model';

export interface DbPasswords {
  planning: string;
  quality: string;
  sst: string;
}

export interface Db {
  version: number;
  currentPeriod: string;           // YYYY-MM
  sectors: string[];
  shifts: string[];
  indicators: Indicator[];
  results: Results;
  audits5S: Audits5S;
  sstIncidents: SstIncident[];
  sstFatalActive: boolean;         // fatal accident flag — zeroes all sectors in current period
  billing: Record<string, number>; // YYYY-MM -> percentage (0–10)
  passwords: DbPasswords;
}
