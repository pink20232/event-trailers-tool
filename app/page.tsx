'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { EventCardPreview } from '@/components/EventCardPreview';
import { VideoEditor } from '@/components/VideoEditor';
import { EventSidebar, type EventData } from '@/components/EventSidebar';
import { MobileMockup } from '@/components/MobileMockup';
import { type VideoInfo } from '@/lib/videoUtils';
import { type AnalysisReasons } from '@/app/api/analyze-video/route';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { LogoAdjuster, type LogoAdjust } from '@/components/LogoAdjuster';
import styles from './page.module.css';

function getDefaultEventData(): EventData {
  const now = new Date();

  const formatDate = (d: Date) =>
    `${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getDate().toString().padStart(2, '0')}/${d.getFullYear()}`;

  const formatTime = (d: Date) => {
    const h = d.getHours();
    const period = h >= 12 ? 'PM' : 'AM';
    const hour = h % 12 || 12;
    return `${hour}:00 ${period}`;
  };

  const start = new Date(now);
  start.setHours(now.getHours() + 1, 0, 0, 0);

  const end = new Date(start);
  end.setHours(start.getHours() + 1, 0, 0, 0);

  const dateStr = formatDate(now);

  return {
    title: '',
    summary: '',
    startDate: dateStr,
    endDate: dateStr,
    startTime: formatTime(start),
    endTime: formatTime(end),
    venue: '',
    organizerLogo: null,
  };
}

export default function Home() {
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(10);
  const [videoDuration, setVideoDuration] = useState<number | null>(null);
  const [currentPlaybackTime, setCurrentPlaybackTime] = useState<number | undefined>(undefined);
  const [eventData, setEventData] = useState<EventData>(getDefaultEventData);
  const [previewLogo, setPreviewLogo] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisReasons, setAnalysisReasons] = useState<AnalysisReasons | null>(null);
  const [suggestedStartTime, setSuggestedStartTime] = useState<number | null>(null);
  const [embeddingBlocked, setEmbeddingBlocked] = useState(false);
  const [logoAdjust, setLogoAdjust] = useState<LogoAdjust>({ scale: 1, x: 0, y: 0 });
  const [isLogoAdjusting, setIsLogoAdjusting] = useState(false);
  // Ref so the analysis effect always reads the latest videoInfo without re-triggering
  const pendingAnalysisRef = useRef<{ info: VideoInfo } | null>(null);

  const handleVideoLoad = (info: VideoInfo) => {
    setVideoInfo(info);
    setStartTime(0);
    setEndTime(10);
    setVideoDuration(null);
    setCurrentPlaybackTime(undefined);
    setAnalysisReasons(null);
    setSuggestedStartTime(null);
    setEmbeddingBlocked(false);
    setIsAnalyzing(true);
    // Store the info so the duration-aware effect can pick it up
    pendingAnalysisRef.current = { info };
  };

  // Run analysis once we have both videoInfo and the real duration from the player.
  // If the player doesn't report duration within 4s, proceed anyway — the API route
  // fetches the real duration from the YouTube Data API server-side.
  useEffect(() => {
    if (!pendingAnalysisRef.current) return;
    const { info } = pendingAnalysisRef.current;

    let fired = false;

    const runAnalysis = async (knownDuration: number | null) => {
      if (fired) return;
      fired = true;
      pendingAnalysisRef.current = null;

      try {
        const res = await fetch('/api/analyze-video', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            videoId: info.videoId,
            platform: info.platform,
            originalUrl: info.originalUrl,
            // Send what we have — the server will override with YouTube Data API duration
            duration: knownDuration ?? 300,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          const dur = knownDuration ?? 300;
          const t = Math.max(0, Math.min(data.suggestedStartTime, dur - 10));
          setSuggestedStartTime(t);
          setStartTime(t);
          setEndTime(t + 10);
          setAnalysisReasons(data.reasons);
          if (data.embeddingBlocked) setEmbeddingBlocked(true);
        }
      } catch (err) {
        console.error('Video analysis failed:', err);
      } finally {
        setIsAnalyzing(false);
      }
    };

    // If the player already reported duration, go immediately
    if (videoDuration !== null) {
      runAnalysis(videoDuration);
      return;
    }

    // Otherwise wait up to 4 seconds for the player, then proceed without it
    const timeout = setTimeout(() => {
      runAnalysis(null); // server will get real duration from YouTube Data API
    }, 4000);

    return () => clearTimeout(timeout);
  }, [videoDuration, videoInfo]); // re-runs when duration arrives OR video changes

  const handleDurationDetected = (duration: number) => {
    setVideoDuration(duration);
    if (endTime > duration) {
      setEndTime(Math.min(10, duration));
    }
  };

  const handleTimeRangeChange = (start: number, end: number) => {
    setStartTime(start);
    setEndTime(end);
  };

  const handleVideoRemove = () => {
    setVideoInfo(null);
    setStartTime(0);
    setEndTime(10);
    setVideoDuration(null);
    setCurrentPlaybackTime(undefined);
    setAnalysisReasons(null);
    setSuggestedStartTime(null);
    setIsAnalyzing(false);
    setEmbeddingBlocked(false);
    pendingAnalysisRef.current = null;
  };

  const isFormValid = useMemo(() => {
    return !!(
      eventData.title &&
      eventData.startDate &&
      eventData.startTime &&
      eventData.venue &&
      eventData.summary &&
      videoInfo
    );
  }, [eventData, videoInfo]);

  const handlePublish = () => {
    if (isFormValid) {
      console.log('Publishing event:', { ...eventData, videoInfo });
      alert('Event published successfully!');
    }
  };

  return (
    <ErrorBoundary>
      <main className={styles.main}>
        {/* ── Top Nav ─────────────────────────────────────────── */}
        <nav className={styles.topNav}>
          <div className={styles.navLeading}>
            <button className={styles.closeBtn} aria-label="Close" type="button">
              <XIcon />
            </button>
            <span className={styles.navTitle}>New event</span>
          </div>
          <div className={styles.navTrailing}>
            <button className={styles.previewBtn} type="button">
              Save as draft
            </button>
            <button
              className={styles.publishBtn}
              type="button"
              onClick={handlePublish}
              disabled={!isFormValid}
            >
              Publish
            </button>
          </div>
        </nav>

        {/* ── Body (3 columns) ─────────────────────────────────── */}
        <div className={styles.body}>
          {/* Left — Stepper panel */}
          <div className={styles.stepperPanel}>
            <div className={styles.stepper}>
              {/* White pill — indicators only (circles + dots) */}
              <div className={styles.indicatorPill}>
                <div className={styles.pillStepRow}>
                  <div className={`${styles.stepCircle} ${styles.stepCircleActive}`}>1</div>
                </div>
                <div className={styles.pillSubRow}>
                  <div className={styles.subDot} />
                </div>
                <div className={styles.pillSubRow}>
                  <div className={styles.subDotInactive} />
                </div>
                <div className={styles.pillStepRow}>
                  <div className={styles.stepCircle}>2</div>
                </div>
                <div className={styles.pillStepRow}>
                  <div className={styles.stepCircle}>3</div>
                </div>
                <div className={styles.pillStepRow}>
                  <div className={styles.stepCircle}>4</div>
                </div>
              </div>
              {/* Labels column — outside the pill */}
              <div className={styles.labelCol}>
                <div className={styles.labelStepRow}>
                  <span className={`${styles.stepLabel} ${styles.stepLabelActive}`}>Create event page</span>
                </div>
                <div className={styles.labelSubRow}>
                  <span className={styles.subLabel}>Discovery card</span>
                </div>
                <div className={styles.labelSubRow}>
                  <span className={styles.subLabel}>Details</span>
                </div>
                <div className={styles.labelStepRow}>
                  <span className={styles.stepLabel}>Add tickets</span>
                </div>
                <div className={styles.labelStepRow}>
                  <span className={styles.stepLabel}>Promotion</span>
                </div>
                <div className={styles.labelStepRow}>
                  <span className={styles.stepLabel}>Publish</span>
                </div>
              </div>
            </div>
          </div>

          {/* Vertical divider: stepper | center */}
          <div className={styles.colDivider} />

          {/* Center — Form */}
          <div className={styles.centerPanel}>
            {/* Section header */}
            <div className={styles.panelHeaderSection}>
              <h1 className={styles.formHeading}>Create event discovery card</h1>
              <p className={styles.formSubheading}>Preview how your event appears in the discovery feed before publishing.</p>
            </div>
            <div className={styles.panelHeaderDivider} />
            {/* Form content */}
            <div className={styles.formContent}>
              <EventSidebar
                eventData={eventData}
                onEventDataChange={(newData) => {
                  setEventData(newData);
                  setPreviewLogo(newData.organizerLogo);
                  if (!newData.organizerLogo) {
                    setLogoAdjust({ scale: 1, x: 0, y: 0 });
                    setIsLogoAdjusting(false);
                  }
                }}
                onVideoLoad={handleVideoLoad}
                onVideoRemove={handleVideoRemove}
                videoInfo={videoInfo}
                embeddingBlocked={embeddingBlocked}
              />
              <div className={styles.buttonGroup}>
                <button className={styles.backBtn} type="button">
                  <BackArrowIcon />
                  Back
                </button>
                <button className={styles.nextStepBtn} type="button">
                  Next step
                  <NextArrowIcon />
                </button>
              </div>
            </div>
          </div>

          {/* Vertical divider: center | phone */}
          <div className={styles.colDivider} />

          {/* Right — Phone preview */}
          <div className={styles.phonePanel}>
            {/* Section header */}
            <div className={styles.panelHeaderSection}>
              <h2 className={styles.formHeading}>Preview</h2>
              <p className={styles.formSubheading}>See how your event card looks to attendees in the discovery feed.</p>
            </div>
            <div className={styles.panelHeaderDivider} />
            {/* Phone + Trailer — absolutely positioned like Figma */}
            <div className={styles.phonePanelContent}>
              <div className={styles.phoneAndTrailerContainer}>
                {/* Phone at top */}
                <div className={styles.phonePos}>
                  <MobileMockup isMobile>
                    <EventCardPreview
                      videoInfo={videoInfo}
                      startTime={startTime}
                      endTime={endTime}
                      eventData={eventData}
                      organizerLogo={previewLogo}
                      logoAdjust={logoAdjust}
                      onLogoClick={() => setIsLogoAdjusting(true)}
                      onDurationDetected={handleDurationDetected}
                      onPlaybackTimeUpdate={setCurrentPlaybackTime}
                    />
                  </MobileMockup>
                  {isLogoAdjusting && previewLogo && (
                    <LogoAdjuster
                      logoSrc={previewLogo}
                      adjust={logoAdjust}
                      onChange={setLogoAdjust}
                      onClose={() => setIsLogoAdjusting(false)}
                    />
                  )}
                </div>
                {/* Trailer card — overlaps phone bottom at exactly top: 602px */}
                <div className={styles.trailerPos}>
                  <VideoEditor
                    videoInfo={videoInfo}
                    isAnalyzing={isAnalyzing}
                    analysisReasons={analysisReasons}
                    duration={videoDuration || 300}
                    onTimeRangeChange={handleTimeRangeChange}
                    suggestedStartTime={suggestedStartTime}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </ErrorBoundary>
  );
}

/* ── Stepper sub-components ─────────────────────────────── */

function StepRow({
  number,
  label,
  active = false,
}: {
  number: number;
  label: string;
  active?: boolean;
}) {
  return (
    <div className={styles.stepRow}>
      <div className={`${styles.stepCircle} ${active ? styles.stepCircleActive : ''}`}>
        {number}
      </div>
      <span className={`${styles.stepLabel} ${active ? styles.stepLabelActive : ''}`}>{label}</span>
    </div>
  );
}

function SubStep({ label, active = false }: { label: string; active?: boolean }) {
  return (
    <div className={styles.subStep}>
      <div className={active ? styles.subDot : styles.subDotInactive} />
      <span className={styles.subLabel}>{label}</span>
    </div>
  );
}

/* ── Nav icons ──────────────────────────────────────────── */

function XIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M15 5L5 15M5 5L15 15" stroke="#161719" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function EyeIcon() {
  return <img src="/icons/Icon_Preview.png" style={{ display: 'block', height: 20, width: 'auto' }} alt="" />;
}

function BackArrowIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M19 12H5M5 12L11 6M5 12L11 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function NextArrowIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M5 12H19M19 12L13 6M19 12L13 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
