import { createFeatureSelector, createSelector } from '@ngrx/store';
import { WorkspaceState } from './workspace.state';

export const selectWorkspaceState = createFeatureSelector<WorkspaceState>('workspace');

export const selectWorkspaces         = createSelector(selectWorkspaceState, s => s.workspaces);
export const selectSelectedWorkspace  = createSelector(selectWorkspaceState, s => s.selectedWorkspace);
export const selectWorkspaceLoading   = createSelector(selectWorkspaceState, s => s.loading);
export const selectWorkspaceSaving    = createSelector(selectWorkspaceState, s => s.saving);
export const selectWorkspaceError     = createSelector(selectWorkspaceState, s => s.error);
export const selectWorkspaceInvitations = createSelector(selectWorkspaceState, s => s.invitations);
