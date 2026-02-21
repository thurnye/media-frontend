import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, of, switchMap, tap } from 'rxjs';
import { PlatformGqlService } from '../../core/services/platform.gql.service';
import { ToastService } from '../../core/services/toast.service';
import { PlatformActions } from './platform.actions';

@Injectable()
export class PlatformEffects {
  private actions$    = inject(Actions);
  private platformGql = inject(PlatformGqlService);
  private toast       = inject(ToastService);

  loadPlatformAccounts$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PlatformActions.loadPlatformAccounts),
      switchMap(({ workspaceId }) =>
        this.platformGql.getPlatformAccounts(workspaceId).pipe(
          map(accounts => PlatformActions.loadPlatformAccountsSuccess({ accounts })),
          catchError(err => of(PlatformActions.loadPlatformAccountsFailure({ error: err.message }))),
        ),
      ),
    ),
  );

  connectPlatformAccount$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PlatformActions.connectPlatformAccount),
      switchMap(({ input }) =>
        this.platformGql.connectPlatformAccount(input).pipe(
          map(account => PlatformActions.connectPlatformAccountSuccess({ account })),
          catchError(err => of(PlatformActions.connectPlatformAccountFailure({ error: err.message }))),
        ),
      ),
    ),
  );

  connectSuccess$ = createEffect(
    () => this.actions$.pipe(
      ofType(PlatformActions.connectPlatformAccountSuccess),
      tap(() => this.toast.show('Account connected successfully!', 'success')),
    ),
    { dispatch: false },
  );

  connectFailure$ = createEffect(
    () => this.actions$.pipe(
      ofType(PlatformActions.connectPlatformAccountFailure),
      tap(({ error }) => this.toast.show(error || 'Failed to connect account.', 'error')),
    ),
    { dispatch: false },
  );

  disconnectPlatformAccount$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PlatformActions.disconnectPlatformAccount),
      switchMap(({ id }) =>
        this.platformGql.disconnectPlatformAccount(id).pipe(
          map(account => PlatformActions.disconnectPlatformAccountSuccess({ account })),
          catchError(err => of(PlatformActions.disconnectPlatformAccountFailure({ error: err.message }))),
        ),
      ),
    ),
  );

  disconnectSuccess$ = createEffect(
    () => this.actions$.pipe(
      ofType(PlatformActions.disconnectPlatformAccountSuccess),
      tap(() => this.toast.show('Account disconnected.', 'info')),
    ),
    { dispatch: false },
  );
}
