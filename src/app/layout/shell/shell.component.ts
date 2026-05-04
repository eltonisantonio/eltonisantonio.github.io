import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { LockModalComponent } from '../../shared/components/lock-modal/lock-modal.component';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, LockModalComponent],
  template: `
    <div class="app">
      <app-sidebar />
      <main class="main">
        <router-outlet />
      </main>
    </div>
    <app-lock-modal />
  `,
})
export class ShellComponent {}
