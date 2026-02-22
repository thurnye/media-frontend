export type PostStatus =
  | 'draft'
  | 'pending_approval'
  | 'approved'
  | 'rejected'
  | 'scheduled'
  | 'publishing'
  | 'partially_published'
  | 'published'
  | 'failed'
  | 'cancelled'
  | 'archived';

export type PriorityLevel = 'low' | 'medium' | 'high';

export type PostCategory =
  | 'marketing'
  | 'educational'
  | 'promotional'
  | 'announcement'
  | 'engagement'
  | 'brand'
  | 'community'
  | 'event'
  | 'product'
  | 'user_generated'
  | 'testimonial'
  | 'behind_the_scenes'
  | 'seasonal'
  | 'others';

export interface IApprovalComment {
  userId: string;
  user?: IUserSummary;
  message: string;
  createdAt: string;
}

export interface IUserSummary {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatarUrl?: string;
}

export interface IApprovalWorkflow {
  requiredApprovers?: string[];
  requiredApproverUsers?: IUserSummary[];
  approvedBy?: string[];
  approvedByUsers?: IUserSummary[];
  rejectedBy?: string[];
  rejectedByUsers?: IUserSummary[];
  cancelledBy?: string[];
  cancelledByUsers?: IUserSummary[];
  archivedBy?: string[];
  archivedByUsers?: IUserSummary[];
  comments?: IApprovalComment[];
}

export interface IPostReviewComment {
  id: string;
  workspaceId: string;
  postId: string;
  authorId: string;
  author?: IUserSummary;
  message: string;
  mediaIds?: string[];
  mediaUrls?: string[];
  parentCommentId?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface IPost {
  id:          string;
  workspaceId: string;
  createdBy:   string;
  createdByUser?: IUserSummary;
  title:       string;
  description?: string;
  mediaIds?:   string[];
  mediaUrls?:  string[];
  category?:   PostCategory;
  tags?:       string[];
  status?:     PostStatus;
  priority?:   PriorityLevel;
  isEvergreen?: boolean;
  approvalWorkflow?: IApprovalWorkflow;
  isActive?:   boolean;
  createdAt?:  string;
  updatedAt?:  string;
}

export interface ICreatePost {
  workspaceId: string;
  title:       string;
  description?: string;
  mediaIds?:   string[];
  category?:   string;
  tags?:       string[];
  priority?:   string;
  isEvergreen?: boolean;
}

export interface IUpdatePost {
  id:          string;
  title?:      string;
  description?: string;
  mediaIds?:   string[];
  category?:   string;
  tags?:       string[];
  priority?:   string;
  status?:     string;
  isEvergreen?: boolean;
  requiredApprovers?: string[];
}

export interface IPaginatedPosts {
  data:       IPost[];
  total:      number;
  page:       number;
  totalPages: number;
}

export interface IPostListFilters {
  search?: string;
  status?: string;
  category?: string;
  priority?: string;
  isEvergreen?: boolean;
  sortBy?: string;
  createdBy?: string;
}
