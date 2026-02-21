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

  loadMyPlatformAccounts$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PlatformActions.loadMyPlatformAccounts),
      switchMap(() =>
        this.platformGql.getMyPlatformAccounts().pipe(
          map(accounts => PlatformActions.loadMyPlatformAccountsSuccess({ accounts })),
          catchError(err => of(PlatformActions.loadMyPlatformAccountsFailure({ error: err.message }))),
        ),
      ),
    ),
  );

  linkPlatformAccount$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PlatformActions.linkPlatformAccount),
      switchMap(({ accountId, workspaceId }) =>
        this.platformGql.linkPlatformAccount(accountId, workspaceId).pipe(
          map(account => PlatformActions.linkPlatformAccountSuccess({ account })),
          catchError(err => of(PlatformActions.linkPlatformAccountFailure({ error: err.message }))),
        ),
      ),
    ),
  );

  linkSuccess$ = createEffect(
    () => this.actions$.pipe(
      ofType(PlatformActions.linkPlatformAccountSuccess),
      tap(() => this.toast.show('Account linked to workspace.', 'success')),
    ),
    { dispatch: false },
  );

  linkFailure$ = createEffect(
    () => this.actions$.pipe(
      ofType(PlatformActions.linkPlatformAccountFailure),
      tap(({ error }) => this.toast.show(error || 'Failed to link account.', 'error')),
    ),
    { dispatch: false },
  );

  unlinkPlatformAccount$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PlatformActions.unlinkPlatformAccount),
      switchMap(({ accountId, workspaceId }) =>
        this.platformGql.unlinkPlatformAccount(accountId, workspaceId).pipe(
          map(account => PlatformActions.unlinkPlatformAccountSuccess({ account })),
          catchError(err => of(PlatformActions.unlinkPlatformAccountFailure({ error: err.message }))),
        ),
      ),
    ),
  );

  unlinkSuccess$ = createEffect(
    () => this.actions$.pipe(
      ofType(PlatformActions.unlinkPlatformAccountSuccess),
      tap(() => this.toast.show('Account unlinked from workspace.', 'info')),
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
