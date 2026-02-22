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

type ReviewerDecision = 'approved' | 'rejected' | 'cancelled' | 'archived';

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

  post = this.store.selectSignal(selectSelectedPost);
  loading = this.store.selectSignal(selectPostLoading);
  error = this.store.selectSignal(selectPostError);
  currentUser = this.store.selectSignal(selectUser);
  selectedWorkspace = this.store.selectSignal(selectSelectedWorkspace);
  workspaceId = signal('');

  showRejectDialog = signal(false);
  showPublishDialog = signal(false);
  rejectReason = signal('');
  showMenu = signal(false);
  selectedReviewers = signal<ReviewerOption[]>([]);
  reviewerDecision = signal<ReviewerDecision>('approved');

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

  onSubmitForApproval(): void {
    const post = this.post();
    if (!post) return;
    this.store.dispatch(PostActions.submitForApproval({ postId: post.id }));
  }

  onApprove(): void {
    const post = this.post();
    if (!post) return;
    this.store.dispatch(PostActions.approvePost({ postId: post.id }));
  }

  onReject(): void {
    const reason = this.rejectReason().trim();
    const post = this.post();
    if (!post || !reason) return;
    this.store.dispatch(PostActions.rejectPost({ postId: post.id, reason }));
    this.showRejectDialog.set(false);
    this.rejectReason.set('');
  }

  onSelectedReviewersChange(reviewers: ReviewerOption[]): void {
    this.selectedReviewers.set(reviewers);
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
}
