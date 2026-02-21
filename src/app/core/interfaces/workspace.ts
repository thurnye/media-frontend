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
  firstName?: string;
  lastName?:  string;
  avatarUrl?: string;
}

export interface IWorkspaceInvitation {
  id:          string;
  workspaceId: string;
  email:       string;
  role:        string;
  status:      string;
  expiresAt?:  string;
  createdAt?:  string;
}

export interface IMemberSuggestion {
  userId:    string;
  email:     string;
  firstName: string;
  lastName:  string;
  avatarUrl?: string;
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
