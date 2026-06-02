import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

interface SuggestionRequest {
  description: string;
}

interface SuggestionResponse {
  suggestion: string;
  explanation: string;
}

/** Keyword-based fallback used when no API key is configured */
function generateFallback(description: string): { suggestion: string; explanation: string } {
  const lower = description.toLowerCase();

  const hasFood    = lower.includes('food') || lower.includes('eat') || lower.includes('taste') || lower.includes('drink') || lower.includes('coffee') || lower.includes('wine') || lower.includes('beer') || lower.includes('chef');
  const hasMusic   = lower.includes('music') || lower.includes('concert') || lower.includes('band') || lower.includes('dj') || lower.includes('live');
  const hasLearn   = lower.includes('learn') || lower.includes('workshop') || lower.includes('class') || lower.includes('skill') || lower.includes('training') || lower.includes('course');
  const hasNetwork = lower.includes('network') || lower.includes('connect') || lower.includes('meet') || lower.includes('community') || lower.includes('professional');
  const hasYoga    = lower.includes('yoga') || lower.includes('wellness') || lower.includes('mindful') || lower.includes('meditat');
  const hasFestival= lower.includes('festival') || lower.includes('fair') || lower.includes('vendor') || lower.includes('market');
  const hasDance   = lower.includes('dance') || lower.includes('dancing') || lower.includes('party');
  const hasCraft   = lower.includes('craft') || lower.includes('art') || lower.includes('paint') || lower.includes('creat') || lower.includes('brew');

  // Extract any prominent number (vendors, coffees, etc.)
  const nums = (description.match(/\b(\d+)\b/g) || []).map(Number).filter(n => n > 5);
  const bigNum = nums.length ? Math.max(...nums) : 0;

  let suggestion = '';
  let explanation = '';

  if (hasCraft && hasFood) {
    suggestion = 'Sip, create, and leave with something you made — a hands-on evening of good drinks and better company.';
    explanation = '"Sip, create, leave with" follows an experience arc. Outcome-first framing tells people exactly what they\'ll walk away with.';
  } else if (hasYoga && hasDance) {
    suggestion = 'Start grounded, end dancing — a feel-good day that moves you from the inside out.';
    explanation = 'The contrast arc (calm → energy) is memorable and specific. People can picture the full arc of their day.';
  } else if (hasFestival && bigNum > 0) {
    suggestion = `Make a full day of it with ${bigNum}+ vendors, live music, food, and games — a festival the whole family can enjoy.`;
    explanation = 'Specific numbers ("' + bigNum + '+") signal scale and value. "Make a full day" implies worth the trip.';
  } else if (hasLearn && hasNetwork) {
    suggestion = 'Walk away with practical skills and a new professional network you can actually use.';
    explanation = '"Walk away with" leads with outcomes. "Actually use" signals immediate value beyond the event.';
  } else if (hasFood && hasMusic) {
    suggestion = 'Taste great food, catch live music, and leave feeling like you found your people.';
    explanation = 'Sensory + social outcomes. "Found your people" signals community — one of the strongest discovery hooks.';
  } else if (hasLearn && hasCraft) {
    suggestion = 'Learn a new craft from a local maker and leave with something handmade to show for it.';
    explanation = 'Tangible take-home outcome. "Something to show for it" makes the value feel concrete and lasting.';
  } else if (hasLearn) {
    suggestion = 'Leave with hands-on skills you can put to use the same day.';
    explanation = '"Same day" signals immediate applicability — the strongest signal of high-value learning events.';
  } else if (hasNetwork) {
    suggestion = 'Meet your next collaborator, client, or friend in a room full of people who get it.';
    explanation = '"People who get it" implies curated community fit — more compelling than "networking opportunity."';
  } else if (hasYoga) {
    suggestion = 'Press reset, stretch it out, and leave feeling lighter than when you walked in.';
    explanation = 'Before/after contrast ("walked in" vs. "leave feeling") makes the transformation concrete and relatable.';
  } else if (hasFood) {
    suggestion = 'Taste your way through the best of what\'s local — leave full, inspired, and wanting more.';
    explanation = 'Sensory outcome chain. "Wanting more" signals a high-quality experience without overpromising.';
  } else {
    // Trim to ≤160 chars as last resort
    const trimmed = description.replace(/\s+/g, ' ').trim();
    suggestion = trimmed.length <= 160 ? trimmed : trimmed.slice(0, 157).trimEnd() + '…';
    explanation = 'Condensed to fit the 160-character discovery card limit while preserving the key details.';
  }

  if (suggestion.length > 160) suggestion = suggestion.slice(0, 157).trimEnd() + '…';
  return { suggestion, explanation };
}

const PROMPT_EXAMPLES = `
Good examples (study these patterns):
- "Taste 75+ coffees, discover new brewing trends, and leave inspired with new favorites and connections." (96 chars)
- "Make a full day of it with 200+ food, crafts, music, and games — a California festival the whole family can enjoy." (114 chars)
- "Start grounded with yoga, end dancing outdoors to DJs and live brass — a feel-good spring day at Thrive City." (110 chars)
- "Learn sourdough from scratch and walk away with a loaf you baked yourself." (74 chars)
- "Meet 100+ founders building in climate tech — pitch, listen, and leave with three new collaborators." (101 chars)

What makes them work:
- Action verbs up front ("Taste", "Make", "Start", "Learn", "Meet")
- Specific details: numbers, activities, places — never generic
- Experience arc: what you do → what you leave with
- Sensory or social outcome at the end
- No filler: zero "amazing", "incredible", "fun for all"
`.trim();

export async function POST(request: NextRequest) {
  // Capture description up-front so the catch block can still use it
  // even after the request body stream has been consumed.
  let description = '';

  try {
    const body: SuggestionRequest = await request.json();
    description = body?.description ?? '';

    if (!description || typeof description !== 'string' || !description.trim()) {
      return NextResponse.json({ error: 'Description is required' }, { status: 400 });
    }
    if (description.length > 10000) {
      return NextResponse.json({ error: 'Description too long' }, { status: 400 });
    }

    // Try Claude; fall back to keyword heuristic if API key is missing
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey || apiKey === 'your_anthropic_api_key_here') {
      await new Promise(r => setTimeout(r, 900));
      const { suggestion, explanation } = generateFallback(description);
      return NextResponse.json({ suggestion, explanation } satisfies SuggestionResponse);
    }

    const message = await anthropic.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 300,
      messages: [
        {
          role: 'user',
          content: `You are writing a discovery card summary for an event listing — the one-liner that makes someone stop scrolling and tap "I'm in."

${PROMPT_EXAMPLES}

Rules (non-negotiable):
- ≤ 160 characters — count every character before writing the final answer
- Outcome-based: what will attendees TASTE, FEEL, LEARN, GAIN, or WALK AWAY WITH?
- Use specifics from the description: exact numbers, named activities, place names if given
- Action-forward opening — start with a verb or an activity
- No hashtags, no emoji, no generic filler ("amazing", "unforgettable", "fun for all")
- Natural spoken English — sounds like a friend recommending it, not a press release

Event description:
"""
${description.trim()}
"""

Think step-by-step:
1. What are the 2–3 most concrete, sensory, or valuable things a person will walk away with?
2. Is there a number, specific activity, or named place I can anchor the summary to?
3. Draft a summary that opens with action and ends with the outcome.
4. Count the characters. Trim if over 160.

Respond with a JSON object — no other text:
{
  "suggestion": "<the ≤160-char outcome-based summary>",
  "explanation": "<1–2 sentences on why this framing works for discovery — be specific about the choices made>"
}`,
        },
      ],
    });

    const raw = message.content[0].type === 'text' ? message.content[0].text.trim() : '';
    const jsonStr = raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
    const parsed = JSON.parse(jsonStr) as { suggestion: string; explanation: string };

    let { suggestion, explanation } = parsed;
    if (suggestion.length > 160) suggestion = suggestion.slice(0, 157).trimEnd() + '…';

    return NextResponse.json({ suggestion, explanation } satisfies SuggestionResponse);
  } catch (err) {
    console.error('description-suggestions error:', err);
    // `description` was captured before the Claude call, so the fallback
    // always has the original text even after the request stream is consumed.
    if (description.trim()) {
      const { suggestion, explanation } = generateFallback(description);
      return NextResponse.json({ suggestion, explanation } satisfies SuggestionResponse);
    }
    return NextResponse.json({ error: 'Failed to generate suggestion' }, { status: 500 });
  }
}
