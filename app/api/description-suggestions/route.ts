import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { SUMMARY_MAX_CHARS, trimToWordBoundary } from '@/lib/summaryLimits';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

interface SuggestionRequest {
  description: string;
}

interface SuggestionResponse {
  suggestion: string;
  explanation: string;
  /** Which engine produced this — 'claude' is the real thing, 'fallback' is keyword templates. */
  source?: 'claude' | 'fallback';
}

/** Keyword-based fallback used when no API key is configured */
function generateFallback(description: string): { suggestion: string; explanation: string } {
  const lower = description.toLowerCase();

  const hasFood    = lower.includes('food') || lower.includes('eat') || lower.includes('taste') || lower.includes('drink') || lower.includes('coffee') || lower.includes('wine') || lower.includes('beer') || lower.includes('chef');
  const hasMusic   = lower.includes('music') || lower.includes('concert') || lower.includes('band') || lower.includes('dj') || lower.includes('live');
  const hasLearn   = lower.includes('learn') || lower.includes('workshop') || lower.includes('class') || lower.includes('skill') || lower.includes('training') || lower.includes('course');
  const hasNetwork = lower.includes('network') || lower.includes('connect') || lower.includes('meet') || lower.includes('community') || lower.includes('professional');
  const hasYoga    = lower.includes('yoga') || lower.includes('wellness') || lower.includes('mindful') || lower.includes('meditat');
  const hasFestival= lower.includes('festival') || lower.includes('fair') || lower.includes('vendor') || lower.includes('market') || lower.includes('night market');
  const hasDance   = lower.includes('dance') || lower.includes('dancing') || lower.includes('party');
  // hasCraft = hands-on making only — NOT general "arts" or "crafts" at a festival
  const hasCraft   = lower.includes('workshop') || lower.includes('pottery') || lower.includes('candle') || lower.includes('brew') || lower.includes('hands-on') || (lower.includes('paint') && !hasFestival);

  // Extract the best "count" number from the description.
  // Priority 1: numbers explicitly written as "200+" — these are always counts,
  //             never brand names or prices.
  // Priority 2: numbers near count-like keywords (vendors, attractions, etc.)
  // Priority 3: largest plain number > 5 (last resort — avoids brand names like "626")
  const explicitCounts = (description.match(/\b(\d+)\+/g) || []).map(s => parseInt(s, 10));
  const contextNums = [...description.matchAll(/\b(\d{2,})\b(?=\s+(?:vendor|attraction|food|booth|performer|artist|act)s?)/gi)]
    .map(m => parseInt(m[1], 10));
  const allNums = (description.match(/\b(\d+)\b/g) || []).map(Number).filter(n => n > 5 && n < 10000);
  const bigNum = explicitCounts.length
    ? Math.max(...explicitCounts)
    : contextNums.length
      ? Math.max(...contextNums)
      : allNums.length ? Math.max(...allNums) : 0;

  // Build a short activity list from what's actually mentioned
  const activities: string[] = [];
  if (hasFood) activities.push('food');
  if (lower.includes('craft') || lower.includes('arts')) activities.push('crafts');
  if (hasMusic) activities.push('live music');
  if (lower.includes('game') || lower.includes('entertainment')) activities.push('games');
  if (lower.includes('shopping') || lower.includes('merchandise')) activities.push('shopping');
  const activityStr = activities.slice(0, 4).join(', ');

  let suggestion = '';
  let explanation = '';

  // Order matters: most distinctive type first.
  // Festival/market with a specific scale number → always wins over generic craft+food.
  if (hasFestival && bigNum > 0 && activityStr) {
    // Kept short on purpose: with the longest 4-item activity list (34 chars)
    // and a 4-digit count this lands at ~97 chars, inside SUMMARY_MAX_CHARS,
    // so it never gets trimmed mid-sentence.
    suggestion = `Make a day of it with ${bigNum}+ ${activityStr} — a festival for the whole family.`;
    explanation = `Anchoring on ${bigNum}+ signals scale and value. Listing the actual activities (${activityStr}) gives people concrete reasons to come.`;
  } else if (hasFestival && bigNum > 0) {
    suggestion = `Explore ${bigNum}+ vendors of food, shopping, and entertainment — a full-day festival for everyone.`;
    explanation = `The vendor count signals a big, worthwhile outing. "For everyone" broadens the appeal without being generic.`;
  } else if (hasFestival && hasFood && hasMusic) {
    suggestion = 'Taste your way through local food, catch live music, and browse unique vendors — all in one place.';
    explanation = 'Three distinct draws (food, music, shopping) give attendees multiple reasons to show up.';
  } else if (hasYoga && hasDance) {
    suggestion = 'Start grounded, end dancing — a feel-good day that moves you from the inside out.';
    explanation = 'The contrast arc (calm → energy) is memorable. People can picture the full shape of their day.';
  } else if (hasCraft && hasFood) {
    suggestion = 'Sip, create, and leave with something you made — a hands-on evening of good drinks and better company.';
    explanation = '"Sip, create, leave with" follows an experience arc. Outcome-first framing tells people exactly what they\'ll walk away with.';
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
    // Last resort: condense the original description to the card limit
    suggestion = trimToWordBoundary(description);
    explanation = `Condensed to fit the ${SUMMARY_MAX_CHARS}-character discovery card limit while preserving the key details.`;
  }

  suggestion = trimToWordBoundary(suggestion);
  return { suggestion, explanation };
}

const PROMPT_EXAMPLES = `
Good examples (study these patterns — note how SHORT they are):
- "Taste 75+ coffees, discover new brewing trends, and leave with new favorites." (77 chars)
- "Graze 200+ booths of food, crafts, and games at the largest Asian night market." (78 chars)
- "Start grounded with yoga, end dancing to live brass at Thrive City." (67 chars)
- "Learn sourdough from scratch and walk away with a loaf you baked yourself." (74 chars)
- "Meet 100+ climate tech founders — pitch, listen, leave with new collaborators." (78 chars)

What makes them work:
- Action verbs up front ("Taste", "Make", "Start", "Learn", "Meet")
- Specific details from the description: exact numbers, named activities, named places
- Experience arc: what you do → what you feel or leave with
- Sensory or social outcome at the end
- No filler: zero "amazing", "incredible", "fun for all"
- For large festivals/markets: lead with the scale (number of vendors/attractions), name the top activities, end with who it's for
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
      console.warn('[description-suggestions] No ANTHROPIC_API_KEY — using keyword fallback. Output will be template copy.');
      await new Promise(r => setTimeout(r, 900));
      const { suggestion, explanation } = generateFallback(description);
      return NextResponse.json({ suggestion, explanation, source: 'fallback' } satisfies SuggestionResponse);
    }

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 500,
      messages: [
        {
          role: 'user',
          content: `You are writing a discovery card summary for an event listing — the one-liner that makes someone stop scrolling and tap "I'm in."

${PROMPT_EXAMPLES}

Rules (non-negotiable):
- ≤ ${SUMMARY_MAX_CHARS} characters — this is a HARD limit. The card shows exactly 3 short lines
  and anything longer gets visibly cut off. Aim for 80–95 characters; never exceed ${SUMMARY_MAX_CHARS}.
- One sentence. Pick the two or three strongest details and cut everything else —
  do not try to fit the whole event in. Leaving something out is correct.
- Outcome-based: what will attendees TASTE, FEEL, LEARN, GAIN, or WALK AWAY WITH?
- Pull specifics directly from the description: exact numbers, named activities, place names
- For festivals and markets: anchor on the vendor/attraction count and list the top 3-4 activities
- Action-forward opening — start with a verb or an activity
- No hashtags, no emoji, no generic filler ("amazing", "unforgettable", "fun for all", "join us")
- Natural spoken English — sounds like a friend recommending it, not a press release
- ACCURACY IS NON-NEGOTIABLE. Every claim must be traceable to the description:
  - Never invent or inflate numbers. Use counts exactly as written. If the only
    number is part of a brand name (e.g. "626 Night Market"), it is NOT a count.
  - Never change what a detail refers to. "Free entry" does not mean free drinks;
    "beer garden" does not mean beer is included; "3 DJs" does not mean 3 stages.
  - Never add seasons, weather, times of day, prices, or demographics that are absent.
  - When compressing, drop details — never merge two facts into a new claim.

Event description:
"""
${description.trim()}
"""

Think step-by-step:
1. What type of event is this? (festival, workshop, concert, networking, etc.)
2. What are the 2–3 most concrete, sensory, or valuable things a person will experience?
3. Are there specific numbers, named activities, or a place name I can use?
4. Draft a summary that opens with action and ends with the feeling or outcome.
5. Count the characters. If over ${SUMMARY_MAX_CHARS}, cut a whole detail rather than shortening words.

Respond with a JSON object — no other text:
{
  "suggestion": "<the ≤${SUMMARY_MAX_CHARS}-char outcome-based summary>",
  "explanation": "<1–2 sentences on why this framing works for discovery — be specific about the choices made>"
}`,
        },
      ],
    });

    const raw = message.content[0].type === 'text' ? message.content[0].text.trim() : '';
    // Strip markdown code fences if present
    const jsonStr = raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
    const parsed = JSON.parse(jsonStr) as { suggestion: string; explanation: string };

    let { suggestion, explanation } = parsed;
    // Safety net only — the prompt should already keep this under the limit.
    // Trim at a word boundary (no mid-word cut, no ellipsis) so the card never clips.
    if (suggestion.length > SUMMARY_MAX_CHARS) {
      console.warn(`[description-suggestions] Claude returned ${suggestion.length} chars (limit ${SUMMARY_MAX_CHARS}) — trimming: "${suggestion}"`);
      suggestion = trimToWordBoundary(suggestion);
    }

    return NextResponse.json({ suggestion, explanation, source: 'claude' } satisfies SuggestionResponse);
  } catch (err) {
    // Loud and specific: a bad model id, an expired key, and a JSON parse failure
    // all used to look identical to a working feature (silent template output).
    const detail = err instanceof Anthropic.APIError
      ? `Anthropic API ${err.status}: ${err.message}`
      : err instanceof Error ? err.message : String(err);
    console.error(`[description-suggestions] Claude call FAILED (${detail}) — falling back to keyword template.`);
    // `description` was captured before the Claude call, so the fallback
    // always has the original text even after the request stream is consumed.
    if (description.trim()) {
      const { suggestion, explanation } = generateFallback(description);
      return NextResponse.json({ suggestion, explanation, source: 'fallback' } satisfies SuggestionResponse);
    }
    return NextResponse.json({ error: 'Failed to generate suggestion' }, { status: 500 });
  }
}
