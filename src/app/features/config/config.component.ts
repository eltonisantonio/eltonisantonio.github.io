import { Component, computed, inject } from '@angular/core';
import { ReactiveFormsModule, FormGroup, FormControl } from '@angular/forms';
import { DbService } from '../../core/services/db.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../shared/services/toast.service';
import { ROUTE_LABELS } from '../../core/routes.map';

@Component({
  selector: 'app-config',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './config.component.html',
})
export class ConfigComponent {
  private readonly db    = inject(DbService);
  private readonly auth  = inject(AuthService);
  private readonly toast = inject(ToastService);

  protected readonly title     = ROUTE_LABELS.config;
  protected readonly passwords = computed(() => this.db.passwords());

  protected readonly form = new FormGroup({
    planning: new FormControl('', { nonNullable: true }),
    quality:  new FormControl('', { nonNullable: true }),
    sst:      new FormControl('', { nonNullable: true }),
  });

  protected savePasswords(): void {
    const { planning, quality, sst } = this.form.getRawValue();

    this.db.update(db => ({
      ...db,
      passwords: { planning, quality, sst },
    }));

    // Lock all areas so the new passwords take effect immediately
    this.auth.lockAll();
    this.form.reset({ planning: '', quality: '', sst: '' });
    this.toast.show('Senhas atualizadas!');
  }

  protected hasPassword(area: 'planning' | 'quality' | 'sst'): boolean {
    return this.passwords()[area].length > 0;
  }
}
