import { Injectable, inject, signal } from '@angular/core';
import { DbService } from './db.service';
import type { LockArea, PendingUnlock } from '../models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly db = inject(DbService);

  private readonly _unlocked = signal<Record<LockArea, boolean>>({
    planning: false,
    quality:  false,
    sst:      false,
  });

  readonly pendingUnlock = signal<PendingUnlock | null>(null);

  isUnlocked(area: LockArea): boolean {
    if (!this.passwordFor(area)) return true;  // no password = open access
    return this._unlocked()[area];
  }

  requestUnlock(area: LockArea, returnUrl: string): void {
    this.pendingUnlock.set({ area, returnUrl });
  }

  tryUnlock(password: string): boolean {
    const pending = this.pendingUnlock();
    if (!pending) return false;
    if (password !== this.passwordFor(pending.area)) return false;

    this._unlocked.update(s => ({ ...s, [pending.area]: true }));
    this.pendingUnlock.set(null);
    return true;
  }

  cancelUnlock(): void {
    this.pendingUnlock.set(null);
  }

  lockAll(): void {
    this._unlocked.set({ planning: false, quality: false, sst: false });
  }

  private passwordFor(area: LockArea): string {
    const p = this.db.passwords();
    switch (area) {
      case 'planning': return p.planning;
      case 'quality':  return p.quality;
      case 'sst':      return p.sst;
    }
  }
}
