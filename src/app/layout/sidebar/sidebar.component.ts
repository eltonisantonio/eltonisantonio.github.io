import { Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { DbService } from '../../core/services/db.service';
import { NAV_SECTIONS, NavSection, NavItem } from './nav.data';

const MONTHS_PT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

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

  protected readonly periodLabel = computed(() => {
    const [year, month] = this.db.currentPeriod().split('-');
    return `${MONTHS_PT[parseInt(month, 10) - 1]} / ${year}`;
  });

  protected readonly sections: SafeNavSection[] = NAV_SECTIONS.map(section => ({
    ...section,
    items: section.items.map(item => ({
      ...item,
      safeIcon: this.sanitizer.bypassSecurityTrustHtml(item.icon),
    })),
  }));
}
