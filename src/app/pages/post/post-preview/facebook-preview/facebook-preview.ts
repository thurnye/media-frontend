import { Component, Input } from '@angular/core';

export type FacebookPostType = 'feed-image' | 'feed-video' | 'reel' | 'text';

@Component({
  selector: 'app-facebook-preview',
  imports: [],
  templateUrl: './facebook-preview.html',
  styleUrl: './facebook-preview.css',
})
export class FacebookPreview {
  @Input() profileName: string = 'Brand Name';
  @Input() profileImage: string = 'https://via.placeholder.com/45';
  @Input() caption: string = '';
  @Input() mediaUrl?: string;
  @Input() type: FacebookPostType = 'feed-image';
}
