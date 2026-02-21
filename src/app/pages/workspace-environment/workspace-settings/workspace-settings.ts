import { Component, effect, inject, OnDestroy, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { selectSelectedWorkspace } from '../../../store/workspace/workspace.selectors';
import {
  selectPlatformAccounts,
  selectActiveAccountCount,
  selectPlatformLoading,
} from '../../../store/platform/platform.selectors';
import { PlatformActions } from '../../../store/platform/platform.actions';
import { ConnectAccountDialog } from './connect-account-dialog/connect-account-dialog';

@Component({
  selector: 'app-workspace-settings',
  imports: [RouterLink, ConnectAccountDialog],
  templateUrl: './workspace-settings.html',
  styleUrl: './workspace-settings.css',
})
export class WorkspaceSettings implements OnDestroy {
  private store = inject(Store);
  private platformsLoaded = false;

  workspace         = this.store.selectSignal(selectSelectedWorkspace);
  accounts          = this.store.selectSignal(selectPlatformAccounts);
  activeCount       = this.store.selectSignal(selectActiveAccountCount);
  accountsLoading   = this.store.selectSignal(selectPlatformLoading);
  showConnectDialog = signal(false);

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
}
