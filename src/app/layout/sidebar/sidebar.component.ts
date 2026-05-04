import { Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { DbService } from '../../core/services/db.service';
import { FirebaseService } from '../../core/services/firebase.service';
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
  protected readonly firebase = inject(FirebaseService);

  protected readonly periodLabel = computed(() => formatPeriodLabel(this.db.currentPeriod()));
  protected readonly isSyncing   = computed(() =>
    this.firebase.status() === 'loading' || this.firebase.status() === 'saving',
  );

  protected async sync(): Promise<void> {
    await this.db.syncFromCloud();
  }

  protected readonly sections: SafeNavSection[] = NAV_SECTIONS.map(section => ({
    ...section,
    items: section.items.map(item => ({
      ...item,
      safeIcon: this.sanitizer.bypassSecurityTrustHtml(item.icon),
    })),
  }));
}
