import { Routes } from '@angular/router';
import { ROUTE_PATHS } from './core/routes.map';
import { areaLockGuard } from './core/guards/area-lock.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./layout/shell/shell.component').then(m => m.ShellComponent),
    children: [
      { path: '', redirectTo: ROUTE_PATHS.managers, pathMatch: 'full' },
      {
        path: ROUTE_PATHS.results,
        canActivate: [areaLockGuard('planning')],
        loadComponent: () =>
          import('./features/results/results.component').then(m => m.ResultsComponent),
      },
      {
        path: ROUTE_PATHS.indicators,
        canActivate: [areaLockGuard('planning')],
        loadComponent: () =>
          import('./features/indicators/indicators.component').then(m => m.IndicatorsComponent),
      },
      {
        path: ROUTE_PATHS.sectors,
        canActivate: [areaLockGuard('planning')],
        loadComponent: () =>
          import('./features/sectors/sectors.component').then(m => m.SectorsComponent),
      },
      {
        path: ROUTE_PATHS.quality,
        canActivate: [areaLockGuard('quality')],
        loadComponent: () =>
          import('./features/quality/quality.component').then(m => m.QualityComponent),
      },
      {
        path: ROUTE_PATHS.sstRegister,
        canActivate: [areaLockGuard('sst')],
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./features/sst/sst-register.component').then(m => m.SstRegisterComponent),
          },
          {
            path: ROUTE_PATHS.sstStatus,
            loadComponent: () =>
              import('./features/sst/sst-status.component').then(m => m.SstStatusComponent),
          },
        ],
      },
      {
        path: ROUTE_PATHS.managers,
        loadComponent: () =>
          import('./features/managers/managers.component').then(m => m.ManagersComponent),
      },
      {
        path: ROUTE_PATHS.export,
        loadComponent: () =>
          import('./features/export/export.component').then(m => m.ExportComponent),
      },
      {
        path: ROUTE_PATHS.config,
        loadComponent: () =>
          import('./features/config/config.component').then(m => m.ConfigComponent),
      },
    ],
  },
];
