import { Component } from '@angular/core';
import { ROUTE_LABELS } from '../../core/routes.map';

@Component({
  selector: 'app-quality',
  standalone: true,
  template: `
    <div class="page-header">
      <div>
        <div class="page-title">{{ title }}</div>
        <div class="page-sub">Em construção</div>
      </div>
    </div>
  `,
})
export class QualityComponent {
  protected readonly title = ROUTE_LABELS.quality;
}
