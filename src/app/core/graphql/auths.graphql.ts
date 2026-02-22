import { gql } from 'apollo-angular';

export const LOGIN_MUTATION = gql`
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      user {
        id
        email
        firstName
        lastName
        avatarUrl
        workspaces {
          workspaceId
          name
        }
      }
    }
  }
`;

export const SIGNUP_MUTATION = gql`
  mutation CreateUser(
    $firstName: String!
    $lastName: String!
    $email: String!
    $password: String!
    $dateOfBirth: String!
  ) {
    createUser(
      firstName: $firstName
      lastName: $lastName
      email: $email
      password: $password
      dateOfBirth: $dateOfBirth
    ) {
      user {
        id
        email
        firstName
        lastName
        avatarUrl
        workspaces {
          workspaceId
          name
        }
      }
    }
  }
`;

export const ME_QUERY = gql`
  query Me {
    me {
      id
      email
      firstName
      lastName
      avatarUrl
      workspaces {
        workspaceId
        name
      }
    }
  }
`;
