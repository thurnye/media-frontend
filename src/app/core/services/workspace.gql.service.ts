import { inject, Injectable } from '@angular/core';
import { Apollo } from 'apollo-angular';
import { map } from 'rxjs';
import { IWorkspace } from '../interfaces/workspace';
import { IMemberSuggestion, IWorkspaceInvitation } from '../interfaces/workspace';
import {
  ACCEPT_INVITATION_MUTATION,
  ADD_WORKSPACE_MEMBER,
  CREATE_WORKSPACE_MUTATION,
  GET_WORKSPACE_INVITATIONS_QUERY,
  GET_WORKSPACE_QUERY,
  GET_WORKSPACES_QUERY,
  INVITE_TO_WORKSPACE_MUTATION,
  REMOVE_WORKSPACE_MEMBER,
  REVOKE_INVITATION_MUTATION,
  SUGGEST_MEMBERS_QUERY,
  UPDATE_WORKSPACE_MUTATION,
} from '../graphql/workspaces.graphql';

export interface ICreateWorkspaceInput {
  name:             string;
  slug:             string;
  description?:     string;
  defaultTimezone?: string;
  plan?:            string;
  settings?:        { approvalRequired?: boolean; evergreenEnabled?: boolean; autoPublishEnabled?: boolean };
}

export interface IUpdateWorkspaceInput {
  id:               string;
  name?:            string;
  slug?:            string;
  description?:     string;
  defaultTimezone?: string;
  plan?:            string;
  settings?:        { approvalRequired?: boolean; evergreenEnabled?: boolean; autoPublishEnabled?: boolean };
}

@Injectable({ providedIn: 'root' })
export class WorkspaceGqlService {
  private apollo = inject(Apollo);

  getWorkspaces() {
    return this.apollo
      .query<{ workspaces: IWorkspace[] }>({
        query: GET_WORKSPACES_QUERY,
        fetchPolicy: 'no-cache',
      })
      .pipe(map(r => r.data!.workspaces));
  }

  getWorkspace(id: string) {
    return this.apollo
      .query<{ workspace: IWorkspace }>({
        query: GET_WORKSPACE_QUERY,
        variables: { id },
        fetchPolicy: 'no-cache',
      })
      .pipe(map(r => r.data!.workspace));
  }

  createWorkspace(input: ICreateWorkspaceInput) {
    return this.apollo
      .mutate<{ createWorkspace: IWorkspace }>({
        mutation: CREATE_WORKSPACE_MUTATION,
        variables: input,
      })
      .pipe(map(r => r.data!.createWorkspace));
  }

  updateWorkspace(input: IUpdateWorkspaceInput) {
    return this.apollo
      .mutate<{ updateWorkspace: IWorkspace }>({
        mutation: UPDATE_WORKSPACE_MUTATION,
        variables: input,
      })
      .pipe(map(r => r.data!.updateWorkspace));
  }

  addMember(workspaceId: string, userId: string, role: string) {
    return this.apollo
      .mutate<{ addWorkspaceMember: IWorkspace }>({
        mutation: ADD_WORKSPACE_MEMBER,
        variables: { workspaceId, userId, role },
      })
      .pipe(map(r => r.data!.addWorkspaceMember));
  }

  removeMember(workspaceId: string, userId: string) {
    return this.apollo
      .mutate<{ removeWorkspaceMember: IWorkspace }>({
        mutation: REMOVE_WORKSPACE_MEMBER,
        variables: { workspaceId, userId },
      })
      .pipe(map(r => r.data!.removeWorkspaceMember));
  }

  suggestMembers(workspaceId: string, query: string) {
    return this.apollo
      .query<{ suggestMembers: IMemberSuggestion[] }>({
        query: SUGGEST_MEMBERS_QUERY,
        variables: { workspaceId, query },
        fetchPolicy: 'no-cache',
      })
      .pipe(map(r => r.data!.suggestMembers));
  }

  inviteToWorkspace(workspaceId: string, email: string, role: string) {
    return this.apollo
      .mutate<{ inviteToWorkspace: IWorkspaceInvitation }>({
        mutation: INVITE_TO_WORKSPACE_MUTATION,
        variables: { workspaceId, email, role },
      })
      .pipe(map(r => r.data!.inviteToWorkspace));
  }

  getWorkspaceInvitations(workspaceId: string) {
    return this.apollo
      .query<{ workspaceInvitations: IWorkspaceInvitation[] }>({
        query: GET_WORKSPACE_INVITATIONS_QUERY,
        variables: { workspaceId },
        fetchPolicy: 'no-cache',
      })
      .pipe(map(r => r.data!.workspaceInvitations));
  }

  revokeInvitation(workspaceId: string, email: string) {
    return this.apollo
      .mutate<{ revokeInvitation: boolean }>({
        mutation: REVOKE_INVITATION_MUTATION,
        variables: { workspaceId, email },
      })
      .pipe(map(r => r.data!.revokeInvitation));
  }

  acceptInvitation(token: string) {
    return this.apollo
      .mutate<{ acceptInvitation: IWorkspace }>({
        mutation: ACCEPT_INVITATION_MUTATION,
        variables: { token },
      })
      .pipe(map(r => r.data!.acceptInvitation));
  }
}
