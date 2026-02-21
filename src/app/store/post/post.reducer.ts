import { createReducer, on } from '@ngrx/store';
import { PostActions } from './post.actions';
import { initialPostState, PostState } from './post.state';

export const postReducer = createReducer(
  initialPostState,

  on(PostActions.loadPosts,              state             => ({ ...state, loading: true,  error: null })),
  on(PostActions.loadPostsSuccess,       (state, { result }) => ({
    ...state, loading: false,
    posts: result.data, total: result.total, page: result.page, totalPages: result.totalPages,
  })),
  on(PostActions.loadPostsFailure,       (state, { error }) => ({ ...state, loading: false, error })),

  on(PostActions.loadMorePosts,          state             => ({ ...state, loadingMore: true,  error: null })),
  on(PostActions.loadMorePostsSuccess,   (state, { result }) => ({
    ...state, loadingMore: false,
    posts: [...state.posts, ...result.data], total: result.total, page: result.page, totalPages: result.totalPages,
  })),
  on(PostActions.loadMorePostsFailure,   (state, { error }) => ({ ...state, loadingMore: false, error })),

  on(PostActions.loadPost,          state             => ({ ...state, loading: true,  error: null, selectedPost: null })),
  on(PostActions.loadPostSuccess,   (state, { post }) => ({ ...state, loading: false, selectedPost: post })),
  on(PostActions.loadPostFailure,   (state, { error }) => ({ ...state, loading: false, error })),

  // ── createPost: optimistic ──────────────────────────────────────────────────
  // Immediately prepend the optimistic (temp) post so the UI feels instant.
  on(PostActions.createPost, (state, { tempPost }) => ({
    ...state, loading: true, error: null,
    posts: [tempPost, ...state.posts],
  })),
  // On success: swap the temp entry with the real server post.
  on(PostActions.createPostSuccess, (state, { post, tempId }) => ({
    ...state, loading: false,
    posts: state.posts.map(p => p.id === tempId ? post : p),
  })),
  // On failure: roll back by removing the temp entry.
  on(PostActions.createPostFailure, (state, { error, tempId }) => ({
    ...state, loading: false, error,
    posts: state.posts.filter(p => p.id !== tempId),
  })),

  on(PostActions.updatePost,        state             => ({ ...state, loading: true,  error: null })),
  on(PostActions.updatePostSuccess, (state, { post }) => ({
    ...state, loading: false,
    posts: state.posts.map(p => p.id === post.id ? post : p),
    selectedPost: post,
  })),
  on(PostActions.updatePostFailure, (state, { error }) => ({ ...state, loading: false, error })),

  // ── deletePost: optimistic ──────────────────────────────────────────────────
  // Immediately remove the post from the list for a snappy feel.
  on(PostActions.deletePost, (state, { id }) => ({
    ...state, loading: true, error: null,
    posts: state.posts.filter(p => p.id !== id),
    selectedPost: state.selectedPost?.id === id ? null : state.selectedPost,
  })),
  // On success: nothing extra needed — post is already gone.
  on(PostActions.deletePostSuccess, (state) => ({ ...state, loading: false, selectedPost: null })),
  // On failure: restore the deleted post at the front of the list.
  on(PostActions.deletePostFailure, (state, { error, post }) => ({
    ...state, loading: false, error,
    posts: [post, ...state.posts],
  })),

  on(PostActions.clearSelectedPost, state => ({ ...state, selectedPost: null })),

  // ── Approval flow ──────────────────────────────────────────────────────────
  on(PostActions.submitForApproval, PostActions.approvePost, PostActions.rejectPost,
    state => ({ ...state, loading: true, error: null }),
  ),
  on(PostActions.submitForApprovalSuccess, PostActions.approvePostSuccess, PostActions.rejectPostSuccess,
    (state, { post }) => ({
      ...state, loading: false,
      posts: state.posts.map(p => p.id === post.id ? post : p),
      selectedPost: state.selectedPost?.id === post.id ? post : state.selectedPost,
    }),
  ),
  on(PostActions.submitForApprovalFailure, PostActions.approvePostFailure, PostActions.rejectPostFailure,
    (state, { error }) => ({ ...state, loading: false, error }),
  ),
);
