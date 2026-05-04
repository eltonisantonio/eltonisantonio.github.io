import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';
import type { LockArea } from '../models';

export const areaLockGuard = (area: LockArea): CanActivateFn =>
  (_route, state) => {
    const auth = inject(AuthService);
    if (auth.isUnlocked(area)) return true;
    auth.requestUnlock(area, state.url);
    return false;
  };
