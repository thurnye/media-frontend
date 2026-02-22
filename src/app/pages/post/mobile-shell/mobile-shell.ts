import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

export type PreviewMode = 'reel' | 'feed';

type Platform = 'facebook' | 'instagram' | 'tiktok';

interface PlatformPreviewConfig {
  aspectRatio: string;
  frameAspectRatio: string;
  safeTop: number;
  safeBottom: number;
  padding: number;
}

const PREVIEW_CONFIG: Record<
  Platform,
  Record<PreviewMode, PlatformPreviewConfig>
> = {
  facebook: {
    feed: {
      aspectRatio: '4/5',
      frameAspectRatio: '9/16',
      safeTop: 0.15,
      safeBottom: 0.22,
      padding: 0,
    },
    reel: {
      aspectRatio: '9/16',
      frameAspectRatio: '9/16',
      safeTop: 0.18,
      safeBottom: 0.25,
      padding: 0,
    },
  },

  instagram: {
    feed: {
      aspectRatio: '1/1',
      frameAspectRatio: '9/16',
      safeTop: 0.12,
      safeBottom: 0.2,
      padding: 12,
    },
    reel: {
      aspectRatio: '9/16',
      frameAspectRatio: '9/16',
      safeTop: 0.18,
      safeBottom: 0.25,
      padding: 0,
    },
  },

  tiktok: {
    feed: {
      aspectRatio: '9/16',
      frameAspectRatio: '9/16',
      safeTop: 0.2,
      safeBottom: 0.28,
      padding: 0,
    },
    reel: {
      aspectRatio: '9/16',
      frameAspectRatio: '9/16',
      safeTop: 0.2,
      safeBottom: 0.28,
      padding: 0,
    },
  },
};

@Component({
  selector: 'app-mobile-shell',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './mobile-shell.html',
  styleUrls: ['./mobile-shell.css'],
})
export class MobileShell {
  @Input() platform: Platform = 'facebook';
  @Input() mode: PreviewMode = 'feed';

  get config(): PlatformPreviewConfig {
    return (
      PREVIEW_CONFIG[this.platform]?.[this.mode] ?? {
        aspectRatio: '4/5',
        frameAspectRatio: '9/16',
        safeTop: 0.15,
        safeBottom: 0.2,
        padding: 12,
      }
    );
  }
}
