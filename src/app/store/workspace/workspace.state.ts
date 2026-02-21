import { IWorkspace } from '../../core/interfaces/workspace';

export interface WorkspaceState {
  workspaces:        IWorkspace[];
  selectedWorkspace: IWorkspace | null;
  loading:           boolean;
  saving:            boolean;
  error:             string | null;
}

export const initialWorkspaceState: WorkspaceState = {
  workspaces:        [],
  selectedWorkspace: null,
  loading:           false,
  saving:            false,
  error:             null,
};
