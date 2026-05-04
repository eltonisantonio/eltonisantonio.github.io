import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar.component';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent],
  template: `
    <div class="app">
      <app-sidebar />
      <main class="main">
        <router-outlet />
      </main>
    </div>
  `,
})
export class ShellComponent {}
