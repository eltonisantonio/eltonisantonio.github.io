export const ROUTE_PATHS = {
  results:     'resultados',
  indicators:  'indicadores',
  sectors:     'setores',
  quality:     'qualidade',
  sstRegister: 'sst',
  sstStatus:   'situacao',   // nested under sstRegister: /sst/situacao
  managers:    'gestores',
  export:      'exportar',
  config:      'configuracoes',
} as const;

export type RouteKey = keyof typeof ROUTE_PATHS;

export const ROUTE_LABELS: Record<RouteKey, string> = {
  results:     'Lançamento de Resultados',
  indicators:  'Cadastro de Indicadores',
  sectors:     'Setores & Turnos',
  quality:     'Auditorias 5S',
  sstRegister: 'Registrar Incidente SST',
  sstStatus:   'Situação SST por Setor',
  managers:    'Painel de Gestores',
  export:      'Exportar / Importar',
  config:      'Configurações',
};
