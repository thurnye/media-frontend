import { Component, EventEmitter, Input, Output, OnChanges, OnDestroy, OnInit, SimpleChanges, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IPlatformAccount, ICreatePlatformPostBatch } from '../../../core/interfaces/platform';
import { PlatformGqlService } from '../../../core/services/platform.gql.service';
import { ToastService } from '../../../core/services/toast.service';
import { MediaService } from '../../../core/services/media.service';

type PlatformMediaType = 'image' | 'video' | 'carousel';

interface EntryMediaItem {
  id: string;
  type: PlatformMediaType;
  url: string;
  altText?: string;
  thumbnailUrl?: string;
  source: 'post' | 'added';
  uploading?: boolean;
  progress?: number;
  error?: string;
}

interface AccountEntry {
  account: IPlatformAccount;
  selected: boolean;
  caption: string;
  hashtags: string;
  media: EntryMediaItem[];
}

@Component({
  selector: 'app-post-publish-dialog',
  imports: [FormsModule],
  templateUrl: './post-publish-dialog.html',
  styleUrl: './post-publish-dialog.css',
})
export class PostPublishDialog implements OnInit, OnDestroy, OnChanges {
  @Input({ required: true }) postId!: string;
  @Input({ required: true }) workspaceId!: string;
  @Input() defaultCaption = '';
  @Input() defaultHashtags: string[] = [];
  @Input() defaultMediaUrls: string[] = [];
  @Output() close = new EventEmitter<void>();
  @Output() published = new EventEmitter<void>();
  @Output() proceed = new EventEmitter<string[]>();

  private platformGql = inject(PlatformGqlService);
  private toast = inject(ToastService);
  private mediaService = inject(MediaService);

  step = signal<1 | 2>(1);
  entries = signal<AccountEntry[]>([]);
  loadingAccounts = signal(true);
  publishing = signal(false);

  scheduleMode = signal<'now' | 'schedule'>('now');
  scheduledDate = signal('');
  scheduledTime = signal('');
  timezone = signal(Intl.DateTimeFormat().resolvedOptions().timeZone);
  private mediaIdCounter = 0;

  ngOnDestroy(): void {
    this.revokeBlobUrls();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['defaultMediaUrls'] && this.entries().length > 0) {
      this.syncDefaultMediaToEntries();
    }
  }

  ngOnInit(): void {
    const defaultMedia = this.buildDefaultMediaItems();
    this.platformGql.getPlatformAccounts(this.workspaceId).subscribe({
      next: (accounts) => {
        const active = accounts.filter(a => a.status === 'active');
        this.entries.set(active.map(a => ({
          account: a,
          selected: false,
          caption: this.defaultCaption,
          hashtags: this.defaultHashtags.join(', '),
          media: defaultMedia.map((item) => ({ ...item })),
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
    const selectedAccountIds = this.entries()
      .filter((entry) => entry.selected)
      .map((entry) => entry.account.id);
    this.proceed.emit(selectedAccountIds);
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
    return this.entries().filter(e => e.selected).every(e =>
      e.caption.trim().length > 0 && e.media.every((item) => !item.uploading),
    );
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
        media: e.media
          .filter((item) => !item.uploading && !item.error)
          .map((item) => ({
            type: item.type,
            url: item.url,
            altText: item.altText,
            thumbnailUrl: item.thumbnailUrl,
          })),
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

  onEntryMediaSelected(entryIndex: number, event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = input.files ? Array.from(input.files) : [];
    if (!files.length) return;

    for (const file of files) {
      this.addUploadingMedia(entryIndex, file);
    }
    input.value = '';
  }

  removeEntryMedia(entryIndex: number, mediaId: string): void {
    const mediaItem = this.entries()[entryIndex]?.media.find((item) => item.id === mediaId);
    if (!mediaItem || mediaItem.uploading) return;

    if (mediaItem.url.startsWith('blob:')) {
      URL.revokeObjectURL(mediaItem.url);
    }

    this.entries.update((entries) =>
      entries.map((entry, index) =>
        index === entryIndex
          ? { ...entry, media: entry.media.filter((item) => item.id !== mediaId) }
          : entry,
      ),
    );
  }

  getPreviewMediaUrl(url: string): string {
    if (!url) return '';
    if (url.startsWith('blob:') || url.startsWith('http')) return url;
    return this.mediaService.getMediaUrl(url);
  }

  trackMediaItem(_: number, item: EntryMediaItem): string {
    return item.id;
  }

  onMediaDragStart(entryIndex: number, mediaId: string, event: DragEvent): void {
    if (!event.dataTransfer) return;
    event.dataTransfer.setData('text/plain', `${entryIndex}:${mediaId}`);
    event.dataTransfer.effectAllowed = 'move';
  }

  onMediaDragOver(event: DragEvent): void {
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
  }

  onMediaDrop(targetEntryIndex: number, targetMediaId: string, event: DragEvent): void {
    event.preventDefault();
    const raw = event.dataTransfer?.getData('text/plain') ?? '';
    if (!raw.includes(':')) return;

    const [sourceEntryIndexRaw, sourceMediaId] = raw.split(':');
    const sourceEntryIndex = Number(sourceEntryIndexRaw);
    if (!Number.isFinite(sourceEntryIndex)) return;
    if (sourceEntryIndex !== targetEntryIndex) return;
    if (sourceMediaId === targetMediaId) return;

    this.reorderEntryMedia(targetEntryIndex, sourceMediaId, targetMediaId);
  }

  private buildDefaultMediaItems(): EntryMediaItem[] {
    return (this.defaultMediaUrls ?? [])
      .filter((url) => typeof url === 'string' && url.trim().length > 0)
      .map((url) => ({
      id: this.nextMediaId(),
      type: this.inferMediaType(url),
      url,
      source: 'post',
      uploading: false,
      progress: 100,
      }));
  }

  private addUploadingMedia(entryIndex: number, file: File): void {
    const tempId = this.nextMediaId();
    const previewUrl = URL.createObjectURL(file);
    const uploadingItem: EntryMediaItem = {
      id: tempId,
      type: file.type.startsWith('video/') ? 'video' : 'image',
      url: previewUrl,
      source: 'added',
      uploading: true,
      progress: 0,
    };

    this.entries.update((entries) =>
      entries.map((entry, index) =>
        index === entryIndex ? { ...entry, media: [...entry.media, uploadingItem] } : entry,
      ),
    );

    this.mediaService.uploadFile(file, this.workspaceId).subscribe({
      next: (evt) => {
        this.entries.update((entries) =>
          entries.map((entry, index) => {
            if (index !== entryIndex) return entry;
            return {
              ...entry,
              media: entry.media.map((item) => {
                if (item.id !== tempId) return item;
                if (evt.type === 'progress') {
                  return { ...item, progress: evt.progress };
                }
                URL.revokeObjectURL(previewUrl);
                return {
                  ...item,
                  uploading: false,
                  progress: 100,
                  type: evt.media.type,
                  url: evt.media.url,
                  thumbnailUrl: evt.media.thumbnailUrl,
                  error: undefined,
                };
              }),
            };
          }),
        );
      },
      error: (err) => {
        this.entries.update((entries) =>
          entries.map((entry, index) => {
            if (index !== entryIndex) return entry;
            return {
              ...entry,
              media: entry.media.map((item) =>
                item.id === tempId
                  ? {
                    ...item,
                    uploading: false,
                    error: err?.error?.error || 'Upload failed',
                  }
                  : item,
              ),
            };
          }),
        );
      },
    });
  }

  private inferMediaType(url: string): PlatformMediaType {
    return /\.(mp4|webm|mov|m4v|avi)$/i.test(url) ? 'video' : 'image';
  }

  private nextMediaId(): string {
    this.mediaIdCounter += 1;
    return `media-${this.mediaIdCounter}`;
  }

  private syncDefaultMediaToEntries(): void {
    const defaultMedia = this.buildDefaultMediaItems();
    this.entries.update((entries) =>
      entries.map((entry) => {
        const addedMedia = entry.media.filter((item) => item.source === 'added');
        return {
          ...entry,
          media: [...defaultMedia.map((item) => ({ ...item })), ...addedMedia],
        };
      }),
    );
  }

  private reorderEntryMedia(entryIndex: number, sourceMediaId: string, targetMediaId: string): void {
    this.entries.update((entries) =>
      entries.map((entry, index) => {
        if (index !== entryIndex) return entry;

        const media = [...entry.media];
        const fromIndex = media.findIndex((item) => item.id === sourceMediaId);
        const toIndex = media.findIndex((item) => item.id === targetMediaId);
        if (fromIndex === -1 || toIndex === -1) return entry;

        const [moved] = media.splice(fromIndex, 1);
        media.splice(toIndex, 0, moved);
        return { ...entry, media };
      }),
    );
  }

  private revokeBlobUrls(): void {
    for (const entry of this.entries()) {
      for (const item of entry.media) {
        if (item.url.startsWith('blob:')) URL.revokeObjectURL(item.url);
      }
    }
  }
}
