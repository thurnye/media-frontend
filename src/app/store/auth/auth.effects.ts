import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { catchError, map, of, switchMap, tap } from 'rxjs';
import { AuthGqlService } from '../../core/services/auth.gql.service';
import { AuthActions } from './auth.actions';
import { WorkspaceActions } from '../workspace/workspace.actions';

@Injectable()
export class AuthEffects {
  private actions$ = inject(Actions);
  private authGql  = inject(AuthGqlService);
  private router   = inject(Router);
  private store    = inject(Store);

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
      tap(() => {
        const invite = this.getQueryParam('invite');
        if (invite) {
          this.store.dispatch(WorkspaceActions.acceptInvitation({ token: invite }));
        } else {
          this.router.navigate(['/dashboard']);
        }
      }),
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
      tap(() => {
        const invite = this.getQueryParam('invite');
        if (invite) {
          this.store.dispatch(WorkspaceActions.acceptInvitation({ token: invite }));
        } else {
          this.router.navigate(['/dashboard']);
        }
      }),
    ),
    { dispatch: false },
  );

  /** Read a query param from the current router URL (not a stale snapshot). */
  private getQueryParam(key: string): string | null {
    const tree = this.router.parseUrl(this.router.url);
    return tree.queryParamMap.get(key);
  }
}
