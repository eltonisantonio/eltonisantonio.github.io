export type SstIncidentType =
  | 'Ato Inseguro'
  | 'Condição Insegura'
  | 'Acidente sem Afastamento'
  | 'Acidente com Afastamento';

export interface SstIncident {
  id: number;          // timestamp used as unique id
  sector: string;
  date: string;        // YYYY-MM-DD
  type: SstIncidentType;
  description: string;
  period: string;      // YYYY-MM
}
