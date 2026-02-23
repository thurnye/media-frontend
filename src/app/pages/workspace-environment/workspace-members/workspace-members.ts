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

  formatDate(value?: string | number | Date): string {
    const date = this.toDate(value);
    if (!date) return '—';
    return date.toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
    });
  }

  private toDate(value?: string | number | Date): Date | null {
    if (value === null || value === undefined || value === '') return null;
    if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;

    if (typeof value === 'number') {
      const date = new Date(value);
      return Number.isNaN(date.getTime()) ? null : date;
    }

    const trimmed = value.trim();
    if (!trimmed) return null;

    // Some backend fields may arrive as epoch milliseconds encoded as strings.
    if (/^\d+$/.test(trimmed)) {
      const asNumber = Number(trimmed);
      if (Number.isFinite(asNumber)) {
        const epochDate = new Date(asNumber);
        if (!Number.isNaN(epochDate.getTime())) return epochDate;
      }
    }

    const parsed = new Date(trimmed);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
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
