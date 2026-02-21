import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { form, FormField } from '@angular/forms/signals';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { ISignUp } from '../../../core/interfaces/auth';
import { signupFormValidation } from '../../../shared/validation/authValidation';
import { AuthActions } from '../../../store/auth/auth.actions';
import { selectError, selectLoading } from '../../../store/auth/auth.selectors';

@Component({
  selector: 'app-signup',
  imports: [RouterLink, FormField, FormsModule],
  templateUrl: './signup.html',
  styleUrl: './signup.css',
})
export class Signup {
  private store = inject(Store);
  private route = inject(ActivatedRoute);

  /** Preserve invite token for login link */
  inviteToken = this.route.snapshot.queryParamMap.get('invite');

  signupModel = signal<ISignUp>({ firstName: '', lastName: '', email: '', password: '', dateOfBirth: '' });
  signupForm  = form(this.signupModel, signupFormValidation);

  loading = this.store.selectSignal(selectLoading);
  error   = this.store.selectSignal(selectError);

  onSignup() {
    if (this.signupForm().invalid()) return;
    this.store.dispatch(AuthActions.signup({ input: this.signupModel() }));
  }
}
