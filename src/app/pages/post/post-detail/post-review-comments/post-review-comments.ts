import { CommonModule, DatePipe } from '@angular/common';
import { Component, inject, Input, OnDestroy, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IUser } from '../../../../core/interfaces/auth';
import { IMediaUploadItem } from '../../../../core/interfaces/media';
import { MediaService } from '../../../../core/services/media.service';

interface ReviewComment {
  id: string;
  author: string;
  authorAvatarUrl?: string;
  message: string;
  createdAt: string;
  mediaIds: string[];
  mediaUrls: string[];
  parentCommentId: string | null;
}

interface ReviewCommentRow extends ReviewComment {
  depth: number;
  hasReplies: boolean;
}

@Component({
  selector: 'app-post-review-comments',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe],
  templateUrl: './post-review-comments.html',
  styleUrl: './post-review-comments.css',
})
export class PostReviewComments implements OnDestroy {
  private mediaService = inject(MediaService);

  @Input({ required: true }) workspaceId!: string;
  @Input() currentUser: IUser | null = null;

  reviewCommentInput = signal('');
  reviewComments = signal<ReviewComment[]>([]);
  replyingToCommentId = signal<string | null>(null);
  commentMedia = signal<IMediaUploadItem[]>([]);
  isAddingComment = signal(false);
  collapsedCommentIds = signal<Set<string>>(new Set());

  readonly commentAcceptedTypes =
    'image/jpeg,image/png,image/gif,image/webp,video/mp4,video/quicktime,video/webm';

  ngOnDestroy(): void {
    this.commentMedia().forEach((item) => {
      if (item.preview) URL.revokeObjectURL(item.preview);
    });
  }

  async onAddReviewComment(): Promise<void> {
    const message = this.reviewCommentInput().trim();
    if (!message || this.isAddingComment()) return;
    this.isAddingComment.set(true);

    const uploadedMedia = await this.uploadCommentMedia();
    if (!uploadedMedia) {
      this.isAddingComment.set(false);
      return;
    }

    const user = this.currentUser;
    const author = user ? `${user.firstName} ${user.lastName}`.trim() : 'Reviewer';

    this.reviewComments.update((comments) => [
      {
        id: `review-${Date.now()}`,
        author: author || 'Reviewer',
        authorAvatarUrl: user?.avatarUrl,
        message,
        createdAt: new Date().toISOString(),
        mediaIds: uploadedMedia.mediaIds,
        mediaUrls: uploadedMedia.mediaUrls,
        parentCommentId: this.replyingToCommentId(),
      },
      ...comments,
    ]);

    this.clearCommentComposer();
    this.isAddingComment.set(false);
  }

  startReply(commentId: string): void {
    if (this.replyingToCommentId() !== commentId) {
      this.clearCommentComposer();
      this.replyingToCommentId.set(commentId);
    }
  }

  cancelReply(): void {
    this.clearCommentComposer();
  }

  isReplyingTo(commentId: string): boolean {
    return this.replyingToCommentId() === commentId;
  }

  get orderedReviewComments(): ReviewCommentRow[] {
    const comments = this.reviewComments();
    const byParent = new Map<string | null, ReviewComment[]>();

    for (const comment of comments) {
      const key = comment.parentCommentId ?? null;
      const bucket = byParent.get(key) ?? [];
      bucket.push(comment);
      byParent.set(key, bucket);
    }

    byParent.forEach((bucket) =>
      bucket.sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt)),
    );

    const rows: ReviewCommentRow[] = [];
    const walk = (parentId: string | null, depth: number) => {
      const children = byParent.get(parentId) ?? [];
      for (const comment of children) {
        const replies = byParent.get(comment.id) ?? [];
        rows.push({ ...comment, depth, hasReplies: replies.length > 0 });
        walk(comment.id, depth + 1);
      }
    };

    walk(null, 0);
    return rows;
  }

  get visibleReviewComments(): ReviewCommentRow[] {
    const collapsedIds = this.collapsedCommentIds();
    const visible: ReviewCommentRow[] = [];
    const hiddenDepths = new Map<number, string>();

    for (const row of this.orderedReviewComments) {
      for (const [depth] of hiddenDepths) {
        if (depth >= row.depth) hiddenDepths.delete(depth);
      }

      if (hiddenDepths.size) continue;

      visible.push(row);
      if (collapsedIds.has(row.id)) {
        hiddenDepths.set(row.depth, row.id);
      }
    }

    return visible;
  }

  getInitials(name: string): string {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return '?';
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
  }

  toggleCollapse(commentId: string): void {
    this.collapsedCommentIds.update((ids) => {
      const next = new Set(ids);
      if (next.has(commentId)) next.delete(commentId);
      else next.add(commentId);
      return next;
    });
  }

  isCollapsed(commentId: string): boolean {
    return this.collapsedCommentIds().has(commentId);
  }

  onCommentFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files) return;

    for (const file of Array.from(input.files)) {
      const preview = file.type.startsWith('image/') ? URL.createObjectURL(file) : '';
      this.commentMedia.update((list) => [
        ...list,
        {
          file,
          preview,
          progress: 0,
          status: 'pending',
        },
      ]);
    }
    input.value = '';
  }

  removeCommentMedia(index: number): void {
    const item = this.commentMedia()[index];
    if (item?.preview) URL.revokeObjectURL(item.preview);
    this.commentMedia.update((list) => list.filter((_, i) => i !== index));
  }

  private clearCommentComposer(): void {
    this.reviewCommentInput.set('');
    this.replyingToCommentId.set(null);
    this.commentMedia().forEach((item) => {
      if (item.preview) URL.revokeObjectURL(item.preview);
    });
    this.commentMedia.set([]);
  }

  private async uploadCommentMedia(): Promise<{ mediaIds: string[]; mediaUrls: string[] } | null> {
    const mediaIds: string[] = [];
    const mediaUrls: string[] = [];

    for (let i = 0; i < this.commentMedia().length; i++) {
      const item = this.commentMedia()[i];
      if (!item || item.status === 'done') continue;

      const uploaded = await this.uploadCommentFileAtIndex(i);
      if (!uploaded?.media?._id) return null;

      mediaIds.push(uploaded.media._id);
      mediaUrls.push(this.mediaService.getMediaUrl(uploaded.media));
    }

    return { mediaIds, mediaUrls };
  }

  private uploadCommentFileAtIndex(index: number): Promise<IMediaUploadItem | null> {
    const item = this.commentMedia()[index];
    if (!item) return Promise.resolve(null);

    this.commentMedia.update((list) => {
      const updated = [...list];
      if (!updated[index]) return updated;
      updated[index] = { ...updated[index], status: 'uploading', progress: 0, error: undefined };
      return updated;
    });

    return new Promise((resolve) => {
      this.mediaService.uploadFile(item.file, this.workspaceId).subscribe({
        next: (event) => {
          this.commentMedia.update((list) => {
            const updated = [...list];
            if (!updated[index]) return updated;

            if (event.type === 'progress') {
              updated[index] = { ...updated[index], progress: event.progress };
            } else if (event.type === 'complete') {
              updated[index] = {
                ...updated[index],
                progress: 100,
                status: 'done',
                media: event.media,
              };
            }
            return updated;
          });

          if (event.type === 'complete') resolve(this.commentMedia()[index] ?? null);
        },
        error: (err) => {
          this.commentMedia.update((list) => {
            const updated = [...list];
            if (!updated[index]) return updated;
            updated[index] = {
              ...updated[index],
              status: 'error',
              error: err?.error?.error || 'Upload failed',
            };
            return updated;
          });
          resolve(null);
        },
      });
    });
  }
}
