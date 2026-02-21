import { createReducer, on } from '@ngrx/store';
import { WorkspaceActions } from './workspace.actions';
import { initialWorkspaceState } from './workspace.state';
import { AuthActions } from '../auth/auth.actions';

export const workspaceReducer = createReducer(
  initialWorkspaceState,

  // Sidebar list (from auth payload)
  on(WorkspaceActions.loadWorkspacesSuccess, (state, { workspaces }) => ({ ...state, workspaces })),

  // Load single for edit
  on(WorkspaceActions.loadWorkspace,        state                    => ({ ...state, loading: true,  error: null })),
  on(WorkspaceActions.loadWorkspaceSuccess, (state, { workspace })   => ({ ...state, loading: false, selectedWorkspace: workspace })),
  on(WorkspaceActions.loadWorkspaceFailure, (state, { error })       => ({ ...state, loading: false, error })),
  on(WorkspaceActions.clearWorkspace,       state                    => ({ ...state, selectedWorkspace: null, error: null })),

  // Create
  on(WorkspaceActions.createWorkspace,        state                  => ({ ...state, saving: true,  error: null })),
  on(WorkspaceActions.createWorkspaceSuccess, (state, { workspace }) => ({
    ...state, saving: false,
    workspaces: [...state.workspaces, workspace],
  })),
  on(WorkspaceActions.createWorkspaceFailure, (state, { error })     => ({ ...state, saving: false, error })),

  // Update
  on(WorkspaceActions.updateWorkspace,        state                  => ({ ...state, saving: true,  error: null })),
  on(WorkspaceActions.updateWorkspaceSuccess, (state, { workspace }) => ({
    ...state, saving: false,
    workspaces:        state.workspaces.map(w => w.id === workspace.id ? workspace : w),
    selectedWorkspace: workspace,
  })),
  on(WorkspaceActions.updateWorkspaceFailure, (state, { error })     => ({ ...state, saving: false, error })),

  // Add member
  on(WorkspaceActions.addMember,        state              => ({ ...state, saving: true,  error: null })),
  on(WorkspaceActions.addMemberSuccess, (state, { workspace }) => ({
    ...state, saving: false,
    selectedWorkspace: state.selectedWorkspace?.id === workspace.id
      ? { ...state.selectedWorkspace, members: workspace.members }
      : state.selectedWorkspace,
  })),
  on(WorkspaceActions.addMemberFailure, (state, { error }) => ({ ...state, saving: false, error })),

  // Remove member
  on(WorkspaceActions.removeMember,        state              => ({ ...state, saving: true,  error: null })),
  on(WorkspaceActions.removeMemberSuccess, (state, { workspace }) => ({
    ...state, saving: false,
    selectedWorkspace: state.selectedWorkspace?.id === workspace.id
      ? { ...state.selectedWorkspace, members: workspace.members }
      : state.selectedWorkspace,
  })),
  on(WorkspaceActions.removeMemberFailure, (state, { error }) => ({ ...state, saving: false, error })),

  // Logout — clear everything
  on(AuthActions.logout, () => initialWorkspaceState),
);
