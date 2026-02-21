import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, of, switchMap, tap } from 'rxjs';
import { WorkspaceGqlService } from '../../core/services/workspace.gql.service';
import { ToastService } from '../../core/services/toast.service';
import { WorkspaceActions } from './workspace.actions';
import { AuthActions } from '../auth/auth.actions';

@Injectable()
export class WorkspaceEffects {
  private actions$     = inject(Actions);
  private workspaceGql = inject(WorkspaceGqlService);
  private router       = inject(Router);
  private toast        = inject(ToastService);

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

  // Invite to workspace
  inviteToWorkspace$ = createEffect(() =>
    this.actions$.pipe(
      ofType(WorkspaceActions.inviteToWorkspace),
      switchMap(({ workspaceId, email, role }) =>
        this.workspaceGql.inviteToWorkspace(workspaceId, email, role).pipe(
          map(() => WorkspaceActions.inviteToWorkspaceSuccess({ workspaceId })),
          catchError(err => of(WorkspaceActions.inviteToWorkspaceFailure({ error: err.message }))),
        ),
      ),
    ),
  );

  inviteToWorkspaceSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType(WorkspaceActions.inviteToWorkspaceSuccess),
      tap(() => this.toast.show('Invitation sent successfully.', 'success')),
      map(({ workspaceId }) => WorkspaceActions.loadInvitations({ workspaceId })),
    ),
  );

  inviteToWorkspaceFailure$ = createEffect(
    () => this.actions$.pipe(
      ofType(WorkspaceActions.inviteToWorkspaceFailure),
      tap(({ error }) => this.toast.show(error || 'Failed to send invitation.', 'error')),
    ),
    { dispatch: false },
  );

  // Load pending invitations
  loadInvitations$ = createEffect(() =>
    this.actions$.pipe(
      ofType(WorkspaceActions.loadInvitations),
      switchMap(({ workspaceId }) =>
        this.workspaceGql.getWorkspaceInvitations(workspaceId).pipe(
          map(invitations => WorkspaceActions.loadInvitationsSuccess({ invitations })),
          catchError(err => of(WorkspaceActions.loadInvitationsFailure({ error: err.message }))),
        ),
      ),
    ),
  );

  // Revoke invitation
  revokeInvitation$ = createEffect(() =>
    this.actions$.pipe(
      ofType(WorkspaceActions.revokeInvitation),
      switchMap(({ workspaceId, email }) =>
        this.workspaceGql.revokeInvitation(workspaceId, email).pipe(
          map(() => WorkspaceActions.revokeInvitationSuccess({ email })),
          catchError(err => of(WorkspaceActions.revokeInvitationFailure({ error: err.message }))),
        ),
      ),
    ),
  );

  revokeInvitationSuccess$ = createEffect(
    () => this.actions$.pipe(
      ofType(WorkspaceActions.revokeInvitationSuccess),
      tap(() => this.toast.show('Invitation revoked.', 'info')),
    ),
    { dispatch: false },
  );

  revokeInvitationFailure$ = createEffect(
    () => this.actions$.pipe(
      ofType(WorkspaceActions.revokeInvitationFailure),
      tap(({ error }) => this.toast.show(error || 'Failed to revoke invitation.', 'error')),
    ),
    { dispatch: false },
  );

  // Accept invitation
  acceptInvitation$ = createEffect(() =>
    this.actions$.pipe(
      ofType(WorkspaceActions.acceptInvitation),
      switchMap(({ token }) =>
        this.workspaceGql.acceptInvitation(token).pipe(
          map(workspace => WorkspaceActions.acceptInvitationSuccess({ workspace })),
          catchError(err => of(WorkspaceActions.acceptInvitationFailure({ error: err.message }))),
        ),
      ),
    ),
  );

  acceptInvitationSuccess$ = createEffect(
    () => this.actions$.pipe(
      ofType(WorkspaceActions.acceptInvitationSuccess),
      tap(({ workspace }) => {
        this.toast.show(`Joined workspace "${workspace.name}".`, 'success');
        this.router.navigate(['/dashboard/workspaces', workspace.id]);
      }),
    ),
    { dispatch: false },
  );

  acceptInvitationFailure$ = createEffect(
    () => this.actions$.pipe(
      ofType(WorkspaceActions.acceptInvitationFailure),
      tap(({ error }) => this.toast.show(error || 'Failed to accept invitation.', 'error')),
    ),
    { dispatch: false },
  );
}
