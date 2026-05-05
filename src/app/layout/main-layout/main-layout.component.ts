import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { LockModalComponent } from '../../shared/components/lock-modal/lock-modal.component';
import { ToastComponent } from '../../shared/components/toast/toast.component';

@Component({
standalone: true,
  imports: [
    RouterOutlet,
    SidebarComponent,
    LockModalComponent,
    ToastComponent
  ],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.scss',
})
export class MainLayout {}
