import { gql } from 'apollo-angular';

export const GET_WORKSPACES_QUERY = gql`
  query GetWorkspaces {
    workspaces {
      id
      name
      slug
      description
      plan
      defaultTimezone
      ownerId
      createdAt
      settings {
        approvalRequired
        evergreenEnabled
        autoPublishEnabled
      }
    }
  }
`;

export const GET_WORKSPACE_QUERY = gql`
  query GetWorkspace($id: ID!) {
    workspace(id: $id) {
      id
      name
      slug
      description
      defaultTimezone
      plan
      ownerId
      members {
        userId
        role
        joinedAt
        firstName
        lastName
        avatarUrl
      }
      settings {
        approvalRequired
        evergreenEnabled
        autoPublishEnabled
      }
    }
  }
`;

export const CREATE_WORKSPACE_MUTATION = gql`
  mutation CreateWorkspace(
    $name: String!
    $slug: String!
    $description: String
    $defaultTimezone: String
    $plan: String
    $settings: WorkspaceSettingsInput
  ) {
    createWorkspace(
      name: $name
      slug: $slug
      description: $description
      defaultTimezone: $defaultTimezone
      plan: $plan
      settings: $settings
    ) {
      id
      name
      slug
      plan
      ownerId
    }
  }
`;

export const UPDATE_WORKSPACE_MUTATION = gql`
  mutation UpdateWorkspace(
    $id: ID!
    $name: String
    $slug: String
    $description: String
    $defaultTimezone: String
    $plan: String
    $settings: WorkspaceSettingsInput
  ) {
    updateWorkspace(
      id: $id
      name: $name
      slug: $slug
      description: $description
      defaultTimezone: $defaultTimezone
      plan: $plan
      settings: $settings
    ) {
      id
      name
      slug
      description
      defaultTimezone
      plan
      ownerId
      settings {
        approvalRequired
        evergreenEnabled
        autoPublishEnabled
      }
    }
  }
`;

export const ADD_WORKSPACE_MEMBER = gql`
  mutation AddWorkspaceMember($workspaceId: ID!, $userId: String!, $role: String!) {
    addWorkspaceMember(workspaceId: $workspaceId, userId: $userId, role: $role) {
      id
      members {
        userId
        role
        joinedAt
        firstName
        lastName
        avatarUrl
      }
    }
  }
`;

export const REMOVE_WORKSPACE_MEMBER = gql`
  mutation RemoveWorkspaceMember($workspaceId: ID!, $userId: String!) {
    removeWorkspaceMember(workspaceId: $workspaceId, userId: $userId) {
      id
      members {
        userId
        role
        joinedAt
        firstName
        lastName
        avatarUrl
      }
    }
  }
`;

export const SUGGEST_MEMBERS_QUERY = gql`
  query SuggestMembers($workspaceId: ID!, $query: String!) {
    suggestMembers(workspaceId: $workspaceId, query: $query) {
      userId
      email
      firstName
      lastName
      avatarUrl
    }
  }
`;

export const INVITE_TO_WORKSPACE_MUTATION = gql`
  mutation InviteToWorkspace($workspaceId: ID!, $email: String!, $role: String!) {
    inviteToWorkspace(workspaceId: $workspaceId, email: $email, role: $role) {
      id
      email
      role
      status
    }
  }
`;

export const GET_WORKSPACE_INVITATIONS_QUERY = gql`
  query WorkspaceInvitations($workspaceId: ID!) {
    workspaceInvitations(workspaceId: $workspaceId) {
      id
      workspaceId
      email
      role
      status
      expiresAt
      createdAt
    }
  }
`;

export const REVOKE_INVITATION_MUTATION = gql`
  mutation RevokeInvitation($workspaceId: ID!, $email: String!) {
    revokeInvitation(workspaceId: $workspaceId, email: $email)
  }
`;

export const ACCEPT_INVITATION_MUTATION = gql`
  mutation AcceptInvitation($token: String!) {
    acceptInvitation(token: $token) {
      id
      name
      slug
      ownerId
    }
  }
`;
