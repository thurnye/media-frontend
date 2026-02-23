import { Component, Input, computed, inject } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { SOCIAL_SVGS, SocialPlatform } from '../social-icons';

type AppPlatform = 'facebook' | 'instagram' | 'twitter' | 'linkedin' | 'tiktok' | 'youtube' | string;

@Component({
  selector: 'app-social-icon',
  standalone: true,
  templateUrl: './social-icon.html',
  styleUrl: './social-icon.css',
  host: {
    '[style.width.px]': 'size',
    '[style.height.px]': 'size',
  },
})
export class SocialIcon {
  private sanitizer = inject(DomSanitizer);

  @Input() platform: AppPlatform = '';
  @Input() size = 16;

  readonly icon = computed<SafeHtml>(() => {
    const mapped = this.mapPlatform(this.platform);
    if (!mapped) return this.sanitizer.bypassSecurityTrustHtml('');

    const raw = SOCIAL_SVGS[mapped];
    if (!raw) return this.sanitizer.bypassSecurityTrustHtml('');

    const unique = `${mapped}-${Math.random().toString(36).slice(2, 8)}`;
    const normalized = raw
      .replace(/\swidth="48"/g, '')
      .replace(/\sheight="48"/g, '')
      .replace(/id="ig"/g, `id="ig-${unique}"`)
      .replace(/url\(#ig\)/g, `url(#ig-${unique})`);

    return this.sanitizer.bypassSecurityTrustHtml(normalized);
  });

  private mapPlatform(platform: AppPlatform): SocialPlatform | null {
    const value = (platform ?? '').toLowerCase();
    if (value === 'twitter' || value === 'x') return 'x';
    if (value === 'facebook') return 'facebook';
    if (value === 'instagram') return 'instagram';
    if (value === 'linkedin') return 'linkedin';
    if (value === 'tiktok') return 'tiktok';
    if (value === 'youtube') return 'youtube';
    if (value === 'threads') return 'threads';
    if (value === 'pinterest') return 'pinterest';
    return null;
  }
}

