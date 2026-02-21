import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
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
import { PostPublishDialog } from '../post-publish-dialog/post-publish-dialog';

@Component({
  selector: 'app-post-detail',
  imports: [RouterLink, FormsModule, DatePipe, PostPublishDialog],
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
  workspaceId = signal('');

  showRejectDialog = signal(false);
  showPublishDialog = signal(false);
  rejectReason = signal('');
  showMenu = signal(false);

  ngOnInit(): void {
    const wsId =
      this.route.parent?.snapshot.paramMap.get('workspaceId') ??
      this.route.snapshot.paramMap.get('workspaceId') ??
      '';
    this.workspaceId.set(wsId);

    const id = this.route.snapshot.paramMap.get('postId')!;
    this.store.dispatch(PostActions.loadPost({ id }));
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
}
