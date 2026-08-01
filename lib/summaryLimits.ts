/**
 * Single source of truth for the event-summary length limit.
 *
 * The discovery card reserves exactly 3 lines for the summary
 * (see `.description` in EventCardPreview.module.css: -webkit-line-clamp: 3).
 *
 * Measured against the real rendered card — 288px content width, 15px
 * Founders Grotesk R, 0.15px letter-spacing, 19.995px line-height — the
 * longest realistic mixed-case prose that still wraps to 3 lines is 109
 * characters. 105 leaves a small margin for wider-than-average glyphs.
 *
 * The old limit was 160, which always overflowed to 4+ lines and got
 * silently clipped by the line-clamp — that is the truncation this fixes.
 * If the card's width, font size, or line count changes, re-measure and
 * update this constant.
 */
export const SUMMARY_MAX_CHARS = 105;

/**
 * Trim to at most `max` characters without cutting a word in half.
 * Returns the text unchanged when it already fits, so the common path
 * never mutates AI output.
 */
export function trimToWordBoundary(text: string, max: number = SUMMARY_MAX_CHARS): string {
  const t = text.replace(/\s+/g, ' ').trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, max + 1);
  const lastSpace = cut.lastIndexOf(' ');
  // No space to break on (one very long word) — hard-cut as a last resort.
  const trimmed = lastSpace > 0 ? cut.slice(0, lastSpace) : t.slice(0, max);
  // Drop any dangling punctuation left by the break, then close the sentence.
  return trimmed.replace(/[\s,;:—-]+$/, '');
}
