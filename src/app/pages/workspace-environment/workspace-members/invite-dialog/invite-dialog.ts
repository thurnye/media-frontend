import { Component, EventEmitter, Input, Output, inject, signal, OnDestroy, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { Subject, debounceTime, distinctUntilChanged, switchMap, of, takeUntil } from 'rxjs';
import { WorkspaceActions } from '../../../../store/workspace/workspace.actions';
import { selectSelectedWorkspace, selectWorkspaceSaving } from '../../../../store/workspace/workspace.selectors';
import { WorkspaceGqlService } from '../../../../core/services/workspace.gql.service';
import { IMemberSuggestion } from '../../../../core/interfaces/workspace';
import { selectUser } from '../../../../store/auth/auth.selectors';

@Component({
  selector: 'app-invite-dialog',
  imports: [FormsModule],
  templateUrl: './invite-dialog.html',
  styleUrl: './invite-dialog.css',
})
export class InviteDialog implements OnDestroy {
  @Input({ required: true }) workspaceId!: string;
  @Output() close = new EventEmitter<void>();

  private store        = inject(Store);
  private workspaceGql = inject(WorkspaceGqlService);
  private destroy$     = new Subject<void>();

  workspace = this.store.selectSignal(selectSelectedWorkspace);
  currentUser = this.store.selectSignal(selectUser);
  saving      = this.store.selectSignal(selectWorkspaceSaving);
  email       = signal('');
  role        = signal('member');
  suggestions = signal<IMemberSuggestion[]>([]);
  showDropdown = signal(false);
  canAssignRoles = computed(() => {
    const ws = this.workspace();
    const userId = this.currentUser()?.id;
    if (!ws || !userId) return false;
    if (ws.ownerId === userId) return true;
    return ws.members?.find((member) => member.userId === userId)?.role === 'admin';
  });

  private search$ = new Subject<string>();

  constructor() {
    this.search$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(query =>
        query.length >= 2
          ? this.workspaceGql.suggestMembers(this.workspaceId, query)
          : of([]),
      ),
      takeUntil(this.destroy$),
    ).subscribe(results => {
      this.suggestions.set(results);
      this.showDropdown.set(results.length > 0);
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onEmailInput(value: string): void {
    this.email.set(value);
    this.search$.next(value.trim());
  }

  onSelectSuggestion(suggestion: IMemberSuggestion): void {
    this.email.set(suggestion.email);
    this.showDropdown.set(false);
  }

  onInputBlur(): void {
    // Delay to allow click on suggestion to register
    setTimeout(() => this.showDropdown.set(false), 200);
  }

  onInputFocus(): void {
    if (this.suggestions().length > 0) {
      this.showDropdown.set(true);
    }
  }

  getInitials(s: IMemberSuggestion): string {
    const first = s.firstName?.charAt(0) ?? '';
    const last  = s.lastName?.charAt(0) ?? '';
    return (first + last).toUpperCase() || s.email.slice(0, 2).toUpperCase();
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('id-backdrop')) {
      this.close.emit();
    }
  }

  onInvite(): void {
    const emailVal = this.email().trim();
    if (!emailVal) return;
    const inviteRole = this.canAssignRoles() ? this.role() : 'member';
    this.store.dispatch(WorkspaceActions.inviteToWorkspace({
      workspaceId: this.workspaceId,
      email: emailVal,
      role: inviteRole,
    }));
    this.close.emit();
  }
}
