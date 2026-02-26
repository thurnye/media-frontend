import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { form, FormField } from '@angular/forms/signals';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { ILogin } from '../../../core/interfaces/auth';
import { loginFormValidation } from '../../../shared/validation/authValidation';
import { AuthActions } from '../../../store/auth/auth.actions';
import { selectError, selectLoading } from '../../../store/auth/auth.selectors';

@Component({
  selector: 'app-login',
  imports: [RouterLink, FormField, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  private store = inject(Store);
  private route = inject(ActivatedRoute);

  loginModel = signal<ILogin>({ email: '', password: '' });
  loginForm  = form(this.loginModel, loginFormValidation);

  loading = this.store.selectSignal(selectLoading);
  error   = this.store.selectSignal(selectError);
  showPassword = signal(false);

  /** Preserve invite token for signup link */
  inviteToken = this.route.snapshot.queryParamMap.get('invite');
  signupSuccess = this.route.snapshot.queryParamMap.get('signup') === 'success';
  passwordResetRequested = this.route.snapshot.queryParamMap.get('reset') === 'requested';
  passwordResetDone = this.route.snapshot.queryParamMap.get('reset') === 'done';

  onLogin() {
    if (this.loginForm().invalid()) return;
    this.store.dispatch(AuthActions.login({ credentials: this.loginModel() }));
  }

  toggleShowPassword() {
    this.showPassword.update((value) => !value);
  }
}
