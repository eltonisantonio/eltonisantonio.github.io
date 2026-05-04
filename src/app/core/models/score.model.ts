export interface GroupCombo {
  sector: string;
  shift: string;
  role: string;
}

export interface ScoreBreakdown {
  raw: number | null;
  penalty5S: number;
  penaltySst: number;
  billing: number;
  final: number | null;
}

export type ScoreStatus = '100%' | '95%+' | '90%+' | '85%+' | '<85%' | 'no-data';
