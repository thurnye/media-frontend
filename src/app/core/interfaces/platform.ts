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
  userId:            string;
  workspaceIds:      string[];
  platform:          PlatformType;
  accountId:         string;
  displayName:       string;
  profilePictureUrl?: string;
  status:            AccountStatus;
  lastSyncAt?:       string;
  createdAt?:        string;
  updatedAt?:        string;
}

export type PublishingStatus = 'draft' | 'scheduled' | 'publishing' | 'published' | 'failed' | 'cancelled';

export interface IPostContent {
  caption?: string;
  hashtags?: string[];
  firstComment?: string;
}

export interface IPublishingInfo {
  status?: PublishingStatus;
  scheduledAt?: string;
  publishedAt?: string;
  timezone?: string;
  platformPostId?: string;
}

export interface IPlatformPost {
  id:         string;
  postId:     string;
  platform:   string;
  accountId:  string;
  content:    IPostContent;
  publishing: IPublishingInfo;
  isActive?:  boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ICreatePlatformPostBatch {
  postId:      string;
  entries:     Array<{
    platform:     string;
    accountId:    string;
    caption:      string;
    hashtags?:    string[];
    firstComment?: string;
  }>;
  scheduledAt?: string;
  timezone?:    string;
}
