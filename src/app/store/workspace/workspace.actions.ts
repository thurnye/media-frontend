import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { IWorkspace } from '../../core/interfaces/workspace';
import { ICreateWorkspaceInput, IUpdateWorkspaceInput } from '../../core/services/workspace.gql.service';

export const WorkspaceActions = createActionGroup({
  source: 'Workspace',
  events: {
    // Sidebar list — populated from auth payload
    'Load Workspaces Success': props<{ workspaces: IWorkspace[] }>(),

    // Load single for edit form
    'Load Workspace':         props<{ id: string }>(),
    'Load Workspace Success': props<{ workspace: IWorkspace }>(),
    'Load Workspace Failure': props<{ error: string }>(),
    'Clear Workspace':        emptyProps(),

    // Create
    'Create Workspace':         props<{ input: ICreateWorkspaceInput }>(),
    'Create Workspace Success': props<{ workspace: IWorkspace }>(),
    'Create Workspace Failure': props<{ error: string }>(),

    // Update
    'Update Workspace':         props<{ input: IUpdateWorkspaceInput }>(),
    'Update Workspace Success': props<{ workspace: IWorkspace }>(),
    'Update Workspace Failure': props<{ error: string }>(),

    // Add member
    'Add Member':         props<{ workspaceId: string; userId: string; role: string }>(),
    'Add Member Success': props<{ workspace: IWorkspace }>(),
    'Add Member Failure': props<{ error: string }>(),

    // Remove member
    'Remove Member':         props<{ workspaceId: string; userId: string }>(),
    'Remove Member Success': props<{ workspace: IWorkspace }>(),
    'Remove Member Failure': props<{ error: string }>(),
  },
});
