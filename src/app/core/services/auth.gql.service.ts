import { inject, Injectable } from '@angular/core';
import { Apollo } from 'apollo-angular';
import { map } from 'rxjs';
import { ILogin, ISignUp, IUser } from '../interfaces/auth';
import {
  LOGIN_MUTATION,
  ME_QUERY,
  REQUEST_PASSWORD_RESET_MUTATION,
  RESET_PASSWORD_MUTATION,
  SIGNUP_MUTATION,
  VERIFY_EMAIL_MUTATION,
} from '../graphql/auths.graphql';

@Injectable({ providedIn: 'root' })
export class AuthGqlService {
  private apollo = inject(Apollo);

  login(credentials: ILogin) {
    return this.apollo
      .mutate<{ login: { user: IUser } }>({
        mutation: LOGIN_MUTATION,
        variables: credentials,
      })
      .pipe(map((r) => r.data!.login.user));
  }

  signup(input: ISignUp) {
    return this.apollo
      .mutate<{ createUser: { user: IUser } }>({
        mutation: SIGNUP_MUTATION,
        variables: input,
      })
      .pipe(map((r) => r.data!.createUser.user));
  }

  me() {
    return this.apollo
      .query<{ me: IUser }>({ query: ME_QUERY, fetchPolicy: 'no-cache' })
      .pipe(map((r) => r.data!.me));
  }

  verifyEmail(token: string) {
    return this.apollo
      .mutate<{ verifyEmail: boolean }>({
        mutation: VERIFY_EMAIL_MUTATION,
        variables: { token },
      })
      .pipe(map((r) => r.data?.verifyEmail ?? false));
  }

  requestPasswordReset(email: string) {
    return this.apollo
      .mutate<{ requestPasswordReset: boolean }>({
        mutation: REQUEST_PASSWORD_RESET_MUTATION,
        variables: { email },
      })
      .pipe(map((r) => r.data?.requestPasswordReset ?? false));
  }

  resetPassword(token: string, newPassword: string) {
    return this.apollo
      .mutate<{ resetPassword: boolean }>({
        mutation: RESET_PASSWORD_MUTATION,
        variables: { token, newPassword },
      })
      .pipe(map((r) => r.data?.resetPassword ?? false));
  }
}
