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
  vibe: 'Crowd energy at its peak — the moment the event comes alive.',
  uniqueness: 'Something here you won\'t find at a standard event.',
  authenticity: 'Real people, real reactions — no stage directions.',
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

    const prompt = `You are writing micro-copy for a discovery card that helps someone decide whether to attend an event. Three short reasons appear under fixed labels: Vibe, Uniqueness, Authenticity.

Platform: ${platform}
Video URL: ${originalUrl}
Total duration: ${videoDurationSeconds} seconds${metadataContext ? `\n${metadataContext}` : ''}

Your tasks:
1. Suggest the best START time (in seconds) for a 10-second highlight clip. Avoid the first 10% (usually intro) and last 5%. Prefer the 20–50% range unless the metadata strongly suggests a better moment.

2. Write one reason per label. Each reason must:
   - Be 12–18 words, written in natural spoken English
   - Reference something SPECIFIC to this event — pull from the title, description, or tags
   - Sound like a friend who's been and is recommending it, not a press release
   - NEVER use these filler phrases: "captures the energy", "sets it apart", "genuine connection", "attendees will experience", "distinctive moment", "memorable experience"

   Label definitions (use these as lenses, not as templates):
   - Vibe: what the crowd energy or atmosphere actually feels like at this event
   - Uniqueness: one concrete thing about this event you won't find anywhere else
   - Authenticity: a real, human moment this kind of event reliably delivers

   Bad (generic, could describe any event):
   - "Peak energy that captures the event atmosphere."
   - "A distinctive moment that sets this event apart."
   - "Genuine connection and joy attendees will experience."

   Good (specific to a night market with 200+ vendors and Asian street food):
   - "Sensory overload of food stalls, lights, and a crowd that came hungry."
   - "200+ Asian-inspired vendors you won't find at a typical California fair."
   - "Real people eating real street food — no dress code, just good vibes."

Respond ONLY with valid JSON:
{
  "startTime": <number>,
  "reasons": {
    "vibe": "<12–18 word reason specific to this event>",
    "uniqueness": "<12–18 word reason specific to this event>",
    "authenticity": "<12–18 word reason specific to this event>"
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
