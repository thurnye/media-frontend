import { Component, computed, EventEmitter, inject, Input, OnInit, Output, signal } from '@angular/core';
import { Store } from '@ngrx/store';
import { PlatformType } from '../../../../core/interfaces/platform';
import { PlatformActions } from '../../../../store/platform/platform.actions';
import { selectMyPlatformAccounts, selectPlatformSaving } from '../../../../store/platform/platform.selectors';
import { environment } from '../../../../../environments/environment';

interface PlatformOption {
  type:  PlatformType;
  label: string;
  color: string;
}

const PLATFORM_OPTIONS: PlatformOption[] = [
  { type: 'instagram', label: 'Instagram', color: '#e1306c' },
  { type: 'facebook',  label: 'Facebook',  color: '#1877f2' },
  { type: 'twitter',   label: 'Twitter',   color: '#1da1f2' },
  { type: 'linkedin',  label: 'LinkedIn',  color: '#0a66c2' },
  { type: 'tiktok',    label: 'TikTok',    color: '#010101' },
  { type: 'youtube',   label: 'YouTube',   color: '#ff0000' },
];

@Component({
  selector: 'app-connect-account-dialog',
  imports: [],
  templateUrl: './connect-account-dialog.html',
  styleUrl: './connect-account-dialog.css',
})
export class ConnectAccountDialog implements OnInit {
  @Input({ required: true }) workspaceId!: string;
  @Output() close = new EventEmitter<void>();

  private store = inject(Store);

  step        = signal<'select' | 'connect'>('select');
  connecting  = signal(false);

  myAccounts  = this.store.selectSignal(selectMyPlatformAccounts);
  saving      = this.store.selectSignal(selectPlatformSaving);

  selected = signal<Set<string>>(new Set());

  readonly platforms = PLATFORM_OPTIONS;

  /** Accounts not yet linked to this workspace. */
  availableAccounts = computed(() =>
    this.myAccounts().filter(a =>
      a.status === 'active' && !a.workspaceIds.includes(this.workspaceId),
    ),
  );

  ngOnInit(): void {
    this.store.dispatch(PlatformActions.loadMyPlatformAccounts());
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('cad-backdrop')) {
      this.close.emit();
    }
  }

  toggleSelection(accountId: string): void {
    const s = new Set(this.selected());
    s.has(accountId) ? s.delete(accountId) : s.add(accountId);
    this.selected.set(s);
  }

  isSelected(accountId: string): boolean {
    return this.selected().has(accountId);
  }

  linkSelected(): void {
    this.selected().forEach(accountId => {
      this.store.dispatch(PlatformActions.linkPlatformAccount({
        accountId,
        workspaceId: this.workspaceId,
      }));
    });
    this.close.emit();
  }

  goToConnect(): void {
    this.step.set('connect');
  }

  selectPlatform(platform: PlatformOption): void {
    this.connecting.set(true);
    const serverUrl = environment.API_URL.replace('/graphql', '');
    window.location.href = `${serverUrl}/oauth/${platform.type}/connect?workspaceId=${this.workspaceId}`;
  }

  getPlatformLabel(type: string): string {
    return PLATFORM_OPTIONS.find(p => p.type === type)?.label ?? type;
  }

  getPlatformColor(type: string): string {
    return PLATFORM_OPTIONS.find(p => p.type === type)?.color ?? '#6c757d';
  }
}
