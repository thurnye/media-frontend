import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthGqlService } from '../../../core/services/auth.gql.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-verify-email',
  imports: [RouterLink],
  templateUrl: './verify-email.html',
})
export class VerifyEmail {
  private route = inject(ActivatedRoute);
  private authGql = inject(AuthGqlService);
  private toast = inject(ToastService);

  loading = signal(true);
  success = signal(false);
  message = signal('Verifying your email...');

  constructor() {
    const token = this.route.snapshot.queryParamMap.get('token');
    if (!token) {
      this.loading.set(false);
      this.success.set(false);
      this.message.set('Verification token is missing.');
      return;
    }
    this.authGql.verifyEmail(token).subscribe({
      next: () => {
        this.loading.set(false);
        this.success.set(true);
        this.message.set('Email verified successfully. You can now sign in.');
        this.toast.show('Email verified successfully. You can now sign in.', 'success');
      },
      error: (err) => {
        this.loading.set(false);
        this.success.set(false);
        this.message.set(err?.message || 'Email verification failed.');
        this.toast.show(err?.message || 'Email verification failed.', 'error');
      },
    });
  }
}
