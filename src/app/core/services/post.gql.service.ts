import { inject, Injectable } from '@angular/core';
import { Apollo } from 'apollo-angular';
import { map } from 'rxjs';
import { ICreatePost, IPaginatedPosts, IPost, IUpdatePost } from '../interfaces/post';
import { CREATE_POST, DELETE_POST, GET_POST, GET_POSTS, UPDATE_POST, SUBMIT_FOR_APPROVAL, APPROVE_POST, REJECT_POST } from '../graphql/posts.graphql';

@Injectable({ providedIn: 'root' })
export class PostGqlService {
  private apollo = inject(Apollo);

  getPosts(workspaceId: string, page = 1, limit = 10) {
    return this.apollo
      .query<{ posts: IPaginatedPosts }>({
        query: GET_POSTS,
        variables: { workspaceId, page, limit },
        fetchPolicy: 'no-cache',
      })
      .pipe(map(r => r.data!.posts));
  }

  getPost(id: string) {
    return this.apollo
      .query<{ post: IPost }>({
        query: GET_POST,
        variables: { id },
        fetchPolicy: 'no-cache',
      })
      .pipe(map(r => r.data!.post));
  }

  createPost(input: ICreatePost) {
    return this.apollo
      .mutate<{ createPost: IPost }>({ mutation: CREATE_POST, variables: input })
      .pipe(map(r => r.data!.createPost));
  }

  updatePost(input: IUpdatePost) {
    return this.apollo
      .mutate<{ updatePost: IPost }>({ mutation: UPDATE_POST, variables: input })
      .pipe(map(r => r.data!.updatePost));
  }

  deletePost(id: string) {
    return this.apollo
      .mutate<{ deletePost: IPost }>({ mutation: DELETE_POST, variables: { id } })
      .pipe(map(r => r.data!.deletePost));
  }

  submitForApproval(postId: string) {
    return this.apollo
      .mutate<{ submitForApproval: IPost }>({ mutation: SUBMIT_FOR_APPROVAL, variables: { postId } })
      .pipe(map(r => r.data!.submitForApproval));
  }

  approvePost(postId: string) {
    return this.apollo
      .mutate<{ approvePost: IPost }>({ mutation: APPROVE_POST, variables: { postId } })
      .pipe(map(r => r.data!.approvePost));
  }

  rejectPost(postId: string, reason: string) {
    return this.apollo
      .mutate<{ rejectPost: IPost }>({ mutation: REJECT_POST, variables: { postId, reason } })
      .pipe(map(r => r.data!.rejectPost));
  }
}
