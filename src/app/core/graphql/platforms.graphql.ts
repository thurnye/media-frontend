import { gql } from 'apollo-angular';

const PLATFORM_ACCOUNT_FIELDS = `
  id
  userId
  workspaceIds
  platform
  accountId
  displayName
  profilePictureUrl
  status
  lastSyncAt
  createdAt
  updatedAt
`;

export const GET_PLATFORM_ACCOUNTS_QUERY = gql`
  query PlatformAccounts($workspaceId: ID!) {
    platformAccounts(workspaceId: $workspaceId) {
      ${PLATFORM_ACCOUNT_FIELDS}
    }
  }
`;

export const GET_MY_PLATFORM_ACCOUNTS_QUERY = gql`
  query MyPlatformAccounts {
    myPlatformAccounts {
      ${PLATFORM_ACCOUNT_FIELDS}
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
      ${PLATFORM_ACCOUNT_FIELDS}
    }
  }
`;

export const LINK_PLATFORM_ACCOUNT_MUTATION = gql`
  mutation LinkPlatformAccount($accountId: ID!, $workspaceId: ID!) {
    linkPlatformAccount(accountId: $accountId, workspaceId: $workspaceId) {
      ${PLATFORM_ACCOUNT_FIELDS}
    }
  }
`;

export const UNLINK_PLATFORM_ACCOUNT_MUTATION = gql`
  mutation UnlinkPlatformAccount($accountId: ID!, $workspaceId: ID!) {
    unlinkPlatformAccount(accountId: $accountId, workspaceId: $workspaceId) {
      ${PLATFORM_ACCOUNT_FIELDS}
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

const PLATFORM_POST_FIELDS = `
  id
  postId
  platform
  accountId
  content {
    caption
    hashtags
    firstComment
  }
  publishing {
    status
    scheduledAt
    publishedAt
    timezone
    platformPostId
  }
  isActive
  createdAt
  updatedAt
`;

export const GET_PLATFORM_POSTS_QUERY = gql`
  query PlatformPosts($postId: ID!) {
    platformPosts(postId: $postId) {
      ${PLATFORM_POST_FIELDS}
    }
  }
`;

export const CREATE_PLATFORM_POSTS_BATCH_MUTATION = gql`
  mutation CreatePlatformPostsBatch(
    $postId: ID!
    $entries: [PlatformPostEntryInput!]!
    $scheduledAt: String
    $timezone: String
  ) {
    createPlatformPostsBatch(
      postId: $postId
      entries: $entries
      scheduledAt: $scheduledAt
      timezone: $timezone
    ) {
      ${PLATFORM_POST_FIELDS}
    }
  }
`;
