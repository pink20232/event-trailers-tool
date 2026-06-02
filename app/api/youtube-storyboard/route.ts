import { NextRequest, NextResponse } from 'next/server';

export interface StoryboardMeta {
  urlTemplate: string; // has $L (level) and $N (sheet index)
  level: number;
  frameWidth: number;
  frameHeight: number;
  frameCount: number; // total frames across all sheets
  columns: number;
  rows: number;       // rows per sheet
  sigh: string;       // signature token to append to sprite URL
  framesPerSheet: number;
  totalSheets: number;
  intervalSeconds: number; // seconds between frames
}

/**
 * Extract ytInitialPlayerResponse JSON from YouTube watch page HTML.
 * Uses a string-aware bracket counter so brace characters inside string
 * values don't confuse the depth tracking.
 */
function extractPlayerResponse(html: string): Record<string, unknown> | null {
  const marker = 'ytInitialPlayerResponse';
  const markerIdx = html.indexOf(marker);
  if (markerIdx === -1) return null;

  const jsonStart = html.indexOf('{', markerIdx);
  if (jsonStart === -1) return null;

  let depth = 0;
  let inString = false;
  let escape = false;
  let jsonEnd = -1;

  for (let i = jsonStart; i < html.length; i++) {
    const c = html[i];

    if (escape) { escape = false; continue; }
    if (c === '\\' && inString) { escape = true; continue; }
    if (c === '"') { inString = !inString; continue; }
    if (inString) continue;

    if (c === '{') depth++;
    else if (c === '}') {
      depth--;
      if (depth === 0) { jsonEnd = i; break; }
    }
  }

  if (jsonEnd === -1) return null;

  try {
    return JSON.parse(html.slice(jsonStart, jsonEnd + 1)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const videoId = request.nextUrl.searchParams.get('videoId');
  const duration = parseFloat(request.nextUrl.searchParams.get('duration') || '300');

  if (!videoId) {
    return NextResponse.json({ error: 'videoId required' }, { status: 400 });
  }

  try {
    // Fetch the YouTube watch page — the internal player API omits storyboard data
    const pageRes = await fetch(
      `https://www.youtube.com/watch?v=${videoId}`,
      {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
      }
    );

    if (!pageRes.ok) {
      return NextResponse.json(
        { error: `YouTube page fetch failed: ${pageRes.status}` },
        { status: 502 }
      );
    }

    const html = await pageRes.text();
    const data = extractPlayerResponse(html);

    if (!data) {
      return NextResponse.json({ error: 'Could not parse ytInitialPlayerResponse' }, { status: 404 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const storyboardRenderer = (data as any)?.storyboards?.playerStoryboardSpecRenderer;
    const spec: string | undefined = storyboardRenderer?.spec;

    if (!spec) {
      return NextResponse.json({ error: 'No storyboard in player response' }, { status: 404 });
    }

    // Spec format:
    //   parts[0]  = URL template (contains $L for level, $N for sheet index)
    //   parts[1+] = per-level metadata: "width#height#frameCount#cols#rows#intervalMs#M$M#sighToken"
    const parts = spec.split('|');
    const urlTemplate = parts[0];

    // Use recommendedLevel from the renderer when available, else pick highest level
    const recommendedLevel: number =
      storyboardRenderer?.recommendedLevel ?? parts.length - 2;
    const levelIndex = Math.min(recommendedLevel, parts.length - 2);
    const levelData = parts[levelIndex + 1];

    if (!levelData) {
      return NextResponse.json({ error: 'Could not parse storyboard levels' }, { status: 500 });
    }

    // segments: [width, height, frameCount, columns, rows, intervalMs, "M$M", sighToken]
    const segments = levelData.split('#');
    const frameWidth  = parseInt(segments[0]);
    const frameHeight = parseInt(segments[1]);
    const frameCount  = parseInt(segments[2]);
    const columns     = parseInt(segments[3]);
    const rows        = parseInt(segments[4]);
    const sigh        = segments[7] ?? '';

    const framesPerSheet = columns * rows;
    const totalSheets    = Math.ceil(frameCount / framesPerSheet);
    const intervalSeconds = duration / frameCount;

    const meta: StoryboardMeta = {
      urlTemplate,
      level: levelIndex,
      frameWidth,
      frameHeight,
      frameCount,
      columns,
      rows,
      sigh,
      framesPerSheet,
      totalSheets,
      intervalSeconds,
    };

    return NextResponse.json(meta, {
      headers: { 'Cache-Control': 'public, max-age=300' }, // 5 min — sigh token has limited lifetime
    });
  } catch (err) {
    console.error('youtube-storyboard error:', err);
    return NextResponse.json({ error: 'Failed to fetch storyboard metadata' }, { status: 500 });
  }
}
