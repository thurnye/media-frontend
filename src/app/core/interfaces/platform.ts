export type PlatformType =
  | 'instagram'
  | 'facebook'
  | 'twitter'
  | 'linkedin'
  | 'tiktok'
  | 'youtube';

export type AccountStatus = 'active' | 'disconnected' | 'suspended';

export interface IPlatformAccount {
  id:                string;
  workspaceId:       string;
  platform:          PlatformType;
  accountId:         string;
  displayName:       string;
  profilePictureUrl?: string;
  status:            AccountStatus;
  lastSyncAt?:       string;
  createdAt?:        string;
  updatedAt?:        string;
}
