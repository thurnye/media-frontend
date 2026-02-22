import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FacebookPostType } from '../facebook-preview/facebook-preview';

@Component({
  selector: 'app-ticktok-preview',
  standalone: true,
  imports: [CommonModule],
  inputs: ['profileName', 'title', 'caption', 'mediaUrl', 'type', 'useVideo'],
  templateUrl: './ticktok-preview.html',
  styleUrl: './ticktok-preview.css',
})
export class TicktokPreview {
  @Input() profileName = 'Brand Name';
  @Input() title = '';
  @Input() caption = '';
  @Input() mediaUrl?: string;
  @Input() type: FacebookPostType = 'reel';
  @Input() useVideo = false;

  get isVideo(): boolean {
    return this.type === 'feed-video' || (this.type === 'reel' && this.useVideo);
  }

  get handleName(): string {
    return `@${this.profileName.toLowerCase().replace(/\s+/g, '_')}`;
  }
}
