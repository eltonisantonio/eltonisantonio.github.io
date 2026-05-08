import { Routes } from '@angular/router';
import { APP_PATHS } from './core/consts/app-paths.const';
import { LoginLayoutComponent } from './core/layouts/auth/login/login-layout.component';

export const routes: Routes = [
  {
    path: APP_PATHS.login.path,
    component: LoginLayoutComponent,
    children: [
      {
        path: '',
        loadComponent: () => import(
          './features/login/login.component'
        ).then((c) => c.LoginComponent)
      }
    ]
  },
  {
    path: APP_PATHS.home.path,
    loadChildren: () => import(
      './features/home/home.routes'
    ).then((r) => r.HOME_ROUTES)
  }
];
