export type VideoPlatform = 'youtube' | 'tiktok' | 'instagram' | 'unknown';

export interface VideoInfo {
  platform: VideoPlatform;
  videoId: string;
  embedUrl: string;
  originalUrl: string;
}

/**
 * Extract video ID and platform from URL
 */
export function parseVideoUrl(url: string): VideoInfo | null {
  if (!url || typeof url !== 'string') {
    return null;
  }

  // YouTube patterns
  const youtubePatterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/.*[?&]v=([^&\n?#]+)/,
  ];

  for (const pattern of youtubePatterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      const videoId = match[1];
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      return {
        platform: 'youtube',
        videoId: videoId,
        embedUrl: `https://www.youtube.com/embed/${videoId}?enablejsapi=1&origin=${origin}&loop=1&playlist=${videoId}&rel=0`,
        originalUrl: url,
      };
    }
  }

  // TikTok patterns
  const tiktokPattern = /tiktok\.com\/.*\/video\/(\d+)/;
  const tiktokMatch = url.match(tiktokPattern);
  if (tiktokMatch && tiktokMatch[1]) {
    return {
      platform: 'tiktok',
      videoId: tiktokMatch[1],
      embedUrl: `https://www.tiktok.com/embed/v2/${tiktokMatch[1]}`,
      originalUrl: url,
    };
  }

  // Instagram Reel patterns
  const instagramPattern = /instagram\.com\/reel\/([^/?]+)/;
  const instagramMatch = url.match(instagramPattern);
  if (instagramMatch && instagramMatch[1]) {
    return {
      platform: 'instagram',
      videoId: instagramMatch[1],
      embedUrl: `https://www.instagram.com/reel/${instagramMatch[1]}/embed/`,
      originalUrl: url,
    };
  }

  return null;
}

/**
 * Validate if URL is from supported platform
 */
export function isValidVideoUrl(url: string): boolean {
  return parseVideoUrl(url) !== null;
}

/**
 * Get platform name for display
 */
export function getPlatformName(platform: VideoPlatform): string {
  switch (platform) {
    case 'youtube':
      return 'YouTube';
    case 'tiktok':
      return 'TikTok';
    case 'instagram':
      return 'Instagram Reel';
    default:
      return 'Unknown';
  }
}

