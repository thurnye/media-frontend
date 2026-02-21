import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { form, FormField } from '@angular/forms/signals';
import { RouterLink } from '@angular/router';
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

  loginModel = signal<ILogin>({ email: '', password: '' });
  loginForm  = form(this.loginModel, loginFormValidation);

  loading = this.store.selectSignal(selectLoading);
  error   = this.store.selectSignal(selectError);

  onLogin() {
    if (this.loginForm().invalid()) return;
    this.store.dispatch(AuthActions.login({ credentials: this.loginModel() }));
  }
}
