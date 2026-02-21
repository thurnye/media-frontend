import { Component, EventEmitter, Input, Output, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { WorkspaceActions } from '../../../../store/workspace/workspace.actions';
import { selectWorkspaceSaving } from '../../../../store/workspace/workspace.selectors';

@Component({
  selector: 'app-invite-dialog',
  imports: [FormsModule],
  templateUrl: './invite-dialog.html',
  styleUrl: './invite-dialog.css',
})
export class InviteDialog {
  @Input({ required: true }) workspaceId!: string;
  @Output() close = new EventEmitter<void>();

  private store = inject(Store);

  saving = this.store.selectSignal(selectWorkspaceSaving);
  userId = signal('');
  role   = signal('member');

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('id-backdrop')) {
      this.close.emit();
    }
  }

  onInvite(): void {
    const uid = this.userId().trim();
    if (!uid) return;
    this.store.dispatch(WorkspaceActions.addMember({
      workspaceId: this.workspaceId,
      userId: uid,
      role: this.role(),
    }));
    this.close.emit();
  }
}
