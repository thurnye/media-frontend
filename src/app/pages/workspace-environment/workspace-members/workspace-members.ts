import { Component, inject, signal } from '@angular/core';
import { Store } from '@ngrx/store';
import { selectSelectedWorkspace } from '../../../store/workspace/workspace.selectors';
import { selectUser } from '../../../store/auth/auth.selectors';
import { WorkspaceActions } from '../../../store/workspace/workspace.actions';
import { InviteDialog } from './invite-dialog/invite-dialog';

@Component({
  selector: 'app-workspace-members',
  imports: [InviteDialog],
  templateUrl: './workspace-members.html',
  styleUrl: './workspace-members.css',
})
export class WorkspaceMembers {
  private store = inject(Store);

  workspace   = this.store.selectSignal(selectSelectedWorkspace);
  currentUser = this.store.selectSignal(selectUser);
  showInviteDialog = signal(false);

  isOwner(): boolean {
    const ws = this.workspace();
    return !!ws && ws.ownerId === this.currentUser()?.id;
  }

  formatDate(dateStr?: string): string {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
    });
  }

  getInitials(userId: string): string {
    return userId.slice(0, 2).toUpperCase();
  }

  onRemoveMember(userId: string): void {
    const ws = this.workspace();
    if (!ws || !confirm('Remove this member from the workspace?')) return;
    this.store.dispatch(WorkspaceActions.removeMember({ workspaceId: ws.id, userId }));
  }
}
