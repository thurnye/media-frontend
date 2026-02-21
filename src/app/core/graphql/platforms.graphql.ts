import { gql } from 'apollo-angular';

export const GET_PLATFORM_ACCOUNTS_QUERY = gql`
  query PlatformAccounts($workspaceId: ID!) {
    platformAccounts(workspaceId: $workspaceId) {
      id
      workspaceId
      platform
      accountId
      displayName
      profilePictureUrl
      status
      lastSyncAt
      createdAt
      updatedAt
    }
  }
`;

export const CONNECT_PLATFORM_ACCOUNT_MUTATION = gql`
  mutation ConnectPlatformAccount(
    $workspaceId: ID!
    $platform: String!
    $accountId: String!
    $displayName: String!
    $accessToken: String!
    $refreshToken: String
    $profilePictureUrl: String
  ) {
    connectPlatformAccount(
      workspaceId: $workspaceId
      platform: $platform
      accountId: $accountId
      displayName: $displayName
      accessToken: $accessToken
      refreshToken: $refreshToken
      profilePictureUrl: $profilePictureUrl
    ) {
      id
      workspaceId
      platform
      accountId
      displayName
      profilePictureUrl
      status
      lastSyncAt
      createdAt
      updatedAt
    }
  }
`;

export const DISCONNECT_PLATFORM_ACCOUNT_MUTATION = gql`
  mutation DisconnectPlatformAccount($id: ID!) {
    disconnectPlatformAccount(id: $id) {
      id
      status
    }
  }
`;
