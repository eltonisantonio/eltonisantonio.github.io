import { Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { DbService } from '../../core/services/db.service';
import { FirebaseService } from '../../core/services/firebase.service';
import { ToastService } from '../../shared/services/toast.service';
import { formatPeriodLabel } from '../../core/utils/format.utils';
import { NAV_SECTIONS, NavSection, NavItem } from './nav.data';

type SafeNavItem    = NavItem    & { safeIcon: SafeHtml };
type SafeNavSection = Omit<NavSection, 'items'> & { items: SafeNavItem[] };

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html',
})
export class SidebarComponent {
  private readonly db        = inject(DbService);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly toast     = inject(ToastService);
  protected readonly firebase = inject(FirebaseService);

  protected readonly periodLabel = computed(() => formatPeriodLabel(this.db.currentPeriod()));
  protected readonly isSyncing   = computed(() =>
    this.firebase.status() === 'loading' || this.firebase.status() === 'saving',
  );

  protected async sync(): Promise<void> {
    const ok = await this.db.syncFromCloud();
    this.toast.show(ok ? 'Dados atualizados!' : 'Sem dados novos no servidor.', ok ? 'success' : 'error');
  }

  protected readonly sections: SafeNavSection[] = NAV_SECTIONS.map(section => ({
    ...section,
    items: section.items.map(item => ({
      ...item,
      safeIcon: this.sanitizer.bypassSecurityTrustHtml(item.icon),
    })),
  }));
}
