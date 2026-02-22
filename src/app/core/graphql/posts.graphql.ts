import { gql } from 'apollo-angular';

const POST_FIELDS = `
  id
  workspaceId
  createdBy
  createdByUser {
    id
    firstName
    lastName
    email
    avatarUrl
  }
  title
  description
  mediaIds
  mediaUrls
  category
  tags
  status
  priority
  isEvergreen
  approvalWorkflow {
    requiredApprovers
    requiredApproverUsers {
      id
      firstName
      lastName
      email
      avatarUrl
    }
    approvedBy
    approvedByUsers {
      id
      firstName
      lastName
      email
      avatarUrl
    }
    rejectedBy
    rejectedByUsers {
      id
      firstName
      lastName
      email
      avatarUrl
    }
    cancelledBy
    cancelledByUsers {
      id
      firstName
      lastName
      email
      avatarUrl
    }
    archivedBy
    archivedByUsers {
      id
      firstName
      lastName
      email
      avatarUrl
    }
    comments {
      userId
      user {
        id
        firstName
        lastName
        email
        avatarUrl
      }
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
    $mediaIds: [ID]
    $category: String
    $tags: [String]
    $priority: String
    $isEvergreen: Boolean
  ) {
    createPost(
      workspaceId: $workspaceId
      title: $title
      description: $description
      mediaIds: $mediaIds
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
    $mediaIds: [ID]
    $category: String
    $tags: [String]
    $priority: String
    $status: String
    $isEvergreen: Boolean
    $requiredApprovers: [ID]
  ) {
    updatePost(
      id: $id
      title: $title
      description: $description
      mediaIds: $mediaIds
      category: $category
      tags: $tags
      priority: $priority
      status: $status
      isEvergreen: $isEvergreen
      requiredApprovers: $requiredApprovers
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

export const GET_POST_REVIEW_COMMENTS = gql`
  query PostReviewComments($postId: ID!) {
    postReviewComments(postId: $postId) {
      id
      workspaceId
      postId
      authorId
      author {
        id
        firstName
        lastName
        email
        avatarUrl
      }
      message
      mediaIds
      mediaUrls
      parentCommentId
      createdAt
      updatedAt
    }
  }
`;

export const ADD_POST_REVIEW_COMMENT = gql`
  mutation AddPostReviewComment(
    $postId: ID!
    $message: String!
    $mediaIds: [ID]
    $parentCommentId: ID
  ) {
    addPostReviewComment(
      postId: $postId
      message: $message
      mediaIds: $mediaIds
      parentCommentId: $parentCommentId
    ) {
      id
      workspaceId
      postId
      authorId
      author {
        id
        firstName
        lastName
        email
        avatarUrl
      }
      message
      mediaIds
      mediaUrls
      parentCommentId
      createdAt
      updatedAt
    }
  }
`;
