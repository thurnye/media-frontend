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

export type PublishingStatus = 'draft' | 'scheduled' | 'publishing' | 'published' | 'overdue' | 'failed' | 'cancelled';

export interface IPostContent {
  caption?: string;
  hashtags?: string[];
  firstComment?: string;
  media?: Array<{
    type: 'image' | 'video' | 'carousel';
    url: string;
    altText?: string;
    thumbnailUrl?: string;
  }>;
}

export interface IPublishingInfo {
  status?: PublishingStatus;
  scheduledAt?: string;
  publishedAt?: string;
  reminderSentAt?: string;
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
    media?: Array<{
      type: 'image' | 'video' | 'carousel';
      url: string;
      altText?: string;
      thumbnailUrl?: string;
    }>;
  }>;
  scheduledAt?: string;
  timezone?:    string;
}

export interface ICreatePlatformPost {
  postId: string;
  platform: string;
  accountId: string;
  caption: string;
  hashtags?: string[];
  firstComment?: string;
  status?: 'draft' | 'scheduled' | 'publishing' | 'published' | 'overdue' | 'failed' | 'cancelled';
  media?: Array<{
    type: 'image' | 'video' | 'carousel';
    url: string;
    altText?: string;
    thumbnailUrl?: string;
  }>;
  scheduledAt?: string;
  timezone?: string;
}

export interface IUpdatePlatformPost {
  id: string;
  caption?: string;
  hashtags?: string[];
  scheduledAt?: string;
  status?: 'draft' | 'scheduled' | 'publishing' | 'published' | 'overdue' | 'failed' | 'cancelled';
  media?: Array<{
    type: 'image' | 'video' | 'carousel';
    url: string;
    altText?: string;
    thumbnailUrl?: string;
  }>;
}
