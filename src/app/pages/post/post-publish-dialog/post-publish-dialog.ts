import { Component, EventEmitter, Input, Output, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IPlatformAccount, ICreatePlatformPostBatch } from '../../../core/interfaces/platform';
import { PlatformGqlService } from '../../../core/services/platform.gql.service';
import { ToastService } from '../../../core/services/toast.service';

interface AccountEntry {
  account: IPlatformAccount;
  selected: boolean;
  caption: string;
  hashtags: string;
}

@Component({
  selector: 'app-post-publish-dialog',
  imports: [FormsModule],
  templateUrl: './post-publish-dialog.html',
  styleUrl: './post-publish-dialog.css',
})
export class PostPublishDialog implements OnInit {
  @Input({ required: true }) postId!: string;
  @Input({ required: true }) workspaceId!: string;
  @Input() defaultCaption = '';
  @Input() defaultHashtags: string[] = [];
  @Output() close = new EventEmitter<void>();
  @Output() published = new EventEmitter<void>();

  private platformGql = inject(PlatformGqlService);
  private toast = inject(ToastService);

  step = signal<1 | 2>(1);
  entries = signal<AccountEntry[]>([]);
  loadingAccounts = signal(true);
  publishing = signal(false);

  scheduleMode = signal<'now' | 'schedule'>('now');
  scheduledDate = signal('');
  scheduledTime = signal('');
  timezone = signal(Intl.DateTimeFormat().resolvedOptions().timeZone);

  ngOnInit(): void {
    this.platformGql.getPlatformAccounts(this.workspaceId).subscribe({
      next: (accounts) => {
        const active = accounts.filter(a => a.status === 'active');
        this.entries.set(active.map(a => ({
          account: a,
          selected: false,
          caption: this.defaultCaption,
          hashtags: this.defaultHashtags.join(', '),
        })));
        this.loadingAccounts.set(false);
      },
      error: () => {
        this.loadingAccounts.set(false);
        this.toast.show('Failed to load connected accounts', 'error');
      },
    });
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('ppd-backdrop')) {
      this.close.emit();
    }
  }

  toggleAccount(index: number): void {
    this.entries.update(entries => entries.map((e, i) =>
      i === index ? { ...e, selected: !e.selected } : e
    ));
  }

  get selectedCount(): number {
    return this.entries().filter(e => e.selected).length;
  }

  goToStep2(): void {
    if (this.selectedCount === 0) return;
    this.step.set(2);
  }

  goBack(): void {
    this.step.set(1);
  }

  updateCaption(index: number, value: string): void {
    this.entries.update(entries => entries.map((e, i) =>
      i === index ? { ...e, caption: value } : e
    ));
  }

  updateHashtags(index: number, value: string): void {
    this.entries.update(entries => entries.map((e, i) =>
      i === index ? { ...e, hashtags: value } : e
    ));
  }

  canPublish(): boolean {
    return this.entries().filter(e => e.selected).every(e => e.caption.trim().length > 0);
  }

  onPublish(): void {
    if (!this.canPublish()) return;
    this.publishing.set(true);

    const selected = this.entries().filter(e => e.selected);
    const input: ICreatePlatformPostBatch = {
      postId: this.postId,
      entries: selected.map(e => ({
        platform: e.account.platform,
        accountId: e.account.id,
        caption: e.caption.trim(),
        hashtags: e.hashtags ? e.hashtags.split(',').map(h => h.trim()).filter(Boolean) : undefined,
      })),
    };

    if (this.scheduleMode() === 'schedule' && this.scheduledDate() && this.scheduledTime()) {
      input.scheduledAt = new Date(`${this.scheduledDate()}T${this.scheduledTime()}`).toISOString();
      input.timezone = this.timezone();
    }

    this.platformGql.createPlatformPostsBatch(input).subscribe({
      next: () => {
        this.publishing.set(false);
        const action = this.scheduleMode() === 'schedule' ? 'scheduled' : 'queued';
        this.toast.show(`Posts ${action} for ${selected.length} account(s)!`, 'success');
        this.published.emit();
        this.close.emit();
      },
      error: (err) => {
        this.publishing.set(false);
        this.toast.show(err.message || 'Failed to create platform posts', 'error');
      },
    });
  }
}
