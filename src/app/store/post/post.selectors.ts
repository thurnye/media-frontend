import { createFeatureSelector, createSelector } from '@ngrx/store';
import { PostState } from './post.state';

export const selectPostState      = createFeatureSelector<PostState>('post');

export const selectPosts           = createSelector(selectPostState, s => s.posts);
export const selectPostsTotal      = createSelector(selectPostState, s => s.total);
export const selectPostsPage       = createSelector(selectPostState, s => s.page);
export const selectPostsTotalPages = createSelector(selectPostState, s => s.totalPages);
export const selectPostsHasMore    = createSelector(selectPostState, s => s.page < s.totalPages);
export const selectSelectedPost    = createSelector(selectPostState, s => s.selectedPost);
export const selectPostLoading     = createSelector(selectPostState, s => s.loading);
export const selectPostLoadingMore = createSelector(selectPostState, s => s.loadingMore);
export const selectPostError       = createSelector(selectPostState, s => s.error);
