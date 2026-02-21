import { inject, Injectable } from '@angular/core';
import { Apollo } from 'apollo-angular';
import { map } from 'rxjs';
import { IPlatformAccount } from '../interfaces/platform';
import {
  CONNECT_PLATFORM_ACCOUNT_MUTATION,
  DISCONNECT_PLATFORM_ACCOUNT_MUTATION,
  GET_PLATFORM_ACCOUNTS_QUERY,
} from '../graphql/platforms.graphql';

export interface IConnectPlatformAccountInput {
  workspaceId:        string;
  platform:           string;
  accountId:          string;
  displayName:        string;
  accessToken:        string;
  refreshToken?:      string;
  profilePictureUrl?: string;
}

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

  connectPlatformAccount(input: IConnectPlatformAccountInput) {
    return this.apollo
      .mutate<{ connectPlatformAccount: IPlatformAccount }>({
        mutation: CONNECT_PLATFORM_ACCOUNT_MUTATION,
        variables: input,
      })
      .pipe(map(r => r.data!.connectPlatformAccount));
  }

  disconnectPlatformAccount(id: string) {
    return this.apollo
      .mutate<{ disconnectPlatformAccount: IPlatformAccount }>({
        mutation: DISCONNECT_PLATFORM_ACCOUNT_MUTATION,
        variables: { id },
      })
      .pipe(map(r => r.data!.disconnectPlatformAccount));
  }
}
