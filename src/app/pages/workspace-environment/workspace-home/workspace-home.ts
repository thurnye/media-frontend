import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { selectSelectedWorkspace, selectWorkspaceLoading } from '../../../store/workspace/workspace.selectors';
import { InviteDialog } from '../workspace-members/invite-dialog/invite-dialog';
import { ConnectAccountDialog } from '../workspace-settings/connect-account-dialog/connect-account-dialog';

@Component({
  selector: 'app-workspace-home',
  imports: [RouterLink, InviteDialog, ConnectAccountDialog],
  templateUrl: './workspace-home.html',
  styleUrl: './workspace-home.css',
})
export class WorkspaceHome {
  private store = inject(Store);

  workspace = this.store.selectSignal(selectSelectedWorkspace);
  loading = this.store.selectSignal(selectWorkspaceLoading);

  showInviteDialog = signal(false);
  showConnectDialog = signal(false);
  showMenu = signal(false);

  toggleMenu(): void {
    this.showMenu.update(v => !v);
  }

  closeMenu(): void {
    this.showMenu.set(false);
  }
}
