import { Routes } from '@angular/router';
import { APP_ROUTES } from '../../core/configs/app-routes';
import { SstRegisterComponent } from './sst-register.component';
import { SstStatusComponent } from './sst-status.component';

export default [
  {
    path: '',
    component: SstRegisterComponent,
  },
  {
    path: APP_ROUTES.sstStatus.path,
    component: SstStatusComponent,
  },
] satisfies Routes;
