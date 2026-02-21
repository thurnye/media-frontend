import { inject, Injectable } from '@angular/core';
import { Apollo } from 'apollo-angular';
import { map } from 'rxjs';
import { IWorkspace } from '../interfaces/workspace';
import {
  ADD_WORKSPACE_MEMBER,
  CREATE_WORKSPACE_MUTATION,
  GET_WORKSPACE_QUERY,
  GET_WORKSPACES_QUERY,
  REMOVE_WORKSPACE_MEMBER,
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
}
