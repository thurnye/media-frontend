import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { FacebookPostType, PreviewMediaItem } from '../facebook-preview/facebook-preview';

@Component({
  selector: 'app-instagram-preview',
  standalone: true,
  imports: [CommonModule],
  inputs: ['profileName', 'title', 'caption', 'mediaUrl', 'type', 'useVideo', 'mediaItems'],
  templateUrl: './instagram-preview.html',
  styleUrl: './instagram-preview.css',
})
export class InstagramPreview implements OnChanges {
  @Input() profileName = 'Brand Name';
  @Input() title = '';
  @Input() caption = '';
  @Input() mediaUrl?: string;
  @Input() type: FacebookPostType = 'feed-image';
  @Input() useVideo = false;
  @Input() mediaItems: PreviewMediaItem[] = [];
  activeSlide = 0;

  get isVideo(): boolean {
    return this.type === 'feed-video' || (this.type === 'reel' && this.useVideo);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['mediaItems']) {
      const maxIndex = Math.max(this.mediaItems.length - 1, 0);
      if (this.activeSlide > maxIndex) this.activeSlide = 0;
    }
  }

  nextSlide(): void {
    if (this.activeSlide >= this.mediaItems.length - 1) return;
    this.activeSlide += 1;
  }

  prevSlide(): void {
    if (this.activeSlide <= 0) return;
    this.activeSlide -= 1;
  }

  goToSlide(index: number): void {
    this.activeSlide = index;
  }
}
