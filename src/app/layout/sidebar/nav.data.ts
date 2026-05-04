import { ROUTE_PATHS } from '../../core/routes.map';
import type { LockArea } from '../../core/models';

export type { LockArea };

export interface NavItem {
  label: string;
  routerLink: string[];
  icon: string;
  lockArea?: LockArea;
}

export interface NavSection {
  title: string;
  items: NavItem[];
  hasDivider: boolean;
}

export const NAV_SECTIONS: NavSection[] = [
  {
    title: 'Planejamento & RH',
    hasDivider: false,
    items: [
      {
        label: 'Lançar Resultados',
        routerLink: ['/', ROUTE_PATHS.results],
        icon: `<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="2" y="2" width="5" height="5" rx="1" fill="currentColor" opacity=".7"/><rect x="9" y="2" width="5" height="5" rx="1" fill="currentColor"/><rect x="2" y="9" width="5" height="5" rx="1" fill="currentColor" opacity=".4"/><rect x="9" y="9" width="5" height="5" rx="1" fill="currentColor" opacity=".6"/></svg>`,
        lockArea: 'planning',
      },
      {
        label: 'Indicadores',
        routerLink: ['/', ROUTE_PATHS.indicators],
        icon: `<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2 12L6 7l3 3 5-6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
        lockArea: 'planning',
      },
      {
        label: 'Setores & Turnos',
        routerLink: ['/', ROUTE_PATHS.sectors],
        icon: `<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="2" y="2" width="12" height="4" rx="1.5" stroke="currentColor" stroke-width="1.4"/><rect x="2" y="10" width="12" height="4" rx="1.5" stroke="currentColor" stroke-width="1.4"/></svg>`,
        lockArea: 'planning',
      },
    ],
  },
  {
    title: 'Qualidade 5S',
    hasDivider: true,
    items: [
      {
        label: 'Auditorias 5S',
        routerLink: ['/', ROUTE_PATHS.quality],
        icon: `<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8 2l1.8 3.6L14 6.4l-3 2.9.7 4.1L8 11.3l-3.7 2.1.7-4.1-3-2.9 4.2-.8z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/></svg>`,
        lockArea: 'quality',
      },
    ],
  },
  {
    title: 'SST',
    hasDivider: true,
    items: [
      {
        label: 'Registrar Incidente',
        routerLink: ['/', ROUTE_PATHS.sstRegister],
        icon: `<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8 2L3 5v4c0 3 2.3 5.3 5 6 2.7-.7 5-3 5-6V5L8 2z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/></svg>`,
        lockArea: 'sst',
      },
      {
        label: 'Situação por Setor',
        routerLink: ['/', ROUTE_PATHS.sstRegister, ROUTE_PATHS.sstStatus],
        icon: `<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="1.4"/><path d="M8 5v3.5l2 1.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>`,
        lockArea: 'sst',
      },
    ],
  },
  {
    title: 'Visão Geral',
    hasDivider: true,
    items: [
      {
        label: 'Painel Gestores',
        routerLink: ['/', ROUTE_PATHS.managers],
        icon: `<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2 13c0-2.2 1.8-4 4-4h4c2.2 0 4 1.8 4 4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><circle cx="8" cy="5" r="3" stroke="currentColor" stroke-width="1.4"/></svg>`,
      },
    ],
  },
  {
    title: 'Dados',
    hasDivider: true,
    items: [
      {
        label: 'Exportar / Importar',
        routerLink: ['/', ROUTE_PATHS.export],
        icon: `<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8 2v8M5 7l3 3 3-3M3 13h10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
      },
      {
        label: 'Configurações',
        routerLink: ['/', ROUTE_PATHS.config],
        icon: `<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="8" cy="8" r="2.5" stroke="currentColor" stroke-width="1.4"/><path d="M8 2v1.5M8 12.5V14M2 8h1.5M12.5 8H14M3.5 3.5l1 1M11.5 11.5l1 1M12.5 3.5l-1 1M4.5 11.5l-1 1" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>`,
      },
    ],
  },
];
