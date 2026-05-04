import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { LockModalComponent } from '../../shared/components/lock-modal/lock-modal.component';
import { ToastComponent } from '../../shared/components/toast/toast.component';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, LockModalComponent, ToastComponent],
  template: `
    <div class="app">
      <app-sidebar />
      <main class="main">
        <router-outlet />
      </main>
    </div>
    <app-lock-modal />
    <app-toast />
  `,
})
export class ShellComponent {}
