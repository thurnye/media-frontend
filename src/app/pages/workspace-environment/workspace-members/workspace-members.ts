import { Component, computed, effect, inject, signal } from '@angular/core';
import { Store } from '@ngrx/store';
import { selectSelectedWorkspace, selectWorkspaceInvitations } from '../../../store/workspace/workspace.selectors';
import { selectUser } from '../../../store/auth/auth.selectors';
import { WorkspaceActions } from '../../../store/workspace/workspace.actions';
import { IWorkspaceMember } from '../../../core/interfaces/workspace';
import { InviteDialog } from './invite-dialog/invite-dialog';

@Component({
  selector: 'app-workspace-members',
  imports: [InviteDialog],
  templateUrl: './workspace-members.html',
  styleUrl: './workspace-members.css',
})
export class WorkspaceMembers {
  private store = inject(Store);
  private invitationsLoaded = false;

  workspace   = this.store.selectSignal(selectSelectedWorkspace);
  currentUser = this.store.selectSignal(selectUser);
  invitations = this.store.selectSignal(selectWorkspaceInvitations);
  showInviteDialog = signal(false);

  /** Load pending invitations when workspace is available. */
  private wsEffect = effect(() => {
    const ws = this.workspace();
    if (ws && !this.invitationsLoaded) {
      this.invitationsLoaded = true;
      this.store.dispatch(WorkspaceActions.loadInvitations({ workspaceId: ws.id }));
    }
  });

  /** The owner member entry (from the members array). */
  ownerMember = computed(() => {
    const ws = this.workspace();
    if (!ws) return null;
    return ws.members?.find(m => m.userId === ws.ownerId) ?? null;
  });

  /** Non-owner members. */
  otherMembers = computed(() => {
    const ws = this.workspace();
    if (!ws) return [];
    return (ws.members ?? []).filter(m => m.userId !== ws.ownerId);
  });

  /** Only pending invitations. */
  pendingInvitations = computed(() =>
    this.invitations().filter(inv => inv.status === 'pending'),
  );

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

  getInitials(member: IWorkspaceMember): string {
    const first = member.firstName?.charAt(0) ?? '';
    const last = member.lastName?.charAt(0) ?? '';
    return (first + last).toUpperCase() || member.userId.slice(0, 2).toUpperCase();
  }

  getFullName(member: IWorkspaceMember): string {
    const name = [member.firstName, member.lastName].filter(Boolean).join(' ');
    return name || member.userId;
  }

  onRemoveMember(userId: string): void {
    const ws = this.workspace();
    if (!ws || !confirm('Remove this member from the workspace?')) return;
    this.store.dispatch(WorkspaceActions.removeMember({ workspaceId: ws.id, userId }));
  }

  onRevokeInvitation(email: string): void {
    const ws = this.workspace();
    if (!ws || !confirm(`Cancel invitation for ${email}?`)) return;
    this.store.dispatch(WorkspaceActions.revokeInvitation({ workspaceId: ws.id, email }));
  }
}
