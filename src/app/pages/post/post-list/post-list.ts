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
import { Subject, Subscription } from 'rxjs';
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

@Component({
  selector: 'app-post-list',
  imports: [RouterLink, PostListFilters],
  templateUrl: './post-list.html',
  styleUrl: './post-list.css',
})
export class PostList implements OnInit, AfterViewInit, OnDestroy {
  private store = inject(Store);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

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

  readonly limit = 6;
  showMenu = signal(false);
  searchQuery = '';
  statusFilter = 'all';
  categoryFilter = 'all';
  priorityFilter = 'all';
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
    if (!confirm('Delete this post? This cannot be undone.')) return;

    const post = this.posts().find((p) => p.id === id);
    if (!post) return;

    this.store.dispatch(PostActions.deletePost({ id, post }));
    if (this.selectedPostId() === id) {
      this.onCloseDetail();
    }
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
    this.evergreenFilter = 'all';
    this.sortBy = 'newest';
    this.refreshPosts();
  }
}
