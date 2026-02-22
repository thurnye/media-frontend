import { Component, effect, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { PostActions } from '../../../store/post/post.actions';
import {
  selectPostError,
  selectPostLoading,
  selectSelectedPost,
} from '../../../store/post/post.selectors';
import { selectUser } from '../../../store/auth/auth.selectors';
import { selectSelectedWorkspace } from '../../../store/workspace/workspace.selectors';
import { WorkspaceActions } from '../../../store/workspace/workspace.actions';
import { PostPublishDialog } from '../post-publish-dialog/post-publish-dialog';
import { ReviewerOption, ReviewerTypeahead } from './reviewer-typeahead/reviewer-typeahead';
import { PostReviewComments } from './post-review-comments/post-review-comments';
import { MediaService } from '../../../core/services/media.service';
import { IUserSummary } from '../../../core/interfaces/post';

type ReviewerDecision = 'approved' | 'rejected' | 'cancelled' | 'archived';
type ReviewerDecisionValue = ReviewerDecision | '';
type ReviewerDecisionItem = {
  userId: string;
  decision: ReviewerDecision;
  user?: IUserSummary;
};

@Component({
  selector: 'app-post-detail',
  imports: [RouterLink, FormsModule, DatePipe, PostPublishDialog, ReviewerTypeahead, PostReviewComments],
  templateUrl: './post-detail.html',
  styleUrl: './post-detail.css',
})
export class PostDetail implements OnInit, OnDestroy {
  private store = inject(Store);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private mediaService = inject(MediaService);

  post = this.store.selectSignal(selectSelectedPost);
  loading = this.store.selectSignal(selectPostLoading);
  error = this.store.selectSignal(selectPostError);
  currentUser = this.store.selectSignal(selectUser);
  selectedWorkspace = this.store.selectSignal(selectSelectedWorkspace);
  workspaceId = signal('');

  showRejectDialog = signal(false);
  showPublishDialog = signal(false);
  rejectReason = signal('');
  pendingReviewerDecision = signal<ReviewerDecisionValue>('');
  showReviewerDecisionMenu = signal(false);
  showMenu = signal(false);
  selectedReviewers = signal<ReviewerOption[]>([]);

  reviewerDecisionOptions: { value: ReviewerDecision; label: string }[] = [
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' },
    { value: 'cancelled', label: 'Cancelled' },
    { value: 'archived', label: 'Archived' },
  ];

  constructor() {
    effect(() => {
      const post = this.post();
      const workspace = this.selectedWorkspace();
      if (!post || !workspace?.members?.length) return;
      if (this.selectedReviewers().length) return;

      const reviewerIds = new Set(post.approvalWorkflow?.requiredApprovers ?? []);
      if (!reviewerIds.size) return;

      const preselected = workspace.members
        .filter((member) => reviewerIds.has(member.userId))
        .map((member) => ({
          id: member.userId,
          name: `${member.firstName ?? ''} ${member.lastName ?? ''}`.trim() || member.userId,
          email: `${member.userId}@workspace.local`,
          role: member.role,
          avatarUrl: member.avatarUrl,
        }));

      if (preselected.length) {
        this.selectedReviewers.set(preselected);
      }
    });

  }

  ngOnInit(): void {
    const wsId =
      this.route.parent?.snapshot.paramMap.get('workspaceId') ??
      this.route.snapshot.paramMap.get('workspaceId') ??
      '';
    this.workspaceId.set(wsId);

    const id = this.route.snapshot.paramMap.get('postId')!;
    this.store.dispatch(PostActions.loadPost({ id }));
    this.store.dispatch(WorkspaceActions.loadWorkspace({ id: wsId }));
  }

  ngOnDestroy(): void {
    this.store.dispatch(PostActions.clearSelectedPost());
  }

  isOwner(): boolean {
    const p = this.post();
    return !!p && this.currentUser()?.id === p.createdBy;
  }

  getStatusLabel(status?: string): string {
    if (!status) return 'Draft';
    return status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  }

  toggleMenu(): void {
    this.showMenu.update((v) => !v);
  }

  closeMenu(): void {
    this.showMenu.set(false);
  }

  onEdit(): void {
    this.router.navigate([
      '/dashboard/workspace',
      this.workspaceId(),
      'post',
      this.post()!.id,
      'edit',
    ]);
  }

  onDelete(): void {
    const post = this.post();
    if (!post || !confirm('Delete this post? This cannot be undone.')) return;
    this.store.dispatch(PostActions.deletePost({ id: post.id, post }));
    this.router.navigate(['/dashboard/workspace', this.workspaceId(), 'posts']);
  }

  onReject(): void {
    const reason = this.rejectReason().trim();
    const post = this.post();
    if (!post || !reason) return;
    this.store.dispatch(PostActions.rejectPost({ postId: post.id, reason }));
    this.pendingReviewerDecision.set('');
    this.showRejectDialog.set(false);
    this.rejectReason.set('');
  }

  onCancelRejectDialog(): void {
    this.showRejectDialog.set(false);
    this.rejectReason.set('');
    this.pendingReviewerDecision.set('');
  }

  toggleReviewerDecisionMenu(): void {
    if (!this.canSubmitReviewerDecision) return;
    this.showReviewerDecisionMenu.update((open) => !open);
  }

  closeReviewerDecisionMenu(): void {
    this.showReviewerDecisionMenu.set(false);
  }

  onReviewerDecisionChange(decision: ReviewerDecisionValue): void {
    this.closeReviewerDecisionMenu();
    const post = this.post();
    if (!post) return;
    if (post.status !== 'pending_approval' && post.status !== 'rejected') return;
    if (!decision) return;

    if (decision === 'approved') {
      this.pendingReviewerDecision.set('');
      this.store.dispatch(PostActions.approvePost({ postId: post.id }));
      return;
    }

    if (decision === 'rejected') {
      this.pendingReviewerDecision.set(decision);
      this.showRejectDialog.set(true);
      return;
    }

    this.pendingReviewerDecision.set('');
    this.store.dispatch(
      PostActions.updatePost({
        input: {
          id: post.id,
          status: decision,
        },
      }),
    );
  }

  onSelectedReviewersChange(reviewers: ReviewerOption[]): void {
    this.selectedReviewers.set(reviewers);

    const post = this.post();
    if (!post) return;

    const nextReviewerIds = reviewers.map((reviewer) => reviewer.id);
    const currentReviewerIds = post.approvalWorkflow?.requiredApprovers ?? [];
    const isSameSelection =
      nextReviewerIds.length === currentReviewerIds.length &&
      nextReviewerIds.every((id) => currentReviewerIds.includes(id));

    if (isSameSelection) return;

    this.store.dispatch(
      PostActions.updatePost({
        input: {
          id: post.id,
          requiredApprovers: nextReviewerIds,
        },
      }),
    );
  }

  get availableReviewers(): ReviewerOption[] {
    const me = this.currentUser()?.id;
    const members = this.selectedWorkspace()?.members ?? [];

    return members
      .filter((member) => member.userId && member.userId !== me)
      .map((member) => ({
        id: member.userId,
        name: `${member.firstName ?? ''} ${member.lastName ?? ''}`.trim() || member.userId,
        email: `${member.userId}@workspace.local`,
        role: member.role,
        avatarUrl: member.avatarUrl,
      }));
  }

  get canSeeReviewerDecision(): boolean {
    const me = this.currentUser()?.id;
    if (!me) return false;
    const requiredApprovers = this.post()?.approvalWorkflow?.requiredApprovers ?? [];
    return requiredApprovers.includes(me);
  }

  get canSubmitReviewerDecision(): boolean {
    const status = this.post()?.status;
    return status === 'pending_approval' || status === 'rejected';
  }

  get reviewerDecisionValue(): ReviewerDecisionValue {
    return this.pendingReviewerDecision() || this.currentReviewerDecision || '';
  }

  get reviewerDecisionLabel(): string {
    if (!this.reviewerDecisionValue) return 'Select decision';
    return this.reviewerDecisionValue.charAt(0).toUpperCase() + this.reviewerDecisionValue.slice(1);
  }

  get currentReviewerDecision(): ReviewerDecision | null {
    const me = this.currentUser()?.id;
    const workflow = this.post()?.approvalWorkflow;
    if (!me || !workflow) return null;
    if ((workflow.approvedBy ?? []).includes(me)) return 'approved';
    if ((workflow.rejectedBy ?? []).includes(me)) return 'rejected';
    if ((workflow.cancelledBy ?? []).includes(me)) return 'cancelled';
    if ((workflow.archivedBy ?? []).includes(me)) return 'archived';
    return null;
  }

  getMediaUrl(url: string): string {
    return this.mediaService.getMediaUrl(url);
  }

  isVideoUrl(url: string): boolean {
    return /\.(mp4|webm|mov|m4v|avi)$/i.test(url);
  }

  get reviewerDecisionItems(): ReviewerDecisionItem[] {
    const workflow = this.post()?.approvalWorkflow;
    if (!workflow) return [];

    const items: ReviewerDecisionItem[] = [];
    const pushItems = (
      ids: string[] | undefined,
      users: IUserSummary[] | undefined,
      decision: ReviewerDecision,
    ) => {
      const usersById = new Map((users ?? []).map((user) => [user.id, user]));
      for (const userId of ids ?? []) {
        items.push({
          userId,
          decision,
          user: usersById.get(userId),
        });
      }
    };

    pushItems(workflow.approvedBy, workflow.approvedByUsers, 'approved');
    pushItems(workflow.rejectedBy, workflow.rejectedByUsers, 'rejected');
    pushItems(workflow.cancelledBy, workflow.cancelledByUsers, 'cancelled');
    pushItems(workflow.archivedBy, workflow.archivedByUsers, 'archived');

    const byUser = new Map<string, ReviewerDecisionItem>();
    for (const item of items) {
      byUser.set(item.userId, item);
    }
    return Array.from(byUser.values());
  }

  getUserInitials(item: ReviewerDecisionItem): string {
    const name = `${item.user?.firstName ?? ''} ${item.user?.lastName ?? ''}`.trim();
    const parts = name.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return '?';
  }

  getDecisionDisplayName(item: ReviewerDecisionItem): string {
    const fullName = `${item.user?.firstName ?? ''} ${item.user?.lastName ?? ''}`.trim();
    return fullName || item.user?.email || item.userId;
  }
}
