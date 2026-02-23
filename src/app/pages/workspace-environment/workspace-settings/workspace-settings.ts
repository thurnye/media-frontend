import { Component, computed, effect, inject, OnDestroy, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { selectSelectedWorkspace } from '../../../store/workspace/workspace.selectors';
import { selectUser } from '../../../store/auth/auth.selectors';
import {
  selectPlatformAccounts,
  selectActiveAccountCount,
  selectPlatformLoading,
} from '../../../store/platform/platform.selectors';
import { PlatformActions } from '../../../store/platform/platform.actions';
import { WorkspaceActions } from '../../../store/workspace/workspace.actions';
import { ConnectAccountDialog } from './connect-account-dialog/connect-account-dialog';
import { SocialIcon } from '../../../shared/icons/social-icon/social-icon';

@Component({
  selector: 'app-workspace-settings',
  imports: [RouterLink, ConnectAccountDialog, SocialIcon],
  templateUrl: './workspace-settings.html',
  styleUrl: './workspace-settings.css',
})
export class WorkspaceSettings implements OnDestroy {
  private store = inject(Store);
  private platformsLoaded = false;

  workspace         = this.store.selectSignal(selectSelectedWorkspace);
  currentUser       = this.store.selectSignal(selectUser);
  accounts          = this.store.selectSignal(selectPlatformAccounts);
  activeCount       = this.store.selectSignal(selectActiveAccountCount);
  accountsLoading   = this.store.selectSignal(selectPlatformLoading);
  showConnectDialog = signal(false);
  showDeleteDialog  = signal(false);
  deleteConfirmText = signal('');
  memberCount       = computed(() => this.workspace()?.members?.length ?? 0);
  postCount         = computed(() => this.workspace()?.postCount ?? 0);
  canDeleteWorkspace = computed(() => {
    const ws = this.workspace();
    const user = this.currentUser();
    if (!ws || !user) return false;
    if (ws.ownerId === user.id) return true;
    const role = ws.members?.find((m) => m.userId === user.id)?.role;
    return role === 'admin';
  });
  canConfirmDelete = computed(() => {
    const ws = this.workspace();
    if (!ws) return false;
    return this.deleteConfirmText().trim() === ws.name;
  });

  /** Reactively load platform accounts once workspace signal resolves. */
  private wsEffect = effect(() => {
    const ws = this.workspace();
    if (ws && !this.platformsLoaded) {
      this.platformsLoaded = true;
      this.store.dispatch(PlatformActions.loadPlatformAccounts({ workspaceId: ws.id }));
    }
  });

  ngOnDestroy(): void {
    this.store.dispatch(PlatformActions.clearPlatformAccounts());
  }

  onUnlink(accountId: string): void {
    const ws = this.workspace();
    if (!ws) return;
    if (!confirm('Unlink this account from the workspace?')) return;
    this.store.dispatch(PlatformActions.unlinkPlatformAccount({ accountId, workspaceId: ws.id }));
  }

  formatDate(dateStr?: string): string {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
    });
  }

  getPlatformLabel(platform: string): string {
    const MAP: Record<string, string> = {
      instagram: 'Instagram', facebook: 'Facebook', twitter: 'Twitter',
      linkedin:  'LinkedIn',  tiktok:   'TikTok',   youtube: 'YouTube',
    };
    return MAP[platform] ?? platform;
  }

  getPlatformColor(platform: string): string {
    const MAP: Record<string, string> = {
      instagram: '#e1306c', facebook: '#1877f2', twitter: '#1da1f2',
      linkedin:  '#0a66c2', tiktok:   '#010101', youtube: '#ff0000',
    };
    return MAP[platform] ?? '#6c757d';
  }

  getPlanLabel(plan?: string): string {
    return (plan ?? 'free').toUpperCase();
  }

  getPlanDescription(plan?: string): string {
    switch ((plan ?? 'free').toLowerCase()) {
      case 'pro':
        return 'Advanced workflow controls, more connected accounts, and higher limits.';
      case 'enterprise':
        return 'Custom limits and dedicated support for large teams.';
      default:
        return 'For individuals and small teams getting started.';
    }
  }

  getPlanLimitLabel(plan: string | undefined, metric: 'members' | 'posts' | 'accounts'): string {
    const normalized = (plan ?? 'free').toLowerCase();
    const limits: Record<string, Record<'members' | 'posts' | 'accounts', number | null>> = {
      free: { members: 5, posts: 100, accounts: 3 },
      pro: { members: 25, posts: 1000, accounts: 15 },
      enterprise: { members: null, posts: null, accounts: null },
    };
    const value = (limits[normalized] ?? limits['free'])[metric];
    return value === null ? 'unlimited' : value.toString();
  }

  onDeleteWorkspace(): void {
    const ws = this.workspace();
    if (!ws || !this.canDeleteWorkspace()) return;
    this.deleteConfirmText.set('');
    this.showDeleteDialog.set(true);
  }

  closeDeleteDialog(): void {
    this.showDeleteDialog.set(false);
    this.deleteConfirmText.set('');
  }

  onDeleteConfirmInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value ?? '';
    this.deleteConfirmText.set(value);
  }

  confirmDeleteWorkspace(): void {
    const ws = this.workspace();
    if (!ws || !this.canDeleteWorkspace() || !this.canConfirmDelete()) return;
    this.store.dispatch(WorkspaceActions.deleteWorkspace({ id: ws.id }));
    this.closeDeleteDialog();
  }
}
