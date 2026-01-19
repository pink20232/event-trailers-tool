import { NextRequest, NextResponse } from 'next/server';

/**
 * API route to get a list of thumbnail URLs for a YouTube video
 * Returns thumbnail data that can be used to create a filmstrip
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const videoId = searchParams.get('videoId');
  const duration = parseFloat(searchParams.get('duration') || '0');
  const count = parseInt(searchParams.get('count') || '20');

  if (!videoId) {
    return NextResponse.json(
      { error: 'videoId is required' },
      { status: 400 }
    );
  }

  try {
    // Calculate timestamps for thumbnails
    const interval = Math.max(1, duration / count);
    const thumbnails: Array<{ timestamp: number; url: string }> = [];

    // For each timestamp, generate a thumbnail URL
    // YouTube doesn't provide thumbnails at arbitrary timestamps via standard URLs,
    // but we can use the storyboard sprite sheet approach
    const spriteUrl = `/api/youtube-thumbnails?videoId=${videoId}&type=sprite`;
    
    // Calculate sprite positions
    const thumbnailWidth = 160;
    const thumbnailHeight = 90;
    const columnsPerRow = 3;

    for (let i = 0; i < count; i++) {
      const timestamp = Math.min(i * interval, duration);
      const thumbnailIndex = i;
      const row = Math.floor(thumbnailIndex / columnsPerRow);
      const col = thumbnailIndex % columnsPerRow;
      
      thumbnails.push({
        timestamp,
        url: `${spriteUrl}#pos=${col * thumbnailWidth},${row * thumbnailHeight}`,
      });
    }

    // Also get a default thumbnail as fallback
    const defaultThumbnail = `/api/youtube-thumbnails?videoId=${videoId}`;

    return NextResponse.json({
      spriteUrl,
      defaultThumbnail,
      thumbnails,
      thumbnailWidth,
      thumbnailHeight,
      columnsPerRow,
    });
  } catch (error) {
    console.error('Error generating thumbnail list:', error);
    return NextResponse.json(
      { error: 'Failed to generate thumbnail list' },
      { status: 500 }
    );
  }
}

