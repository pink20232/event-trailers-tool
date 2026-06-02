import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

interface AnalyzeRequest {
  videoId: string;
  platform: string;
  originalUrl: string;
  duration: number;
}

export interface AnalysisReasons {
  vibe: string;
  uniqueness: string;
  authenticity: string;
}

interface AnalyzeResponse {
  suggestedStartTime: number;
  reasons: AnalysisReasons;
  embeddingBlocked?: boolean;
}

const FALLBACK_REASONS: AnalysisReasons = {
  vibe: 'Peak energy that captures the event atmosphere.',
  uniqueness: 'A distinctive moment that sets this event apart.',
  authenticity: 'Genuine connection and joy attendees will experience.',
};

async function fetchYouTubeMetadata(videoId: string): Promise<Record<string, unknown> | null> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey || apiKey === 'your_youtube_api_key_here') return null;

  try {
    const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,status&id=${videoId}&key=${apiKey}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    const item = data.items?.[0];
    if (!item) return null;
    return {
      title: item.snippet?.title,
      description: item.snippet?.description?.slice(0, 500),
      tags: item.snippet?.tags?.slice(0, 10),
      duration: item.contentDetails?.duration,
      embeddable: item.status?.embeddable,
    };
  } catch {
    return null;
  }
}

function parseISODuration(iso: string): number {
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  return (parseInt(match[1] || '0') * 3600) +
         (parseInt(match[2] || '0') * 60) +
         parseInt(match[3] || '0');
}

export async function POST(request: NextRequest) {
  let body: AnalyzeRequest = { videoId: '', platform: 'unknown', originalUrl: '', duration: 300 };
  try {
    body = await request.json() as AnalyzeRequest;
    const { videoId, platform, originalUrl, duration } = body;

    let metadataContext = '';
    let videoDurationSeconds = duration;
    let embeddingBlocked = false;

    if (platform === 'youtube' && videoId) {
      const meta = await fetchYouTubeMetadata(videoId);
      if (meta) {
        if (meta.duration) {
          videoDurationSeconds = parseISODuration(meta.duration as string);
        }
        if (meta.embeddable === false) {
          embeddingBlocked = true;
        }
        metadataContext = `
Video title: ${meta.title}
Video description: ${meta.description}
Tags: ${Array.isArray(meta.tags) ? meta.tags.join(', ') : 'none'}
Duration: ${videoDurationSeconds}s`;
      }
    }

    const prompt = `You are helping an event organizer select the best 10-second clip from their event video to use on a social discovery card.

Platform: ${platform}
Video URL: ${originalUrl}
Total duration: ${videoDurationSeconds} seconds${metadataContext ? `\n${metadataContext}` : ''}

Your task:
1. Suggest the best START time (in seconds) for a 10-second highlight clip that captures energy, action, or emotion. Avoid the very beginning (usually intro/setup) and very end. Aim for roughly the 20–40% mark unless metadata suggests a better moment.
2. Write one short reason (under 12 words) for each of these three categories that explains why this moment will resonate with potential attendees:
   - Vibe: the energy or atmosphere this moment captures
   - Uniqueness: what makes this moment distinctive or memorable
   - Authenticity: the genuine human element this moment reveals

Respond ONLY with valid JSON in this exact format:
{
  "startTime": <number>,
  "reasons": {
    "vibe": "<vibe reason>",
    "uniqueness": "<uniqueness reason>",
    "authenticity": "<authenticity reason>"
  }
}`;

    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 256,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = message.content[0].type === 'text' ? message.content[0].text : '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON in response');

    const parsed = JSON.parse(jsonMatch[0]);
    const suggestedStartTime = Math.max(0, Math.min(
      Math.round(parsed.startTime),
      Math.max(0, videoDurationSeconds - 10)
    ));

    const reasons: AnalysisReasons = (
      parsed.reasons &&
      typeof parsed.reasons.vibe === 'string' &&
      typeof parsed.reasons.uniqueness === 'string' &&
      typeof parsed.reasons.authenticity === 'string'
    ) ? parsed.reasons : FALLBACK_REASONS;

    const response: AnalyzeResponse = {
      suggestedStartTime,
      reasons,
      ...(embeddingBlocked && { embeddingBlocked: true }),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('analyze-video error:', error);
    return NextResponse.json({
      suggestedStartTime: Math.round((body.duration || 300) * 0.25),
      reasons: FALLBACK_REASONS,
    } as AnalyzeResponse);
  }
}
