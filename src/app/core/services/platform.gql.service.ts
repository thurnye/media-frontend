import { inject, Injectable } from '@angular/core';
import { Apollo } from 'apollo-angular';
import { map } from 'rxjs';
import { ICreatePlatformPost, ICreatePlatformPostBatch, IPlatformAccount, IPlatformPost, IUpdatePlatformPost } from '../interfaces/platform';
import {
  DISCONNECT_PLATFORM_ACCOUNT_MUTATION,
  GET_PLATFORM_ACCOUNTS_QUERY,
  GET_MY_PLATFORM_ACCOUNTS_QUERY,
  LINK_PLATFORM_ACCOUNT_MUTATION,
  UNLINK_PLATFORM_ACCOUNT_MUTATION,
  GET_PLATFORM_POSTS_QUERY,
  GET_WORKSPACE_PLATFORM_POSTS_QUERY,
  GET_WORKSPACE_PLATFORM_POSTS_BY_DAY_QUERY,
  CREATE_PLATFORM_POST_MUTATION,
  CREATE_PLATFORM_POSTS_BATCH_MUTATION,
  UPDATE_PLATFORM_POST_MUTATION,
} from '../graphql/platforms.graphql';

@Injectable({ providedIn: 'root' })
export class PlatformGqlService {
  private apollo = inject(Apollo);

  getPlatformAccounts(workspaceId: string) {
    return this.apollo
      .query<{ platformAccounts: IPlatformAccount[] }>({
        query: GET_PLATFORM_ACCOUNTS_QUERY,
        variables: { workspaceId },
        fetchPolicy: 'no-cache',
      })
      .pipe(map(r => r.data!.platformAccounts));
  }

  getMyPlatformAccounts() {
    return this.apollo
      .query<{ myPlatformAccounts: IPlatformAccount[] }>({
        query: GET_MY_PLATFORM_ACCOUNTS_QUERY,
        fetchPolicy: 'no-cache',
      })
      .pipe(map(r => r.data!.myPlatformAccounts));
  }

  linkPlatformAccount(accountId: string, workspaceId: string) {
    return this.apollo
      .mutate<{ linkPlatformAccount: IPlatformAccount }>({
        mutation: LINK_PLATFORM_ACCOUNT_MUTATION,
        variables: { accountId, workspaceId },
      })
      .pipe(map(r => r.data!.linkPlatformAccount));
  }

  unlinkPlatformAccount(accountId: string, workspaceId: string) {
    return this.apollo
      .mutate<{ unlinkPlatformAccount: IPlatformAccount }>({
        mutation: UNLINK_PLATFORM_ACCOUNT_MUTATION,
        variables: { accountId, workspaceId },
      })
      .pipe(map(r => r.data!.unlinkPlatformAccount));
  }

  disconnectPlatformAccount(id: string) {
    return this.apollo
      .mutate<{ disconnectPlatformAccount: IPlatformAccount }>({
        mutation: DISCONNECT_PLATFORM_ACCOUNT_MUTATION,
        variables: { id },
      })
      .pipe(map(r => r.data!.disconnectPlatformAccount));
  }

  getPlatformPosts(postId: string) {
    return this.apollo
      .query<{ platformPosts: IPlatformPost[] }>({
        query: GET_PLATFORM_POSTS_QUERY,
        variables: { postId },
        fetchPolicy: 'no-cache',
      })
      .pipe(map(r => r.data!.platformPosts));
  }

  getWorkspacePlatformPosts(workspaceId: string) {
    return this.apollo
      .query<{ workspacePlatformPosts: IPlatformPost[] }>({
        query: GET_WORKSPACE_PLATFORM_POSTS_QUERY,
        variables: { workspaceId },
        fetchPolicy: 'no-cache',
      })
      .pipe(map(r => r.data!.workspacePlatformPosts));
  }

  getWorkspacePlatformPostsByDay(workspaceId: string, date: string) {
    return this.apollo
      .query<{ workspacePlatformPostsByDay: IPlatformPost[] }>({
        query: GET_WORKSPACE_PLATFORM_POSTS_BY_DAY_QUERY,
        variables: { workspaceId, date },
        fetchPolicy: 'no-cache',
      })
      .pipe(map(r => r.data!.workspacePlatformPostsByDay));
  }

  createPlatformPostsBatch(input: ICreatePlatformPostBatch) {
    return this.apollo
      .mutate<{ createPlatformPostsBatch: IPlatformPost[] }>({
        mutation: CREATE_PLATFORM_POSTS_BATCH_MUTATION,
        variables: input,
      })
      .pipe(map(r => r.data!.createPlatformPostsBatch));
  }

  createPlatformPost(input: ICreatePlatformPost) {
    return this.apollo
      .mutate<{ createPlatformPost: IPlatformPost }>({
        mutation: CREATE_PLATFORM_POST_MUTATION,
        variables: input,
      })
      .pipe(map(r => r.data!.createPlatformPost));
  }

  updatePlatformPost(input: IUpdatePlatformPost) {
    return this.apollo
      .mutate<{ updatePlatformPost: IPlatformPost }>({
        mutation: UPDATE_PLATFORM_POST_MUTATION,
        variables: input,
      })
      .pipe(map(r => r.data!.updatePlatformPost));
  }
}
