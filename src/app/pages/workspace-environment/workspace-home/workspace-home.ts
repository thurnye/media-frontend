import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { selectSelectedWorkspace, selectWorkspaceLoading } from '../../../store/workspace/workspace.selectors';
import { InviteDialog } from '../workspace-members/invite-dialog/invite-dialog';
import { ConnectAccountDialog } from '../workspace-settings/connect-account-dialog/connect-account-dialog';
import { WorkspaceCalendar } from '../workspace-calendar/workspace-calendar';

@Component({
  selector: 'app-workspace-home',
  imports: [RouterLink, InviteDialog, ConnectAccountDialog, WorkspaceCalendar],
  templateUrl: './workspace-home.html',
  styleUrl: './workspace-home.css',
})
export class WorkspaceHome {
  private store = inject(Store);

  workspace = this.store.selectSignal(selectSelectedWorkspace);
  loading = this.store.selectSignal(selectWorkspaceLoading);
  memberCount = computed(() => this.workspace()?.members?.length ?? 0);
  planLabel = computed(() => (this.workspace()?.plan ?? 'free').toUpperCase());

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
