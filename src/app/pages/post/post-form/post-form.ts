import { Component, effect, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { PostActions } from '../../../store/post/post.actions';
import { selectPostError, selectPostLoading, selectSelectedPost } from '../../../store/post/post.selectors';
import { selectUser } from '../../../store/auth/auth.selectors';
import { PostCategory, PriorityLevel } from '../../../core/interfaces/post';

@Component({
  selector: 'app-post-form',
  imports: [FormsModule],
  templateUrl: './post-form.html',
  styleUrl: './post-form.css',
})
export class PostForm implements OnInit, OnDestroy {
  private store  = inject(Store);
  private route  = inject(ActivatedRoute);
  private router = inject(Router);

  postId      = signal<string | null>(null);
  workspaceId = signal('');
  isEdit      = signal(false);

  title       = '';
  description = '';
  category    = '';
  tags        = '';
  priority    = '';
  isEvergreen = false;

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
  }

  onSubmit(): void {
    if (!this.title.trim()) return;

    const parsedTags = this.tags
      ? this.tags.split(',').map(t => t.trim()).filter(Boolean)
      : undefined;

    if (this.isEdit()) {
      this.store.dispatch(PostActions.updatePost({
        input: {
          id:          this.postId()!,
          title:       this.title,
          description: this.description || undefined,
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
          category:    this.category || undefined,
          tags:        parsedTags,
          priority:    this.priority || undefined,
          isEvergreen: this.isEvergreen,
        },
        tempPost,
        tempId,
      }));
    }
  }

  onCancel(): void {
    this.router.navigate(['/dashboard/workspace', this.workspaceId(), 'posts']);
  }
}
