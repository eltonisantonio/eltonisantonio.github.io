type RouteConfig = {
  path: string;
  label: string;
};

export const APP_ROUTES = {
  results: {
    path: 'resultados',
    label: 'Lançamento de Resultados',
  },
  indicators: {
    path: 'indicadores',
    label: 'Cadastro de Indicadores',
  },
  sectors: {
    path: 'setores',
    label: 'Setores & Turnos',
  },
  quality: {
    path: 'qualidade',
    label: 'Auditorias 5S',
  },
  sstRegister: {
    path: 'sst',
    label: 'Registrar Incidente SST',
  },
  sstStatus: {
    path: 'situacao',
    label: 'Situação SST por Setor',
  },
  managers: {
    path: 'gestores',
    label: 'Painel de Gestores',
  },
  export: {
    path: 'exportar',
    label: 'Exportar / Importar',
  },
  settings: {
    path: 'configuracoes',
    label: 'Configurações',
  },
} satisfies Record<string, RouteConfig>;
