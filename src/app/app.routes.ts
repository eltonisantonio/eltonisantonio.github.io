import { Routes } from '@angular/router';

import { APP_ROUTES } from './core/configs/app-routes';
import { areaLockGuard } from './core/guards/area-lock.guard';
import { MainLayout } from './layout/main-layout/main-layout.component';

export const routes: Routes = [
  {
    path: '',
    component: MainLayout,
    children: [
      {
        path: '',
        redirectTo: APP_ROUTES.managers.path,
        pathMatch: 'full'
      },
      {
        path: APP_ROUTES.managers.path,
        loadChildren: () => import('./features/managers/managers.routes'),
      },
      {
        path: APP_ROUTES.results.path,
        canActivate: [areaLockGuard('planning')],
        loadChildren: () => import('./features/results/results.routes'),
      },
      {
        path: APP_ROUTES.indicators.path,
        canActivate: [areaLockGuard('planning')],
        loadChildren: () => import('./features/indicators/indicators.routes'),
      },
      {
        path: APP_ROUTES.sectors.path,
        canActivate: [areaLockGuard('planning')],
        loadChildren: () => import('./features/sectors/sectors.routes'),
      },
      {
        path: APP_ROUTES.quality.path,
        canActivate: [areaLockGuard('quality')],
        loadChildren: () => import('./features/quality/quality.routes'),
      },
      {
        path: APP_ROUTES.sstRegister.path,
        canActivate: [areaLockGuard('sst')],
        loadChildren: () => import('./features/sst/sst.routes'),
      },
      {
        path: APP_ROUTES.export.path,
        loadChildren: () => import('./features/export/export.routes'),
      },
      {
        path: APP_ROUTES.settings.path,
        loadChildren: () => import('./features/settings/settings.routes'),
      },
    ],
  },
];
