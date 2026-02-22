import { Store } from '@ngrx/store';
import { CommonModule } from '@angular/common';
import { Component, inject, Input } from '@angular/core';
import { selectUser } from '../../../../store/auth/auth.selectors';

export type FacebookPostType = 'feed-image' | 'feed-video' | 'reel' | 'text';
export interface PreviewMediaItem {
  url: string;
  isVideo: boolean;
}

@Component({
  selector: 'app-facebook-preview',
  standalone: true,
  imports: [CommonModule],
  inputs: ['profileName', 'profileImage', 'title', 'caption', 'mediaUrl', 'type', 'useVideo', 'mediaItems'],
  templateUrl: './facebook-preview.html',
  styleUrl: './facebook-preview.css',
})
export class FacebookPreview {
  private store  = inject(Store);

  currentUser  = this.store.selectSignal(selectUser);


  @Input() profileName: string = 'Brand Name';
  @Input() profileImage: string = 'https://via.placeholder.com/45';
  @Input() title: string = '';
  @Input() caption: string = '';
  @Input() mediaUrl?: string;
  @Input() type: FacebookPostType = 'reel';
  @Input() useVideo = false;
  @Input() mediaItems: PreviewMediaItem[] = [];

  get gridMediaItems(): PreviewMediaItem[] {
    return this.mediaItems.slice(0, 4);
  }

  get remainingMediaCount(): number {
    return Math.max(this.mediaItems.length - 4, 0);
  }
}
