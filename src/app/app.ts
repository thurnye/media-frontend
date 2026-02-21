import { Component, inject, OnInit } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { Store } from '@ngrx/store';
import { selectInitialized, selectUser } from './store/auth/auth.selectors';
import { AuthActions } from './store/auth/auth.actions';
import { ToastComponent } from './core/components/toast/toast';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, ToastComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnInit {
  private store  = inject(Store);
  private router = inject(Router);

  private user  = this.store.selectSignal(selectUser);
  initialized   = this.store.selectSignal(selectInitialized);

  ngOnInit(): void {
    // On every page load, ask the backend "who am I?" using the HttpOnly cookie.
    // If valid → restoreSessionSuccess → user stays logged in.
    // If invalid/missing → logout → user stays on public routes.
    this.store.dispatch(AuthActions.restoreSession());
  }

  loggedInUser(): string | null {
    const u = this.user();
    return u ? `${u.firstName} ${u.lastName}` : null;
  }

  onLogout(): void {
    this.store.dispatch(AuthActions.logout());
    this.router.navigate(['/login']);
  }
}
