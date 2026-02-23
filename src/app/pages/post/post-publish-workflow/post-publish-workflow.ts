import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { IPost } from '../../../core/interfaces/post';
import { ICreatePlatformPost, IPlatformAccount, IPlatformPost } from '../../../core/interfaces/platform';
import { MediaService } from '../../../core/services/media.service';
import { PlatformGqlService } from '../../../core/services/platform.gql.service';
import { PostGqlService } from '../../../core/services/post.gql.service';
import { ToastService } from '../../../core/services/toast.service';
import { forkJoin } from 'rxjs';

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
  existingPlatformPostId?: string;
  account: IPlatformAccount;
  caption: string;
  hashtags: string;
  media: EntryMediaItem[];
  publishMode: 'now' | 'schedule';
  scheduledDate: string;
  scheduledTime: string;
}

@Component({
  selector: 'app-post-publish-workflow',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './post-publish-workflow.html',
  styleUrl: './post-publish-workflow.css',
})
export class PostPublishWorkflow implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private postGql = inject(PostGqlService);
  private platformGql = inject(PlatformGqlService);
  private mediaService = inject(MediaService);
  private toast = inject(ToastService);

  workspaceId = signal('');
  postId = signal('');
  post = signal<IPost | null>(null);

  loading = signal(true);
  publishing = signal(false);
  submitMode = signal<'draft' | 'publish' | null>(null);
  editDraftMode = signal(false);
  activeTabIndex = signal(0);
  entries = signal<AccountEntry[]>([]);
  availableAccounts = signal<IPlatformAccount[]>([]);
  showAddAccountsModal = signal(false);
  pendingAddAccountIds = signal<string[]>([]);

  timezone = signal(Intl.DateTimeFormat().resolvedOptions().timeZone);

  private mediaIdCounter = 0;

  ngOnInit(): void {
    const workspaceId =
      this.route.parent?.snapshot.paramMap.get('workspaceId') ??
      this.route.snapshot.paramMap.get('workspaceId') ??
      '';
    const postId = this.route.snapshot.paramMap.get('postId') ?? '';
    const accountIdsRaw = this.route.snapshot.queryParamMap.get('accounts') ?? '';
    const editDraft = this.route.snapshot.queryParamMap.get('editDraft') === '1';
    const platformPostIdsRaw = this.route.snapshot.queryParamMap.get('platformPostIds') ?? '';
    const selectedAccountIds = accountIdsRaw
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean);
    const selectedPlatformPostIds = platformPostIdsRaw
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean);

    this.workspaceId.set(workspaceId);
    this.postId.set(postId);
    this.editDraftMode.set(editDraft);

    if (!workspaceId || !postId || !selectedAccountIds.length) {
      this.toast.show('No selected accounts found for publishing', 'error');
      this.router.navigate(['/dashboard/workspace', workspaceId, 'post', postId]);
      return;
    }

    this.postGql.getPost(postId).subscribe({
      next: (post) => {
        this.post.set(post);
        this.platformGql.getPlatformAccounts(workspaceId).subscribe({
          next: (accounts) => {
            const activeAccounts = accounts.filter((account) => account.status === 'active');
            const selectedAccounts = accounts.filter((account) =>
              editDraft
                ? selectedAccountIds.includes(account.id)
                : account.status === 'active' && selectedAccountIds.includes(account.id),
            );

            if (!selectedAccounts.length) {
              this.loading.set(false);
              this.toast.show('Selected accounts are no longer available', 'error');
              this.router.navigate(['/dashboard/workspace', workspaceId, 'post', postId]);
              return;
            }

            const finalizeEntries = (existingPlatformPosts: IPlatformPost[]) => {
              const targetedPosts = selectedPlatformPostIds.length
                ? existingPlatformPosts.filter((item) => selectedPlatformPostIds.includes(item.id))
                : existingPlatformPosts;

              this.entries.set(
                selectedAccounts.map((account) => {
                  const draftPost = this.pickExistingDraftPostForAccount(targetedPosts, account.id);
                  return {
                    existingPlatformPostId: draftPost?.id,
                    account,
                    caption: draftPost?.content?.caption ?? post.description ?? '',
                    hashtags: (draftPost?.content?.hashtags ?? post.tags ?? []).join(', '),
                    media: draftPost?.content?.media?.length
                      ? this.buildMediaItemsFromPlatformPost(draftPost)
                      : this.buildDefaultMediaItems(post.mediaUrls ?? []),
                    publishMode: draftPost?.publishing?.scheduledAt ? 'schedule' : 'now',
                    scheduledDate: draftPost?.publishing?.scheduledAt ? this.toDateInputValue(new Date(draftPost.publishing.scheduledAt)) : '',
                    scheduledTime: draftPost?.publishing?.scheduledAt ? this.toTimeInputValue(new Date(draftPost.publishing.scheduledAt)) : '',
                  };
                }),
              );
              this.availableAccounts.set(
                activeAccounts.filter(
                  (account) => !selectedAccounts.some((selected) => selected.id === account.id),
                ),
              );
              this.loading.set(false);
            };

            if (editDraft) {
              this.platformGql.getPlatformPosts(postId).subscribe({
                next: (platformPosts) => finalizeEntries(platformPosts),
                error: () => finalizeEntries([]),
              });
              return;
            }

            finalizeEntries([]);
          },
          error: () => {
            this.loading.set(false);
            this.toast.show('Failed to load connected accounts', 'error');
          },
        });
      },
      error: () => {
        this.loading.set(false);
        this.toast.show('Failed to load post details', 'error');
      },
    });
  }

  ngOnDestroy(): void {
    this.revokeBlobUrls();
  }

  get activeEntry(): AccountEntry | null {
    return this.entries()[this.activeTabIndex()] ?? null;
  }

  get canContinueToSchedule(): boolean {
    if (this.hasInvalidTikTokMediaCount) return false;
    return this.entries().every((entry) =>
      entry.caption.trim().length > 0 && entry.media.every((item) => !item.uploading),
    );
  }

  get canPublish(): boolean {
    if (this.hasInvalidTikTokMediaCount) return false;
    return (
      this.canContinueToSchedule &&
      this.entries().every(
        (entry) =>
          entry.publishMode === 'now' ||
          (entry.publishMode === 'schedule' && !!entry.scheduledDate && !!entry.scheduledTime),
      )
    );
  }

  get canSaveDraft(): boolean {
    return this.canContinueToSchedule;
  }

  get hasInvalidTikTokMediaCount(): boolean {
    return this.entries().some(
      (entry) => entry.account.platform === 'tiktok' && entry.media.length > 1,
    );
  }

  get invalidTikTokEntries(): AccountEntry[] {
    return this.entries().filter(
      (entry) => entry.account.platform === 'tiktok' && entry.media.length > 1,
    );
  }

  getDisplayMedia(entry: AccountEntry): EntryMediaItem[] {
    return entry.media;
  }

  selectTab(index: number): void {
    this.activeTabIndex.set(index);
  }

  addAccount(accountId: string): void {
    if (!accountId) return;
    const account = this.availableAccounts().find((item) => item.id === accountId);
    if (!account) return;

    const post = this.post();
    const nextEntry: AccountEntry = {
      existingPlatformPostId: undefined,
      account,
      caption: post?.description ?? '',
      hashtags: (post?.tags ?? []).join(', '),
      media: this.buildDefaultMediaItems(post?.mediaUrls ?? []),
      publishMode: 'now',
      scheduledDate: '',
      scheduledTime: '',
    };

    this.entries.update((entries) => [...entries, nextEntry]);
    this.availableAccounts.update((accounts) => accounts.filter((item) => item.id !== accountId));
    this.activeTabIndex.set(this.entries().length - 1);
  }

  openAddAccountsModal(): void {
    if (!this.availableAccounts().length) return;
    this.pendingAddAccountIds.set([]);
    this.showAddAccountsModal.set(true);
  }

  closeAddAccountsModal(): void {
    this.showAddAccountsModal.set(false);
    this.pendingAddAccountIds.set([]);
  }

  togglePendingAddAccount(accountId: string): void {
    this.pendingAddAccountIds.update((ids) =>
      ids.includes(accountId) ? ids.filter((id) => id !== accountId) : [...ids, accountId],
    );
  }

  isPendingAddAccount(accountId: string): boolean {
    return this.pendingAddAccountIds().includes(accountId);
  }

  confirmAddAccounts(): void {
    const ids = this.pendingAddAccountIds();
    if (!ids.length) return;
    for (const id of ids) {
      this.addAccount(id);
    }
    this.closeAddAccountsModal();
  }

  updateActiveCaption(value: string): void {
    const index = this.activeTabIndex();
    this.entries.update((entries) =>
      entries.map((entry, i) => (i === index ? { ...entry, caption: value } : entry)),
    );
  }

  updateActiveHashtags(value: string): void {
    const index = this.activeTabIndex();
    this.entries.update((entries) =>
      entries.map((entry, i) => (i === index ? { ...entry, hashtags: value } : entry)),
    );
  }

  updateActivePublishMode(mode: 'now' | 'schedule'): void {
    const index = this.activeTabIndex();
    this.entries.update((entries) =>
      entries.map((entry, i) =>
        i === index
          ? {
            ...entry,
            publishMode: mode,
            ...(mode === 'now' ? { scheduledDate: '', scheduledTime: '' } : {}),
          }
          : entry,
      ),
    );
  }

  updateActiveScheduledDate(value: string): void {
    const index = this.activeTabIndex();
    this.entries.update((entries) =>
      entries.map((entry, i) => (i === index ? { ...entry, scheduledDate: value } : entry)),
    );
  }

  updateActiveScheduledTime(value: string): void {
    const index = this.activeTabIndex();
    this.entries.update((entries) =>
      entries.map((entry, i) => (i === index ? { ...entry, scheduledTime: value } : entry)),
    );
  }

  onPublish(): void {
    this.submitPlatformPosts('publish');
  }

  onSaveDraft(): void {
    this.submitPlatformPosts('draft');
  }

  private submitPlatformPosts(mode: 'publish' | 'draft'): void {
    if (this.publishing()) return;
    if (mode === 'publish' && !this.canPublish) return;
    if (mode === 'draft' && !this.canSaveDraft) return;

    this.submitMode.set(mode);
    this.publishing.set(true);

    const requests = this.entries().map((entry) => {
      const hashtags = entry.hashtags
        ? entry.hashtags.split(',').map((tag) => tag.trim()).filter(Boolean)
        : [];

      const media = entry.media
        .filter((item) => !item.uploading && !item.error)
        .map((item) => ({
          type: item.type,
          url: item.url,
          altText: item.altText,
          thumbnailUrl: item.thumbnailUrl,
        }));

      const status =
        mode === 'draft'
          ? 'draft'
          : entry.publishMode === 'schedule'
            ? 'scheduled'
            : 'publishing';

      const scheduledAt =
        status === 'scheduled' && entry.scheduledDate && entry.scheduledTime
          ? new Date(`${entry.scheduledDate}T${entry.scheduledTime}`).toISOString()
          : undefined;

      if (this.editDraftMode() && entry.existingPlatformPostId) {
        return this.platformGql.updatePlatformPost({
          id: entry.existingPlatformPostId,
          caption: entry.caption.trim(),
          hashtags,
          media,
          status,
          scheduledAt,
        });
      }

      const input: ICreatePlatformPost = {
        postId: this.postId(),
        platform: entry.account.platform,
        accountId: entry.account.id,
        caption: entry.caption.trim(),
        hashtags,
        media,
        status,
      };

      if (scheduledAt) {
        input.scheduledAt = scheduledAt;
        input.timezone = this.timezone();
      }

      return this.platformGql.createPlatformPost(input);
    });

    forkJoin(requests).subscribe({
      next: () => {
        this.publishing.set(false);
        this.submitMode.set(null);
        const action = mode === 'draft' ? 'saved as draft' : 'created';
        this.toast.show(`Platform posts ${action} for ${this.entries().length} account(s)!`, 'success');
        this.router.navigate(['/dashboard/workspace', this.workspaceId(), 'post', this.postId()]);
      },
      error: (err) => {
        this.publishing.set(false);
        this.submitMode.set(null);
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

  getPreviewMediaUrl(url: string): string {
    if (!url) return '';
    if (url.startsWith('blob:') || url.startsWith('http')) return url;
    return this.mediaService.getMediaUrl(url);
  }

  trackMediaItem(_: number, item: EntryMediaItem): string {
    return item.id;
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

    this.mediaService.uploadFile(file, this.workspaceId()).subscribe({
      next: (evt) => {
        this.entries.update((entries) =>
          entries.map((entry, index) => {
            if (index !== entryIndex) return entry;
            return {
              ...entry,
              media: entry.media.map((item) => {
                if (item.id !== tempId) return item;
                if (evt.type === 'progress') return { ...item, progress: evt.progress };
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
                  ? { ...item, uploading: false, error: err?.error?.error || 'Upload failed' }
                  : item,
              ),
            };
          }),
        );
      },
    });
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

  private buildDefaultMediaItems(defaultMediaUrls: string[]): EntryMediaItem[] {
    return (defaultMediaUrls ?? [])
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

  private buildMediaItemsFromPlatformPost(platformPost: IPlatformPost): EntryMediaItem[] {
    return (platformPost.content?.media ?? []).map((item) => ({
      id: this.nextMediaId(),
      type: item.type,
      url: item.url,
      altText: item.altText,
      thumbnailUrl: item.thumbnailUrl,
      source: 'post',
      uploading: false,
      progress: 100,
    }));
  }

  private pickExistingDraftPostForAccount(platformPosts: IPlatformPost[], accountId: string): IPlatformPost | null {
    const drafts = platformPosts
      .filter(
        (item) =>
          item.accountId === accountId &&
          ((item.publishing?.status ?? 'draft') === 'draft' ||
            (item.publishing?.status ?? '') === 'scheduled'),
      )
      .sort((a, b) => {
        const aTime = +(new Date(a.updatedAt ?? a.createdAt ?? 0));
        const bTime = +(new Date(b.updatedAt ?? b.createdAt ?? 0));
        return bTime - aTime;
      });
    return drafts[0] ?? null;
  }

  private toDateInputValue(date: Date): string {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private toTimeInputValue(date: Date): string {
    const hours = `${date.getHours()}`.padStart(2, '0');
    const minutes = `${date.getMinutes()}`.padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  private inferMediaType(url: string): PlatformMediaType {
    return /\.(mp4|webm|mov|m4v|avi)$/i.test(url) ? 'video' : 'image';
  }

  private nextMediaId(): string {
    this.mediaIdCounter += 1;
    return `media-${this.mediaIdCounter}`;
  }

  private revokeBlobUrls(): void {
    for (const entry of this.entries()) {
      for (const item of entry.media) {
        if (item.url.startsWith('blob:')) URL.revokeObjectURL(item.url);
      }
    }
  }
}
