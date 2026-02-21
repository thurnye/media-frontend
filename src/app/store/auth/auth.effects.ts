import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, of, switchMap, tap } from 'rxjs';
import { AuthGqlService } from '../../core/services/auth.gql.service';
import { AuthActions } from './auth.actions';

@Injectable()
export class AuthEffects {
  private actions$ = inject(Actions);
  private authGql  = inject(AuthGqlService);
  private router   = inject(Router);

  restoreSession$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.restoreSession),
      switchMap(() =>
        this.authGql.me().pipe(
          map(user => AuthActions.restoreSessionSuccess({ user })),
          catchError(() => of(AuthActions.logout())), // no cookie or expired — stay on current page
        ),
      ),
    ),
  );

  login$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.login),
      switchMap(({ credentials }) =>
        this.authGql.login(credentials).pipe(
          map(user => AuthActions.loginSuccess({ user })),
          catchError(err => of(AuthActions.loginFailure({ error: err.message }))),
        ),
      ),
    ),
  );

  loginSuccess$ = createEffect(
    () => this.actions$.pipe(
      ofType(AuthActions.loginSuccess),
      tap(() => this.router.navigate(['/dashboard'])),
    ),
    { dispatch: false },
  );

  signup$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.signup),
      switchMap(({ input }) =>
        this.authGql.signup(input).pipe(
          map(user => AuthActions.signupSuccess({ user })),
          catchError(err => of(AuthActions.signupFailure({ error: err.message }))),
        ),
      ),
    ),
  );

  signupSuccess$ = createEffect(
    () => this.actions$.pipe(
      ofType(AuthActions.signupSuccess),
      tap(() => this.router.navigate(['/dashboard'])),
    ),
    { dispatch: false },
  );
}
