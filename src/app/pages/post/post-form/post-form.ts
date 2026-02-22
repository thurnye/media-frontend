import { Component, effect, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { PostActions } from '../../../store/post/post.actions';
import { selectPostError, selectPostLoading, selectSelectedPost } from '../../../store/post/post.selectors';
import { selectUser } from '../../../store/auth/auth.selectors';
import { PostCategory, PriorityLevel } from '../../../core/interfaces/post';
import { MobileShell, PreviewMode } from '../mobile-shell/mobile-shell';
import {
  FacebookPostType,
  FacebookPreview,
  PreviewMediaItem,
} from '../post-preview/facebook-preview/facebook-preview';
import { InstagramPreview } from '../post-preview/instagram-preview/instagram-preview';
import { TicktokPreview } from '../post-preview/ticktok-preview/ticktok-preview';
import { MediaService } from '../../../core/services/media.service';
import { IMediaUploadItem } from '../../../core/interfaces/media';

@Component({
  selector: 'app-post-form',
  standalone: true,
  imports: [FormsModule, MobileShell, FacebookPreview, InstagramPreview, TicktokPreview],
  templateUrl: './post-form.html',
  styleUrl: './post-form.css',
})
export class PostForm implements OnInit, OnDestroy {
  private store        = inject(Store);
  private route        = inject(ActivatedRoute);
  private router       = inject(Router);
  private mediaService = inject(MediaService);

  postId      = signal<string | null>(null);
  workspaceId = signal('');
  isEdit      = signal(false);

  title       = '';
  description = '';
  category    = '';
  tags        = '';
  priority    = '';
  isEvergreen = false;

  uploadedMedia = signal<IMediaUploadItem[]>([]);
  isDragging    = signal(false);
  isSubmitting  = signal(false);
  previewPlatform = signal<'facebook' | 'instagram' | 'tiktok'>('facebook');
  previewMode     = signal<PreviewMode>('feed');

  readonly acceptedTypes = 'image/jpeg,image/png,image/gif,image/webp,video/mp4,video/quicktime,video/webm';
  readonly previewPlatforms = [
    { value: 'facebook' as const, label: 'Facebook' },
    { value: 'instagram' as const, label: 'Instagram' },
    { value: 'tiktok' as const, label: 'TikTok' },
  ];

  loading      = this.store.selectSignal(selectPostLoading);
  error        = this.store.selectSignal(selectPostError);
  selectedPost = this.store.selectSignal(selectSelectedPost);
  currentUser  = this.store.selectSignal(selectUser);

  readonly categories: { value: PostCategory; label: string }[] = [
    { value: 'marketing',         label: 'Marketing' },
    { value: 'educational',       label: 'Educational' },
    { value: 'promotional',       label: 'Promotional' },
    { value: 'announcement',      label: 'Announcement' },
    { value: 'engagement',        label: 'Engagement' },
    { value: 'brand',             label: 'Brand' },
    { value: 'community',         label: 'Community' },
    { value: 'event',             label: 'Event' },
    { value: 'product',           label: 'Product' },
    { value: 'user_generated',    label: 'User Generated' },
    { value: 'testimonial',       label: 'Testimonial' },
    { value: 'behind_the_scenes', label: 'Behind the Scenes' },
    { value: 'seasonal',          label: 'Seasonal' },
    { value: 'others',            label: 'Others' },
  ];

  readonly priorities: { value: PriorityLevel; label: string }[] = [
    { value: 'low',    label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high',   label: 'High' },
  ];

  constructor() {
    // Populate form fields when the post loads in edit mode
    effect(() => {
      const post = this.selectedPost();
      if (post && this.isEdit()) {
        this.title       = post.title;
        this.description = post.description ?? '';
        this.category    = post.category ?? '';
        this.tags        = post.tags?.join(', ') ?? '';
        this.priority    = post.priority ?? '';
        this.isEvergreen = post.isEvergreen ?? false;
      }
    });

    // Reel and TikTok previews only support a single media item.
    effect(() => {
      if (!this.isMultiMediaPost) return;
      if (this.previewMode() === 'reel') this.previewMode.set('feed');
      if (this.previewPlatform() === 'tiktok') this.previewPlatform.set('facebook');
    });
  }

  ngOnInit(): void {
    // workspaceId comes from a parent route segment
    const wsId = this.route.parent?.snapshot.paramMap.get('workspaceId')
              ?? this.route.snapshot.paramMap.get('workspaceId')
              ?? '';
    this.workspaceId.set(wsId);

    const id = this.route.snapshot.paramMap.get('postId');
    if (id) {
      this.postId.set(id);
      this.isEdit.set(true);
      this.store.dispatch(PostActions.loadPost({ id }));
    }
  }

  ngOnDestroy(): void {
    this.store.dispatch(PostActions.clearSelectedPost());
    this.uploadedMedia().forEach(item => {
      if (item.preview) URL.revokeObjectURL(item.preview);
    });
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);
    const files = event.dataTransfer?.files;
    if (files) this.handleFiles(Array.from(files));
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.handleFiles(Array.from(input.files));
      input.value = '';
    }
  }

  removeMedia(index: number): void {
    const item = this.uploadedMedia()[index];
    if (item.media?._id) {
      this.mediaService.deleteMedia(item.media._id).subscribe();
    }
    if (item.preview) URL.revokeObjectURL(item.preview);
    this.uploadedMedia.update(list => list.filter((_, i) => i !== index));
  }

  private handleFiles(files: File[]): void {
    for (const file of files) {
      const preview = file.type.startsWith('image/')
        ? URL.createObjectURL(file)
        : '';

      const item: IMediaUploadItem = {
        file,
        preview,
        progress: 0,
        status: 'pending',
      };

      this.uploadedMedia.update(list => [...list, item]);
    }
  }

  async onSubmit(): Promise<void> {
    if (!this.title.trim() || this.isSubmitting()) return;
    this.isSubmitting.set(true);

    const uploadsSucceeded = await this.uploadPendingMedia();
    if (!uploadsSucceeded) {
      this.isSubmitting.set(false);
      return;
    }

    const parsedTags = this.tags
      ? this.tags.split(',').map(t => t.trim()).filter(Boolean)
      : undefined;

    const mediaIds = this.uploadedMedia()
      .filter(item => item.status === 'done' && item.media?._id)
      .map(item => item.media!._id);

    if (this.isEdit()) {
      this.store.dispatch(PostActions.updatePost({
        input: {
          id:          this.postId()!,
          title:       this.title,
          description: this.description || undefined,
          mediaIds:    mediaIds.length ? mediaIds : undefined,
          category:    this.category || undefined,
          tags:        parsedTags,
          priority:    this.priority || undefined,
          isEvergreen: this.isEvergreen,
        },
      }));
    } else {
      const tempId   = `temp-${Date.now()}`;
      const tempPost = {
        id:          tempId,
        workspaceId: this.workspaceId(),
        createdBy:   this.currentUser()?.id ?? '',
        title:       this.title,
        description: this.description || undefined,
        mediaIds:    mediaIds.length ? mediaIds : undefined,
        category:    (this.category || undefined) as PostCategory | undefined,
        tags:        parsedTags,
        priority:    (this.priority || undefined) as PriorityLevel | undefined,
        isEvergreen: this.isEvergreen,
        status:      'draft' as const,
      };
      this.store.dispatch(PostActions.createPost({
        input: {
          workspaceId: this.workspaceId(),
          title:       this.title,
          description: this.description || undefined,
          mediaIds:    mediaIds.length ? mediaIds : undefined,
          category:    this.category || undefined,
          tags:        parsedTags,
          priority:    this.priority || undefined,
          isEvergreen: this.isEvergreen,
        },
        tempPost,
        tempId,
      }));
    }

    this.isSubmitting.set(false);
  }

  onCancel(): void {
    this.router.navigate(['/dashboard/workspace', this.workspaceId(), 'posts']);
  }

  setPreviewPlatform(platform: 'facebook' | 'instagram' | 'tiktok'): void {
    if (this.isPlatformDisabled(platform)) return;
    this.previewPlatform.set(platform);
  }

  setPreviewMode(mode: PreviewMode): void {
    if (this.isModeDisabled(mode)) return;
    this.previewMode.set(mode);
  }

  get previewMediaUrl(): string | undefined {
    return this.previewMediaItems[0]?.url;
  }

  get previewPostType(): FacebookPostType {
    if (this.previewMode() === 'reel') return 'reel';
    if (!this.previewMediaUrl) return 'text';
    return this.previewHasVideo ? 'feed-video' : 'feed-image';
  }

  get previewHasVideo(): boolean {
    return this.previewMediaItems[0]?.isVideo ?? false;
  }

  get previewMediaItems(): PreviewMediaItem[] {
    return this.uploadedMedia()
      .filter(item => item.status !== 'error')
      .map(item => {
        const url = item.media?.url
          ? this.mediaService.getMediaUrl(item.media)
          : item.preview;
        const isVideo = item.media?.type
          ? item.media.type === 'video'
          : item.media?.mimeType
            ? item.media.mimeType.startsWith('video/')
            : item.file.type.startsWith('video/');
        return { url, isVideo };
      })
      .filter(item => Boolean(item.url));
  }

  get isMultiMediaPost(): boolean {
    return this.uploadedMedia().filter(item => item.status !== 'error').length > 1;
  }

  isPlatformDisabled(platform: 'facebook' | 'instagram' | 'tiktok'): boolean {
    return platform === 'tiktok' && this.isMultiMediaPost;
  }

  isModeDisabled(mode: PreviewMode): boolean {
    return mode === 'reel' && this.isMultiMediaPost;
  }

  private async uploadPendingMedia(): Promise<boolean> {
    const pendingIndices = this.uploadedMedia()
      .map((item, index) => ({ item, index }))
      .filter(({ item }) => item.status !== 'done')
      .map(({ index }) => index);

    for (const index of pendingIndices) {
      const latestItem = this.uploadedMedia()[index];
      if (!latestItem || latestItem.status === 'done') continue;

      const uploaded = await this.uploadFileAtIndex(index);
      if (!uploaded) return false;
    }

    return true;
  }

  private uploadFileAtIndex(index: number): Promise<boolean> {
    const item = this.uploadedMedia()[index];
    if (!item || item.status === 'done') return Promise.resolve(true);

    this.uploadedMedia.update(list => {
      const updated = [...list];
      if (!updated[index]) return updated;
      updated[index] = {
        ...updated[index],
        status: 'uploading',
        progress: 0,
        error: undefined,
      };
      return updated;
    });

    return new Promise((resolve) => {
      this.mediaService.uploadFile(item.file, this.workspaceId()).subscribe({
        next: (event) => {
          this.uploadedMedia.update(list => {
            const updated = [...list];
            if (!updated[index]) return updated;

            if (event.type === 'progress') {
              updated[index] = { ...updated[index], progress: event.progress };
            } else if (event.type === 'complete') {
              updated[index] = {
                ...updated[index],
                progress: 100,
                status: 'done',
                media: event.media,
              };
            }
            return updated;
          });

          if (event.type === 'complete') resolve(true);
        },
        error: (err) => {
          this.uploadedMedia.update(list => {
            const updated = [...list];
            if (!updated[index]) return updated;
            updated[index] = {
              ...updated[index],
              status: 'error',
              error: err?.error?.error || 'Upload failed',
            };
            return updated;
          });
          resolve(false);
        },
      });
    });
  }
}
