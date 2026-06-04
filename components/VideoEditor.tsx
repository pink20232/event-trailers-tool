'use client';

import React, { useState, useRef, useEffect, useCallback, useLayoutEffect } from 'react';
import styles from './VideoEditor.module.css';
import { type VideoInfo } from '@/lib/videoUtils';
import { type AnalysisReasons } from '@/app/api/analyze-video/route';

interface VideoEditorProps {
  videoInfo: VideoInfo | null;
  isAnalyzing?: boolean;
  analysisReasons?: AnalysisReasons | null;
  duration?: number;
  onTimeRangeChange?: (startTime: number, endTime: number) => void;
  suggestedStartTime?: number | null;
}

const CLIP_DURATION = 10;

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export const VideoEditor: React.FC<VideoEditorProps> = ({
  videoInfo,
  isAnalyzing = false,
  analysisReasons = null,
  duration = 300,
  onTimeRangeChange,
  suggestedStartTime = null,
}) => {
  const [startTime, setStartTime] = useState(0);
  const scrubberRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const dragOffsetRef = useRef(0);

  // Morph animation: rainbow track → window pill
  const prevIsAnalyzingRef = useRef(isAnalyzing);
  const [showMorphBar, setShowMorphBar] = useState(false);
  const [morphCollapsed, setMorphCollapsed] = useState(false);

  const endTime = Math.min(startTime + CLIP_DURATION, duration);

  // Sync to AI suggestion
  useEffect(() => {
    if (suggestedStartTime !== null && suggestedStartTime !== undefined) {
      setStartTime(Math.max(0, Math.min(suggestedStartTime, duration - CLIP_DURATION)));
    }
  }, [suggestedStartTime, duration]);

  // Reset on new video
  useEffect(() => {
    if (!videoInfo) {
      setStartTime(0);
      setShowMorphBar(false);
      setMorphCollapsed(false);
    }
  }, [videoInfo]);

  // Trigger morph animation when analysis completes
  useEffect(() => {
    if (prevIsAnalyzingRef.current === true && !isAnalyzing && videoInfo) {
      setShowMorphBar(true);
      setMorphCollapsed(false);
      // Double-rAF: let the full-width bar render first, then collapse
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setMorphCollapsed(true);
        });
      });
      const timer = setTimeout(() => {
        setShowMorphBar(false);
        setMorphCollapsed(false);
      }, 750);
      return () => clearTimeout(timer);
    }
    prevIsAnalyzingRef.current = isAnalyzing;
  }, [isAnalyzing, videoInfo]);

  // Notify parent
  useEffect(() => {
    onTimeRangeChange?.(startTime, endTime);
  }, [startTime, endTime, onTimeRangeChange]);

  const clampStart = useCallback(
    (s: number) => Math.max(0, Math.min(s, duration - CLIP_DURATION)),
    [duration]
  );

  const timeFromClientX = useCallback((clientX: number): number => {
    if (!scrubberRef.current) return 0;
    const rect = scrubberRef.current.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    return pct * duration;
  }, [duration]);

  const handleScrubberMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const clickedTime = timeFromClientX(e.clientX);
    const startPct = startTime / duration;
    const endPct = endTime / duration;
    const rect = scrubberRef.current!.getBoundingClientRect();
    const clickPct = (e.clientX - rect.left) / rect.width;

    if (clickPct >= startPct && clickPct <= endPct) {
      dragOffsetRef.current = clickedTime - startTime;
    } else {
      dragOffsetRef.current = CLIP_DURATION / 2;
      setStartTime(clampStart(clickedTime - CLIP_DURATION / 2));
    }
    isDragging.current = true;
  }, [timeFromClientX, startTime, endTime, duration, clampStart]);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      setStartTime(clampStart(timeFromClientX(e.clientX) - dragOffsetRef.current));
    };
    const onUp = () => { isDragging.current = false; };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    return () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
  }, [timeFromClientX, clampStart]);

  // Scrubber window position as % of track
  const windowLeft = `${(startTime / Math.max(duration, 1)) * 100}%`;

  // Ghost marker — locked to AI's original suggestion, never moves with drag
  const suggestedLeft = suggestedStartTime !== null
    ? `${(suggestedStartTime / Math.max(duration, 1)) * 100}%`
    : null;

  return (
    <div className={styles.card}>

      {/* ── Empty state ──────────────────────────────────── */}
      {!videoInfo && (
        <>
          <div className={styles.header}>
            <p className={styles.title}>Recommended clip</p>
            <p className={styles.description}>
              Our system analyzes your video to select a 10-second moment that best captures your event&apos;s vibe.
            </p>
          </div>
          <div className={styles.filmstripWrapper}>
            <div className={styles.gradientBar} />
            <div className={styles.clipsCard}>
              <img src="/images/clip1.png" className={styles.clipImg} alt="" />
              <img src="/images/clip2.png" className={styles.clipImg} alt="" />
              <img src="/images/clip3.png" className={styles.clipImg} alt="" />
            </div>
            <div className={styles.playBtn}>
              <PlayIcon />
            </div>
          </div>
        </>
      )}

      {/* ── Analyzing state ──────────────────────────────── */}
      {videoInfo && isAnalyzing && (
        <>
          <div className={styles.resultsHeader}>
            <p className={styles.title}>Recommended clip</p>
            <div className={styles.scrubberRow}>
              <div className={styles.scrubberTrack}>
                {/* Rainbow fills the full track while scanning */}
                <div className={styles.analyzingFill} />
              </div>
              <span className={`${styles.scrubberTime} ${styles.scrubberTimeDim}`}>
                {formatTime(duration)}
              </span>
            </div>
          </div>
          {/* Copy vertically centered in remaining space */}
          <div className={styles.analyzingCopyWrap}>
            <p className={styles.analyzingCopy}>
              Analyzing video and selecting the recommended moment…
            </p>
          </div>
        </>
      )}

      {/* ── Results state ────────────────────────────────── */}
      {videoInfo && !isAnalyzing && (
        <>
          {/* Header row: title + inline scrubber */}
          <div className={styles.resultsHeader}>
            <p className={styles.title}>Recommended clip</p>
            <div className={styles.scrubberRow}>
              <div
                ref={scrubberRef}
                className={styles.scrubberTrack}
                onMouseDown={handleScrubberMouseDown}
              >
                {/* Ghost marker: AI's original suggestion — stays put while user drags */}
                {suggestedLeft !== null && !showMorphBar && (
                  <div
                    className={styles.scrubberSuggestedMark}
                    style={{ left: suggestedLeft }}
                  >
                    <img
                      src="/icons/Drag_button.png"
                      className={styles.dragButton}
                      alt="Suggested position"
                      draggable={false}
                    />
                  </div>
                )}
                {/* Morph bar: animates from full-width → window pill on first render */}
                {showMorphBar && (
                  <div
                    className={styles.scrubberMorphBar}
                    style={morphCollapsed
                      ? { left: windowLeft, width: '28px' }
                      : { left: '0%', width: '100%' }}
                  />
                )}
                {/* Regular window: shown after morph completes */}
                {!showMorphBar && (
                  <div className={styles.scrubberWindow} style={{ left: windowLeft }}>
                    <img
                      src="/icons/Drag_button.png"
                      className={styles.dragButton}
                      alt=""
                      draggable={false}
                    />
                  </div>
                )}
              </div>
              <span className={styles.scrubberTime}>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Three reason columns */}
          {analysisReasons && (
            <div className={styles.reasonsRow}>
              <div className={styles.reasonCol} style={{ animationDelay: '0ms' }}>
                <VibeIcon />
                <div className={styles.reasonText}>
                  <p className={styles.reasonLabel}>Vibe</p>
                  <FittedText className={styles.reasonBody} text={addPeriod(analysisReasons.vibe)} />
                </div>
              </div>
              <div className={styles.reasonCol} style={{ animationDelay: '320ms' }}>
                <UniquenessIcon />
                <div className={styles.reasonText}>
                  <p className={styles.reasonLabel}>Uniqueness</p>
                  <FittedText className={styles.reasonBody} text={addPeriod(analysisReasons.uniqueness)} />
                </div>
              </div>
              <div className={styles.reasonCol} style={{ animationDelay: '480ms' }}>
                <AuthenticityIcon />
                <div className={styles.reasonText}>
                  <p className={styles.reasonLabel}>Authenticity</p>
                  <FittedText className={styles.reasonBody} text={addPeriod(analysisReasons.authenticity)} />
                </div>
              </div>
            </div>
          )}
        </>
      )}

    </div>
  );
};

/* ── Helpers ─────────────────────────────────────────────── */

/** Ensure text ends with a period. */
function addPeriod(text: string): string {
  if (!text) return text;
  const t = text.trimEnd();
  return /[.!?]$/.test(t) ? t : t + '.';
}

/**
 * Renders text trimmed (by word) to fit exactly 3 lines — no ellipsis.
 * Uses a hidden clone for measurement so the visible element never flashes.
 */
function FittedText({ text, className }: { text: string; className?: string }) {
  const [display, setDisplay] = useState(text);
  const ref = useRef<HTMLParagraphElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || !text) return;

    const lhRaw = getComputedStyle(el).lineHeight;
    const lh = lhRaw === 'normal' ? parseFloat(getComputedStyle(el).fontSize) * 1.333 : parseFloat(lhRaw);
    const maxH = lh * 3 + 2; // 3 lines + 2px tolerance

    // Already fits?
    if (el.scrollHeight <= maxH) { setDisplay(text); return; }

    // Clone into same parent for accurate width measurement
    const clone = el.cloneNode(false) as HTMLParagraphElement;
    clone.style.cssText = [
      'position:absolute', 'visibility:hidden', 'pointer-events:none',
      `width:${el.offsetWidth}px`, 'height:auto', 'max-height:none',
      'overflow:visible', 'white-space:normal',
    ].join(';');
    el.parentElement!.appendChild(clone);

    // Binary search on word count
    const words = text.split(' ');
    let lo = 1, hi = words.length;
    while (lo < hi) {
      const mid = Math.ceil((lo + hi) / 2);
      clone.textContent = words.slice(0, mid).join(' ');
      if (clone.scrollHeight <= maxH) lo = mid;
      else hi = mid - 1;
    }

    el.parentElement!.removeChild(clone);
    setDisplay(words.slice(0, lo).join(' '));
  }, [text]);

  return <p ref={ref} className={className}>{display}</p>;
}

/* ── Icons ───────────────────────────────────────────────── */

const iconStyle: React.CSSProperties = { display: 'block', width: 24, height: 24 };

function PlayIcon() {
  return (
    <img src="/icons/Icon_Play.png" width={32} height={32} alt="" />
  );
}

function VibeIcon() {
  return <img src="/icons/Icon_Vibe.png" style={iconStyle} alt="" />;
}

function UniquenessIcon() {
  return <img src="/icons/Icon_Uniqueness.png" style={iconStyle} alt="" />;
}

function AuthenticityIcon() {
  return <img src="/icons/Icon_Authenticity.png" style={iconStyle} alt="" />;
}
