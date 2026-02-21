import { IWorkspace, IWorkspaceInvitation } from '../../core/interfaces/workspace';

export interface WorkspaceState {
  workspaces:        IWorkspace[];
  selectedWorkspace: IWorkspace | null;
  invitations:       IWorkspaceInvitation[];
  loading:           boolean;
  saving:            boolean;
  error:             string | null;
}

export const initialWorkspaceState: WorkspaceState = {
  workspaces:        [],
  selectedWorkspace: null,
  invitations:       [],
  loading:           false,
  saving:            false,
  error:             null,
};
