import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Store } from '@ngrx/store';
import { selectUser } from '../../store/auth/auth.selectors';
import { AuthActions } from '../../store/auth/auth.actions';
import { selectWorkspaces } from '../../store/workspace/workspace.selectors';

@Component({
  selector: 'app-dashboard',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard {
  private store = inject(Store);
  private Router = inject(Router);

  user = this.store.selectSignal(selectUser);
  workspaces = this.store.selectSignal(selectWorkspaces);
  sidebarOpen = signal(false);

  initials = computed(() => {
    const u = this.user();
    if (!u) return '?';
    return `${u.firstName[0]}${u.lastName[0]}`.toUpperCase();
  });

  toggleSidebar(): void {
    this.sidebarOpen.update((v) => !v);
  }
  closeSidebar(): void {
    this.sidebarOpen.set(false);
  }

  onLogout(): void {
    this.store.dispatch(AuthActions.logout());
    this.Router.navigate(['/login']);
  }
}
