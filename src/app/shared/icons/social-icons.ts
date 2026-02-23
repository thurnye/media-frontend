// src/app/shared/icons/social-icons.ts

export type SocialPlatform =
  | 'facebook'
  | 'x'
  | 'twitter'
  | 'instagram'
  | 'linkedin'
  | 'pinterest'
  | 'youtube'
  | 'tiktok'
  | 'threads';

export const SOCIAL_SVGS: Record<SocialPlatform, string> = {
  facebook: `
<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48" role="img" aria-label="Facebook">
  <circle cx="24" cy="24" r="24" fill="#1877F2"/>
  <path fill="#FFFFFF" d="M29.5 24H26v13h-5.5V24H18v-5h2.5v-3.1C20.5 11 22.7 9 27 9h3.8v5H28.6c-1.3 0-2.6.3-2.6 2.1V19h4.9l-.7 5z"/>
</svg>`,

  x: `
<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48" role="img" aria-label="X">
  <circle cx="24" cy="24" r="24" fill="#000000"/>
  <path fill="#FFFFFF" d="M30.8 14H34l-7.1 8.1L35 34h-6.6l-5.2-6.7L17.4 34H14l7.6-8.6L13 14h6.8l4.7 6.1L30.8 14z"/>
</svg>`,
  twitter: `
<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48" role="img" aria-label="X">
  <circle cx="24" cy="24" r="24" fill="#000000"/>
  <path fill="#FFFFFF" d="M30.8 14H34l-7.1 8.1L35 34h-6.6l-5.2-6.7L17.4 34H14l7.6-8.6L13 14h6.8l4.7 6.1L30.8 14z"/>
</svg>`,

  instagram: `
<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48" role="img" aria-label="Instagram">
  <defs>
    <linearGradient id="ig" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#F58529"/>
      <stop offset="50%" stop-color="#DD2A7B"/>
      <stop offset="100%" stop-color="#8134AF"/>
    </linearGradient>
  </defs>
  <circle cx="24" cy="24" r="24" fill="url(#ig)"/>
  <rect x="14" y="14" width="20" height="20" rx="6" ry="6" fill="none" stroke="#fff" stroke-width="2"/>
  <circle cx="24" cy="24" r="5" fill="none" stroke="#fff" stroke-width="2"/>
  <circle cx="30" cy="18" r="1.5" fill="#fff"/>
</svg>`,

  linkedin: `
<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48" role="img" aria-label="LinkedIn">
  <circle cx="24" cy="24" r="24" fill="#0A66C2"/>
  <rect x="14" y="20" width="4" height="14" fill="#fff"/>
  <circle cx="16" cy="16" r="2" fill="#fff"/>
  <path fill="#fff" d="M22 20h4v2c.6-1 2-2.2 4.3-2.2 4.6 0 5.7 3 5.7 7V34h-4v-6.3c0-1.8 0-4-2.4-4s-2.8 1.9-2.8 3.9V34h-4V20z"/>
</svg>`,

  pinterest: `
<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48" role="img" aria-label="Pinterest">
  <circle cx="24" cy="24" r="24" fill="#E60023"/>
  <path fill="#FFFFFF" d="M24 12c-6.1 0-10 4-10 8.8 0 2.1 1.2 4.8 3.2 5.6.3.1.5 0 .6-.3l.3-1.2c.1-.3.1-.4-.2-.7-.7-.8-1.2-1.9-1.2-3.4 0-4.4 3.3-8.3 8.6-8.3 4.7 0 7.3 2.9 7.3 6.7 0 5-2.2 9.2-5.5 9.2-1.8 0-3.1-1.5-2.7-3.3.5-2.2 1.4-4.6 1.4-6.2 0-1.4-.7-2.6-2.3-2.6-1.8 0-3.3 1.9-3.3 4.5 0 1.6.5 2.7.5 2.7L19 35h3l1.2-4.3c.3.6 1.8 1.2 3.3 1.2 4.3 0 7.2-3.9 7.2-9.2C33.7 16.5 29.8 12 24 12z"/>
</svg>`,

  youtube: `
<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48" role="img" aria-label="YouTube">
  <circle cx="24" cy="24" r="24" fill="#FF0000"/>
  <polygon points="20,16 34,24 20,32" fill="#FFFFFF"/>
</svg>`,

  tiktok: `
<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48" role="img" aria-label="TikTok">
  <!-- Background -->
  <circle cx="24" cy="24" r="24" fill="#000000"/>

  <!-- TikTok note -->
  <path
    d="M28.5 13c1.1 3.2 3.6 5.7 6.8 6.8v4.1c-2.5 0-4.9-.8-6.8-2.2v7.3c0 4.3-3.5 7.8-7.8 7.8s-7.8-3.5-7.8-7.8 3.5-7.8 7.8-7.8c.5 0 1 .1 1.5.2v4.3c-.5-.2-1-.3-1.5-.3-1.9 0-3.5 1.6-3.5 3.5s1.6 3.5 3.5 3.5 3.5-1.6 3.5-3.5V13h4.3z"
    fill="#FFFFFF"
  />

  <!-- Cyan shadow -->
  <path
    d="M27.5 14c1.1 3.2 3.6 5.7 6.8 6.8v2c-2.6-.2-4.9-1.3-6.8-3v7.2c0 4.3-3.5 7.8-7.8 7.8-1.6 0-3-.5-4.2-1.3 1.4 1.9 3.7 3.1 6.2 3.1 4.3 0 7.8-3.5 7.8-7.8V21.5c1.9 1.4 4.2 2.2 6.8 2.2v-4.1c-3.2-1.1-5.7-3.6-6.8-6.8h-3z"
    fill="#25F4EE"
    opacity="0.8"
  />

  <!-- Pink shadow -->
  <path
    d="M20.5 23.5c.5 0 1 .1 1.5.3v2.2c-.5-.2-1-.3-1.5-.3-1.9 0-3.5 1.6-3.5 3.5 0 .8.3 1.5.7 2.1-.9-.7-1.5-1.8-1.5-3 0-1.9 1.6-3.5 3.5-3.5z"
    fill="#FE2C55"
    opacity="0.8"
  />
</svg>
`,

  threads: `
<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48" role="img" aria-label="Threads">
  <circle cx="24" cy="24" r="24" fill="#000"/>
  <path fill="#fff" d="M24 14c-5.3 0-9 3.2-9 8 0 3.8 2.5 6.5 6.3 7.1l.6-2.2c-2.4-.4-3.9-1.8-3.9-4.2 0-3.1 2.4-5.2 5.9-5.2 3.2 0 5.4 1.6 5.7 4.2-1.1-.4-2.4-.6-3.8-.6-3.4 0-5.7 1.7-5.7 4.4 0 2.6 2 4.3 5 4.3 2.1 0 3.8-.8 4.9-2.2-.2 3.1-2.6 5-6.2 5-2.6 0-4.6-1.1-5.7-3l-2.5 1.5C17.4 34 20.4 36 24 36c5.9 0 9.6-3.6 9.6-9.2 0-7.4-4.1-12.8-9.6-12.8zm-.1 13.3c-1.4 0-2.3-.7-2.3-1.8s1-1.9 2.7-1.9c1.2 0 2.2.2 3.1.6-.4 1.9-1.7 3.1-3.5 3.1z"/>
</svg>`,
};
