/**
 * Extract YouTube video ID from various YouTube URL formats
 * Supports:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID
 */
export function extractYouTubeId(url: string): string | null {
  try {
    const urlObj = new URL(url);
    
    // Format: youtube.com/watch?v=VIDEO_ID
    if (urlObj.hostname.includes('youtube.com')) {
      const videoId = urlObj.searchParams.get('v');
      if (videoId) return videoId;
    }
    
    // Format: youtu.be/VIDEO_ID
    if (urlObj.hostname === 'youtu.be') {
      const videoId = urlObj.pathname.slice(1);
      if (videoId) return videoId;
    }
    
    // Format: youtube.com/embed/VIDEO_ID
    if (urlObj.pathname.includes('/embed/')) {
      const videoId = urlObj.pathname.split('/embed/')[1];
      if (videoId) return videoId;
    }
    
    return null;
  } catch {
    return null;
  }
}

/**
 * Extract Google Drive file ID from various Google Drive URL formats
 * Supports:
 * - https://drive.google.com/file/d/FILE_ID/view
 * - https://drive.google.com/open?id=FILE_ID
 * - https://drive.google.com/uc?id=FILE_ID
 */
export function extractGoogleDriveId(url: string): string | null {
  try {
    const urlObj = new URL(url);
    
    if (!urlObj.hostname.includes('drive.google.com')) {
      return null;
    }
    
    // Format: drive.google.com/file/d/FILE_ID/view
    if (urlObj.pathname.includes('/file/d/')) {
      const matches = urlObj.pathname.match(/\/file\/d\/([^\/]+)/);
      if (matches && matches[1]) return matches[1];
    }
    
    // Format: drive.google.com/open?id=FILE_ID or drive.google.com/uc?id=FILE_ID
    const fileId = urlObj.searchParams.get('id');
    if (fileId) return fileId;
    
    return null;
  } catch {
    return null;
  }
}

/**
 * Get Google Drive embed URL from file ID
 * Uses 'preview' endpoint which has minimal UI controls
 */
export function getGoogleDriveEmbedUrl(fileId: string): string {
  // Using 'preview' endpoint which shows minimal controls
  // Unfortunately, Google Drive doesn't allow completely hiding controls
  return `https://drive.google.com/file/d/${fileId}/preview`;
}

/**
 * Check if URL is a YouTube URL
 */
export function isYouTubeUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.includes('youtube.com') || urlObj.hostname === 'youtu.be';
  } catch {
    return false;
  }
}

/**
 * Check if URL is a Google Drive URL
 */
export function isGoogleDriveUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.includes('drive.google.com');
  } catch {
    return false;
  }
}
