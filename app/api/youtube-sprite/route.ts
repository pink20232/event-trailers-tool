import { NextRequest, NextResponse } from 'next/server';

// Proxies YouTube storyboard sprite sheets server-side.
// Required because sprite URLs include signed tokens and block direct browser fetches.
export async function GET(request: NextRequest) {
  const encodedUrl = request.nextUrl.searchParams.get('url');

  if (!encodedUrl) {
    return NextResponse.json({ error: 'url required' }, { status: 400 });
  }

  const spriteUrl = decodeURIComponent(encodedUrl);

  // Only allow YouTube image URLs
  if (!spriteUrl.startsWith('https://i.ytimg.com/')) {
    return NextResponse.json({ error: 'Only i.ytimg.com URLs are allowed' }, { status: 403 });
  }

  try {
    const res = await fetch(spriteUrl, {
      headers: {
        'Referer': 'https://www.youtube.com/',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    if (!res.ok) {
      return NextResponse.json({ error: `Sprite fetch failed: ${res.status}` }, { status: 502 });
    }

    const buffer = await res.arrayBuffer();
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'public, max-age=3600',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (err) {
    console.error('youtube-sprite proxy error:', err);
    return NextResponse.json({ error: 'Failed to proxy sprite' }, { status: 500 });
  }
}
