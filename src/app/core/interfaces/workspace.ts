export interface IWorkspaceSettings {
  approvalRequired?:   boolean;
  evergreenEnabled?:   boolean;
  autoPublishEnabled?: boolean;
}

export type WorkspacePlan = 'free' | 'pro' | 'enterprise';

export type WorkspaceRole = 'admin' | 'manager' | 'member';

export interface IWorkspaceMember {
  userId:    string;
  role:      WorkspaceRole;
  joinedAt?: string;
}

export interface IWorkspace {
  id:               string;
  name:             string;
  slug:             string;
  description?:     string;
  ownerId?:         string;
  members?:         IWorkspaceMember[];
  settings?:        IWorkspaceSettings;
  plan?:            WorkspacePlan;
  defaultTimezone?: string;
  isActive?:        boolean;
  createdAt?:       string;
  updatedAt?:       string;
}
