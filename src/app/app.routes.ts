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
        path: APP_ROUTES.results.path,
        canActivate: [areaLockGuard('planning')],
        loadComponent: () => import(
          './features/results/results.component'
        ).then(m => m.ResultsComponent),
      },
      {
        path: APP_ROUTES.indicators.path,
        canActivate: [areaLockGuard('planning')],
        loadComponent: () => import(
          './features/indicators/indicators.component'
        ).then(m => m.IndicatorsComponent),
      },
      {
        path: APP_ROUTES.sectors.path,
        canActivate: [areaLockGuard('planning')],
        loadComponent: () => import(
          './features/sectors/sectors.component'
        ).then(m => m.SectorsComponent),
      },
      {
        path: APP_ROUTES.quality.path,
        canActivate: [areaLockGuard('quality')],
        loadComponent: () => import(
          './features/quality/quality.component'
        ).then(m => m.QualityComponent),
      },
      {
        path: APP_ROUTES.sstRegister.path,
        canActivate: [areaLockGuard('sst')],
        children: [
          {
            path: '',
            loadComponent: () => import(
              './features/sst/sst-register.component'
            ).then(m => m.SstRegisterComponent),
          },
          {
            path: APP_ROUTES.sstStatus.path,
            loadComponent: () => import(
              './features/sst/sst-status.component'
            ).then(m => m.SstStatusComponent),
          },
        ],
      },
      {
        path: APP_ROUTES.managers.path,
        loadComponent: () => import(
          './features/managers/managers.component'
        ).then(m => m.ManagersComponent),
      },
      {
        path: APP_ROUTES.export.path,
        loadComponent: () => import(
          './features/export/export.component'
        ).then(m => m.ExportComponent),
      },
      {
        path: APP_ROUTES.config.path,
        loadComponent: () => import(
          './features/config/config.component'
        ).then(m => m.ConfigComponent),
      },
    ],
  },
];
