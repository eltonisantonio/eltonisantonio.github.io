import type { Db } from '../models';
import { DEFAULT_INDICATORS } from './default-indicators.data';

export function defaultDb(): Db {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = now.getFullYear();

  return {
    version: 2,
    currentPeriod: `${year}-${month}`,
    sectors: [
      'ABASTECIMENTO',
      'CONTROLE DE QUALIDADE',
      'E.T.E.',
      'ENSAQUE',
      'ENSAQUE PET',
      'ESTOQUE AQUA',
      'ESTOQUE MP',
      'ESTOQUE PET',
      'EXPEDICAO',
      'EXPEDICAO PET',
      'EXTRUSORA',
      'FFO',
      'HIGIENIZACAO',
      'HIGIENIZACAO INDUSTRIAL',
      'LABORATORIO',
      'MANUTENCAO',
      'PROJETOS',
      'RECEBIMENTO',
      'RESTAURANTE',
      'SALA DE MICRO',
      'SESMT',
      'UTILIDADES',
    ],
    shifts: [
      '1º Turno - 21:00 / 05:20',
      '2º Turno - 05:00 / 13:20',
      '3º Turno - 13:00 / 21:20',
    ],
    indicators: DEFAULT_INDICATORS,
    results: {},
    audits5S: {},
    sstIncidents: [],
    sstFatalActive: false,
    billing: {},
    passwords: { planning: '', quality: '', sst: '' },
  };
}
