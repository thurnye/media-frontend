import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, exhaustMap, map, of, switchMap, tap } from 'rxjs';
import { PostGqlService } from '../../core/services/post.gql.service';
import { ToastService } from '../../core/services/toast.service';
import { PostActions } from './post.actions';
import { GLOBAL_CONSTANTS } from '../../core/constants/globalConstants';

const { TOAST } = GLOBAL_CONSTANTS;

@Injectable()
export class PostEffects {
  private actions$ = inject(Actions);
  private postGql  = inject(PostGqlService);
  private router   = inject(Router);
  private toast    = inject(ToastService);

  loadPosts$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PostActions.loadPosts),
      switchMap(({ workspaceId, page, limit, filters }) =>
        this.postGql.getPosts(workspaceId, page, limit, filters ?? {}).pipe(
          map(result => PostActions.loadPostsSuccess({ result })),
          catchError(err => of(PostActions.loadPostsFailure({ error: err.message }))),
        ),
      ),
    ),
  );

  loadMorePosts$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PostActions.loadMorePosts),
      exhaustMap(({ workspaceId, page, limit, filters }) =>
        this.postGql.getPosts(workspaceId, page, limit, filters ?? {}).pipe(
          map(result => PostActions.loadMorePostsSuccess({ result })),
          catchError(err => of(PostActions.loadMorePostsFailure({ error: err.message }))),
        ),
      ),
    ),
  );

  loadPost$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PostActions.loadPost),
      switchMap(({ id }) =>
        this.postGql.getPost(id).pipe(
          map(post => PostActions.loadPostSuccess({ post })),
          catchError(err => of(PostActions.loadPostFailure({ error: err.message }))),
        ),
      ),
    ),
  );

  // Pass tempId through so the reducer can swap/remove the optimistic entry
  createPost$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PostActions.createPost),
      switchMap(({ input, tempId }) =>
        this.postGql.createPost(input).pipe(
          map(post => PostActions.createPostSuccess({ post, tempId })),
          catchError(err => of(PostActions.createPostFailure({ error: err.message, tempId }))),
        ),
      ),
    ),
  );

  createPostSuccess$ = createEffect(
    () => this.actions$.pipe(
      ofType(PostActions.createPostSuccess),
      tap(({ post }) => {
        this.toast.show(TOAST.POST_CREATED, 'success');
        this.router.navigate(['/dashboard/workspace', post.workspaceId, 'posts']);
      }),
    ),
    { dispatch: false },
  );

  // Show a toast on create failure so the user knows the roll-back happened
  createPostFailure$ = createEffect(
    () => this.actions$.pipe(
      ofType(PostActions.createPostFailure),
      tap(() => this.toast.show(TOAST.POST_CREATE_FAILED, 'error')),
    ),
    { dispatch: false },
  );

  updatePost$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PostActions.updatePost),
      switchMap(({ input }) =>
        this.postGql.updatePost(input).pipe(
          map(post => PostActions.updatePostSuccess({ post })),
          catchError(err => of(PostActions.updatePostFailure({ error: err.message }))),
        ),
      ),
    ),
  );

  updatePostSuccess$ = createEffect(
    () => this.actions$.pipe(
      ofType(PostActions.updatePostSuccess),
      tap(({ post }) => {
        this.toast.show(TOAST.POST_UPDATED, 'success');
        this.router.navigate(['/dashboard/workspace', post.workspaceId, 'post', post.id]);
      }),
    ),
    { dispatch: false },
  );

  // Pass the full post through so the reducer can restore it on failure
  deletePost$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PostActions.deletePost),
      switchMap(({ id, post }) =>
        this.postGql.deletePost(id).pipe(
          map(() => PostActions.deletePostSuccess({ id })),
          catchError(err => of(PostActions.deletePostFailure({ error: err.message, post }))),
        ),
      ),
    ),
  );

  deletePostSuccess$ = createEffect(
    () => this.actions$.pipe(
      ofType(PostActions.deletePostSuccess),
      tap(() => this.toast.show('Post deleted successfully', 'success')),
    ),
    { dispatch: false },
  );

  // Show a toast on delete failure so the user knows the roll-back happened
  deletePostFailure$ = createEffect(
    () => this.actions$.pipe(
      ofType(PostActions.deletePostFailure),
      tap(() => this.toast.show(TOAST.POST_DELETE_FAILED, 'error')),
    ),
    { dispatch: false },
  );

  // ── Approval flow ────────────────────────────────────────────────────────────

  submitForApproval$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PostActions.submitForApproval),
      switchMap(({ postId }) =>
        this.postGql.submitForApproval(postId).pipe(
          map(post => PostActions.submitForApprovalSuccess({ post })),
          catchError(err => of(PostActions.submitForApprovalFailure({ error: err.message }))),
        ),
      ),
    ),
  );

  submitForApprovalSuccess$ = createEffect(
    () => this.actions$.pipe(
      ofType(PostActions.submitForApprovalSuccess),
      tap(() => this.toast.show(TOAST.POST_SUBMITTED, 'success')),
    ),
    { dispatch: false },
  );

  approvePost$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PostActions.approvePost),
      switchMap(({ postId }) =>
        this.postGql.approvePost(postId).pipe(
          map(post => PostActions.approvePostSuccess({ post })),
          catchError(err => of(PostActions.approvePostFailure({ error: err.message }))),
        ),
      ),
    ),
  );

  approvePostSuccess$ = createEffect(
    () => this.actions$.pipe(
      ofType(PostActions.approvePostSuccess),
      tap(() => this.toast.show(TOAST.POST_APPROVED, 'success')),
    ),
    { dispatch: false },
  );

  rejectPost$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PostActions.rejectPost),
      switchMap(({ postId, reason }) =>
        this.postGql.rejectPost(postId, reason).pipe(
          map(post => PostActions.rejectPostSuccess({ post })),
          catchError(err => of(PostActions.rejectPostFailure({ error: err.message }))),
        ),
      ),
    ),
  );

  rejectPostSuccess$ = createEffect(
    () => this.actions$.pipe(
      ofType(PostActions.rejectPostSuccess),
      tap(() => this.toast.show(TOAST.POST_REJECTED, 'success')),
    ),
    { dispatch: false },
  );

  approvalFailure$ = createEffect(
    () => this.actions$.pipe(
      ofType(
        PostActions.submitForApprovalFailure,
        PostActions.approvePostFailure,
        PostActions.rejectPostFailure,
      ),
      tap(() => this.toast.show(TOAST.POST_APPROVAL_FAILED, 'error')),
    ),
    { dispatch: false },
  );
}
