import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthGqlService } from '../../../core/services/auth.gql.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-forgot-password',
  imports: [FormsModule, RouterLink],
  templateUrl: './forgot-password.html',
})
export class ForgotPassword {
  private authGql = inject(AuthGqlService);
  private router = inject(Router);
  private toast = inject(ToastService);

  email = signal('');
  loading = signal(false);
  error = signal<string | null>(null);

  onSubmit() {
    const email = this.email().trim();
    if (!email) return;
    this.loading.set(true);
    this.error.set(null);
    this.authGql.requestPasswordReset(email).subscribe({
      next: () => {
        this.loading.set(false);
        this.toast.show('If your email exists, a reset link has been sent.', 'success');
        this.router.navigate(['/login'], { queryParams: { reset: 'requested' } });
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err?.message || 'Failed to request password reset');
        this.toast.show(err?.message || 'Failed to request password reset', 'error');
      },
    });
  }
}
