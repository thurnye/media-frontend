import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthGqlService } from '../../../core/services/auth.gql.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-reset-password',
  imports: [FormsModule, RouterLink],
  templateUrl: './reset-password.html',
})
export class ResetPassword {
  private route = inject(ActivatedRoute);
  private authGql = inject(AuthGqlService);
  private router = inject(Router);
  private toast = inject(ToastService);

  token = this.route.snapshot.queryParamMap.get('token') ?? '';
  password = signal('');
  confirmPassword = signal('');
  showPassword = signal(false);
  showConfirmPassword = signal(false);
  loading = signal(false);
  error = signal<string | null>(null);

  get isInvalid(): boolean {
    return (
      !this.token ||
      this.password().trim().length < 10 ||
      this.password() !== this.confirmPassword()
    );
  }

  onSubmit() {
    if (this.isInvalid) return;
    this.loading.set(true);
    this.error.set(null);
    this.authGql.resetPassword(this.token, this.password()).subscribe({
      next: () => {
        this.loading.set(false);
        this.toast.show('Password updated successfully.', 'success');
        this.router.navigate(['/login'], { queryParams: { reset: 'done' } });
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err?.message || 'Failed to reset password');
        this.toast.show(err?.message || 'Failed to reset password', 'error');
      },
    });
  }

  toggleShowPassword() {
    this.showPassword.update((value) => !value);
  }

  toggleShowConfirmPassword() {
    this.showConfirmPassword.update((value) => !value);
  }
}
