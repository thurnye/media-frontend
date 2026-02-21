import { gql } from 'apollo-angular';

const POST_FIELDS = `
  id
  workspaceId
  createdBy
  title
  description
  category
  tags
  status
  priority
  isEvergreen
  approvalWorkflow {
    requiredApprovers
    approvedBy
    rejectedBy
    comments {
      userId
      message
      createdAt
    }
  }
  isActive
  createdAt
  updatedAt
`;

export const GET_POSTS = gql`
  query Posts($workspaceId: ID!, $page: Int, $limit: Int) {
    posts(workspaceId: $workspaceId, page: $page, limit: $limit) {
      data {
        ${POST_FIELDS}
      }
      total
      page
      totalPages
    }
  }
`;

export const GET_POST = gql`
  query Post($id: ID!) {
    post(id: $id) {
      ${POST_FIELDS}
    }
  }
`;

export const CREATE_POST = gql`
  mutation CreatePost(
    $workspaceId: ID!
    $title: String!
    $description: String
    $category: String
    $tags: [String]
    $priority: String
    $isEvergreen: Boolean
  ) {
    createPost(
      workspaceId: $workspaceId
      title: $title
      description: $description
      category: $category
      tags: $tags
      priority: $priority
      isEvergreen: $isEvergreen
    ) {
      ${POST_FIELDS}
    }
  }
`;

export const UPDATE_POST = gql`
  mutation UpdatePost(
    $id: ID!
    $title: String
    $description: String
    $category: String
    $tags: [String]
    $priority: String
    $status: String
    $isEvergreen: Boolean
  ) {
    updatePost(
      id: $id
      title: $title
      description: $description
      category: $category
      tags: $tags
      priority: $priority
      status: $status
      isEvergreen: $isEvergreen
    ) {
      ${POST_FIELDS}
    }
  }
`;

export const DELETE_POST = gql`
  mutation DeletePost($id: ID!) {
    deletePost(id: $id) {
      id
    }
  }
`;

export const SUBMIT_FOR_APPROVAL = gql`
  mutation SubmitForApproval($postId: ID!) {
    submitForApproval(postId: $postId) {
      ${POST_FIELDS}
    }
  }
`;

export const APPROVE_POST = gql`
  mutation ApprovePost($postId: ID!) {
    approvePost(postId: $postId) {
      ${POST_FIELDS}
    }
  }
`;

export const REJECT_POST = gql`
  mutation RejectPost($postId: ID!, $reason: String!) {
    rejectPost(postId: $postId, reason: $reason) {
      ${POST_FIELDS}
    }
  }
`;
