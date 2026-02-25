import {
  AfterViewInit,
  Component,
  effect,
  ElementRef,
  inject,
  OnDestroy,
  OnInit,
  signal,
  ViewChild,
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { Subject, Subscription, forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { PostActions } from '../../../store/post/post.actions';
import {
  selectPostError,
  selectPostLoading,
  selectPostLoadingMore,
  selectPosts,
  selectPostsHasMore,
  selectPostsPage,
  selectPostsTotal,
  selectSelectedPost,
} from '../../../store/post/post.selectors';
import { selectUser } from '../../../store/auth/auth.selectors';
import { IPostListFilters } from '../../../core/interfaces/post';
import { PostListFilters } from './post-list-filters/post-list-filters';
import { PlatformGqlService } from '../../../core/services/platform.gql.service';
import { SocialIcon } from '../../../shared/icons/social-icon/social-icon';

type FailedPlatformSummary = {
  platform: string;
  accountId: string;
  status: string;
  failedAt?: string;
};

type ScheduledPlatformSummary = {
  platform: string;
  accountId: string;
  status: string;
  scheduledAt?: string;
  timezone?: string;
};

@Component({
  selector: 'app-post-list',
  imports: [RouterLink, PostListFilters, SocialIcon],
  templateUrl: './post-list.html',
  styleUrl: './post-list.css',
})
export class PostList implements OnInit, AfterViewInit, OnDestroy {
  private store = inject(Store);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private platformGql = inject(PlatformGqlService);

  posts = this.store.selectSignal(selectPosts);
  loading = this.store.selectSignal(selectPostLoading);
  loadingMore = this.store.selectSignal(selectPostLoadingMore);
  error = this.store.selectSignal(selectPostError);
  page = this.store.selectSignal(selectPostsPage);
  total = this.store.selectSignal(selectPostsTotal);
  hasMore = this.store.selectSignal(selectPostsHasMore);
  currentUser = this.store.selectSignal(selectUser);
  selectedPost = this.store.selectSignal(selectSelectedPost);

  /** ID of the post whose detail panel is open (desktop only) */
  selectedPostId = signal<string | null>(null);
  panelLoading = signal(false);
  workspaceId = signal('');
  platformUsageByPostId = signal<Record<string, string[]>>({});
  platformFailedByPostId = signal<Record<string, boolean>>({});
  platformScheduledByPostId = signal<Record<string, boolean>>({});
  platformFailedDetailsByPostId = signal<Record<string, FailedPlatformSummary[]>>({});
  platformScheduledDetailsByPostId = signal<Record<string, ScheduledPlatformSummary[]>>({});

  readonly limit = 6;
  showMenu = signal(false);
  showDeleteDialog = signal(false);
  pendingDeletePostId = signal<string | null>(null);
  pendingDeletePostTitle = signal('');
  showFailedInfoDialog = signal(false);
  pendingFailedPostTitle = signal('');
  pendingFailedItems = signal<FailedPlatformSummary[]>([]);
  showScheduledInfoDialog = signal(false);
  pendingScheduledPostTitle = signal('');
  pendingScheduledItems = signal<ScheduledPlatformSummary[]>([]);
  searchQuery = '';
  statusFilter = 'all';
  categoryFilter = 'all';
  priorityFilter = 'all';
  platformFilter = 'all';
  evergreenFilter = 'all';
  sortBy = 'newest';
  private searchInput$ = new Subject<string>();
  private searchSub?: Subscription;

  readonly statusOptions = [
    { value: 'all', label: 'All Statuses' },
    { value: 'draft', label: 'Draft' },
    { value: 'pending_approval', label: 'Pending Approval' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' },
    { value: 'scheduled', label: 'Scheduled' },
    { value: 'publishing', label: 'Publishing' },
    { value: 'partially_published', label: 'Partially Published' },
    { value: 'published', label: 'Published' },
    { value: 'failed', label: 'Failed' },
    { value: 'cancelled', label: 'Cancelled' },
    { value: 'archived', label: 'Archived' },
  ];

  readonly categoryOptions = [
    { value: 'all', label: 'All Categories' },
    { value: 'marketing', label: 'Marketing' },
    { value: 'educational', label: 'Educational' },
    { value: 'promotional', label: 'Promotional' },
    { value: 'announcement', label: 'Announcement' },
    { value: 'engagement', label: 'Engagement' },
    { value: 'brand', label: 'Brand' },
    { value: 'community', label: 'Community' },
    { value: 'event', label: 'Event' },
    { value: 'product', label: 'Product' },
    { value: 'user_generated', label: 'User Generated' },
    { value: 'testimonial', label: 'Testimonial' },
    { value: 'behind_the_scenes', label: 'Behind the Scenes' },
    { value: 'seasonal', label: 'Seasonal' },
    { value: 'others', label: 'Others' },
  ];

  readonly priorityOptions = [
    { value: 'all', label: 'All Priorities' },
    { value: 'high', label: 'High' },
    { value: 'medium', label: 'Medium' },
    { value: 'low', label: 'Low' },
  ];

  readonly platformOptions = [
    { value: 'all', label: 'All Platforms' },
    { value: 'facebook', label: 'Facebook' },
    { value: 'instagram', label: 'Instagram' },
    { value: 'twitter', label: 'Twitter/X' },
    { value: 'linkedin', label: 'LinkedIn' },
    { value: 'tiktok', label: 'TikTok' },
    { value: 'youtube', label: 'YouTube' },
  ];

  readonly evergreenOptions = [
    { value: 'all', label: 'All Types' },
    { value: 'evergreen', label: 'Evergreen' },
    { value: 'regular', label: 'Regular' },
  ];

  readonly sortOptions = [
    { value: 'newest', label: 'Newest First' },
    { value: 'oldest', label: 'Oldest First' },
    { value: 'updated_desc', label: 'Recently Updated' },
    { value: 'updated_asc', label: 'Least Recently Updated' },
    { value: 'title_asc', label: 'Title A-Z' },
    { value: 'title_desc', label: 'Title Z-A' },
    { value: 'priority_desc', label: 'Highest Priority' },
    { value: 'priority_asc', label: 'Lowest Priority' },
  ];

  @ViewChild('scrollSentinel') private sentinelRef!: ElementRef<HTMLElement>;
  private observer: IntersectionObserver | null = null;

  constructor() {
    // Turn off panel spinner once the correct post is loaded
    effect(() => {
      const post = this.selectedPost();
      if (post && post.id === this.selectedPostId()) {
        this.panelLoading.set(false);
      }
    });

    this.searchSub = this.searchInput$
      .pipe(debounceTime(500), distinctUntilChanged())
      .subscribe(() => this.refreshPosts());

    effect(() => {
      const posts = this.posts();
      const postIds = posts.map((post) => post.id);
      if (!postIds.length) {
        this.platformUsageByPostId.set({});
        this.platformFailedByPostId.set({});
        this.platformScheduledByPostId.set({});
        this.platformFailedDetailsByPostId.set({});
        this.platformScheduledDetailsByPostId.set({});
        return;
      }

      forkJoin(
        postIds.map((postId) =>
          this.platformGql.getPlatformPosts(postId).pipe(
            map((platformPosts) => {
              const failedItems = platformPosts
                .filter((item) => item.publishing?.status === 'failed')
                .map((item) => ({
                  platform: item.platform,
                  accountId: item.accountId,
                  status: item.publishing?.status ?? 'failed',
                  failedAt: item.updatedAt ?? item.createdAt,
                }));
              const scheduledItems = platformPosts
                .filter((item) => item.publishing?.status === 'scheduled')
                .map((item) => ({
                  platform: item.platform,
                  accountId: item.accountId,
                  status: item.publishing?.status ?? 'scheduled',
                  scheduledAt: item.publishing?.scheduledAt,
                  timezone: item.publishing?.timezone,
                }));

              return {
                postId,
                platforms: Array.from(new Set(platformPosts.map((item) => item.platform))),
                hasFailed: failedItems.length > 0,
                hasScheduled: scheduledItems.length > 0,
                failedItems,
                scheduledItems,
              };
            }),
            catchError(() =>
              of({
                postId,
                platforms: [],
                hasFailed: false,
                hasScheduled: false,
                failedItems: [],
                scheduledItems: [],
              }),
            ),
          ),
        ),
      ).subscribe((rows) => {
        const next: Record<string, string[]> = {};
        const failedByPostId: Record<string, boolean> = {};
        const scheduledByPostId: Record<string, boolean> = {};
        const failedDetailsByPostId: Record<string, FailedPlatformSummary[]> = {};
        const scheduledDetailsByPostId: Record<string, ScheduledPlatformSummary[]> = {};
        for (const row of rows) next[row.postId] = row.platforms;
        for (const row of rows) failedByPostId[row.postId] = row.hasFailed;
        for (const row of rows) scheduledByPostId[row.postId] = row.hasScheduled;
        for (const row of rows) failedDetailsByPostId[row.postId] = row.failedItems;
        for (const row of rows) scheduledDetailsByPostId[row.postId] = row.scheduledItems;
        this.platformUsageByPostId.set(next);
        this.platformFailedByPostId.set(failedByPostId);
        this.platformScheduledByPostId.set(scheduledByPostId);
        this.platformFailedDetailsByPostId.set(failedDetailsByPostId);
        this.platformScheduledDetailsByPostId.set(scheduledDetailsByPostId);
      });
    });
  }

  ngOnInit(): void {
    const wsId =
      this.route.parent?.snapshot.paramMap.get('workspaceId') ??
      this.route.snapshot.paramMap.get('workspaceId') ??
      '';
    this.workspaceId.set(wsId);
    this.refreshPosts();
  }

  ngAfterViewInit(): void {
    this.observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && this.hasMore() && !this.loading() && !this.loadingMore()) {
          this.store.dispatch(
            PostActions.loadMorePosts({
              workspaceId: this.workspaceId(),
              page: this.page() + 1,
              limit: this.limit,
              filters: this.backendFilters,
            }),
          );
        }
      },
      { threshold: 0.1 },
    );

    if (this.sentinelRef?.nativeElement) {
      this.observer.observe(this.sentinelRef.nativeElement);
    }
  }

  ngOnDestroy(): void {
    this.searchSub?.unsubscribe();
    this.observer?.disconnect();
  }

  isOwner(createdBy: string): boolean {
    return this.currentUser()?.id === createdBy;
  }

  /** Desktop: open split panel. Mobile: navigate to detail page. */
  onCardClick(id: string, bypass?: boolean): void {
    if (window.innerWidth >= 768 && !bypass) {
      this.selectedPostId.set(id);
      this.panelLoading.set(true);
      this.store.dispatch(PostActions.clearSelectedPost());
      this.store.dispatch(PostActions.loadPost({ id }));
    } else {
      this.router.navigate(['/dashboard/workspace', this.workspaceId(), 'post', id]);
    }
  }

  onCloseDetail(): void {
    this.selectedPostId.set(null);
    this.store.dispatch(PostActions.clearSelectedPost());
  }

  toggleMenu(): void {
    this.showMenu.update((v) => !v);
  }

  closeMenu(): void {
    this.showMenu.set(false);
  }

  selectStatus(value: string): void {
    this.statusFilter = value;
    this.refreshPosts();
  }

  selectCategory(value: string): void {
    this.categoryFilter = value;
    this.refreshPosts();
  }

  selectPriority(value: string): void {
    this.priorityFilter = value;
    this.refreshPosts();
  }

  selectPlatform(value: string): void {
    this.platformFilter = value;
    this.refreshPosts();
  }

  selectEvergreen(value: string): void {
    this.evergreenFilter = value;
    this.refreshPosts();
  }

  selectSort(value: string): void {
    this.sortBy = value;
    this.refreshPosts();
  }

  onSearchChange(value: string): void {
    this.searchQuery = value;
    this.searchInput$.next(value.trim());
  }

  onDelete(id: string, event: Event): void {
    event.stopPropagation();
    const post = this.posts().find((p) => p.id === id);
    if (!post) return;
    this.pendingDeletePostId.set(id);
    this.pendingDeletePostTitle.set(post.title);
    this.showDeleteDialog.set(true);
  }

  cancelDelete(): void {
    this.showDeleteDialog.set(false);
    this.pendingDeletePostId.set(null);
    this.pendingDeletePostTitle.set('');
  }

  confirmDelete(): void {
    const id = this.pendingDeletePostId();
    if (!id) return;
    const post = this.posts().find((p) => p.id === id);
    if (!post) {
      this.cancelDelete();
      return;
    }

    this.store.dispatch(PostActions.deletePost({ id, post }));
    if (this.selectedPostId() === id) {
      this.onCloseDetail();
    }
    this.cancelDelete();
  }

  openFailedInfo(postId: string, postTitle: string, event: Event): void {
    event.stopPropagation();
    this.pendingFailedPostTitle.set(postTitle);
    this.pendingFailedItems.set(this.platformFailedDetailsByPostId()[postId] ?? []);
    this.showFailedInfoDialog.set(true);
  }

  closeFailedInfo(): void {
    this.showFailedInfoDialog.set(false);
    this.pendingFailedPostTitle.set('');
    this.pendingFailedItems.set([]);
  }

  openScheduledInfo(postId: string, postTitle: string, event: Event): void {
    event.stopPropagation();
    this.pendingScheduledPostTitle.set(postTitle);
    this.pendingScheduledItems.set(this.platformScheduledDetailsByPostId()[postId] ?? []);
    this.showScheduledInfoDialog.set(true);
  }

  closeScheduledInfo(): void {
    this.showScheduledInfoDialog.set(false);
    this.pendingScheduledPostTitle.set('');
    this.pendingScheduledItems.set([]);
  }

  onEdit(id: string, event: Event): void {
    event.stopPropagation();
    this.router.navigate(['/dashboard/workspace', this.workspaceId(), 'post', id, 'edit']);
  }

  getStatusLabel(status?: string): string {
    if (!status) return 'Draft';
    return status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  }

  get backendFilters(): IPostListFilters {
    const query = this.searchQuery.trim();
    return {
      search: query || undefined,
      status: this.statusFilter !== 'all' ? this.statusFilter : undefined,
      category: this.categoryFilter !== 'all' ? this.categoryFilter : undefined,
      priority: this.priorityFilter !== 'all' ? this.priorityFilter : undefined,
      platform: this.platformFilter !== 'all' ? this.platformFilter : undefined,
      isEvergreen:
        this.evergreenFilter === 'all'
          ? undefined
          : this.evergreenFilter === 'evergreen',
      sortBy: this.sortBy || 'newest',
    };
  }

  refreshPosts(): void {
    this.store.dispatch(
      PostActions.loadPosts({
        workspaceId: this.workspaceId(),
        page: 1,
        limit: this.limit,
        filters: this.backendFilters,
      }),
    );
  }

  clearFilters(): void {
    this.searchQuery = '';
    this.statusFilter = 'all';
    this.categoryFilter = 'all';
    this.priorityFilter = 'all';
    this.platformFilter = 'all';
    this.evergreenFilter = 'all';
    this.sortBy = 'newest';
    this.refreshPosts();
  }

  getPostPlatforms(postId: string): string[] {
    return this.platformUsageByPostId()[postId] ?? [];
  }

  hasFailedPlatformPost(postId: string): boolean {
    return this.platformFailedByPostId()[postId] ?? false;
  }

  hasScheduledPlatformPost(postId: string): boolean {
    if (this.hasFailedPlatformPost(postId)) return false;
    return this.platformScheduledByPostId()[postId] ?? false;
  }

  formatDateTime(value?: string): string {
    if (!value) return 'N/A';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return 'N/A';
    return d.toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  }

  getPlatformIconLabel(platform: string): string {
    const normalized = platform.toLowerCase();
    if (normalized === 'linkedin') return 'in';
    if (normalized === 'twitter') return 'X';
    if (normalized === 'youtube') return '▶';
    if (normalized === 'tiktok') return '♫';
    return normalized.charAt(0).toUpperCase();
  }
}
