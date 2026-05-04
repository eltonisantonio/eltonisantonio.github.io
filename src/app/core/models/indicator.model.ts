export type Direction = 'higher' | 'lower';
export type Format = 'decimal' | 'integer' | 'absolute';
export type Periodicity = 'monthly' | 'quarterly' | 'semiannual' | 'annual';

export interface Indicator {
  id: number;
  sector: string;
  shift: string;
  role: string;
  name: string;
  direction: Direction;
  format: Format;
  periodicity: Periodicity;
  closingMonth: number | null;
  weight: number;
  target85: number | null;
  target90: number | null;
  target95: number | null;
  target100: number | null;
}
