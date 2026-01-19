import { NextRequest, NextResponse } from 'next/server';

/**
 * API route to fetch YouTube thumbnails server-side
 * Uses multiple fallback strategies to ensure thumbnails load
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const videoId = searchParams.get('videoId');
  const type = searchParams.get('type'); // 'sprite' or 'single'

  if (!videoId) {
    return NextResponse.json(
      { error: 'videoId is required' },
      { status: 400 }
    );
  }

  try {
    // Strategy 1: Try to fetch storyboard sprite sheet directly
    if (type === 'sprite') {
      const storyboardLevels = ['L1', 'L2', 'L3'];
      
      for (const level of storyboardLevels) {
        const storyboardUrl = `https://i.ytimg.com/sb/${videoId}/storyboard3_${level}/default.jpg`;
        
        try {
          const response = await fetch(storyboardUrl, {
            headers: {
              'Referer': 'https://www.youtube.com/',
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            },
          });

          if (response.ok) {
            const imageBuffer = await response.arrayBuffer();
            return new NextResponse(imageBuffer, {
              headers: {
                'Content-Type': 'image/jpeg',
                'Cache-Control': 'public, max-age=86400',
                'Access-Control-Allow-Origin': '*',
              },
            });
          }
        } catch (err) {
          continue;
        }
      }
    }

    // Strategy 2: Use YouTube oEmbed API (no key required) to get default thumbnail
    try {
      const oEmbedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
      const oEmbedResponse = await fetch(oEmbedUrl);
      
      if (oEmbedResponse.ok) {
        const oEmbedData = await oEmbedResponse.json();
        // Extract thumbnail URL from oEmbed response
        const thumbnailUrl = oEmbedData.thumbnail_url;
        
        if (thumbnailUrl) {
          const thumbResponse = await fetch(thumbnailUrl);
          if (thumbResponse.ok) {
            const imageBuffer = await thumbResponse.arrayBuffer();
            return new NextResponse(imageBuffer, {
              headers: {
                'Content-Type': 'image/jpeg',
                'Cache-Control': 'public, max-age=86400',
                'Access-Control-Allow-Origin': '*',
              },
            });
          }
        }
      }
    } catch (oEmbedError) {
      console.error('oEmbed error:', oEmbedError);
    }

    // Strategy 3: Use standard YouTube thumbnail URLs
    const thumbnailUrls = [
      `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
      `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
      `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
    ];

    for (const thumbUrl of thumbnailUrls) {
      try {
        const response = await fetch(thumbUrl, {
          headers: {
            'Referer': 'https://www.youtube.com/',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          },
        });

        if (response.ok) {
          const imageBuffer = await response.arrayBuffer();
          return new NextResponse(imageBuffer, {
            headers: {
              'Content-Type': 'image/jpeg',
              'Cache-Control': 'public, max-age=86400',
              'Access-Control-Allow-Origin': '*',
            },
          });
        }
      } catch (err) {
        continue;
      }
    }

    // Strategy 4: Use CORS proxy as last resort (public proxy service)
    try {
      const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(`https://img.youtube.com/vi/${videoId}/mqdefault.jpg`)}`;
      const proxyResponse = await fetch(proxyUrl);
      
      if (proxyResponse.ok) {
        const imageBuffer = await proxyResponse.arrayBuffer();
        return new NextResponse(imageBuffer, {
          headers: {
            'Content-Type': 'image/jpeg',
            'Cache-Control': 'public, max-age=3600', // Shorter cache for proxy
            'Access-Control-Allow-Origin': '*',
          },
        });
      }
    } catch (proxyError) {
      console.error('CORS proxy error:', proxyError);
    }

    return NextResponse.json(
      { error: 'Failed to fetch thumbnail' },
      { status: 404 }
    );
  } catch (error) {
    console.error('Error fetching YouTube thumbnail:', error);
    return NextResponse.json(
      { error: 'Failed to fetch thumbnail' },
      { status: 500 }
    );
  }
}

