import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { ICreatePost, IPaginatedPosts, IPost, IUpdatePost } from '../../core/interfaces/post';

export const PostActions = createActionGroup({
  source: 'Post',
  events: {
    'Load Posts':               props<{ workspaceId: string; page: number; limit: number }>(),
    'Load Posts Success':       props<{ result: IPaginatedPosts }>(),
    'Load Posts Failure':       props<{ error: string }>(),

    'Load More Posts':          props<{ workspaceId: string; page: number; limit: number }>(),
    'Load More Posts Success':  props<{ result: IPaginatedPosts }>(),
    'Load More Posts Failure':  props<{ error: string }>(),

    'Load Post':           props<{ id: string }>(),
    'Load Post Success':   props<{ post: IPost }>(),
    'Load Post Failure':   props<{ error: string }>(),

    // createPost carries a pre-built optimistic post and its tempId so the
    // reducer can show it immediately; success/failure carry tempId for swap/rollback
    'Create Post':         props<{ input: ICreatePost; tempPost: IPost; tempId: string }>(),
    'Create Post Success': props<{ post: IPost; tempId: string }>(),
    'Create Post Failure': props<{ error: string; tempId: string }>(),

    'Update Post':         props<{ input: IUpdatePost }>(),
    'Update Post Success': props<{ post: IPost }>(),
    'Update Post Failure': props<{ error: string }>(),

    // deletePost carries the full post so the reducer can roll back on failure
    'Delete Post':         props<{ id: string; post: IPost }>(),
    'Delete Post Success': props<{ id: string }>(),
    'Delete Post Failure': props<{ error: string; post: IPost }>(),

    'Clear Selected Post': emptyProps(),
  },
});
