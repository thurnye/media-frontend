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
import { IPlatformPost } from '../../../core/interfaces/platform';
import { PlatformGqlService } from '../../../core/services/platform.gql.service';
import { forkJoin } from 'rxjs';

type ReviewerDecision = 'approved' | 'rejected' | 'cancelled' | 'archived';
type ReviewerDecisionValue = ReviewerDecision | '';
type ReviewerDecisionItem = {
  userId: string;
  decision: ReviewerDecision;
  user?: IUserSummary;
};
type DraftScheduleMode = 'draft' | 'scheduled';
type DraftEditModel = {
  caption: string;
  hashtags: string;
  scheduleMode: DraftScheduleMode;
  scheduledDate: string;
  scheduledTime: string;
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
  private platformGql = inject(PlatformGqlService);

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
  platformPosts = signal<IPlatformPost[]>([]);
  loadingPlatformPosts = signal(false);
  platformPostsError = signal<string | null>(null);
  private lastLoadedPlatformPostId: string | null = null;
  editingDraftIds = signal<Set<string>>(new Set());
  draftEdits = signal<Record<string, DraftEditModel>>({});
  savingDraftIds = signal<Set<string>>(new Set());
  bulkDraftEditMode = signal(false);
  activePlatformPostMenuPostId = signal<string | null>(null);
  retryingPlatformPostIds = signal<Set<string>>(new Set());

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

    effect(() => {
      const postId = this.post()?.id;
      if (!postId) {
        this.platformPosts.set([]);
        this.platformPostsError.set(null);
        this.lastLoadedPlatformPostId = null;
        return;
      }
      if (this.lastLoadedPlatformPostId === postId) return;
      this.lastLoadedPlatformPostId = postId;
      this.loadPlatformPosts(postId);
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

  togglePlatformPostMenu(post: IPlatformPost): void {
    const menuKey = this.getPlatformPostMenuKey(post);
    this.activePlatformPostMenuPostId.update((current) => (current === menuKey ? null : menuKey));
  }

  closePlatformPostMenu(): void {
    this.activePlatformPostMenuPostId.set(null);
  }

  isPlatformPostMenuOpen(post: IPlatformPost): boolean {
    return this.activePlatformPostMenuPostId() === this.getPlatformPostMenuKey(post);
  }

  private getPlatformPostMenuKey(post: IPlatformPost): string {
    return post.id || `${post.accountId}:${post.platform}:${post.createdAt ?? ''}`;
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

  onPublishAccountsSelected(accountIds: string[]): void {
    const post = this.post();
    if (!post || !accountIds.length) return;

    this.showPublishDialog.set(false);
    this.router.navigate(
      ['/dashboard/workspace', this.workspaceId(), 'post', post.id, 'publish'],
      {
        queryParams: { accounts: accountIds.join(',') },
      },
    );
  }

  goToPublishFlowForDraft(platformPost: IPlatformPost): void {
    if (!platformPost?.accountId) return;
    this.closePlatformPostMenu();
    this.goToPublishFlowForAccounts([platformPost.accountId], true, [platformPost.id]);
  }

  goToPublishFlowForAllDrafts(): void {
    const draftPosts = this.platformPosts().filter((item) => this.isDraftPlatformPost(item));
    const accountIds = Array.from(
      new Set(
        draftPosts
          .map((item) => item.accountId)
          .filter(Boolean),
      ),
    );
    if (!accountIds.length) return;
    this.goToPublishFlowForAccounts(accountIds, true, draftPosts.map((item) => item.id));
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

  get canShowReadyForPublish(): boolean {
    if (this.post()?.status !== 'approved') return false;

    const me = this.currentUser()?.id;
    const workspace = this.selectedWorkspace();
    if (!me || !workspace) return false;

    if (workspace.ownerId === me) return true;

    const role = workspace.members?.find((member) => member.userId === me)?.role;
    return role === 'admin' || role === 'manager';
  }

  get canManagePlatformDrafts(): boolean {
    const me = this.currentUser()?.id;
    const workspace = this.selectedWorkspace();
    if (!me || !workspace) return false;
    if (workspace.ownerId === me) return true;
    const role = workspace.members?.find((member) => member.userId === me)?.role;
    return role === 'admin' || role === 'manager';
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

  getPlatformPostMedia(post: IPlatformPost): Array<{ type?: string; url: string }> {
    const media = post.content?.media ?? [];
    if (media.length) return media;
    return [];
  }

  get hasDraftPlatformPosts(): boolean {
    return this.platformPosts().some((item) => this.isEditablePlatformPost(item));
  }

  isDraftPlatformPost(post: IPlatformPost): boolean {
    return this.isEditablePlatformPost(post);
  }

  isEditablePlatformPost(post: IPlatformPost): boolean {
    const status = post.publishing?.status ?? 'draft';
    return status === 'draft' || status === 'failed';
  }

  getPlatformPostEditLabel(post: IPlatformPost): string {
    return (post.publishing?.status ?? 'draft') === 'failed' ? 'Edit Failed' : 'Edit Draft';
  }

  retryFailedPlatformPost(platformPost: IPlatformPost): void {
    if (!this.canManagePlatformDrafts) return;
    if ((platformPost.publishing?.status ?? 'draft') !== 'failed') return;
    if (this.retryingPlatformPostIds().has(platformPost.id)) return;

    this.retryingPlatformPostIds.update((ids) => {
      const next = new Set(ids);
      next.add(platformPost.id);
      return next;
    });

    this.platformGql
      .updatePlatformPost({
        id: platformPost.id,
        status: 'publishing',
      })
      .subscribe({
        next: (updated) => {
          this.platformPosts.update((items) =>
            items.map((item) => (item.id === updated.id ? updated : item)),
          );
          this.closePlatformPostMenu();
          this.retryingPlatformPostIds.update((ids) => {
            const next = new Set(ids);
            next.delete(platformPost.id);
            return next;
          });
        },
        error: () => {
          this.retryingPlatformPostIds.update((ids) => {
            const next = new Set(ids);
            next.delete(platformPost.id);
            return next;
          });
        },
      });
  }

  isRetryingPlatformPost(postId: string): boolean {
    return this.retryingPlatformPostIds().has(postId);
  }

  isEditingDraft(postId: string): boolean {
    return this.editingDraftIds().has(postId);
  }

  startEditDraft(post: IPlatformPost): void {
    if (!this.canManagePlatformDrafts || !this.isDraftPlatformPost(post)) return;
    const nextIds = new Set(this.editingDraftIds());
    nextIds.add(post.id);
    this.editingDraftIds.set(nextIds);
    this.draftEdits.update((map) => ({
      ...map,
      [post.id]: this.createDraftEditModel(post),
    }));
  }

  cancelEditDraft(postId: string): void {
    this.editingDraftIds.update((ids) => {
      const next = new Set(ids);
      next.delete(postId);
      return next;
    });
    this.draftEdits.update((map) => {
      const next = { ...map };
      delete next[postId];
      return next;
    });
  }

  startEditAllDrafts(): void {
    if (!this.canManagePlatformDrafts) return;
    const drafts = this.platformPosts().filter((post) => this.isDraftPlatformPost(post));
    if (!drafts.length) return;

    const ids = new Set(this.editingDraftIds());
    const edits = { ...this.draftEdits() };
    for (const post of drafts) {
      ids.add(post.id);
      edits[post.id] = this.createDraftEditModel(post);
    }
    this.editingDraftIds.set(ids);
    this.draftEdits.set(edits);
    this.bulkDraftEditMode.set(true);
  }

  cancelEditAllDrafts(): void {
    const draftIds = new Set(
      this.platformPosts().filter((post) => this.isDraftPlatformPost(post)).map((post) => post.id),
    );
    this.editingDraftIds.update((ids) => {
      const next = new Set(ids);
      for (const id of draftIds) next.delete(id);
      return next;
    });
    this.draftEdits.update((map) => {
      const next = { ...map };
      for (const id of draftIds) delete next[id];
      return next;
    });
    this.bulkDraftEditMode.set(false);
  }

  onDraftCaptionChange(postId: string, value: string): void {
    this.patchDraftEdit(postId, { caption: value });
  }

  onDraftHashtagsChange(postId: string, value: string): void {
    this.patchDraftEdit(postId, { hashtags: value });
  }

  onDraftScheduleModeChange(postId: string, mode: DraftScheduleMode): void {
    this.patchDraftEdit(postId, {
      scheduleMode: mode,
      ...(mode === 'draft' ? { scheduledDate: '', scheduledTime: '' } : {}),
    });
  }

  onDraftScheduledDateChange(postId: string, value: string): void {
    this.patchDraftEdit(postId, { scheduledDate: value });
  }

  onDraftScheduledTimeChange(postId: string, value: string): void {
    this.patchDraftEdit(postId, { scheduledTime: value });
  }

  getDraftEdit(postId: string): DraftEditModel | null {
    return this.draftEdits()[postId] ?? null;
  }

  saveDraft(postId: string): void {
    const edit = this.getDraftEdit(postId);
    if (!edit) return;
    if (edit.scheduleMode === 'scheduled' && (!edit.scheduledDate || !edit.scheduledTime)) return;

    this.savingDraftIds.update((ids) => {
      const next = new Set(ids);
      next.add(postId);
      return next;
    });

    this.platformGql
      .updatePlatformPost({
        id: postId,
        caption: edit.caption.trim(),
        hashtags: edit.hashtags
          ? edit.hashtags.split(',').map((tag) => tag.trim()).filter(Boolean)
          : [],
        status: edit.scheduleMode === 'scheduled' ? 'scheduled' : 'draft',
        ...(edit.scheduleMode === 'scheduled'
          ? {
            scheduledAt: new Date(`${edit.scheduledDate}T${edit.scheduledTime}`).toISOString(),
          }
          : {}),
      })
      .subscribe({
        next: (updated) => {
          this.platformPosts.update((items) =>
            items.map((item) => (item.id === updated.id ? updated : item)),
          );
          this.cancelEditDraft(postId);
          this.bulkDraftEditMode.set(false);
          this.savingDraftIds.update((ids) => {
            const next = new Set(ids);
            next.delete(postId);
            return next;
          });
        },
        error: () => {
          this.savingDraftIds.update((ids) => {
            const next = new Set(ids);
            next.delete(postId);
            return next;
          });
        },
      });
  }

  saveAllDrafts(): void {
    const draftIds = Array.from(this.editingDraftIds()).filter((id) =>
      this.platformPosts().some((post) => post.id === id && this.isDraftPlatformPost(post)),
    );
    if (!draftIds.length) return;

    const requests = draftIds
      .map((id) => {
        const edit = this.getDraftEdit(id);
        if (!edit) return null;
        if (edit.scheduleMode === 'scheduled' && (!edit.scheduledDate || !edit.scheduledTime)) return null;
        return this.platformGql.updatePlatformPost({
          id,
          caption: edit.caption.trim(),
          hashtags: edit.hashtags
            ? edit.hashtags.split(',').map((tag) => tag.trim()).filter(Boolean)
            : [],
          status: edit.scheduleMode === 'scheduled' ? 'scheduled' : 'draft',
          ...(edit.scheduleMode === 'scheduled'
            ? {
              scheduledAt: new Date(`${edit.scheduledDate}T${edit.scheduledTime}`).toISOString(),
            }
            : {}),
        });
      })
      .filter((req): req is ReturnType<PlatformGqlService['updatePlatformPost']> => !!req);

    if (!requests.length) return;
    this.savingDraftIds.set(new Set(draftIds));

    forkJoin(requests).subscribe({
      next: (updatedPosts) => {
        const byId = new Map(updatedPosts.map((post) => [post.id, post]));
        this.platformPosts.update((items) =>
          items.map((item) => byId.get(item.id) ?? item),
        );
        this.savingDraftIds.set(new Set());
        this.cancelEditAllDrafts();
      },
      error: () => {
        this.savingDraftIds.set(new Set());
      },
    });
  }

  isSavingDraft(postId: string): boolean {
    return this.savingDraftIds().has(postId);
  }

  get usedPlatforms(): string[] {
    return Array.from(new Set(this.platformPosts().map((item) => item.platform)));
  }

  getPlatformIconLabel(platform: string): string {
    const normalized = platform.toLowerCase();
    if (normalized === 'linkedin') return 'in';
    if (normalized === 'twitter') return 'X';
    if (normalized === 'youtube') return '▶';
    if (normalized === 'tiktok') return '♫';
    return normalized.charAt(0).toUpperCase();
  }

  private loadPlatformPosts(postId: string): void {
    this.loadingPlatformPosts.set(true);
    this.platformPostsError.set(null);

    this.platformGql.getPlatformPosts(postId).subscribe({
      next: (posts) => {
        this.platformPosts.set(posts);
        this.editingDraftIds.set(new Set());
        this.draftEdits.set({});
        this.savingDraftIds.set(new Set());
        this.bulkDraftEditMode.set(false);
        this.activePlatformPostMenuPostId.set(null);
        this.retryingPlatformPostIds.set(new Set());
        this.loadingPlatformPosts.set(false);
      },
      error: (err) => {
        this.platformPosts.set([]);
        this.platformPostsError.set(err?.message ?? 'Failed to load platform posts');
        this.activePlatformPostMenuPostId.set(null);
        this.retryingPlatformPostIds.set(new Set());
        this.loadingPlatformPosts.set(false);
      },
    });
  }

  private createDraftEditModel(post: IPlatformPost): DraftEditModel {
    const scheduledAt = post.publishing?.scheduledAt ? new Date(post.publishing.scheduledAt) : null;
    return {
      caption: post.content?.caption ?? '',
      hashtags: (post.content?.hashtags ?? []).join(', '),
      scheduleMode: scheduledAt ? 'scheduled' : 'draft',
      scheduledDate: scheduledAt ? this.toDateInputValue(scheduledAt) : '',
      scheduledTime: scheduledAt ? this.toTimeInputValue(scheduledAt) : '',
    };
  }

  private patchDraftEdit(postId: string, patch: Partial<DraftEditModel>): void {
    this.draftEdits.update((map) => {
      const current = map[postId];
      if (!current) return map;
      return { ...map, [postId]: { ...current, ...patch } };
    });
  }

  private toDateInputValue(date: Date): string {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private toTimeInputValue(date: Date): string {
    const hours = `${date.getHours()}`.padStart(2, '0');
    const minutes = `${date.getMinutes()}`.padStart(2, '0');
    return `${hours}:${minutes}`;
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

  private goToPublishFlowForAccounts(
    accountIds: string[],
    editDraft: boolean,
    platformPostIds: string[] = [],
  ): void {
    const post = this.post();
    if (!post || !accountIds.length) return;
    this.router.navigate(
      ['/dashboard/workspace', this.workspaceId(), 'post', post.id, 'publish'],
      {
        queryParams: {
          accounts: accountIds.join(','),
          editDraft: editDraft ? '1' : undefined,
          platformPostIds: platformPostIds.length ? platformPostIds.join(',') : undefined,
        },
      },
    );
  }
}
