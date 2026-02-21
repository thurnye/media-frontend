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
  message: string;
  createdAt: string;
}

export interface IApprovalWorkflow {
  requiredApprovers?: string[];
  approvedBy?: string[];
  rejectedBy?: string[];
  comments?: IApprovalComment[];
}

export interface IPost {
  id:          string;
  workspaceId: string;
  createdBy:   string;
  title:       string;
  description?: string;
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
  category?:   string;
  tags?:       string[];
  priority?:   string;
  isEvergreen?: boolean;
}

export interface IUpdatePost {
  id:          string;
  title?:      string;
  description?: string;
  category?:   string;
  tags?:       string[];
  priority?:   string;
  status?:     string;
  isEvergreen?: boolean;
}

export interface IPaginatedPosts {
  data:       IPost[];
  total:      number;
  page:       number;
  totalPages: number;
}
