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
import { PostActions } from '../../../store/post/post.actions';
import {
  selectPostError,
  selectPostLoading,
  selectPostLoadingMore,
  selectPosts,
  selectPostsHasMore,
  selectPostsPage,
  selectSelectedPost,
} from '../../../store/post/post.selectors';
import { selectUser } from '../../../store/auth/auth.selectors';

@Component({
  selector: 'app-post-list',
  imports: [RouterLink],
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
  hasMore = this.store.selectSignal(selectPostsHasMore);
  currentUser = this.store.selectSignal(selectUser);
  selectedPost = this.store.selectSignal(selectSelectedPost);

  /** ID of the post whose detail panel is open (desktop only) */
  selectedPostId = signal<string | null>(null);
  panelLoading = signal(false);
  workspaceId = signal('');

  readonly limit = 6;
  showMenu = signal(false);

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
  }

  ngOnInit(): void {
    const wsId =
      this.route.parent?.snapshot.paramMap.get('workspaceId') ??
      this.route.snapshot.paramMap.get('workspaceId') ??
      '';
    this.workspaceId.set(wsId);
    this.store.dispatch(PostActions.loadPosts({ workspaceId: wsId, page: 1, limit: this.limit }));
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
}
