import { Component, EventEmitter, Input, Output, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { PlatformType } from '../../../../core/interfaces/platform';
import { PlatformActions } from '../../../../store/platform/platform.actions';
import { selectPlatformSaving } from '../../../../store/platform/platform.selectors';

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
  imports: [FormsModule],
  templateUrl: './connect-account-dialog.html',
  styleUrl: './connect-account-dialog.css',
})
export class ConnectAccountDialog {
  @Input({ required: true }) workspaceId!: string;
  @Output() close = new EventEmitter<void>();

  private store = inject(Store);

  saving           = this.store.selectSignal(selectPlatformSaving);
  step             = signal<1 | 2>(1);
  selectedPlatform = signal<PlatformOption | null>(null);
  accountId        = signal('');
  displayName      = signal('');
  accessToken      = signal('');
  refreshToken     = signal('');

  readonly platforms = PLATFORM_OPTIONS;

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('cad-backdrop')) {
      this.close.emit();
    }
  }

  selectPlatform(platform: PlatformOption): void {
    this.selectedPlatform.set(platform);
    this.step.set(2);
  }

  goBack(): void {
    this.step.set(1);
    this.selectedPlatform.set(null);
    this.accountId.set('');
    this.displayName.set('');
    this.accessToken.set('');
    this.refreshToken.set('');
  }

  isFormValid(): boolean {
    return !!this.accountId().trim()
        && !!this.displayName().trim()
        && !!this.accessToken().trim();
  }

  onConnect(): void {
    const platform = this.selectedPlatform();
    if (!platform || !this.isFormValid()) return;

    this.store.dispatch(PlatformActions.connectPlatformAccount({
      input: {
        workspaceId:  this.workspaceId,
        platform:     platform.type,
        accountId:    this.accountId().trim(),
        displayName:  this.displayName().trim(),
        accessToken:  this.accessToken().trim(),
        refreshToken: this.refreshToken().trim() || undefined,
      },
    }));
    this.close.emit();
  }
}
