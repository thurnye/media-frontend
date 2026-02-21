import { inject, Injectable } from '@angular/core';
import { Apollo } from 'apollo-angular';
import { map } from 'rxjs';
import { ILogin, ISignUp, IUser } from '../interfaces/auth';
import { LOGIN_MUTATION, ME_QUERY, SIGNUP_MUTATION } from '../graphql/auths.graphql';

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
}
