import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ReactiveFormsModule, FormControl, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import type { LockArea } from '../../../core/models';

const AREA_CONFIG: Record<LockArea, { title: string; icon: string }> = {
  planning: { title: 'Acesso — Planejamento & RH', icon: '🛡️' },
  quality:  { title: 'Acesso — Qualidade 5S',       icon: '⭐' },
  sst:      { title: 'Acesso — SST',                icon: '🛡️' },
};

@Component({
  selector: 'app-lock-modal',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './lock-modal.component.html',
})
export class LockModalComponent {
  private readonly auth   = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly pendingUnlock = this.auth.pendingUnlock;
  protected readonly areaConfig    = AREA_CONFIG;
  protected readonly hasError      = signal(false);

  protected readonly form = new FormGroup({
    password: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });

  protected submit(): void {
    const pending = this.pendingUnlock();
    if (!pending) return;

    if (this.auth.tryUnlock(this.form.controls.password.value)) {
      this.form.reset();
      this.hasError.set(false);
      this.router.navigateByUrl(pending.returnUrl);
    } else {
      this.hasError.set(true);
      this.form.controls.password.reset();
    }
  }

  protected cancel(): void {
    this.auth.cancelUnlock();
    this.form.reset();
    this.hasError.set(false);
  }
}
