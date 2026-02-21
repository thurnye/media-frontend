import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, of, switchMap, tap } from 'rxjs';
import { WorkspaceGqlService } from '../../core/services/workspace.gql.service';
import { WorkspaceActions } from './workspace.actions';
import { AuthActions } from '../auth/auth.actions';

@Injectable()
export class WorkspaceEffects {
  private actions$     = inject(Actions);
  private workspaceGql = inject(WorkspaceGqlService);
  private router       = inject(Router);

  // Populate sidebar list directly from the auth payload — no extra API call
  loadWorkspacesOnAuth$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.loginSuccess, AuthActions.signupSuccess, AuthActions.restoreSessionSuccess),
      map(({ user }) =>
        WorkspaceActions.loadWorkspacesSuccess({
          workspaces: (user.workspaces ?? []).map(ws => ({
            id:   ws.workspaceId,
            name: ws.name,
            slug: '',
          })),
        }),
      ),
    ),
  );

  // Load single workspace for edit form
  loadWorkspace$ = createEffect(() =>
    this.actions$.pipe(
      ofType(WorkspaceActions.loadWorkspace),
      switchMap(({ id }) =>
        this.workspaceGql.getWorkspace(id).pipe(
          map(workspace => WorkspaceActions.loadWorkspaceSuccess({ workspace })),
          catchError(err => of(WorkspaceActions.loadWorkspaceFailure({ error: err.message }))),
        ),
      ),
    ),
  );

  createWorkspace$ = createEffect(() =>
    this.actions$.pipe(
      ofType(WorkspaceActions.createWorkspace),
      switchMap(({ input }) =>
        this.workspaceGql.createWorkspace(input).pipe(
          map(workspace => WorkspaceActions.createWorkspaceSuccess({ workspace })),
          catchError(err => of(WorkspaceActions.createWorkspaceFailure({ error: err.message }))),
        ),
      ),
    ),
  );

  createWorkspaceSuccess$ = createEffect(
    () => this.actions$.pipe(
      ofType(WorkspaceActions.createWorkspaceSuccess),
      tap(() => this.router.navigate(['/dashboard/workspaces'])),
    ),
    { dispatch: false },
  );

  updateWorkspace$ = createEffect(() =>
    this.actions$.pipe(
      ofType(WorkspaceActions.updateWorkspace),
      switchMap(({ input }) =>
        this.workspaceGql.updateWorkspace(input).pipe(
          map(workspace => WorkspaceActions.updateWorkspaceSuccess({ workspace })),
          catchError(err => of(WorkspaceActions.updateWorkspaceFailure({ error: err.message }))),
        ),
      ),
    ),
  );

  updateWorkspaceSuccess$ = createEffect(
    () => this.actions$.pipe(
      ofType(WorkspaceActions.updateWorkspaceSuccess),
      tap(() => this.router.navigate(['/dashboard/workspaces'])),
    ),
    { dispatch: false },
  );

  addMember$ = createEffect(() =>
    this.actions$.pipe(
      ofType(WorkspaceActions.addMember),
      switchMap(({ workspaceId, userId, role }) =>
        this.workspaceGql.addMember(workspaceId, userId, role).pipe(
          map(workspace => WorkspaceActions.addMemberSuccess({ workspace })),
          catchError(err => of(WorkspaceActions.addMemberFailure({ error: err.message }))),
        ),
      ),
    ),
  );

  removeMember$ = createEffect(() =>
    this.actions$.pipe(
      ofType(WorkspaceActions.removeMember),
      switchMap(({ workspaceId, userId }) =>
        this.workspaceGql.removeMember(workspaceId, userId).pipe(
          map(workspace => WorkspaceActions.removeMemberSuccess({ workspace })),
          catchError(err => of(WorkspaceActions.removeMemberFailure({ error: err.message }))),
        ),
      ),
    ),
  );
}
